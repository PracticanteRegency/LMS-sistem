import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import styles from "../styles/MundialRanking.module.css";
import { getTrendColor } from "../services/mundial.ts";
import type { RankingEntry } from "../services/mundial.ts";
import dedupe from "../services/dedupe.js";
import {
  // @ts-ignore
  getRanking,
  // @ts-ignore
  getRankingEspecial,
} from "../services/mundial.js";

/* ===== BANNER MARQUEE ===== */
function BannerMarquee() {
  return (
    <div className={styles.topBanner}>
      <div className={styles.topBannerInner}>
        <div className={styles.marquee}>
          <div className={styles.marqueeTrack}>
            <span className={styles.marqueeText}>
              Con motivo de la <strong>Copa Mundial de la FIFA 2026</strong>, invitamos a todos los colaboradores a participar en nuestra plataforma de predicciones, un espacio creado para compartir la emoción del fútbol y fortalecer la integración en nuestra organización. Esta iniciativa busca promover uno de nuestros valores fundamentales: <strong>el respeto</strong>, fomentando una participación sana, donde cada opinión y pronóstico sea valorado dentro de un ambiente de compañerismo y juego limpio. Los invitamos a vivir esta experiencia con entusiasmo, respeto y espíritu de equipo.
            </span>
            <span className={styles.marqueeText}>
              Con motivo de la <strong>Copa Mundial de la FIFA 2026</strong>, invitamos a todos los colaboradores a participar en nuestra plataforma de predicciones, un espacio creado para compartir la emoción del fútbol y fortalecer la integración en nuestra organización. Esta iniciativa busca promover uno de nuestros valores fundamentales: <strong>el respeto</strong>, fomentando una participación sana, donde cada opinión y pronóstico sea valorado dentro de un ambiente de compañerismo y juego limpio. Los invitamos a vivir esta experiencia con entusiasmo, respeto y espíritu de equipo.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ===== RANKING MUNDIAL SECTION ===== */
function RankingMundialSection({ initialPlayers = [] }: { initialPlayers?: RankingEntry[] }) {
  const [userRank, setUserRank] = useState<RankingEntry | null>(null);
  const [fullList, setFullList] = useState<RankingEntry[]>([]);

  useEffect(() => {
    if (initialPlayers && initialPlayers.length > 0) {
      const sortedPlayers = [...initialPlayers].sort((a, b) => b.points - a.points);
      setFullList(sortedPlayers);

      // Find current user
      const currentUserRank = sortedPlayers.find((p: any) => p.isCurrentUser);
      setUserRank(currentUserRank || null);
    }
  }, [initialPlayers]);

  if (fullList.length === 0) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>📊</div>
        <h3 className={styles.emptyTitle}>Sin Rankings Disponibles</h3>
        <p className={styles.emptyDesc}>Aún no hay datos de ranking. ¡Comienza a hacer predicciones!</p>
      </div>
    );
  }

  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <span className={styles.sectionIcon}>🏆</span>
        <h2 className={styles.sectionTitle}>Ranking Mundial</h2>
        <span className={styles.sectionBadge}>{fullList.length} participantes</span>
      </div>

      <div className={styles.rankingContainer}>
        {/* Podium - Top 3 */}
        {fullList.length >= 1 && (
          <div className={styles.podium}>
            {/* 2nd Place */}
            {fullList[1] && (
              <div className={styles.podiumEntry}>
                <div className={styles.podiumAvatarSecond}>{fullList[1].avatar}</div>
                <p className={styles.podiumName}>{fullList[1].name}</p>
                <p className={styles.podiumPoints}>{fullList[1].points} pts</p>
                <div className={styles.podiumBarSecond}>
                  <span className={styles.podiumBarNumberOther}>{fullList[1].rank || "—"}</span>
                </div>
              </div>
            )}
            {/* 1st Place */}
            <div className={styles.podiumFirstWrapper}>
              <span className={styles.podiumTrophy}>🏆</span>
              <div className={styles.podiumAvatarFirst}>{fullList[0].avatar}</div>
              <p className={styles.podiumName}>{fullList[0].name}</p>
              <p className={styles.podiumPoints}>{fullList[0].points} pts</p>
              <div className={styles.podiumBarFirst}>
                <span className={styles.podiumBarNumberFirst}>{fullList[0].rank || "—"}</span>
              </div>
            </div>
            {/* 3rd Place */}
            {fullList[2] && (
              <div className={styles.podiumEntry}>
                <div className={styles.podiumAvatarThird}>{fullList[2].avatar}</div>
                <p className={styles.podiumName}>{fullList[2].name}</p>
                <p className={styles.podiumPoints}>{fullList[2].points} pts</p>
                <div className={styles.podiumBarThird}>
                  <span className={styles.podiumBarNumberOther}>{fullList[2].rank || "—"}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Full Table */}
        <div style={{ marginTop: "2rem" }}>
          <p className={styles.tableHeader}>📋 Ranking Completo</p>
          <div className={styles.rankingTable}>
            {fullList.map((player: RankingEntry, idx: number) => {
              const trendType = getTrendColor(player.trend);
              const rankEmoji = player.rank === 1 ? "🏆" : player.rank === 2 ? "🥈" : player.rank === 3 ? "🥉" : null;

              return (
                <div
                  key={`mundial-${player.name}-${idx}`}
                  className={`${player.rank > 0 && player.rank <= 3 ? styles.rankingRowTop : styles.rankingRow} ${
                    userRank?.rank === player.rank ? styles.rankingRowCurrentUser : ""
                  }`}
                >
                  <div className={styles.rankingRank}>
                    {player.rank === 0 ? (
                      <span style={{ fontSize: "0.7rem", color: "#888" }}>Por definirse</span>
                    ) : rankEmoji ? (
                      <span className={styles.rankingRankEmoji}>{rankEmoji}</span>
                    ) : (
                      <span>{player.rank}</span>
                    )}
                  </div>
                  <div className={styles.rankingAvatar}>{player.avatar}</div>
                  <div className={styles.rankingInfo}>
                    <p className={styles.rankingName}>
                      {player.name}
                      {userRank?.rank === player.rank && <span className={styles.userBadge}>(Tú)</span>}
                    </p>
                    <p className={styles.rankingHits}>{player.exactHits} aciertos exactos</p>
                  </div>
                  <div className={styles.rankingRight}>
                    <span
                      className={`${styles.rankingTrend} ${
                        trendType === "up"
                          ? styles.trendUp
                          : trendType === "down"
                          ? styles.trendDown
                          : styles.trendNeutral
                      }`}
                    >
                      {player.trend ? (player.trend.startsWith("+") ? "↑" : player.trend.startsWith("-") ? "↓" : "—") : "—"}
                      {player.trend || "—"}
                    </span>
                    <div className={styles.rankingScore}>
                      <p className={styles.rankingScoreValue}>{player.points}</p>
                      <p className={styles.rankingScoreLabel}>puntos</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* User position if outside visible range (shouldn't happen with full table, but kept for safety) */}
        {userRank && !fullList.find((p) => p.rank === userRank.rank) && (
          <div className={styles.userPositionSection}>
            <p className={styles.userPositionTitle}>📍 Tu Posición</p>
            <div className={styles.rankingTable}>
              <div className={`${styles.rankingRow} ${styles.rankingRowCurrentUser}`}>
                <div className={styles.rankingRank}>
                  <span>{userRank.rank}</span>
                </div>
                <div className={styles.rankingAvatar}>{userRank.avatar}</div>
                <div className={styles.rankingInfo}>
                  <p className={styles.rankingName}>
                    {userRank.name}
                    <span className={styles.userBadge}>(Tú)</span>
                  </p>
                  <p className={styles.rankingHits}>{userRank.exactHits} aciertos exactos</p>
                </div>
                <div className={styles.rankingRight}>
                  <span
                    className={`${styles.rankingTrend} ${
                      userRank.trend?.startsWith("+")
                        ? styles.trendUp
                        : userRank.trend?.startsWith("-")
                        ? styles.trendDown
                        : styles.trendNeutral
                    }`}
                  >
                    {userRank.trend ? (userRank.trend.startsWith("+") ? "↑" : userRank.trend.startsWith("-") ? "↓" : "—") : "—"}
                    {userRank.trend || "—"}
                  </span>
                  <div className={styles.rankingScore}>
                    <p className={styles.rankingScoreValue}>{userRank.points}</p>
                    <p className={styles.rankingScoreLabel}>puntos</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ===== RANKING ESPECIAL SECTION (List only, no podium) ===== */
function RankingEspecialSection({ initialPlayers = [] }: { initialPlayers?: RankingEntry[] }) {
  const [userRank, setUserRank] = useState<RankingEntry | null>(null);
  const [fullList, setFullList] = useState<RankingEntry[]>([]);

  useEffect(() => {
    if (initialPlayers && initialPlayers.length > 0) {
      const sortedPlayers = [...initialPlayers].sort((a, b) => b.points - a.points);
      setFullList(sortedPlayers);

      // Find current user
      const currentUserRank = sortedPlayers.find((p: any) => p.isCurrentUser);
      setUserRank(currentUserRank || null);
    }
  }, [initialPlayers]);

  if (fullList.length === 0) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>✨</div>
        <h3 className={styles.emptyTitle}>Sin Rankings Especiales</h3>
        <p className={styles.emptyDesc}>Aún no hay predicciones especiales disponibles o no hay datos.</p>
      </div>
    );
  }

  return (
    <div className={styles.especialSection}>
      <div className={styles.especialHeader}>
        <span className={styles.sectionIcon}>✨</span>
        <h2 className={styles.sectionTitle}>Ranking Especial</h2>
        <span className={styles.especialBadge}>{fullList.length} participantes</span>
      </div>

      <div className={styles.rankingContainer}>
        {/* Simple List - No Podium */}
        <div className={styles.rankingTable}>
          {fullList.map((player: RankingEntry, idx: number) => {
            const trendType = getTrendColor(player.trend);

            return (
              <div
                key={`especial-${player.name}-${idx}`}
                className={`${styles.rankingRow} ${userRank?.rank === player.rank ? styles.rankingRowCurrentUser : ""}`}
              >
                <div className={styles.rankingRank}>
                  <span>{player.rank}</span>
                </div>
                <div className={styles.rankingAvatar}>{player.avatar}</div>
                <div className={styles.rankingInfo}>
                  <p className={styles.rankingName}>
                    {player.name}
                    {userRank?.rank === player.rank && <span className={styles.userBadge}>(Tú)</span>}
                  </p>
                  <p className={styles.rankingHits}>{player.exactHits} aciertos especiales</p>
                </div>
                <div className={styles.rankingRight}>
                  <span
                    className={`${styles.rankingTrend} ${
                      trendType === "up"
                        ? styles.trendUp
                        : trendType === "down"
                        ? styles.trendDown
                        : styles.trendNeutral
                    }`}
                  >
                    {player.trend ? (player.trend.startsWith("+") ? "↑" : player.trend.startsWith("-") ? "↓" : "—") : "—"}
                    {player.trend || "—"}
                  </span>
                  <div className={styles.rankingScore}>
                    <p className={styles.rankingScoreValue}>{player.points}</p>
                    <p className={styles.rankingScoreLabel}>puntos</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* User position if outside visible range */}
        {userRank && !fullList.find((p) => p.rank === userRank.rank) && (
          <div className={styles.userPositionSection}>
            <p className={styles.userPositionTitle}>📍 Tu Posición</p>
            <div className={styles.rankingTable}>
              <div className={`${styles.rankingRow} ${styles.rankingRowCurrentUser}`}>
                <div className={styles.rankingRank}>
                  <span>{userRank.rank}</span>
                </div>
                <div className={styles.rankingAvatar}>{userRank.avatar}</div>
                <div className={styles.rankingInfo}>
                  <p className={styles.rankingName}>
                    {userRank.name}
                    <span className={styles.userBadge}>(Tú)</span>
                  </p>
                  <p className={styles.rankingHits}>{userRank.exactHits} aciertos especiales</p>
                </div>
                <div className={styles.rankingRight}>
                  <span
                    className={`${styles.rankingTrend} ${
                      userRank.trend?.startsWith("+")
                        ? styles.trendUp
                        : userRank.trend?.startsWith("-")
                        ? styles.trendDown
                        : styles.trendNeutral
                    }`}
                  >
                    {userRank.trend ? (userRank.trend.startsWith("+") ? "↑" : userRank.trend.startsWith("-") ? "↓" : "—") : "—"}
                    {userRank.trend || "—"}
                  </span>
                  <div className={styles.rankingScore}>
                    <p className={styles.rankingScoreValue}>{userRank.points}</p>
                    <p className={styles.rankingScoreLabel}>puntos</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ===== PAGE HEADER ===== */
function PageHeader() {
  return (
    <div className={styles.pageHeader}>
      <h1 className={styles.pageTitle}>🎯 Rankings</h1>
      <p className={styles.pageSubtitle}>
        Mira los rankings mundial y especial. ¡Compite con otros jugadores y demuestra tu conocimiento del fútbol!
      </p>
    </div>
  );
}

/* ===== MAIN PAGE ===== */
export default function MundialRanking() {
  const [loading, setLoading] = useState(true);
  const [rankingMundial, setRankingMundial] = useState<RankingEntry[]>([]);
  const [rankingEspecial, setRankingEspecial] = useState<RankingEntry[]>([]);

  useEffect(() => {
    setLoading(true);

    Promise.all([
      dedupe("ranking-mundial", {}, () => getRanking(100)),
      dedupe("ranking-especial", {}, () => getRankingEspecial(100)),
    ])
      .then(([mundialRes, especialRes]: any) => {
        // Transform ranking mundial data
        const miPosicionMundial = (mundialRes as any)?.data?.mi_posicion;
        const rankingMundialData = ((mundialRes as any)?.data?.ranking || []).map((entry: any) => ({
          rank: entry.posicion,
          name: entry.nombre,
          avatar: entry.iniciales || entry.nombre.charAt(0),
          points: entry.puntos_totales,
          exactHits: entry.aciertos_exactos,
          trend: entry.tendencia_str || "0",
          isCurrentUser: miPosicionMundial && entry.posicion === miPosicionMundial.posicion,
        }));
        setRankingMundial(rankingMundialData);

        // Transform ranking especial data
        const miPosicionEspecial = (especialRes as any)?.data?.mi_posicion;
        const rankingEspecialData = ((especialRes as any)?.data?.ranking || []).map((entry: any) => ({
          rank: entry.posicion,
          name: entry.nombre,
          avatar: entry.iniciales || entry.nombre.charAt(0),
          points: entry.puntos_totales,
          exactHits: entry.predicciones_especiales_acertadas || 0,
          trend: entry.tendencia_str || "0",
          isCurrentUser: miPosicionEspecial && entry.posicion === miPosicionEspecial.posicion,
        }));
        setRankingEspecial(rankingEspecialData);
      })
      .catch((error: any) => {
        console.error("Error fetching rankings:", error);
        setRankingMundial([]);
        setRankingEspecial([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <div className={styles.pageWrapper}>
      <Link to="/mundial" className={styles.backLink}>
        ← Volver a Inicio
      </Link>

      <BannerMarquee />
      <PageHeader />

      {loading ? (
        <div className={styles.loading}>
          <div className={styles.loadingSpinner}></div>
          <p className={styles.loadingText}>Cargando rankings...</p>
        </div>
      ) : (
        <>
          <RankingMundialSection initialPlayers={rankingMundial} />
          <RankingEspecialSection initialPlayers={rankingEspecial} />
        </>
      )}
    </div>
  );
}

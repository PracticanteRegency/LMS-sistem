import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import styles from "../styles/MundialHome.module.css";
import { getTrendColor } from "../services/mundial.ts";
import type { MatchData, RankingEntry } from "../services/mundial.ts";
import dedupe from "../services/dedupe.js";
import {
  // @ts-ignore
  getPartidos,
  // @ts-ignore
  getRanking,
  // @ts-ignore
  getConfiguracion,
  // @ts-ignore
  getHomeData,
  // @ts-ignore
  upsertPrediccionEspecial,
} from "../services/mundial.js";

/* ===== COMPONENTE PARA MOSTRAR BANDERAS CON FALLBACK ===== */
function BanderaDisplay({ url, nombre, emoji }: { url?: string; nombre?: string; emoji?: string }) {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleImageError = () => {
    setImageError(true);
    setIsLoading(false);
  };

  const handleImageLoad = () => {
    setImageError(false);
    setIsLoading(false);
  };

  // Si no hay URL o hubo error, mostrar emoji
  if (!url || imageError) {
    return (
      <div
        style={{
          width: "48px",
          height: "48px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "4px",
          backgroundColor: "var(--muted)",
          fontSize: "1.5rem",
          fontWeight: "bold",
        }}
        title={nombre || "Equipo"}
      >
        {emoji || "🏁"}
      </div>
    );
  }

  return (
    <div style={{ position: "relative" }}>
      {isLoading && (
        <div
          style={{
            width: "48px",
            height: "48px",
            borderRadius: "4px",
            backgroundColor: "var(--muted)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span style={{ fontSize: "0.75rem", color: "var(--muted-foreground)" }}>⏳</span>
        </div>
      )}
      <img
        src={url}
        alt={nombre || "Bandera del equipo"}
        onError={handleImageError}
        onLoad={handleImageLoad}
        style={{
          width: "100%",
          height: "48px",
          borderRadius: "4px",
          objectFit: "cover",
          display: isLoading ? "none" : "block",
        }}
      />
    </div>
  );
}

/* ===== BANNER MARQUEE (ONLY ON MUNDIAL HOME) ===== */
function BannerMarquee() {
  return (
    <div className={styles.topBanner} role="region" aria-label="Anuncio Mundial">
      <div className={styles.topBannerInner}>
        <div className={styles.marquee}>
          <div className={styles.marqueeTrack}>
            <span className={styles.marqueeText}>
              Con motivo de la <strong>Copa Mundial de la FIFA 2026</strong>, invitamos a todos los colaboradores a participar en nuestra plataforma de predicciones, un espacio creado para compartir la emoción del fútbol y fortalecer la integración en nuestra organización. Esta iniciativa busca promover uno de nuestros valores fundamentales: <strong>el respeto</strong>, fomentando una participación sana, donde cada opinión y pronóstico sea valorado dentro de un ambiente de compañerismo y juego limpio. Los invitamos a vivir esta experiencia con entusiasmo, respeto y espíritu de equipo.
            </span>
            <span className={styles.marqueeText} aria-hidden="true">
              Con motivo de la <strong>Copa Mundial de la FIFA 2026</strong>, invitamos a todos los colaboradores a participar en nuestra plataforma de predicciones, un espacio creado para compartir la emoción del fútbol y fortalecer la integración en nuestra organización. Esta iniciativa busca promover uno de nuestros valores fundamentales: <strong>el respeto</strong>, fomentando una participación sana, donde cada opinión y pronóstico sea valorado dentro de un ambiente de compañerismo y juego limpio. Los invitamos a vivir esta experiencia con entusiasmo, respeto y espíritu de equipo.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
// All data from backend API

/* ===== HERO ===== */
function Hero() {
  return (
    <section className={styles.hero}>
      <div className={styles.heroBg} />
      <div className={styles.heroDots}>
        <div className={styles.heroDot} />
        <div className={styles.heroDot} />
        <div className={styles.heroDot} />
        <div className={styles.heroDot} />
      </div>

      <div className={styles.heroContent}>
        <div className={styles.heroPill}>
          <span className={styles.heroPillDot}>
            <span className={styles.heroPillDotPing} />
            <span className={styles.heroPillDotCore} />
          </span>
          <span className={styles.heroPillText}>Mundial 2026 — USA, México y Canadá</span>
        </div>

        <h1 className={styles.heroTitle}>
          Predice. Compite.{" "}
          <span className={styles.heroHighlight}>Gana.</span>
        </h1>

        <p className={styles.heroSubtitle}>
          Participa en MICampeonato, la competencia de predicciones más emocionante del Mundial 2026.
          Registra tus predicciones, acumula puntos y compite por increíbles premios.
        </p>

        <div className={styles.heroButtons}>
          <Link to="/mundial/partidos" className={styles.btnPrimaryLg}>
            Hacer Mis Predicciones →
          </Link>
          <a href="#como-funciona" className={styles.btnOutlineLg}>
            Ver Cómo Funciona
          </a>
        </div>

        <div className={styles.heroStats}>
          <div className={styles.heroStatCard}>
            <span className={styles.heroStatEmoji}>👥</span>
            <span className={styles.heroStatValue}>+ 1,500</span>
            <span className={styles.heroStatLabel}>Participantes</span>
          </div>
          <div className={styles.heroStatCard}>
            <span className={styles.heroStatEmoji}>🏆</span>
            <span className={styles.heroStatValue}>$5,000,000</span>
            <span className={styles.heroStatLabel}>En Premios</span>
          </div>
          <div className={styles.heroStatCard}>
            <span className={styles.heroStatEmoji}>🎯</span>
            <span className={styles.heroStatValue}>104</span>
            <span className={styles.heroStatLabel}>Partidos</span>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ===== HOW IT WORKS ===== */
function HowItWorks({ steps }: { steps: any[] }) {
  return (
    <section id="como-funciona" className={styles.howItWorks}>
      <div className={styles.sectionInner}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Cómo Funciona</h2>
          <p className={styles.sectionSubtitle}>
            Participar es muy sencillo. Sigue estos pasos y comienza a competir.
          </p>
        </div>

        <div className={styles.stepsGrid}>
          {steps.map((step, idx) => (
            <div key={idx} className={styles.stepCard}>
              <span className={styles.stepNumber}>{step.step}</span>
              <div className={styles.stepEmoji}>{step.emoji}</div>
              <h3 className={styles.stepTitle}>{step.title}</h3>
              <p className={styles.stepDesc}>{step.description}</p>
            </div>
          ))}
        </div>

        <ScoringRulesGrid />
      </div>
    </section>
  );
}

/* ===== SCORING RULES ===== */
function ScoringRulesGrid() {
  const [scoringRules, setScoringRules] = useState<any[]>([]);
  const [multiplierRules, setMultiplierRules] = useState<any[]>([]);

  useEffect(() => {
    dedupe("config", {}, () => getConfiguracion())
      .then((res: any): void => {
        const cfg = res.data || {};

        // Construir scoring rules desde los campos reales del backend
        const rules: any[] = [];
        if (cfg.puntos_resultado_exacto !== undefined) {
          rules.push({
            points: cfg.puntos_resultado_exacto,
            condition: "Resultado Exacto",
            example: "Ej: Predices 2-1 y el resultado es 2-1",
          });
        }
        if (cfg.puntos_ganador_correcto !== undefined) {
          rules.push({
            points: cfg.puntos_ganador_correcto,
            condition: "Ganador Correcto",
            example: "Ej: Predices que gana el local y gana el local",
          });
        }
        setScoringRules(rules);

        // Construir multiplicadores desde el dict del backend
        const multiplicadores = cfg.multiplicadores || {};
        const mRules = Object.entries(multiplicadores).map(([phase, multiplier]) => ({
          phase,
          multiplier: typeof multiplier === "string" && multiplier.startsWith("x") ? multiplier : `x${multiplier}`,
        }));
        setMultiplierRules(mRules);
      })
      .catch(() => {
        setScoringRules([]);
        setMultiplierRules([]);
      });
  }, []);

  if (scoringRules.length === 0 && multiplierRules.length === 0) {
    return null;
  }

  return (
    <div className={styles.scoringGrid}>
      {scoringRules.length > 0 && (
      <div className={styles.scoringCard}>
        <h3 className={styles.scoringCardTitle}>Sistema de Puntuación</h3>
        {scoringRules.map((item, idx) => (
          <div key={idx} className={styles.scoringItem}>
            <div className={styles.scoringPoints}>
              <span className={styles.scoringPointsValue}>{item.points}</span>
              <span className={styles.scoringPointsLabel}>puntos</span>
            </div>
            <div>
              <p className={styles.scoringCondition}>{item.condition}</p>
              <p className={styles.scoringExample}>{item.example}</p>
            </div>
          </div>
        ))}
      </div>
      )}

      {multiplierRules.length > 0 && (
      <div className={styles.scoringCard}>
        <h3 className={styles.scoringCardTitle}>Multiplicadores por Fase</h3>
        <p className={styles.scoringCardDesc}>
          Los puntos base se multiplican según la fase del torneo. ¡Las predicciones en fases finales valen más!
        </p>
        {multiplierRules.map((item, idx) => (
          <div key={idx} className={styles.multiplierItem}>
            <span className={styles.multiplierPhase}>{item.phase}</span>
            <span className={styles.multiplierValue}>{item.multiplier}</span>
          </div>
        ))}
      </div>
      )}
    </div>
  );
}


/* ===== MATCHES ===== */
function MatchesSection({ initialMatches = [] }: { initialMatches?: MatchData[] }) {
  const [matches, setMatches] = useState<MatchData[]>(initialMatches);

  // Helper function to normalize estado values (handle both Spanish and English)
  const isEstadoFinalizado = (estado: string | undefined): boolean => {
    return estado === "finalizado" || estado === "finished";
  };

  useEffect(() => {
    setMatches(initialMatches);
  }, [initialMatches]);

  return (
    <section id="partidos" className={styles.matchesSection}>
      <div className={styles.sectionInner}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Próximos Partidos</h2>
          <p className={styles.sectionSubtitle}>
            Registra tus predicciones antes de que comience cada partido y acumula puntos.
          </p>
        </div>

        <div className={styles.matchesGrid}>
          {matches
            .slice(0, 6)
            .map((match: MatchData) => (
              <div key={match.id} className={styles.matchCard}>
                <div className={styles.matchCardHeader}>
                  <span className={styles.badgeMuted}>{match.phase}</span>
                  <span className={styles.badgePrimary}>{match.multiplier}</span>
                </div>

                <div className={styles.matchTeams}>
                  <div className={styles.matchTeam}>
                    <img src={match.homeFlag} alt={match.homeTeam} className={styles.matchFlagImg} />
                    <span className={styles.matchTeamName}>{match.homeTeam}</span>
                  </div>
                  <span className={styles.matchVs}>VS</span>
                  <div className={styles.matchTeam}>
                    <img src={match.awayFlag} alt={match.awayTeam} className={styles.matchFlagImg} />
                    <span className={styles.matchTeamName}>{match.awayTeam}</span>
                  </div>
                </div>

                <div className={styles.matchDetails}>
                  <div className={styles.matchDetail}>
                    <span className={styles.matchDetailIcon}>📅</span>
                    <span>{match.date}</span>
                  </div>
                  <div className={styles.matchDetail}>
                    <span className={styles.matchDetailIcon}>⏰</span>
                    <span>{match.time}</span>
                  </div>
                </div>

                {isEstadoFinalizado(match.estado) ? (
                  <button disabled className={styles.btnPrimary} style={{ width: "100%", textAlign: "center", boxSizing: "border-box", overflow: "hidden", opacity: 0.6, cursor: "not-allowed" }}>
                    ✔️ Finalizado
                  </button>
                ) : (
                  <Link to="/mundial/partidos" className={styles.btnPrimary} style={{ width: "100%", textAlign: "center", boxSizing: "border-box", overflow: "hidden" }}>
                    Hacer Predicción →
                  </Link>
                )}
              </div>
            ))}
        </div>

        <div className={styles.sectionCta}>
          <Link to="/mundial/partidos" className={styles.btnOutline}>
            Ver Todos los Partidos →
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ===== SPECIAL PREDICTIONS ===== */
function SpecialPredictionsSection({ initialSpecialPredictions = [], initialTeams = [], initialUserPredictions = [], onSuccess }: { initialSpecialPredictions?: any[], initialTeams?: any[], initialUserPredictions?: any[], onSuccess?: () => void }) {
  const [predictions, setPredictions] = useState<any[]>(initialSpecialPredictions);
  const [userPredictions, setUserPredictions] = useState<any[]>(initialUserPredictions);
  const [selectedTeam, setSelectedTeam] = useState<{ [key: string]: any }>({});
  const [loading, setLoading] = useState(false);
  const [teams, setTeams] = useState<any[]>(initialTeams);

  useEffect(() => {
    setPredictions(initialSpecialPredictions);
  }, [initialSpecialPredictions]);

  useEffect(() => {
    setTeams(initialTeams);
  }, [initialTeams]);

  useEffect(() => {
    setUserPredictions(initialUserPredictions);
    // Inicializar selectedTeam con las predicciones existentes del usuario
    const teamMap: any = {};
    initialUserPredictions.forEach((pred: any) => {
      if (pred.equipo_seleccionado) {
        teamMap[pred.tipo] = pred.equipo_seleccionado;
      }
    });
    setSelectedTeam(teamMap);
  }, [initialUserPredictions]);

  const handleSubmitSpecial = async (tipo: string) => {
    setLoading(true);
    try {
      const payload: any = { tipo };
      
      const teamId = selectedTeam[tipo];
      if (!teamId) {
        alert("Selecciona un equipo");
        setLoading(false);
        return;
      }
      payload.equipo_seleccionado = teamId;

      const res = await upsertPrediccionEspecial(payload);
      
      // Actualizar estado local
      const existingIndex = userPredictions.findIndex(p => p.tipo === tipo);
      if (existingIndex >= 0) {
        const updated = [...userPredictions];
        updated[existingIndex] = res.data;
        setUserPredictions(updated);
      } else {
        setUserPredictions([...userPredictions, res.data]);
      }

      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error("Error:", error);
      alert("Error al guardar la predicción");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="especiales" className={styles.specialSection}>
      <div className={styles.sectionInner}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>🎯 Predicciones Especiales</h2>
          <p className={styles.sectionSubtitle}>
            Responde una sola vez y gana puntos extras al finalizar el torneo.
          </p>
        </div>

        {predictions.length === 0 ? (
          <div style={{ textAlign: "center", padding: "2rem", color: "var(--muted-foreground)" }}>
            No hay predicciones especiales disponibles en este momento
          </div>
        ) : (
          <div className={styles.specialGrid}>
            {predictions
              .filter((pred) => ["campeon", "subcampeon", "tercer_lugar"].includes(pred.tipo))
              .map((pred) => {
                const userPred = userPredictions.find(p => p.tipo === pred.tipo);
                const getIcon = (tipo: string) => {
                  switch(tipo) {
                    case "campeon": return "🏆";
                    case "subcampeon": return "🥈";
                    case "tercer_lugar": return "🥉";
                    default: return "🎯";
                  }
                };
                const getLabel = (tipo: string) => {
                  switch(tipo) {
                    case "campeon": return "Campeón";
                    case "subcampeon": return "Subcampeón";
                    case "tercer_lugar": return "Tercer Lugar";
                    default: return tipo;
                  }
                };

                return (
                  <div key={pred.id || pred.tipo} className={styles.specialPredictionCard}>
                    <div className={styles.specialPredHeader}>
                      <h3 style={{ fontWeight: 700, marginBottom: "0.25rem", fontSize: "1.1rem" }}>
                        {getIcon(pred.tipo)} {getLabel(pred.tipo)}
                      </h3>
                      <span className={styles.specialPoints}>+{pred.puntos_acierto} pts</span>
                    </div>

                    {pred.descripcion && (
                      <p style={{ fontSize: "0.85rem", color: "var(--muted-foreground)", marginBottom: "1rem", lineHeight: 1.5 }}>
                        {pred.descripcion}
                      </p>
                    )}

                    {userPred && !userPred.puede_editar ? (
                      // Read-only: ya respondió y está cerrada
                      <div style={{ padding: "1rem", backgroundColor: "var(--muted)", borderRadius: "6px", marginBottom: "1rem", border: "2px solid var(--success)" }}>
                        <p style={{ fontSize: "0.875rem", color: "var(--success)", fontWeight: 600, margin: "0 0 0.5rem 0" }}>✓ Respondida</p>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginTop: "0.75rem" }}>
                          <BanderaDisplay url={userPred.equipo_bandera} nombre={userPred.equipo_nombre} emoji={userPred.equipo_emoji} />
                          <span style={{ fontWeight: 600, fontSize: "1rem" }}>
                            {userPred.equipo_nombre}
                          </span>
                        </div>
                        <p style={{ fontSize: "0.75rem", color: "var(--muted-foreground)", margin: "0.5rem 0 0 0" }}>
                          Cerrada desde el {new Date(userPred.fecha_cierre).toLocaleDateString()}
                        </p>
                      </div>
                    ) : userPred && userPred.puede_editar ? (
                      // Editable: ya respondió pero aún puede editar
                      <div style={{ padding: "1rem", backgroundColor: "var(--muted)", borderRadius: "6px", marginBottom: "1rem", border: "2px solid var(--primary)" }}>
                        <p style={{ fontSize: "0.875rem", color: "var(--primary)", fontWeight: 600, margin: "0 0 0.5rem 0" }}>✓ Respondida (editable)</p>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginTop: "0.75rem", marginBottom: "0.75rem" }}>
                          <BanderaDisplay url={userPred.equipo_bandera} nombre={userPred.equipo_nombre} emoji={userPred.equipo_emoji} />
                          <span style={{ fontWeight: 600, fontSize: "1rem" }}>
                            {userPred.equipo_nombre}
                          </span>
                        </div>
                        <select
                          value={selectedTeam[pred.tipo] || userPred.equipo_seleccionado || ""}
                          onChange={(e) => setSelectedTeam({ ...selectedTeam, [pred.tipo]: parseInt(e.target.value) })}
                          className={styles.specialSelect}
                          disabled={loading}
                          style={{ marginBottom: "0.75rem" }}
                        >
                          <option value="">Selecciona un equipo...</option>
                          {teams.map((team) => (
                            <option key={team.id} value={team.id}>
                              {team.bandera_emoji} {team.nombre}
                            </option>
                          ))}
                        </select>
                        <button
                          className={styles.specialSubmitBtn}
                          onClick={() => handleSubmitSpecial(pred.tipo)}
                          disabled={loading || !selectedTeam[pred.tipo]}
                          style={{ width: "100%", fontWeight: 600 }}
                        >
                          {loading ? "Actualizando..." : "Actualizar →"}
                        </button>
                      </div>
                    ) : (
                      // Not answered yet: show selection form
                      <>
                        <select
                          value={selectedTeam[pred.tipo] || ""}
                          onChange={(e) => setSelectedTeam({ ...selectedTeam, [pred.tipo]: parseInt(e.target.value) })}
                          className={styles.specialSelect}
                          disabled={loading}
                          style={{ marginBottom: "0.75rem" }}
                        >
                          <option value="">Selecciona un equipo...</option>
                          {teams.map((team) => (
                            <option key={team.id} value={team.id}>
                              {team.bandera_emoji} {team.nombre}
                            </option>
                          ))}
                        </select>
                        <button
                          className={styles.specialSubmitBtn}
                          onClick={() => handleSubmitSpecial(pred.tipo)}
                          disabled={loading || !selectedTeam[pred.tipo]}
                          style={{ width: "100%", fontWeight: 600 }}
                        >
                          {loading ? "Guardando..." : "Predecir →"}
                        </button>
                      </>
                    )}
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </section>
  );
}
function RankingSection({ initialPlayers = [] }: { initialPlayers?: RankingEntry[] }) {
  const [userRank, setUserRank] = useState<RankingEntry | null>(null);
  const [top10List, setTop10List] = useState<RankingEntry[]>([]);
  const [allSortedPlayers, setAllSortedPlayers] = useState<RankingEntry[]>([]);

  useEffect(() => {
    // Procesar jugadores para separar al usuario del top 10
    if (initialPlayers && initialPlayers.length > 0) {
      // Ordenar de mayor a menor por puntos
      const sortedPlayers = [...initialPlayers].sort((a, b) => b.points - a.points);
      setAllSortedPlayers(sortedPlayers);
      
      // Buscar al usuario actual
      const currentUserRank = sortedPlayers.find((p: any) => p.isCurrentUser);
      setUserRank(currentUserRank || null);

      // Top 10 siempre son las posiciones 1-10
      setTop10List(sortedPlayers.slice(0, 10));
    }
  }, [initialPlayers]);

  return (
    <section id="ranking" className={styles.rankingSection}>
      <div className={styles.sectionInner}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Ranking en Tiempo Real</h2>
          <p className={styles.sectionSubtitle}>
            Mira quién lidera la competencia. El ranking se actualiza automáticamente después de cada partido.
          </p>
        </div>

        <div className={styles.rankingContainer}>
          {/* Podium - Always show top 3 (positions 1, 2, 3) */}
          <div className={styles.podium}>
            {/* 2nd Place (Left) */}
            <div className={styles.podiumEntry}>
              <div className={styles.podiumAvatarSecond}>{allSortedPlayers[1]?.avatar}</div>
              <p className={styles.podiumName}>{allSortedPlayers[1]?.name}</p>
              <p className={styles.podiumPoints}>{allSortedPlayers[1]?.points} pts</p>
              <div className={styles.podiumBarSecond}>
                <span className={styles.podiumBarNumberOther}>2</span>
              </div>
            </div>
            {/* 1st Place (Center) */}
            <div className={styles.podiumFirstWrapper}>
              <span className={styles.podiumTrophy}>🏆</span>
              <div className={styles.podiumAvatarFirst}>{allSortedPlayers[0]?.avatar}</div>
              <p className={styles.podiumName}>{allSortedPlayers[0]?.name}</p>
              <p className={styles.podiumPoints}>{allSortedPlayers[0]?.points} pts</p>
              <div className={styles.podiumBarFirst}>
                <span className={styles.podiumBarNumberFirst}>1</span>
              </div>
            </div>
            {/* 3rd Place (Right) */}
            <div className={styles.podiumEntry}>
              <div className={styles.podiumAvatarThird}>{allSortedPlayers[2]?.avatar}</div>
              <p className={styles.podiumName}>{allSortedPlayers[2]?.name}</p>
              <p className={styles.podiumPoints}>{allSortedPlayers[2]?.points} pts</p>
              <div className={styles.podiumBarThird}>
                <span className={styles.podiumBarNumberOther}>3</span>
              </div>
            </div>
          </div>

          {/* Top 10 Table - Posiciones 1 a 10 con ordenamiento por puntos y desempate por fecha primera predicción */}
          <div style={{ marginTop: "2rem" }}>
            <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "1rem", color: "var(--foreground)" }}>
              🏅 Top 10
            </h3>
            <div className={styles.rankingTable}>
              {top10List.map((player: RankingEntry, idx: number) => {
                const trendType = getTrendColor(player.trend);
                const rankEmoji = player.rank === 1 ? "🏆" : player.rank === 2 ? "🥈" : player.rank === 3 ? "🥉" : null;
                const isCurrentUser = userRank?.rank === player.rank;

                return (
                  <div
                    key={`${player.name}-${idx}`}
                    className={`${player.rank <= 3 ? styles.rankingRowTop : styles.rankingRow} ${isCurrentUser ? styles.rankingRowCurrentUser : ""}`}
                  >
                    <div className={styles.rankingRank}>
                      {rankEmoji ? (
                        <span className={styles.rankingRankEmoji}>{rankEmoji}</span>
                      ) : (
                        <span>{player.rank}</span>
                      )}
                    </div>
                    <div className={styles.rankingAvatar}>{player.avatar}</div>
                    <div className={styles.rankingInfo}>
                      <p className={styles.rankingName}>
                        {player.name}
                        {isCurrentUser && <span className={styles.userBadge}> (Tú)</span>}
                      </p>
                      <p className={styles.rankingHits}>{player.exactHits} aciertos exactos</p>
                    </div>
                    <div className={styles.rankingRight}>
                      <span className={`${styles.rankingTrend} ${
                        trendType === "up" ? styles.trendUp : trendType === "down" ? styles.trendDown : styles.trendNeutral
                      }`}>
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

          {/* Si el usuario está fuera del top 10, mostrar su posición */}
          {userRank && userRank.rank > 10 && (
            <div style={{ marginTop: "2rem", paddingTop: "2rem", borderTop: "1px solid var(--border)" }}>
              <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "1rem", color: "var(--foreground)" }}>
                📍 Tu Posición
              </h3>
              <div className={styles.rankingTable}>
                <div className={`${styles.rankingRow} ${styles.rankingRowCurrentUser}`}>
                  <div className={styles.rankingRank}>
                    <span>{userRank.rank}</span>
                  </div>
                  <div className={styles.rankingAvatar}>{userRank.avatar}</div>
                  <div className={styles.rankingInfo}>
                    <p className={styles.rankingName}>
                      {userRank.name}
                      <span className={styles.userBadge}> (Tú)</span>
                    </p>
                    <p className={styles.rankingHits}>{userRank.exactHits} aciertos exactos</p>
                  </div>
                  <div className={styles.rankingRight}>
                    <span className={`${styles.rankingTrend} ${
                      (userRank.trend?.startsWith("+") ? "up" : userRank.trend?.startsWith("-") ? "down" : "neutral") === "up" ? styles.trendUp : (userRank.trend?.startsWith("+") ? "up" : userRank.trend?.startsWith("-") ? "down" : "neutral") === "down" ? styles.trendDown : styles.trendNeutral
                    }`}>
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

          <div className={styles.sectionCta} style={{ marginTop: "2rem" }}>
            <Link to="/mundial/ranking" className={styles.btnOutline}>
              Ver Ranking Completo →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ===== PÁGINA PRINCIPAL — MICampeonato ===== */
export default function MundialHome() {
  const [steps, setSteps] = useState<any[]>([]);
  const [matches, setMatches] = useState<MatchData[]>([]);
  const [specialPredictions, setSpecialPredictions] = useState<any[]>([]);
  const [players, setPlayers] = useState<RankingEntry[]>([]);
  const [equipos, setEquipos] = useState<any[]>([]);
  const [userSpecialPredictions, setUserSpecialPredictions] = useState<any[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    dedupe("home", {}, () => getHomeData())
      .then((res: any): void => {
        const data = res.data || {};
        
        // ============================================
        // CONFIGURACIÓN (from configuracion endpoint)
        // ============================================
        if (data.configuracion) {
          if (data.configuracion?.steps) setSteps(data.configuracion.steps);
        }
        
        // ============================================
        // PREDICCIONES ESPECIALES (from predicciones-especiales endpoint)
        // Structure: { predicciones: [...], configuraciones: [...] }
        // ============================================
        if (data.predicciones_especiales) {
          // Configuraciones son los tipos de predicciones especiales disponibles
          const configs = data.predicciones_especiales?.configuraciones || [];
          setSpecialPredictions(configs);
          // Predicciones del usuario actual
          const userPreds = data.predicciones_especiales?.predicciones || [];
          setUserSpecialPredictions(userPreds);
        }
        
        // ============================================
        // PARTIDOS (from partidos endpoint)
        // Structure: { partidos: [...], total: number, equipos: [...], estadisticas: {...} }
        // Transform backend formato to frontend MatchData format
        // ============================================
        if (data.partidos) {
          const partidos = (data.partidos?.partidos || []).map((partido: any) => ({
            id: partido.id,
            equipo_local: partido.equipo_local,
            equipo_local_nombre: partido.equipo_local_nombre,
            equipo_local_bandera: partido.equipo_local_bandera,
            equipo_visitante: partido.equipo_visitante,
            equipo_visitante_nombre: partido.equipo_visitante_nombre,
            equipo_visitante_bandera: partido.equipo_visitante_bandera,
            fecha: partido.fecha,
            hora: partido.hora,
            fase: partido.fase,
            grupo: partido.grupo,
            multiplicador: partido.multiplicador,
            estado: partido.estado,
            puede_predecir: partido.puede_predecir,
            resultado: partido.resultado,
            fue_a_penaltis: partido.fue_a_penaltis,
            mi_prediccion: partido.mi_prediccion,
            // Legacy fields for compatibility
            homeTeam: partido.equipo_local_nombre,
            homeFlag: partido.equipo_local_bandera,
            awayTeam: partido.equipo_visitante_nombre,
            awayFlag: partido.equipo_visitante_bandera,
            date: partido.fecha,
            time: partido.hora,
            phase: partido.fase,
            group: partido.grupo,
            multiplier: partido.multiplicador,
            status: partido.estado,
          }));
          setMatches(partidos);

          // Equipos disponibles para predicciones especiales
          const equiposData = data.partidos?.equipos || [];
          setEquipos(equiposData);
        }
        
        // ============================================
        // RANKING (from ranking endpoint)
        // Structure: { ranking: [...], total_participantes: number, mi_posicion: {...} }
        // Transform backend formato to frontend RankingEntry format
        // ============================================
        if (data.ranking) {
          // Get user's ranking info
          const miPosicion = data.ranking?.mi_posicion;
          
          // Transform ranking data and mark current user by posicion (rank is unique)
          const rankingData = (data.ranking?.ranking || []).map((entry: any) => ({
            rank: entry.posicion,
            name: entry.nombre,
            avatar: entry.iniciales || entry.nombre.charAt(0),
            points: entry.puntos_totales,
            exactHits: entry.aciertos_exactos,
            trend: entry.tendencia_str || "0",
            // Mark if this is the current user (compare by posicion, not email, since email may be duplicate in test data)
            isCurrentUser: miPosicion && entry.posicion === miPosicion.posicion,
          }));
          
          setPlayers(rankingData);
        }
      })
      .catch(() => {
        setSteps([]);
        setMatches([]);
        setSpecialPredictions([]);
        setPlayers([]);
      });
  }, []);

  return (
    <div className={styles.pageWrapper}>
      <BannerMarquee />
      <Hero />
      <MatchesSection initialMatches={matches} />
      <SpecialPredictionsSection initialSpecialPredictions={specialPredictions} initialTeams={equipos} initialUserPredictions={userSpecialPredictions} onSuccess={() => { setShowSuccess(true); setTimeout(() => setShowSuccess(false), 1800); }} />
      <RankingSection initialPlayers={players} />
      <HowItWorks steps={steps} />
      {/* ===== SUCCESS MODAL ===== */}
      {showSuccess && (
        <div className={styles.successOverlay} onClick={() => setShowSuccess(false)}>
          <div className={styles.successModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.successIconContainer}>
              <div className={styles.successIconBg}>✓</div>
            </div>
            <h3 className={styles.successTitle}>Predicción Guardada</h3>
            <p className={styles.successText}>Tu predicción ha sido registrada correctamente.</p>
          </div>
        </div>
      )}    </div>
  );
}

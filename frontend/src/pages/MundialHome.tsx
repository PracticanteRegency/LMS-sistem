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
  getPrediccionesEspeciales,
  // @ts-ignore
  getHomeData,
  // @ts-ignore
  getEquipos,
  // @ts-ignore
  upsertPrediccionEspecial,
} from "../services/mundial.js";

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
          Únete a MICampeonato, la competencia de predicciones más emocionante del Mundial 2026.
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
            <span className={styles.heroStatValue}>10,000+</span>
            <span className={styles.heroStatLabel}>Participantes</span>
          </div>
          <div className={styles.heroStatCard}>
            <span className={styles.heroStatEmoji}>🏆</span>
            <span className={styles.heroStatValue}>$50,000</span>
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
        if (res.data?.scoring_rules) setScoringRules(res.data.scoring_rules);
        if (res.data?.multiplier_rules) setMultiplierRules(res.data.multiplier_rules);
      })
      .catch(() => {
        setScoringRules([]);
        setMultiplierRules([]);
      });
  }, []);

  return (
    <div className={styles.scoringGrid}>
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
    </div>
  );
}

/* ===== SCORING RULES (STANDALONE VERSION FOR HOME) ===== */
function ScoringRulesGridStandalone({ scoringRules = [], multiplierRules = [] }: { scoringRules?: any[], multiplierRules?: any[] }) {
  return (
    <div className={styles.scoringGrid}>
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
    </div>
  );
}

/* ===== MATCHES ===== */
function MatchesSection({ initialMatches = [] }: { initialMatches?: MatchData[] }) {
  const [matches, setMatches] = useState<MatchData[]>(initialMatches);

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

                <Link to="/mundial/partidos" className={styles.btnPrimary} style={{ width: "100%", textAlign: "center" }}>
                  Hacer Predicción →
                </Link>
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

/* ===== PRIZES ===== */
function PrizesSection({ initialPrizes = [], initialSpecialPredictions = [] }: { initialPrizes?: any[], initialSpecialPredictions?: any[] }) {
  const [prizes, setPrizes] = useState<any[]>(initialPrizes);
  const [specialPredictions, setSpecialPredictions] = useState<any[]>(initialSpecialPredictions);

  useEffect(() => {
    setPrizes(initialPrizes);
    setSpecialPredictions(initialSpecialPredictions);
  }, [initialPrizes, initialSpecialPredictions]);

  return (
    <section id="premios" className={styles.prizesSection}>
      <div className={styles.sectionInner}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Premios Increíbles</h2>
          <p className={styles.sectionSubtitle}>
            Compite por más de $50,000 en premios. Los tres primeros lugares se llevan todo.
          </p>
        </div>

        <div className={styles.prizesGrid}>
          {prizes.map((prize, idx) => (
            <div key={idx} className={idx === 0 ? styles.prizeCardFirst : styles.prizeCard}>
              <div
                className={styles.prizeIcon}
                style={{ background: prize.bgColor, border: `2px solid ${prize.borderColor}` }}
              >
                {prize.emoji}
              </div>
              <p className={styles.prizePosition}>{prize.position}</p>
              <p className={styles.prizeAmount}>{prize.prize}</p>
              <p className={styles.prizePercent}>{prize.percentage} del pozo total</p>
            </div>
          ))}
        </div>

        <div className={styles.specialCard}>
          <div className={styles.specialHeader}>
            <span className={styles.specialEmoji}>🎁</span>
            <h3 className={styles.specialTitle}>Predicciones Especiales</h3>
          </div>
          <p className={styles.specialDesc}>
            Además de los partidos, puedes ganar puntos adicionales con predicciones especiales que se evalúan al finalizar el torneo.
          </p>
          <div className={styles.specialGrid}>
            {specialPredictions.map((pred, idx) => (
              <div key={idx} className={styles.specialItem}>
                <span className={styles.specialItemName}>{pred.name}</span>
                <span className={styles.specialItemPoints}>{pred.points}</span>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.prizesCta}>
          <Link to="/mundial/partidos" className={styles.btnPrimary}>
            Participar Ahora →
          </Link>
          <p className={styles.prizesCtaNote}>Registro gratuito. Sin cargos ocultos.</p>
        </div>
      </div>
    </section>
  );
}

/* ===== SPECIAL PREDICTIONS ===== */
function SpecialPredictionsSection({ initialSpecialPredictions = [] }: { initialSpecialPredictions?: any[] }) {
  const [predictions, setPredictions] = useState<any[]>(initialSpecialPredictions);
  const [userPredictions, setUserPredictions] = useState<any[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<{ [key: string]: any }>({});
  const [selectedPlayer, setSelectedPlayer] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);
  const [teams, setTeams] = useState<any[]>([]);

  useEffect(() => {
    setPredictions(initialSpecialPredictions);
  }, [initialSpecialPredictions]);

  useEffect(() => {
    // Cargar equipos
    dedupe("equipos-for-special", {}, () => getEquipos())
      .then((res: any): void => {
        const data = Array.isArray(res.data) ? res.data : res.data?.equipos || [];
        setTeams(data);
      })
      .catch(() => {
        setTeams([]);
      });

    // Cargar predicciones especiales del usuario
    dedupe("my-special-predictions", {}, () => getPrediccionesEspeciales())
      .then((res: any): void => {
        const data = res.data?.predicciones || [];
        setUserPredictions(data);
        // Inicializar selectedTeam y selectedPlayer con las predicciones existentes
        const teamMap: any = {};
        const playerMap: any = {};
        data.forEach((pred: any) => {
          if (pred.equipo_seleccionado) {
            teamMap[pred.tipo] = pred.equipo_seleccionado;
          }
          if (pred.jugador_seleccionado) {
            playerMap[pred.tipo] = pred.jugador_seleccionado;
          }
        });
        setSelectedTeam(teamMap);
        setSelectedPlayer(playerMap);
      })
      .catch(() => {
        setUserPredictions([]);
      });
  }, []);

  const handleSubmitSpecial = async (tipo: string) => {
    setLoading(true);
    try {
      const payload: any = { tipo };
      
      if (["campeon", "subcampeon", "tercer_lugar"].includes(tipo)) {
        const teamId = selectedTeam[tipo];
        if (!teamId) {
          alert("Selecciona un equipo");
          setLoading(false);
          return;
        }
        payload.equipo_seleccionado = teamId;
      } else if (tipo === "maximo_goleador") {
        const player = selectedPlayer[tipo];
        if (!player) {
          alert("Ingresa el nombre del jugador");
          setLoading(false);
          return;
        }
        payload.jugador_seleccionado = player;
      }

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

      alert("Predicción guardada ✓");
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
            {predictions.map((pred) => {
              const userPred = userPredictions.find(p => p.tipo === pred.tipo);
              const isTeamType = ["campeon", "subcampeon", "tercer_lugar"].includes(pred.tipo);

              return (
                <div key={pred.tipo} className={styles.specialPredictionCard}>
                  <div className={styles.specialPredHeader}>
                    <h3 style={{ fontWeight: 700, marginBottom: "0.5rem" }}>{pred.get_tipo_display || pred.tipo}</h3>
                    <span className={styles.specialPoints}>+{pred.puntos_acierto} pts</span>
                  </div>

                  {userPred ? (
                    <div style={{ padding: "1rem", backgroundColor: "var(--muted)", borderRadius: "6px", marginBottom: "1rem" }}>
                      <p style={{ fontSize: "0.875rem", color: "var(--success)" }}>✓ Respondida</p>
                      <p style={{ fontWeight: 600, marginTop: "0.5rem" }}>
                        {isTeamType ? userPred.equipo_seleccionado?.nombre : userPred.jugador_seleccionado}
                      </p>
                    </div>
                  ) : (
                    <>
                      {isTeamType ? (
                        <select
                          value={selectedTeam[pred.tipo] || ""}
                          onChange={(e) => setSelectedTeam({ ...selectedTeam, [pred.tipo]: parseInt(e.target.value) })}
                          className={styles.specialSelect}
                          disabled={loading}
                        >
                          <option value="">Selecciona un equipo...</option>
                          {teams.map((team) => (
                            <option key={team.id} value={team.id}>
                              {team.bandera_emoji} {team.nombre}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          value={selectedPlayer[pred.tipo] || ""}
                          onChange={(e) => setSelectedPlayer({ ...selectedPlayer, [pred.tipo]: e.target.value })}
                          placeholder="Ej: Mbappé"
                          className={styles.specialInput}
                          disabled={loading}
                        />
                      )}
                      <button
                        className={styles.specialSubmitBtn}
                        onClick={() => handleSubmitSpecial(pred.tipo)}
                        disabled={loading}
                        style={{ marginTop: "0.75rem", width: "100%" }}
                      >
                        {loading ? "Guardando..." : "Responder"}
                      </button>
                    </>
                  )}

                  <p style={{ fontSize: "0.75rem", color: "var(--muted-foreground)", marginTop: "0.75rem" }}>
                    Cierra: {pred.fecha_cierre ? new Date(pred.fecha_cierre).toLocaleDateString() : "—"}
                  </p>
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
  const [players, setPlayers] = useState<RankingEntry[]>(initialPlayers);

  useEffect(() => {
    setPlayers(initialPlayers);
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
          {/* Podium */}
          <div className={styles.podium}>
            {/* 2nd */}
            <div className={styles.podiumEntry}>
              <div className={styles.podiumAvatarSecond}>{players[1]?.avatar}</div>
              <p className={styles.podiumName}>{players[1]?.name}</p>
              <p className={styles.podiumPoints}>{players[1]?.points} pts</p>
              <div className={styles.podiumBarSecond}>
                <span className={styles.podiumBarNumberOther}>2</span>
              </div>
            </div>
            {/* 1st */}
            <div className={styles.podiumFirstWrapper}>
              <span className={styles.podiumTrophy}>🏆</span>
              <div className={styles.podiumAvatarFirst}>{players[0]?.avatar}</div>
              <p className={styles.podiumName}>{players[0]?.name}</p>
              <p className={styles.podiumPoints}>{players[0]?.points} pts</p>
              <div className={styles.podiumBarFirst}>
                <span className={styles.podiumBarNumberFirst}>1</span>
              </div>
            </div>
            {/* 3rd */}
            <div className={styles.podiumEntry}>
              <div className={styles.podiumAvatarThird}>{players[2]?.avatar}</div>
              <p className={styles.podiumName}>{players[2]?.name}</p>
              <p className={styles.podiumPoints}>{players[2]?.points} pts</p>
              <div className={styles.podiumBarThird}>
                <span className={styles.podiumBarNumberOther}>3</span>
              </div>
            </div>
          </div>

          {/* Full Table */}
          <div className={styles.rankingTable}>
            {players.map((player: RankingEntry) => {
              const trendType = getTrendColor(player.trend);
              const rankEmoji = player.rank === 1 ? "🏆" : player.rank === 2 ? "🥈" : player.rank === 3 ? "🥉" : null;

              return (
                <div
                  key={player.name}
                  className={player.rank <= 3 ? styles.rankingRowTop : styles.rankingRow}
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
                    <p className={styles.rankingName}>{player.name}</p>
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

          <div className={styles.sectionCta} style={{ marginTop: "2rem" }}>
            <button className={styles.btnOutline}>Ver Ranking Completo →</button>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ===== PÁGINA PRINCIPAL — MICampeonato ===== */
export default function MundialHome() {
  const [steps, setSteps] = useState<any[]>([]);
  const [scoringRules, setScoringRules] = useState<any[]>([]);
  const [multiplierRules, setMultiplierRules] = useState<any[]>([]);
  const [matches, setMatches] = useState<MatchData[]>([]);
  const [prizes, setPrizes] = useState<any[]>([]);
  const [specialPredictions, setSpecialPredictions] = useState<any[]>([]);
  const [players, setPlayers] = useState<RankingEntry[]>([]);

  useEffect(() => {
    dedupe("home", {}, () => getHomeData())
      .then((res: any): void => {
        const data = res.data || {};
        
        // ============================================
        // CONFIGURACIÓN (from configuracion endpoint)
        // ============================================
        if (data.configuracion) {
          if (data.configuracion?.scoring_rules) setScoringRules(data.configuracion.scoring_rules);
          if (data.configuracion?.multiplier_rules) setMultiplierRules(data.configuracion.multiplier_rules);
          if (data.configuracion?.steps) setSteps(data.configuracion.steps);
          if (data.configuracion?.prizes) setPrizes(data.configuracion.prizes);
        }
        
        // ============================================
        // PREDICCIONES ESPECIALES (from predicciones-especiales endpoint)
        // Structure: { predicciones: [...] }
        // ============================================
        if (data.predicciones_especiales) {
          const especiales = data.predicciones_especiales?.predicciones || [];
          setSpecialPredictions(especiales);
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
        }
        
        // ============================================
        // RANKING (from ranking endpoint)
        // Structure: { ranking: [...], total_participantes: number, mi_posicion: {...} }
        // Transform backend formato to frontend RankingEntry format
        // ============================================
        if (data.ranking) {
          const rankingData = (data.ranking?.ranking || []).map((entry: any) => ({
            rank: entry.posicion,
            name: entry.nombre,
            avatar: entry.iniciales || entry.nombre.charAt(0),
            points: entry.puntos_totales,
            exactHits: entry.aciertos_exactos,
            trend: entry.tendencia_str || "0",
          }));
          setPlayers(rankingData);
        }
      })
      .catch(() => {
        setSteps([]);
        setScoringRules([]);
        setMultiplierRules([]);
        setMatches([]);
        setPrizes([]);
        setSpecialPredictions([]);
        setPlayers([]);
      });
  }, []);

  return (
    <div className={styles.pageWrapper}>
      <Hero />
      <MatchesSection initialMatches={matches} />
      <RankingSection initialPlayers={players} />
      <SpecialPredictionsSection initialSpecialPredictions={specialPredictions} />
      <PrizesSection initialPrizes={prizes} initialSpecialPredictions={specialPredictions} />
      <HowItWorks steps={steps} />
      <ScoringRulesGridStandalone scoringRules={scoringRules} multiplierRules={multiplierRules} />
    </div>
  );
}

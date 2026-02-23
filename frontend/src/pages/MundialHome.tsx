import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import styles from "../styles/MundialHome.module.css";
import { getTrendColor } from "../services/mundial.ts";
import type { MatchData, RankingEntry } from "../services/mundial.ts";
import {
  // @ts-ignore
  getPartidos,
  // @ts-ignore
  getRanking,
  // @ts-ignore
  getConfiguracion,
  // @ts-ignore
  getPrediccionesEspeciales,
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
    getConfiguracion()
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

/* ===== MATCHES ===== */
function MatchesSection() {
  const [activePhase, setActivePhase] = useState("Grupos");
  const [matches, setMatches] = useState<MatchData[]>([]);
  const [phases, setPhases] = useState<string[]>([]);

  useEffect(() => {
    getPartidos()
      .then((res: any): void => {
        const data = res.data || [];
        setMatches(data);
        const uniquePhases = ["Todos", ...new Set(data.map((m: MatchData) => m.phase))] as string[];
        setPhases(uniquePhases);
      })
      .catch(() => {
        setMatches([]);
        setPhases(["Todos"]);
      });
  }, []);

  return (
    <section id="partidos" className={styles.matchesSection}>
      <div className={styles.sectionInner}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Próximos Partidos</h2>
          <p className={styles.sectionSubtitle}>
            Registra tus predicciones antes de que comience cada partido y acumula puntos.
          </p>
        </div>

        <div className={styles.phaseFilter}>
          {phases.map((phase) => (
            <button
              key={phase}
              className={`${styles.btnGhost} ${styles.btnSmall} ${activePhase === phase ? styles.btnActive : ""}`}
              onClick={() => setActivePhase(phase)}
            >
              {phase}
            </button>
          ))}
        </div>

        <div className={styles.matchesGrid}>
          {matches
            .filter((match) => activePhase === "Todos" || match.phase === activePhase)
            .slice(0, 6)
            .map((match: MatchData) => (
              <div key={match.id} className={styles.matchCard}>
                <div className={styles.matchCardHeader}>
                  <span className={styles.badgeMuted}>{match.phase}</span>
                <span className={styles.badgePrimary}>{match.multiplier}</span>
              </div>

              <div className={styles.matchTeams}>
                <div className={styles.matchTeam}>
                  <span className={styles.matchFlag}>{match.homeFlag}</span>
                  <span className={styles.matchTeamName}>{match.homeTeam}</span>
                </div>
                <span className={styles.matchVs}>VS</span>
                <div className={styles.matchTeam}>
                  <span className={styles.matchFlag}>{match.awayFlag}</span>
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
function PrizesSection() {
  const [prizes, setPrizes] = useState<any[]>([]);
  const [specialPredictions, setSpecialPredictions] = useState<any[]>([]);

  useEffect(() => {
    getConfiguracion()
      .then((res: any): void => {
        if (res.data?.prizes) setPrizes(res.data.prizes);
      })
      .catch(() => {
        setPrizes([]);
      });
    getPrediccionesEspeciales()
      .then((res: any): void => {
        if (res.data) setSpecialPredictions(res.data);
      })
      .catch(() => {
        setSpecialPredictions([]);
      });
  }, []);

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

/* ===== RANKING ===== */
function RankingSection() {
  const [players, setPlayers] = useState<RankingEntry[]>([]);

  useEffect(() => {
    getRanking()
      .then((res: any): void => {
        if (res.data) setPlayers(res.data);
      })
      .catch(() => {
        setPlayers([]);
      });
  }, []);

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
                  key={player.rank}
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
                      {player.trend.startsWith("+") ? "↑" : player.trend.startsWith("-") ? "↓" : "—"}
                      {player.trend}
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

  useEffect(() => {
    getConfiguracion()
      .then((res: any): void => {
        if (res.data?.steps) setSteps(res.data.steps);
      })
      .catch(() => {
        setSteps([]);
      });
  }, []);

  return (
    <div className={styles.pageWrapper}>
      <Hero />
      <MatchesSection />
      <HowItWorks steps={steps} />
      <RankingSection />
      <PrizesSection />
    </div>
  );
}

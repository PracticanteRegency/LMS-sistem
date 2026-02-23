import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import styles from "../styles/MundialPartidos.module.css";
import { formatDateES } from "../services/mundial.ts";
import type { WinnerChoice, Prediction, MatchData } from "../services/mundial.ts";
// @ts-ignore - API functions from JS file
import { getPartidos } from "../services/mundial.js";

// All data from backend API

// ================================================================
//  COMPONENTE PRINCIPAL
// ================================================================

export default function MundialPartidos() {
  const [activePhase, setActivePhase] = useState("Todos");
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMatch, setSelectedMatch] = useState<MatchData | null>(null);
  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);
  const [winner, setWinner] = useState<WinnerChoice | null>(null);
  const [predictions, setPredictions] = useState<Record<number, Prediction>>({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [allMatches, setAllMatches] = useState<MatchData[]>([]);
  const [phases, setPhases] = useState<string[]>([]);
  const [groups, setGroups] = useState<string[]>([]);

  useEffect(() => {
    getPartidos()
      .then((res: any): void => {
        const data = res.data || [];
        setAllMatches(data);
        const uniquePhases = ["Todos", ...new Set(data.map((m: MatchData) => m.phase))] as string[];
        setPhases(uniquePhases);
        const uniqueGroups = [...new Set(data.filter((m: MatchData) => m.group).map((m: MatchData) => m.group))];
        setGroups(uniqueGroups as string[]);
      })
      .catch(() => {
        setAllMatches([]);
        setPhases(["Todos"]);
        setGroups([]);
      });
  }, []);

  const filteredMatches = useMemo(() => {
    return allMatches.filter((match) => {
      const phaseMatch = activePhase === "Todos" || match.phase === activePhase;
      const groupMatch =
        activePhase !== "Grupos" || !activeGroup || match.group === activeGroup;
      const searchMatch =
        !searchTerm ||
        match.homeTeam.toLowerCase().includes(searchTerm.toLowerCase()) ||
        match.awayTeam.toLowerCase().includes(searchTerm.toLowerCase());
      return phaseMatch && groupMatch && searchMatch;
    });
  }, [allMatches, activePhase, activeGroup, searchTerm]);

  const totalPredicted = Object.keys(predictions).length;

  const openPredictionModal = (match: MatchData) => {
    if (match.status === "locked") return;
    setSelectedMatch(match);
    const existing = predictions[match.id];
    if (existing) {
      setHomeScore(existing.home);
      setAwayScore(existing.away);
      setWinner(existing.winner);
    } else {
      setHomeScore(0);
      setAwayScore(0);
      setWinner(null);
    }
  };

  const handleSavePrediction = () => {
    if (!selectedMatch || !winner) return;
    setPredictions({
      ...predictions,
      [selectedMatch.id]: { home: homeScore, away: awayScore, winner },
    });
    setSelectedMatch(null);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 1800);
  };

  const adjustScore = (side: "home" | "away", delta: number) => {
    if (side === "home") setHomeScore(Math.max(0, homeScore + delta));
    else setAwayScore(Math.max(0, awayScore + delta));
  };

  const getStatusBadge = (match: MatchData) => {
    const pred = predictions[match.id];
    if (match.status === "locked" && !pred) {
      return <span className={styles.badgeLocked}>🔒 Bloqueado</span>;
    }
    if (pred) {
      return <span className={styles.badgeDone}>✅ Predicción hecha</span>;
    }
    return <span className={styles.badgePending}>⏳ Pendiente</span>;
  };

  const getPhaseCount = (phase: string) => {
    if (phase === "Todos") return allMatches.length;
    return allMatches.filter((m) => m.phase === phase).length;
  };

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <Link to="/mundial" className={styles.btnBack}>← Volver</Link>
          <div>
            <h1 className={styles.headerTitle}>⚽ MICampeonato — Partidos</h1>
            <p className={styles.headerSubtitle}>
              Haz tus predicciones antes de que inicie cada partido
            </p>
          </div>
        </div>
        <div className={styles.headerRight}>
          <span className={styles.headerBadge}>
            ✅ {totalPredicted} / {allMatches.filter((m) => m.status === "open").length} predicciones
          </span>
        </div>
      </div>

      {/* Stats Bar */}
      <div className={styles.statsBar}>
        {phases.map((phase) => (
          <div key={phase} className={styles.statChip}>
            <span className={styles.statChipLabel}>{phase}</span>
            <span className={styles.statChipValue}>{getPhaseCount(phase)}</span>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        <div className={styles.searchWrapper}>
          <span className={styles.searchIcon}>🔍</span>
          <input
            className={styles.searchInput}
            placeholder="Buscar por equipo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className={styles.phaseTabs}>
          {phases.map((phase) => (
            <button
              key={phase}
              className={activePhase === phase ? styles.phaseTabActive : styles.phaseTab}
              onClick={() => {
                setActivePhase(phase);
                if (phase !== "Grupos") setActiveGroup(null);
              }}
            >
              {phase}
              <span className={styles.phaseCount}>{getPhaseCount(phase)}</span>
            </button>
          ))}
        </div>

        {activePhase === "Grupos" && (
          <div className={styles.groupTabs}>
            <button
              className={!activeGroup ? styles.groupTabActive : styles.groupTab}
              onClick={() => setActiveGroup(null)}
            >
              Todos
            </button>
            {groups.map((g) => (
              <button
                key={g}
                className={activeGroup === g ? styles.groupTabActive : styles.groupTab}
                onClick={() => setActiveGroup(g)}
              >
                {g}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Match Cards Grid */}
      <div className={styles.matchesGrid}>
        {filteredMatches.map((match) => {
          const pred = predictions[match.id];
          return (
            <div
              key={match.id}
              className={`${styles.matchCard} ${match.status === "locked" && !pred ? styles.matchCardLocked : ""}`}
              onClick={() => openPredictionModal(match)}
              style={{ cursor: match.status === "locked" ? "default" : "pointer" }}
            >
              <div className={styles.matchCardHeader}>
                <span className={styles.matchPhase}>
                  {match.phase}{match.group ? ` - ${match.group}` : ""}
                </span>
                <span className={styles.matchMultiplier}>{match.multiplier}</span>
              </div>
              <div className={styles.matchCardBody}>
                <div className={styles.matchTeam}>
                  <span className={styles.matchFlag}>{match.homeFlag}</span>
                  <span className={styles.matchTeamName}>{match.homeTeam}</span>
                </div>
                <div className={styles.matchVs}>
                  {pred ? (
                    <span className={styles.matchPredScore}>
                      {pred.home} - {pred.away}
                    </span>
                  ) : (
                    <span className={styles.matchVsText}>VS</span>
                  )}
                </div>
                <div className={styles.matchTeam}>
                  <span className={styles.matchFlag}>{match.awayFlag}</span>
                  <span className={styles.matchTeamName}>{match.awayTeam}</span>
                </div>
              </div>
              <div className={styles.matchCardFooter}>
                <span className={styles.matchDate}>📅 {formatDateES(match.date)}</span>
                <span className={styles.matchTime}>⏰ {match.time}</span>
              </div>
              <div className={styles.matchStatus}>{getStatusBadge(match)}</div>
            </div>
          );
        })}
      </div>

      {filteredMatches.length === 0 && (
        <div className={styles.emptyState}>
          <p className={styles.emptyEmoji}>🔍</p>
          <p className={styles.emptyTitle}>Sin resultados</p>
          <p className={styles.emptyText}>No se encontraron partidos con esos filtros.</p>
        </div>
      )}

      {/* ===== PREDICTION MODAL ===== */}
      {selectedMatch && (
        <div className={styles.modalOverlay} onClick={() => setSelectedMatch(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>⚽ Tu Predicción</h2>
              <button className={styles.modalClose} onClick={() => setSelectedMatch(null)}>✕</button>
            </div>

            <div className={styles.modalBody}>
              <p className={styles.modalSubtext}>
                {selectedMatch.phase}{selectedMatch.group ? ` - Grupo ${selectedMatch.group}` : ""}
                {" "} | {formatDateES(selectedMatch.date)} | {selectedMatch.time}
              </p>

              {/* Winner Selection */}
              <p className={styles.sectionLabel}>¿Quién gana?</p>
              <div className={styles.winnerGrid}>
                <button
                  className={winner === "home" ? styles.winnerBtnActive : styles.winnerBtn}
                  onClick={() => setWinner("home")}
                >
                  <span className={styles.winnerFlag}>{selectedMatch.homeFlag}</span>
                  <span>{selectedMatch.homeTeam}</span>
                </button>
                <button
                  className={winner === "draw" ? styles.winnerBtnActive : styles.winnerBtn}
                  onClick={() => setWinner("draw")}
                >
                  <span className={styles.winnerFlag}>🤝</span>
                  <span>Empate</span>
                </button>
                <button
                  className={winner === "away" ? styles.winnerBtnActive : styles.winnerBtn}
                  onClick={() => setWinner("away")}
                >
                  <span className={styles.winnerFlag}>{selectedMatch.awayFlag}</span>
                  <span>{selectedMatch.awayTeam}</span>
                </button>
              </div>

              {/* Score Adjuster */}
              <p className={styles.sectionLabel}>Marcador</p>
              <div className={styles.scoreAdjuster}>
                <div className={styles.scoreTeamCol}>
                  <span className={styles.scoreTeamLabel}>
                    {selectedMatch.homeFlag} {selectedMatch.homeTeam}
                  </span>
                  <div className={styles.scoreControls}>
                    <button
                      className={styles.scoreBtn}
                      onClick={() => adjustScore("home", -1)}
                    >
                      ➖
                    </button>
                    <span className={styles.scoreValue}>{homeScore}</span>
                    <button
                      className={styles.scoreBtn}
                      onClick={() => adjustScore("home", 1)}
                    >
                      ➕
                    </button>
                  </div>
                </div>
                <span className={styles.scoreSeparator}>-</span>
                <div className={styles.scoreTeamCol}>
                  <span className={styles.scoreTeamLabel}>
                    {selectedMatch.awayFlag} {selectedMatch.awayTeam}
                  </span>
                  <div className={styles.scoreControls}>
                    <button
                      className={styles.scoreBtn}
                      onClick={() => adjustScore("away", -1)}
                    >
                      ➖
                    </button>
                    <span className={styles.scoreValue}>{awayScore}</span>
                    <button
                      className={styles.scoreBtn}
                      onClick={() => adjustScore("away", 1)}
                    >
                      ➕
                    </button>
                  </div>
                </div>
              </div>

              {/* Winner vs Score mismatch */}
              {winner &&
                ((winner === "home" && homeScore <= awayScore) ||
                  (winner === "away" && awayScore <= homeScore) ||
                  (winner === "draw" && homeScore !== awayScore)) && (
                  <div className={styles.predictionWarning}>
                    ⚠️ El marcador no coincide con el ganador seleccionado
                  </div>
                )}

              {/* Points info */}
              <div className={styles.predictionInfo}>
                <p>🏆 Resultado exacto: <strong>3 pts × {selectedMatch.multiplier}</strong></p>
                <p>✅ Ganador correcto: <strong>1 pt × {selectedMatch.multiplier}</strong></p>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button className={styles.btnOutline} onClick={() => setSelectedMatch(null)}>Cancelar</button>
              <button
                className={styles.btnPrimary}
                disabled={!winner}
                onClick={handleSavePrediction}
              >
                Guardar Predicción
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== SUCCESS MODAL ===== */}
      {showSuccess && (
        <div className={styles.successOverlay}>
          <div className={styles.successModal}>
            <div className={styles.successCheck}>✓</div>
            <p className={styles.successTitle}>¡Predicción guardada!</p>
            <p className={styles.successText}>Buena suerte 🍀</p>
          </div>
        </div>
      )}
    </div>
  );
}

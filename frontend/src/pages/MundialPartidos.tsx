import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import styles from "../styles/MundialPartidos.module.css";
import { formatDateES } from "../services/mundial.ts";
import type { WinnerChoice, Prediction, MatchData } from "../services/mundial.ts";
import dedupe from "../services/dedupe.js";
// @ts-ignore - API functions from JS file
import { getPartidos, upsertPrediccion } from "../services/mundial.js";

// All data from backend API

// ================================================================
//  COMPONENTE PRINCIPAL
// ================================================================

export default function MundialPartidos() {
  // State declarations
  const [activePhase, setActivePhase] = useState("Todos");
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMatch, setSelectedMatch] = useState<MatchData | null>(null);
  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);
  const [winner, setWinner] = useState<WinnerChoice | null>(null);
  const [penaltisHome, setPenaltisHome] = useState(0);
  const [penaltisAway, setPenaltisAway] = useState(0);
  const [predictions, setPredictions] = useState<Record<number, Prediction>>({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [allMatches, setAllMatches] = useState<MatchData[]>([]);
  const [phases, setPhases] = useState<string[]>([]);
  const [groups, setGroups] = useState<string[]>([]);

  // Helper function to normalize estado values (handle both Spanish and English)
  const isEstadoAbierto = (estado: string | undefined): boolean => {
    return estado === "abierto" || estado === "open";
  };

  const isEstadoBloqueado = (estado: string | undefined): boolean => {
    return estado === "bloqueado" || estado === "locked";
  };

  const isEstadoFinalizado = (estado: string | undefined): boolean => {
    return estado === "finalizado" || estado === "finished";
  };

  // Función para validar si puede predecir basado en la hora actual
  const canPredictByTime = (fecha: string, hora: string): boolean => {
    try {
      // Combina fecha y hora del partido
      const matchDateTime = new Date(`${fecha}T${hora}`);
      const nowTime = new Date();
      // Calcula 1 hora antes del partido
      const oneHourBefore = new Date(matchDateTime.getTime() - 60 * 60 * 1000);
      // Puede predecir si es ANTES de 1 hora antes del partido
      return nowTime < oneHourBefore;
    } catch {
      // Si hay error en el parsing, permitir predicción
      return true;
    }
  };

  useEffect(() => {
    dedupe("partidos", {}, () => getPartidos())
      .then((res: any): void => {
        // Backend returns { partidos: [...], equipos: [...], estadisticas: {...} }
        const data = res.data?.partidos || res.data || [];
        // Add compatibility fields for component expectations
        const transformedData = data.map((m: any) => ({
          ...m,
          homeTeam: m.equipo_local_nombre || m.homeTeam,
          homeFlag: m.equipo_local_bandera || m.homeFlag,
          awayTeam: m.equipo_visitante_nombre || m.awayTeam,
          awayFlag: m.equipo_visitante_bandera || m.awayFlag,
          phase: m.fase || m.phase,
          group: m.grupo || m.group,
          multiplier: m.multiplicador || m.multiplier,
          date: m.fecha || m.date,
          time: m.hora || m.time,
          puede_predecir: m.puede_predecir !== undefined ? m.puede_predecir : true,
          // Transform mi_prediccion to predictions format
          ...(m.mi_prediccion && {
            mi_prediccion: {
              home: m.mi_prediccion.goles_local,
              away: m.mi_prediccion.goles_visitante,
              winner: m.mi_prediccion.ganador === "local" ? "home" : m.mi_prediccion.ganador === "visitante" ? "away" : "draw",
            }
          })
        }));
        setAllMatches(transformedData);
        // Initialize predictions state with existing mi_prediccion data
        const existingPredictions: Record<number, Prediction> = {};
        transformedData.forEach((m: any) => {
          if (m.mi_prediccion) {
            existingPredictions[m.id] = m.mi_prediccion;
          }
        });
        setPredictions(existingPredictions);
        const uniquePhases = ["Todos", ...new Set(transformedData.map((m: MatchData) => m.fase || m.phase))] as string[];
        setPhases(uniquePhases);
        const uniqueGroups = [...new Set(transformedData.filter((m: MatchData) => m.grupo || m.group).map((m: MatchData) => m.grupo || m.group))];
        setGroups(uniqueGroups as string[]);
      })
      .catch((err: Error) => {
        console.error("Error cargando partidos:", err);
        setAllMatches([]);
        setPhases(["Todos"]);
        setGroups([]);
      });
  }, []);

  const filteredMatches = useMemo(() => {
    return allMatches.filter((match) => {
      const phaseMatch = activePhase === "Todos" || (match.fase || match.phase) === activePhase;
      const groupMatch =
        activePhase !== "Grupos" || !activeGroup || (match.grupo || match.group) === activeGroup;
      const searchMatch =
        !searchTerm ||
        (match.equipo_local_nombre || match.homeTeam || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (match.equipo_visitante_nombre || match.awayTeam || "").toLowerCase().includes(searchTerm.toLowerCase());
      return phaseMatch && groupMatch && searchMatch;
    });
  }, [allMatches, activePhase, activeGroup, searchTerm]);

  const totalPredictions = Object.keys(predictions).length;
  const totalOpenMatches = allMatches.filter((m) => 
    (m.puede_predecir !== false) && 
    isEstadoAbierto(m.estado) && 
    canPredictByTime(m.fecha, m.hora)
  ).length;

  const openPredictionModal = (match: MatchData) => {
    if (!isEstadoAbierto(match.estado) || match.puede_predecir === false || !canPredictByTime(match.fecha, match.hora)) return;
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
    // Reset penaltis
    setPenaltisHome(0);
    setPenaltisAway(0);
  };

  const handleSavePrediction = async () => {
    if (!selectedMatch || !winner) return;
    
    // Validate that penalties are not tied
    if (winner === "draw" && penaltisHome === penaltisAway && (penaltisHome !== 0 || penaltisAway !== 0)) {
      alert("Los penaltis no pueden terminar en empate");
      return;
    }

    try {
      // Send prediction to backend
      const predictionData: any = {
        partido: selectedMatch.id,
        goles_local: homeScore,
        goles_visitante: awayScore,
        ganador: winner === "home" ? "local" : winner === "away" ? "visitante" : "empate",
      };
      
      // If draw, include penalty shootout data (always send if empate)
      if (winner === "draw") {
        predictionData.predice_penaltis = penaltisHome !== 0 || penaltisAway !== 0;
        if (penaltisHome !== 0 || penaltisAway !== 0) {
          predictionData.penaltis_local = penaltisHome;
          predictionData.penaltis_visitante = penaltisAway;
          // Determine winner based on penalties
          if (penaltisHome > penaltisAway) {
            predictionData.ganador_penaltis = "local";
          } else if (penaltisAway > penaltisHome) {
            predictionData.ganador_penaltis = "visitante";
          }
        }
      }
      
      await upsertPrediccion(predictionData);
      // Update local state
      setPredictions({
        ...predictions,
        [selectedMatch.id]: { home: homeScore, away: awayScore, winner },
      });
      setSelectedMatch(null);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 1800);
    } catch (error) {
      console.error("Error guardando predicción:", error);
      alert("Error al guardar la predicción. Intenta nuevamente.");
    }
  };

  const adjustScore = (side: "home" | "away", delta: number) => {
    if (side === "home") setHomeScore(Math.max(0, homeScore + delta));
    else setAwayScore(Math.max(0, awayScore + delta));
  };

  const adjustPenaltis = (side: "home" | "away", delta: number) => {
    if (side === "home") setPenaltisHome(Math.max(0, penaltisHome + delta));
    else setPenaltisAway(Math.max(0, penaltisAway + delta));
  };

  const getStatusBadge = (match: MatchData) => {
    const pred = predictions[match.id];
    if (isEstadoFinalizado(match.estado)) {
      return <span className={styles.badgeLocked}>✔️ Finalizado</span>;
    }
    if (isEstadoBloqueado(match.estado) && !pred) {
      return <span className={styles.badgeLocked}>🔒 Bloqueado</span>;
    }
    if (pred) {
      return <span className={styles.badgeDone}>✅ Predicción hecha</span>;
    }
    return <span className={styles.badgePending}>⏳ Pendiente</span>;
  };

  const getPhaseCount = (phase: string) => {
    if (phase === "Todos") return allMatches.length;
    return allMatches.filter((m) => (m.fase || m.phase) === phase).length;
  };

  const getMultiplierColor = (multiplier?: string) => {
    if (!multiplier) return styles.badgeMultiplier1;
    const value = parseFloat(multiplier.replace("x", ""));
    if (value <= 1.25) return styles.badgeMultiplier1;
    if (value <= 1.75) return styles.badgeMultiplier2;
    if (value <= 2.5) return styles.badgeMultiplier3;
    return styles.badgeMultiplier4;
  };

  return (
    <div className={styles.pageLayout}>
      {/* Header */}
      <header className={styles.stickyHeader}>
        <div className={styles.headerInner}>
          <Link to="/mundial" className={styles.headerBackLink}>
            ← Volver
          </Link>
          <div className={styles.headerCenter}>
            <h1 className={styles.headerMainTitle}>Todos los Partidos</h1>
          </div>
          <div className={styles.predictionCounter}>
            <p className={styles.predictionCounterLabel}>Predicciones</p>
            <p className={styles.predictionCounterValue}>
              {totalPredictions}/{totalOpenMatches}
            </p>
          </div>
        </div>
      </header>

      <div className={styles.mainContent}>
        {/* Page Title */}
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>Todos los Partidos</h1>
          <p className={styles.pageSubtitle}>
            48 selecciones, 12 grupos, 104 partidos. Selecciona un partido para predecir ganador, empate y marcador.
          </p>
        </div>

        {/* Stats Grid */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <p className={styles.statValue}>{allMatches.length}</p>
            <p className={styles.statLabel}>Total partidos</p>
          </div>
          <div className={styles.statCard}>
            <p className={`${styles.statValue} ${styles.statPrimary}`}>{totalPredictions}</p>
            <p className={styles.statLabel}>Predichos</p>
          </div>
          <div className={styles.statCard}>
            <p className={`${styles.statValue} ${styles.statSecondary}`}>{totalOpenMatches - totalPredictions}</p>
            <p className={styles.statLabel}>Pendientes</p>
          </div>
          <div className={styles.statCard}>
            <p className={styles.statValue}>48</p>
            <p className={styles.statLabel}>Selecciones</p>
          </div>
        </div>

        {/* Search */}
        <div className={styles.searchContainer}>
          <span className={styles.searchIcon}>🔍</span>
          <input
            type="text"
            placeholder="Buscar por equipo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        {/* Phase Filters */}
        <div className={styles.phaseFilters}>
          {phases.map((phase) => (
            <button
              key={phase}
              onClick={() => {
                setActivePhase(phase);
                setActiveGroup(null);
              }}
              className={`${styles.phaseButton} ${activePhase === phase ? styles.phaseButtonActive : ""}`}
            >
              {phase}
              <span className={styles.phaseCount}>({getPhaseCount(phase)})</span>
            </button>
          ))}
        </div>

        {/* Group Sub-filters */}
        {(activePhase === "Todos" || activePhase === "Grupos") && (
          <div className={styles.groupFilters}>
            <button
              onClick={() => setActiveGroup(null)}
              className={`${styles.groupButton} ${activeGroup === null ? styles.groupButtonActive : ""}`}
            >
              Todos
            </button>
            {groups.map((g) => (
              <button
                key={g}
                onClick={() => setActiveGroup(g)}
                className={`${styles.groupButton} ${activeGroup === g ? styles.groupButtonActive : ""}`}
              >
                {g}
              </button>
            ))}
          </div>
        )}

        {/* Matches List */}
        <div className={styles.matchList}>
          {filteredMatches.map((match) => {
            const pred = predictions[match.id];
            return (
              <div
                key={match.id}
                className={`${styles.matchCard} ${
                  isEstadoBloqueado(match.estado) || isEstadoFinalizado(match.estado) ? styles.matchCardLocked : "hover:border-primary/50 cursor-pointer"
                } ${pred ? styles.matchCardPredicted : ""}`}
                onClick={() => openPredictionModal(match)}
              >
                <div className={styles.matchBadgeRow}>
                  <span className={styles.badgeSecondary}>
                    {match.fase || match.phase}
                    {(match.grupo || match.group) ? ` - Grupo ${match.grupo || match.group}` : ""}
                  </span>
                  <span className={`${styles.badgePrimary} ${getMultiplierColor(match.multiplicador || match.multiplier)}`}>
                    {match.multiplicador || match.multiplier}
                  </span>
                  {getStatusBadge(match)}
                </div>

                <div className={styles.teamsRow}>
                  {/* Home team */}
                  <div className={styles.teamSide}>
                    <img src={match.equipo_local_bandera || match.homeFlag} alt={match.equipo_local_nombre || match.homeTeam} className={styles.teamFlagImg} />
                    <span className={styles.teamName}>{ match.homeTeam || match.equipo_local_nombre}</span>
                  </div>

                  {/* Score display */}
                  <div className={styles.scoreDisplay}>
                    {pred ? (
                      <div className={styles.scoreBoxContainer}>
                        <div className={`${styles.scoreBox} ${styles.scorePredicted}`}>
                          <span className={styles.scoreValue}>{pred.home}</span>
                          <span className={styles.scoreSeparator}>-</span>
                          <span className={styles.scoreValue}>{pred.away}</span>
                        </div>
                        <p className={styles.scoreTeamLabel}>
                          {pred.winner === "home"
                            ? `Gana ${match.equipo_local_nombre || match.homeTeam}`
                            : pred.winner === "away"
                              ? `Gana ${match.equipo_visitante_nombre || match.awayTeam}`
                              : "Empate"}
                        </p>
                      </div>
                    ) : (
                      <div className={`${styles.scoreBox} ${styles.scorePending}`}>
                        <span className={styles.scoreValue}>?</span>
                        <span className={styles.scoreSeparator}>-</span>
                        <span className={styles.scoreValue}>?</span>
                      </div>
                    )}
                  </div>

                  {/* Away team */}
                  <div className={`${styles.teamSide} ${styles.teamSideAway}`}>
                    <span className={styles.teamName}>{match.equipo_visitante_nombre || match.awayTeam}</span>
                    <img src={match.equipo_visitante_bandera || match.awayFlag} alt={match.equipo_visitante_nombre || match.awayTeam} className={styles.teamFlagImg} />
                  </div>
                </div>

                <div className={styles.matchInfoRow}>
                  <div className={styles.matchDetails}>
                    <div className={styles.matchDetailItem}>
                      📅 {(match.fecha || match.date) ? formatDateES(match.fecha || match.date || "") : "N/A"}
                    </div>
                    <div className={styles.matchDetailItem}>
                      ⏰ {(match.hora || match.time) || "N/A"}
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (match.puede_predecir !== false && isEstadoAbierto(match.estado) && canPredictByTime(match.fecha, match.hora)) openPredictionModal(match);
                    }}
                    disabled={match.puede_predecir === false || !isEstadoAbierto(match.estado) || !canPredictByTime(match.fecha, match.hora)}
                    className={`${styles.actionButton} ${
                      match.puede_predecir === false || !isEstadoAbierto(match.estado) || !canPredictByTime(match.fecha, match.hora)
                        ? styles.actionButtonDisabled
                        : pred
                          ? styles.actionButtonSecondary
                          : styles.actionButtonPrimary
                    }`}
                  >
                    {isEstadoFinalizado(match.estado)
                      ? "Finalizado"
                      : (match.puede_predecir === false || !canPredictByTime(match.fecha, match.hora))
                        ? "Bloqueado"
                        : pred
                          ? "Editar"
                          : "Predecir"}
                  </button>
                </div>
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
      </div>

      {/* ===== PREDICTION MODAL ===== */}
      {selectedMatch && (
        <div className={styles.modalOverlay} onClick={() => setSelectedMatch(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                {predictions[selectedMatch.id] ? "Editar Predicción" : "Nueva Predicción"}
              </h2>
              <p className={styles.modalSubtext}>
                {selectedMatch.fase || selectedMatch.phase}{(selectedMatch.grupo || selectedMatch.group) ? ` - Grupo ${selectedMatch.grupo || selectedMatch.group}` : ""} | {(selectedMatch.fecha || selectedMatch.date) ? formatDateES(selectedMatch.fecha || selectedMatch.date || "") : "N/A"} - {(selectedMatch.hora || selectedMatch.time) || "N/A"}
              </p>
            </div>

            <div className={styles.modalBody}>
              {/* Step 1: Who wins? */}
              <div className={styles.stepSection}>
                <p className={styles.stepLabel}>Paso 1: ¿Quién gana el partido?</p>
                <div className={styles.winnerGrid}>
                  <button
                    type="button"
                    onClick={() => setWinner("home")}
                    className={`${styles.winnerOption} ${
                      winner === "home" ? styles.winnerOptionSelected : ""
                    }`}
                  >
                    <img src={selectedMatch.equipo_local_bandera || selectedMatch.homeFlag} alt={selectedMatch.equipo_local_nombre || selectedMatch.homeTeam} className={styles.winnerFlagImg} />
                    <span className={styles.winnerLabel}>
                      {selectedMatch.equipo_local_nombre || selectedMatch.homeTeam}
                    </span>
                    {winner === "home" && <span className={styles.checkIcon}>✓</span>}
                  </button>

                  <button
                    type="button"
                    onClick={() => setWinner("draw")}
                    className={`${styles.winnerOption} ${styles.winnerOptionDraw} ${
                      winner === "draw" ? styles.winnerOptionSelected : ""
                    }`}
                  >
                    <span className={styles.winnerFlag}>=</span>
                    <span className={styles.winnerLabel}>Empate</span>
                    {winner === "draw" && <span className={styles.checkIcon}>✓</span>}
                  </button>

                  <button
                    type="button"
                    onClick={() => setWinner("away")}
                    className={`${styles.winnerOption} ${
                      winner === "away" ? styles.winnerOptionSelected : ""
                    }`}
                  >
                    <img src={selectedMatch.equipo_visitante_bandera || selectedMatch.awayFlag} alt={selectedMatch.equipo_visitante_nombre || selectedMatch.awayTeam} className={styles.winnerFlagImg} />
                    <span className={styles.winnerLabel}>
                      {selectedMatch.equipo_visitante_nombre || selectedMatch.awayTeam}
                    </span>
                    {winner === "away" && <span className={styles.checkIcon}>✓</span>}
                  </button>
                </div>
              </div>

              {/* Step 2: Score */}
              <div className={styles.stepSection}>
                <p className={styles.stepLabel}>Paso 2: Marcador exacto</p>
                <div className={styles.scoreSection}>
                  {/* Home score */}
                  <div className={styles.scoreTeam}>
                    <span className={styles.scoreTeamLabel}>
                      {selectedMatch.equipo_local_nombre || selectedMatch.homeTeam}
                    </span>
                    <div className={styles.scoreControls}>
                      <button
                        type="button"
                        onClick={() => adjustScore("home", -1)}
                        className={styles.scoreButton}
                      >
                        ➖
                      </button>
                      <div className={styles.scoreBigBox}>
                        <span className={styles.scoreBigValue}>{homeScore}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => adjustScore("home", 1)}
                        className={styles.scoreButton}
                      >
                        ➕
                      </button>
                    </div>
                  </div>

                  <span className={styles.scoreSeparatorBig}>-</span>

                  {/* Away score */}
                  <div className={styles.scoreTeam}>
                    <span className={styles.scoreTeamLabel}>
                      {selectedMatch.equipo_visitante_nombre || selectedMatch.awayTeam}
                    </span>
                    <div className={styles.scoreControls}>
                      <button
                        type="button"
                        onClick={() => adjustScore("away", -1)}
                        className={styles.scoreButton}
                      >
                        ➖
                      </button>
                      <div className={styles.scoreBigBox}>
                        <span className={styles.scoreBigValue}>{awayScore}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => adjustScore("away", 1)}
                        className={styles.scoreButton}
                      >
                        ➕
                      </button>
                    </div>
                  </div>
                </div>

                {/* Validation warning */}
                {winner &&
                  ((winner === "home" && homeScore <= awayScore) ||
                    (winner === "away" && awayScore <= homeScore) ||
                    (winner === "draw" && homeScore !== awayScore)) && (
                    <p className={styles.validationWarning}>
                      ⚠️ Seleccionaste {winner === "draw" ? "empate" : `ganador ${winner === "home" ? "local" : "visitante"}`} pero el marcador no lo refleja.
                    </p>
                  )}
              </div>

              {/* Step 3: Penalty shootout (only if draw) */}
              {winner === "draw" && (
                <div className={styles.stepSection}>
                  <p className={styles.stepLabel}>Paso 3: Resultado de penaltis/desempate (Opcional)</p>
                  <p className={styles.stepDescription}>Si crees que el partido se decide por penaltis, ingresa los goles predichos.</p>
                  
                  {penaltisHome === penaltisAway && (penaltisHome !== 0 || penaltisAway !== 0) && (
                    <div style={{ color: "#f56565", marginBottom: "1rem", fontSize: "0.9rem" }}>
                      ⚠️ Los penaltis no pueden terminar en empate
                    </div>
                  )}
                  
                  <div className={styles.scoreSection} style={{ marginTop: "1rem" }}>
                    {/* Home penaltis */}
                    <div className={styles.scoreTeam}>
                      <span className={styles.scoreTeamLabel}>
                        {selectedMatch.equipo_local_nombre || selectedMatch.homeTeam} (P)
                      </span>
                      <div className={styles.scoreControls}>
                        <button
                          type="button"
                          onClick={() => adjustPenaltis("home", -1)}
                          className={styles.scoreButton}
                        >
                          ➖
                        </button>
                        <div className={styles.scoreBigBox}>
                          <span className={styles.scoreBigValue}>{penaltisHome}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => adjustPenaltis("home", 1)}
                          className={styles.scoreButton}
                        >
                          ➕
                        </button>
                      </div>
                    </div>

                    <span className={styles.scoreSeparatorBig}>-</span>

                    {/* Away penaltis */}
                    <div className={styles.scoreTeam}>
                      <span className={styles.scoreTeamLabel}>
                        {selectedMatch.equipo_visitante_nombre || selectedMatch.awayTeam} (P)
                      </span>
                      <div className={styles.scoreControls}>
                        <button
                          type="button"
                          onClick={() => adjustPenaltis("away", -1)}
                          className={styles.scoreButton}
                        >
                          ➖
                        </button>
                        <div className={styles.scoreBigBox}>
                          <span className={styles.scoreBigValue}>{penaltisAway}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => adjustPenaltis("away", 1)}
                          className={styles.scoreButton}
                        >
                          ➕
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Points Info */}
              <div className={styles.pointsInfo}>
                <div className={styles.pointsRow}>
                  <span className={styles.pointsLabel}>Resultado exacto</span>
                  <span className={styles.pointsValue}>
                    {selectedMatch.multiplier ? (3 * parseFloat(selectedMatch.multiplier.replace("x", ""))) : 0} pts
                  </span>
                </div>
                <div className={styles.pointsRow}>
                  <span className={styles.pointsLabel}>Ganador correcto</span>
                  <span className={styles.pointsValue}>
                    {selectedMatch.multiplier ? (1 * parseFloat(selectedMatch.multiplier.replace("x", ""))) : 0} pts
                  </span>
                </div>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button className={styles.btnOutline} onClick={() => setSelectedMatch(null)}>
                Cancelar
              </button>
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
        <div className={styles.successOverlay} onClick={() => setShowSuccess(false)}>
          <div className={styles.successModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.successIconContainer}>
              <div className={styles.successIconBg}>✓</div>
            </div>
            <h3 className={styles.successTitle}>Predicción Guardada</h3>
            <p className={styles.successText}>Tu predicción ha sido registrada correctamente.</p>
          </div>
        </div>
      )}
    </div>
  );
}

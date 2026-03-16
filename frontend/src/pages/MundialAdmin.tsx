import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import styles from "../styles/MundialAdmin.module.css";
import dedupe from "../services/dedupe.js";
import {
  formatDateES,
} from "../services/mundial.ts";
import type { Match, AdminTab } from "../services/mundial.ts";
import {
  // @ts-ignore
  getEquipos,
  // @ts-ignore
  getConfiguracion,
  // @ts-ignore
  getPartidosAdmin,
  // @ts-ignore
  createPartido,
  // @ts-ignore
  updatePartido,
  // @ts-ignore
  deletePartido,
  // @ts-ignore
  registrarResultado,
  // @ts-ignore
  createEquipo,
  // @ts-ignore
  createConfigEspecial,
  // @ts-ignore
  getConfigEspeciales,
  // @ts-ignore
  updateConfigEspecial,
  // @ts-ignore
  deleteConfigEspecial,
  // @ts-ignore
  getEdiciones,
} from "../services/mundial.js";

// All data from backend API

export default function MundialAdmin() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [activeTab, setActiveTab] = useState<AdminTab>("matches");
  const [searchTerm, setSearchTerm] = useState("");
  const [phaseFilter, setPhaseFilter] = useState("Todos");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [showCreateTeamModal, setShowCreateTeamModal] = useState(false);
  const [showCreateSpecialModal, setShowCreateSpecialModal] = useState(false);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [resultMatch, setResultMatch] = useState<Match | null>(null);
  const [resultHome, setResultHome] = useState(0);
  const [resultAway, setResultAway] = useState(0);
  const [wentToPenalties, setWentToPenalties] = useState(false);
  const [penaltiesHome, setPenaltiesHome] = useState(0);
  const [penaltiesAway, setPenaltiesAway] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);
  const [showSuccess, setShowSuccess] = useState<string | null>(null);

  // Data from backend
  const [teams, setTeams] = useState<any[]>([]);
  const [phases, setPhases] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [specialSettings, setSpecialSettings] = useState<any[]>([]);

  // Form state
  const [formHomeTeam, setFormHomeTeam] = useState("");
  const [formAwayTeam, setFormAwayTeam] = useState("");
  const [formDate, setFormDate] = useState("");
  const [formTime, setFormTime] = useState("");
  const [formPhase, setFormPhase] = useState("");
  const [formGroup, setFormGroup] = useState("");
  const [formStatus, setFormStatus] = useState<"open" | "locked">("open");

  // Team form state
  const [formTeamName, setFormTeamName] = useState("");
  const [formTeamCodigo, setFormTeamCodigo] = useState("");
  const [formTeamEdicion, setFormTeamEdicion] = useState("");
  const [formTeamEmoji, setFormTeamEmoji] = useState("");
  const [formTeamBanderaImagen, setFormTeamBanderaImagen] = useState<File | null>(null);
  const [formTeamActive, setFormTeamActive] = useState(true);

  // Special prediction form state
  const [formSpecialType, setFormSpecialType] = useState("");
  const [formSpecialPoints, setFormSpecialPoints] = useState(50);
  const [formSpecialDeadline, setFormSpecialDeadline] = useState("");
  const [formSpecialDescription, setFormSpecialDescription] = useState("");
  const [formSpecialEnabled, setFormSpecialEnabled] = useState(true);
  const [formSpecialEdicion, setFormSpecialEdicion] = useState("");
  const [editingSpecialId, setEditingSpecialId] = useState<number | null>(null);

  // Ediciones del mundial
  const [ediciones, setEdiciones] = useState<any[]>([]);

  useEffect(() => {
    // Obtener partidos
    dedupe("admin-partidos", {}, () => getPartidosAdmin())
      .then((res: any): void => {
        const data = Array.isArray(res.data) ? res.data : res.data?.partidos || [];
        setMatches(data);
      })
      .catch(() => {
        setMatches([]);
      });
    // Obtener equipos
    dedupe("equipos", {}, () => getEquipos())
      .then((res: any): void => {
        const data = Array.isArray(res.data) ? res.data : res.data?.equipos || [];
        setTeams(data);
      })
      .catch(() => {
        setTeams([]);
      });
    // Obtener configuración (fases, grupos, etc)
    dedupe("config", {}, () => getConfiguracion())
      .then((res: any): void => {
        // Construir array de fases desde la configuración
        const phasesArray = [
          { value: "Grupos", label: "Grupos", multiplier: res.data?.multiplicador_grupos || "x1" },
          { value: "16avos", label: "16avos", multiplier: res.data?.multiplicador_dieciseisavos || "x1.25" },
          { value: "Octavos", label: "Octavos", multiplier: res.data?.multiplicador_octavos || "x1.5" },
          { value: "Cuartos", label: "Cuartos", multiplier: res.data?.multiplicador_cuartos || "x1.75" },
          { value: "Semifinales", label: "Semifinales", multiplier: res.data?.multiplicador_semifinales || "x2" },
          { value: "Tercer Puesto", label: "Tercer Puesto", multiplier: res.data?.multiplicador_tercer_puesto || "x2.5" },
          { value: "Final", label: "Final", multiplier: res.data?.multiplicador_final || "x3" },
        ];
        setPhases(phasesArray);

        // Grupos (letras A-H para 8 grupos)
        setGroups(["A", "B", "C", "D", "E", "F", "G", "H","I","J", "K", "L"]);
      })
      .catch(() => {
        // Valores por defecto si falla la API
        const defaultPhases = [
          { value: "Grupos", label: "Grupos", multiplier: "x1" },
          { value: "16avos", label: "16avos", multiplier: "x1.25" },
          { value: "Octavos", label: "Octavos", multiplier: "x1.5" },
          { value: "Cuartos", label: "Cuartos", multiplier: "x1.75" },
          { value: "Semifinales", label: "Semifinales", multiplier: "x2" },
          { value: "Tercer Puesto", label: "Tercer Puesto", multiplier: "x2.5" },
          { value: "Final", label: "Final", multiplier: "x3" },
        ];
        setPhases(defaultPhases);
        setGroups(["A", "B", "C", "D", "E", "F", "G", "H","I", "J", "K", "L"]);
      });

    // Obtener configuraciones de predicciones especiales
    dedupe("config-especiales", {}, () => getConfigEspeciales())
      .then((res: any): void => {
        const data = Array.isArray(res.data) ? res.data : [];
        setSpecialSettings(data);
      })
      .catch(() => {
        setSpecialSettings([]);
      });

    // Obtener ediciones del mundial
    dedupe("ediciones", {}, () => getEdiciones())
      .then((res: any): void => {
        const data = Array.isArray(res.data) ? res.data : [];
        setEdiciones(data);
        // Seleccionar la edición activa por defecto
        const activa = data.find((e: any) => e.activa);
        if (activa) setFormSpecialEdicion(String(activa.id));
      })
      .catch(() => {
        setEdiciones([]);
      });
  }, []);

  const filteredMatches = matches.filter((match) => {
    const phaseMatch = phaseFilter === "Todos" || match.fase === phaseFilter;
    const homeTeamName = (match.equipo_local_nombre || match.homeTeam || "").toString().toLowerCase();
    const awayTeamName = (match.equipo_visitante_nombre || match.awayTeam || "").toString().toLowerCase();
    const searchMatch =
      homeTeamName.includes(searchTerm.toLowerCase()) ||
      awayTeamName.includes(searchTerm.toLowerCase());
    return phaseMatch && searchMatch;
  });

  const resetForm = () => {
    setFormHomeTeam("");
    setFormAwayTeam("");
    setFormDate("");
    setFormTime("");
    setFormPhase("");
    setFormGroup("");
    setFormStatus("open");
    setEditingMatch(null);
  };

  const openCreateModal = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const openEditModal = (match: Match) => {
    setEditingMatch(match);
    // Convertir IDs a strings para el formulario
    setFormHomeTeam(String(match.equipo_local || match.homeTeam || ""));
    setFormAwayTeam(String(match.equipo_visitante || match.awayTeam || ""));
    setFormDate(match.fecha || match.date || "");
    setFormTime(match.hora || match.time || "");
    setFormPhase(match.fase || match.phase || "");
    setFormGroup(match.grupo || match.group || "");
    const estado = (match.estado || match.status || "").toLowerCase();
    setFormStatus(estado === "finalizado" || estado === "finished" ? "open" : (estado as "open" | "locked"));
    setShowCreateModal(true);
  };

  const openResultModal = (match: Match) => {
    setResultMatch(match);
    setResultHome(match.result?.home ?? 0);
    setResultAway(match.result?.away ?? 0);
    setWentToPenalties(false);
    setPenaltiesHome(0);
    setPenaltiesAway(0);
    setShowResultModal(true);
  };

  const handleSaveMatch = async () => {
    if (!formHomeTeam || !formAwayTeam || !formDate || !formTime || !formPhase) return;

    // formHomeTeam y formAwayTeam ya contienen el ID del equipo
    const homeTeamId = parseInt(formHomeTeam as string);
    const awayTeamId = parseInt(formAwayTeam as string);

    if (!homeTeamId || !awayTeamId) {
      alert("Por favor selecciona ambos equipos correctamente");
      return;
    }

    const payload = {
      equipo_local: homeTeamId,
      equipo_visitante: awayTeamId,
      fecha: formDate,
      hora: formTime,
      fase: formPhase,
      grupo: formPhase === "Grupos" ? formGroup : null,
      estado: formStatus === "open" ? "abierto" : "bloqueado",
    };

    console.log("📤 Enviando payload:", payload);

    try {
      if (editingMatch) {
        // Actualizar partido existente
        await updatePartido(editingMatch.id, payload);
        triggerSuccess("Partido actualizado");
      } else {
        // Crear nuevo partido
        await createPartido(payload);
        triggerSuccess("Partido creado");
      }

      // Recargar partidos desde el backend
      getPartidosAdmin()
        .then((res: any) => {
          const data = Array.isArray(res.data) ? res.data : res.data?.partidos || [];
          setMatches(data);
        })
        .catch((err: Error) => {
          console.error("Error cargando partidos:", err);
        });

      setShowCreateModal(false);
      resetForm();
    } catch (error: any) {
      console.error("❌ Error guardando partido:", error);
      const errorMessage = error.response?.data?.error || error.response?.data?.detail || error.message || "Error desconocido";
      const formattedError = typeof errorMessage === 'object' ? JSON.stringify(errorMessage) : errorMessage;
      alert(`Error al guardar el partido:\n${formattedError}`);
    }
  };

  const handleSaveResult = async () => {
    if (!resultMatch) return;

    const payload: any = {
      goles_local: resultHome,
      goles_visitante: resultAway,
      fue_a_penaltis: wentToPenalties,
      penaltis_local: wentToPenalties ? penaltiesHome : null,
      penaltis_visitante: wentToPenalties ? penaltiesAway : null,
    };

    try {
      await registrarResultado(resultMatch.id, payload);
      triggerSuccess("Resultado registrado. Puntos calculados.");

      // Recargar partidos desde el backend
      getPartidosAdmin()
        .then((res: any) => {
          const data = Array.isArray(res.data) ? res.data : res.data?.partidos || [];
          setMatches(data);
        })
        .catch((err: Error) => {
          console.error("Error cargando partidos:", err);
        });

      setShowResultModal(false);
    } catch (error) {
      console.error("Error registrando resultado:", error);
      alert("Error al registrar el resultado. Revisa la consola.");
    }
  };

  const handleDeleteMatch = async (id: number) => {
    try {
      await deletePartido(id);
      setMatches(matches.filter((m) => m.id !== id));
      setShowDeleteConfirm(null);
      triggerSuccess("Partido eliminado");
    } catch (error) {
      console.error("Error eliminando partido:", error);
      alert("Error al eliminar el partido. Revisa la consola.");
    }
  };

  const triggerSuccess = (msg: string) => {
    setShowSuccess(msg);
    setTimeout(() => setShowSuccess(null), 2000);
  };

  const reloadSpecialSettings = async () => {
    try {
      const res = await getConfigEspeciales();
      const data = Array.isArray(res.data) ? res.data : [];
      setSpecialSettings(data);
    } catch (error) {
      console.error("Error recargando configuraciones especiales:", error);
    }
  };

  const reloadTeams = async () => {
    try {
      const res = await getEquipos();
      const data = Array.isArray(res.data) ? res.data : res.data?.equipos || [];
      setTeams(data);
    } catch (error) {
      console.error("Error recargando equipos:", error);
    }
  };

  const getStatusBadge = (status: string) => {
    const s = (status || "").toLowerCase();
    switch (s) {
      case "abierto":
      case "open":
        return <span className={styles.badgePrimary}>Abierto</span>;
      case "bloqueado":
      case "locked":
        return <span className={styles.badgeWarning}>Bloqueado</span>;
      case "finalizado":
      case "finished":
        return <span className={styles.badgeAccent}>Finalizado</span>;
      default:
        return <span className={styles.badgeMuted}>{status || "—"}</span>;
    }
  };

  const totalOpen = matches.filter((m) => {
    const e = (m.estado || m.status || "").toLowerCase();
    return e === "abierto" || e === "open";
  }).length;
  const totalFinished = matches.filter((m) => {
    const e = (m.estado || m.status || "").toLowerCase();
    return e === "finalizado" || e === "finished";
  }).length;
  const totalLocked = matches.filter((m) => {
    const e = (m.estado || m.status || "").toLowerCase();
    return e === "bloqueado" || e === "locked";
  }).length;

  return (
    <div className={styles.adminLayout}>
      {/* ===== ADMIN HEADER ===== */}
      <header className={styles.adminHeader}>
        <div className={styles.adminHeaderInner}>
          <Link to="/mundial" className={styles.backLink}>
            ← Volver
          </Link>
          <div className={styles.headerTitle}>
            <span className={styles.headerIcon}>🛡️</span>
            <span>Panel de Administración</span>
          </div>
        </div>
      </header>

      <main className={styles.mainContent}>
        {/* ===== TABS ===== */}
        <div className={styles.tabBar}>
          <button
            className={`${styles.tabBtn} ${activeTab === "matches" ? styles.tabActive : ""}`}
            onClick={() => setActiveTab("matches")}
          >
            📅 Partidos
          </button>
          <button
            className={`${styles.tabBtn} ${activeTab === "results" ? styles.tabActive : ""}`}
            onClick={() => setActiveTab("results")}
          >
            📊 Resultados
          </button>
          <button
            className={`${styles.tabBtn} ${activeTab === "teams" ? styles.tabActive : ""}`}
            onClick={() => setActiveTab("teams")}
          >
            🏴 Equipos
          </button>
          <button
            className={`${styles.tabBtn} ${activeTab === "special" ? styles.tabActive : ""}`}
            onClick={() => setActiveTab("special")}
          >
            🎯 Predicciones Especiales
          </button>
          <button
            className={`${styles.tabBtn} ${activeTab === "settings" ? styles.tabActive : ""}`}
            onClick={() => setActiveTab("settings")}
          >
            ⚙️ Configuración
          </button>
        </div>

        {/* ===== STATS GRID ===== */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <p className={styles.statValue}>{matches.length}</p>
            <p className={styles.statLabel}>Total partidos</p>
          </div>
          <div className={styles.statCard}>
            <p className={`${styles.statValue} ${styles.statPrimary}`}>{totalOpen}</p>
            <p className={styles.statLabel}>Abiertos</p>
          </div>
          <div className={styles.statCard}>
            <p className={`${styles.statValue} ${styles.statWarning}`}>{totalLocked}</p>
            <p className={styles.statLabel}>Bloqueados</p>
          </div>
          <div className={styles.statCard}>
            <p className={`${styles.statValue} ${styles.statSuccess}`}>{totalFinished}</p>
            <p className={styles.statLabel}>Finalizados</p>
          </div>
        </div>

        {/* ===== MATCHES TAB ===== */}
        {activeTab === "matches" && (
          <>
            {/* Toolbar */}
            <div className={styles.toolbar}>
              <div className={styles.searchWrapper}>
                <span className={styles.searchIcon}>🔍</span>
                <input
                  type="text"
                  placeholder="Buscar por equipo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={styles.searchInput}
                />
              </div>
              <select
                value={phaseFilter}
                onChange={(e) => setPhaseFilter(e.target.value)}
                className={styles.filterSelect}
              >
                <option value="Todos">Todas las fases</option>
                {phases.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
              <button onClick={openCreateModal} className={styles.btnPrimary}>
                ➕ Crear Partido
              </button>
            </div>

            {/* Matches Table */}
            <div className={styles.tableWrapper}>
              <table className={styles.matchTable}>
                <thead>
                  <tr className={styles.tableHeader}>
                    <th>Partido</th>
                    <th className={styles.hiddenMobile}>Fase</th>
                    <th className={styles.hiddenTablet}>Fecha</th>
                    <th>Estado</th>
                    <th>Resultado</th>
                    <th className={styles.hiddenMobile}>Predicciones</th>
                    <th style={{ textAlign: "right" }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMatches.map((match) => {
                    const estado = (match.estado || match.status || "").toLowerCase();
                    const isFinished = estado === "finalizado" || estado === "finished";
                    return (
                      <tr key={match.id} className={`${styles.matchTableRow} ${isFinished ? styles.finishedRow : ""}`} style={{ opacity: isFinished ? 0.9 : 1 }}>
                        <td className={styles.matchTableCell}>
                          <div className={styles.teamDisplay}>
                            <img src={match.equipo_local_bandera || match.homeFlag} alt={match.equipo_local_nombre || match.homeTeam} className={styles.teamFlagImg} />
                            <span className={styles.teamName}>{match.equipo_local_nombre || match.homeTeam}</span>
                            <span className={styles.vs}>vs</span>
                            <span className={styles.teamName}>{match.equipo_visitante_nombre || match.awayTeam}</span>
                            <img src={match.equipo_visitante_bandera || match.awayFlag} alt={match.equipo_visitante_nombre || match.awayTeam} className={styles.teamFlagImg} />
                          </div>
                        </td>
                        <td className={`${styles.matchTableCell} ${styles.hiddenMobile}`}>
                          <span className={styles.badge}>{match.fase || match.phase}{(match.grupo || match.group) ? ` ${match.grupo || match.group}` : ""}</span>
                          <span className={styles.badgeMuted}>{match.multiplicador || match.multiplier}</span>
                        </td>
                        <td className={`${styles.matchTableCell} ${styles.hiddenTablet}`}>
                          <div>
                            <p>{formatDateES(match.fecha || match.date || "")}</p>
                            <p className={styles.smallText}>{match.hora || match.time}</p>
                          </div>
                        </td>
                        <td className={styles.matchTableCell}>
                          {getStatusBadge(match.estado || match.status || "")}
                        </td>
                        <td className={styles.matchTableCell} style={{ textAlign: "center", fontWeight: 600 }}>
                          {match.goles_local !== undefined || match.resultado ? (
                            <div>
                              <span style={{ fontSize: "1.1rem", color: "var(--success)" }}>
                                {match.goles_local !== undefined ? match.goles_local : match.resultado?.goles_local || "-"} - {match.goles_visitante !== undefined ? match.goles_visitante : match.resultado?.goles_visitante || "-"}
                              </span>
                              {(match.fue_a_penaltis || match.penaltis_local !== undefined) && (
                                <div style={{ fontSize: "0.75rem", color: "var(--warning)", marginTop: "0.25rem" }}>
                                  (P: {match.penaltis_local || 0}-{match.penaltis_visitante || 0})
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className={styles.mutedText}>-</span>
                          )}
                        </td>
                        <td className={`${styles.matchTableCell} ${styles.hiddenMobile}`} style={{ textAlign: "center" }}>
                          <span className={styles.badge} style={{ fontSize: "0.75rem" }}>
                            {match.total_predicciones || 0} 📊
                          </span>
                        </td>
                        <td className={styles.matchTableCell}>
                          <div className={styles.actionButtons}>
                            <button
                              className={styles.actionBtn}
                              onClick={() => openEditModal(match)}
                              title="Editar partido"
                            >
                              ✏️
                            </button>
                            <button
                              className={styles.actionBtn}
                              onClick={() => openResultModal(match)}
                              title="Registrar resultado"
                            >
                              🎯
                            </button>
                            <button
                              className={`${styles.actionBtn} ${styles.actionBtnDelete}`}
                              onClick={() => setShowDeleteConfirm(match.id)}
                              title="Eliminar partido"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {filteredMatches.length === 0 && (
                <div style={{ textAlign: "center", padding: "3rem 1rem" }}>
                  <p style={{ color: "var(--muted-foreground)" }}>No se encontraron partidos.</p>
                </div>
              )}
            </div>
          </>
        )}

        {/* ===== RESULTS TAB ===== */}
        {activeTab === "results" && (
          <div>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.5rem" }}>📊 Gesionar Resultados</h2>
            <p style={{ color: "var(--muted-foreground)", marginBottom: "1.5rem", fontSize: "0.875rem" }}>
              Vista completa de todos los partidos. Haz clic en un partido pendiente para registrar su resultado.
            </p>

            <div className={styles.resultsLayout}>
              {/* PENDIENTES */}
              {matches.filter((m) => {
                const estado = (m.estado || m.status || "").toLowerCase();
                return estado !== "finished" && estado !== "finalizado";
              }).length > 0 && (
                <div className={styles.resultsColumn}>
                  <h3 style={{ fontSize: "1.125rem", fontWeight: 700, marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    ⏳ Pendientes ({matches.filter((m) => {
                      const estado = (m.estado || m.status || "").toLowerCase();
                      return estado !== "finished" && estado !== "finalizado";
                    }).length})
                  </h3>
                  {matches
                    .filter((m) => {
                      const estado = (m.estado || m.status || "").toLowerCase();
                      return estado !== "finished" && estado !== "finalizado";
                    })
                    .map((match) => (
                      <div
                        key={match.id}
                        className={styles.resultCard}
                        onClick={() => openResultModal(match)}
                        style={{ cursor: "pointer", transition: "all 0.2s" }}
                        onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 4px 12px rgba(59, 130, 246, 0.2)")}
                        onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
                      >
                        <div className={styles.resultCardHeader}>
                          <div className={styles.resultTeams} style={{ flex: 1 }}>
                            <img src={match.equipo_local_bandera || match.homeFlag} alt={match.equipo_local_nombre || match.homeTeam} className={styles.resultTeamFlagImg} />
                            <span style={{ fontWeight: 600 }}>{match.equipo_local_nombre || match.homeTeam}</span>
                            <span className={styles.vs} style={{ margin: "0 0.5rem" }}>VS</span>
                            <span style={{ fontWeight: 600 }}>{match.equipo_visitante_nombre || match.awayTeam}</span>
                            <img src={match.equipo_visitante_bandera || match.awayFlag} alt={match.equipo_visitante_nombre || match.awayTeam} className={styles.resultTeamFlagImg} />
                          </div>
                          {getStatusBadge(match.estado || match.status || "")}
                        </div>
                        <div className={styles.resultMeta}>
                          <span className={styles.badgeMuted}>
                            {match.fase || match.phase}{(match.grupo || match.group) ? ` - ${match.grupo || match.group}` : ""}
                          </span>
                          <span className={styles.badgeMuted}>📅 {formatDateES(match.fecha || match.date || "")}</span>
                          <span className={styles.badgeMuted}>⏰ {match.hora || match.time}</span>
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "var(--primary)", marginTop: "0.5rem", fontWeight: 500 }}>
                          👆 Haz clic para ingresar resultado
                        </div>
                      </div>
                    ))}
                </div>
              )}

              {/* FINALIZADOS */}
              {matches.filter((m) => {
                const estado = (m.estado || m.status || "").toLowerCase();
                return estado === "finalizado" || estado === "finished";
              }).length > 0 && (
                <div className={styles.resultsColumn}>
                  <h3 style={{ fontSize: "1.125rem", fontWeight: 700, marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    ✅ Finalizados ({matches.filter((m) => {
                      const estado = (m.estado || m.status || "").toLowerCase();
                      return estado === "finalizado" || estado === "finished";
                    }).length})
                  </h3>
                  {matches
                    .filter((m) => {
                      const estado = (m.estado || m.status || "").toLowerCase();
                      return estado === "finalizado" || estado === "finished";
                    })
                    .map((match) => (
                      <div key={match.id} className={styles.resultCard} style={{ backgroundColor: "var(--muted)", borderLeft: "4px solid var(--success)" }}>
                        <div className={styles.resultCardHeader}>
                          <div className={styles.resultTeams} style={{ flex: 1 }}>
                            <img src={match.equipo_local_bandera || match.homeFlag} alt={match.equipo_local_nombre || match.homeTeam} className={styles.resultTeamFlagImg} />
                            <span style={{ fontWeight: 600 }}>{match.equipo_local_nombre || match.homeTeam}</span>
                          </div>
                          <div style={{ textAlign: "center" }}>
                            <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--success)" }}>
                              {match.goles_local || match.resultado?.goles_local || 0}
                            </div>
                          </div>
                          <div style={{ textAlign: "center", fontSize: "0.875rem", color: "var(--muted-foreground)", minWidth: "60px" }}>
                            {match.fue_a_penaltis || match.penaltis_local !== undefined ? (
                              <div>
                                <div style={{ fontWeight: 600 }}>-</div>
                                <div style={{ fontSize: "0.75rem" }}>
                                  (P: {match.penaltis_local || 0}-{match.penaltis_visitante || 0})
                                </div>
                              </div>
                            ) : (
                              <div style={{ fontWeight: 600 }}>-</div>
                            )}
                          </div>
                          <div style={{ textAlign: "center" }}>
                            <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--success)" }}>
                              {match.goles_visitante || match.resultado?.goles_visitante || 0}
                            </div>
                          </div>
                          <div className={styles.resultTeams} style={{ flex: 1, justifyContent: "flex-end" }}>
                            <span style={{ fontWeight: 600 }}>{match.equipo_visitante_nombre || match.awayTeam}</span>
                            <img src={match.equipo_visitante_bandera || match.awayFlag} alt={match.equipo_visitante_nombre || match.awayTeam} className={styles.resultTeamFlagImg} />
                          </div>
                        </div>
                        <div className={styles.resultMeta}>
                          <span className={styles.badgeMuted}>
                            {match.fase || match.phase}{(match.grupo || match.group) ? ` - ${match.grupo || match.group}` : ""}
                          </span>
                          <span className={styles.badgeMuted}>📅 {formatDateES(match.fecha || match.date || "")}</span>
                          <span className={styles.badgeMuted}>🏆 {match.total_predicciones || 0} predicciones</span>
                          <span className={styles.badgeMuted}>📊 Multiplicador: {match.multiplicador || "x1"}</span>
                        </div>
                      </div>
                    ))}
                </div>
              )}

              {matches.length === 0 && (
                <div style={{ gridColumn: "1 / -1", padding: "3rem 1rem", textAlign: "center" }}>
                  <p style={{ color: "var(--muted-foreground)", fontSize: "1rem" }}>No hay partidos registrados aún.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===== TEAMS TAB ===== */}
        {activeTab === "teams" && (
          <div className={styles.container}>
            <div className={styles.toolbar}>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700 }}>🏴 Equipos Participantes</h2>
              <button className={styles.btnPrimary} onClick={() => {
                setFormTeamName("");
                setFormTeamCodigo("");
                setFormTeamEdicion("");
                setFormTeamEmoji("");
                setFormTeamBanderaImagen(null);
                setFormTeamActive(true);
                setShowCreateTeamModal(true);
              }}>
                ➕ Crear Equipo
              </button>
            </div>

            <div className={styles.grid} style={{ gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))" }}>
              {teams.map((team) => (
                <div key={team.id} className={styles.teamCard} style={{ padding: "1rem", border: "1px solid var(--border)", borderRadius: "8px" }}>
                  <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>{team.bandera_emoji || "🏳️"}</div>
                  <h3 style={{ fontWeight: 700, marginBottom: "0.5rem" }}>{team.nombre}</h3>
                  <div style={{ fontSize: "0.875rem", color: "var(--muted-foreground)", marginBottom: "1rem" }}>
                    {team.activo ? "✅ Activo" : "❌ Inactivo"}
                  </div>
                  <button className={styles.btnOutline} style={{ width: "100%" }}>Editar</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===== SPECIAL PREDICTIONS TAB ===== */}
        {activeTab === "special" && (
          <div className={styles.container}>
            <div className={styles.toolbar}>
              <div>
                <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.5rem" }}>🎯 Predicciones Especiales</h2>
                <p style={{ color: "var(--muted-foreground)", fontSize: "0.875rem" }}>
                  Crea predicciones adicionales (campeón, máximo goleador, etc.) con puntos bonus
                </p>
              </div>
              <button className={styles.btnPrimary} onClick={() => {
                setEditingSpecialId(null);
                setFormSpecialType("");
                setFormSpecialPoints(50);
                setFormSpecialDeadline("");
                setFormSpecialDescription("");
                setFormSpecialEnabled(true);
                // Preseleccionar la edición activa
                const activa = ediciones.find((e: any) => e.activa);
                setFormSpecialEdicion(activa ? String(activa.id) : "");
                setShowCreateSpecialModal(true);
              }}>
                ➕ Crear Predicción Especial
              </button>
            </div>

            {/* Info Box */}
            <div style={{ 
              padding: "1rem", 
              backgroundColor: "var(--card)", 
              borderLeft: "4px solid var(--primary)",
              borderRadius: "8px", 
              marginBottom: "1.5rem",
              border: "1px solid var(--border)"
            }}>
              <h3 style={{ fontSize: "0.875rem", fontWeight: 700, marginBottom: "0.5rem" }}>ℹ️ Cómo funcionan las Predicciones Especiales</h3>
              <ul style={{ fontSize: "0.8rem", color: "var(--muted-foreground)", margin: "0.5rem 0 0 1.5rem", lineHeight: 1.6 }}>
                <li>Se cierran automáticamente en la fecha/hora especificada</li>
                <li>Los puntos se otorgan solo si la predicción es correcta</li>
                <li>Se suman a los puntos totales del usuario</li>
                <li>Úsalas para eventos importantes como la final o premiaciones especiales</li>
              </ul>
            </div>

            <div className={styles.specialPredictionsGrid}>
              {specialSettings.length === 0 ? (
                <div style={{ 
                  padding: "2rem", 
                  textAlign: "center", 
                  color: "var(--muted-foreground)",
                  backgroundColor: "var(--muted)",
                  borderRadius: "8px",
                  gridColumn: "1 / -1"
                }}>
                  <p style={{ fontSize: "1rem" }}>📭 No hay predicciones especiales configuradas aún</p>
                  <p style={{ fontSize: "0.875rem", marginTop: "0.5rem" }}>Crea una para agregar retos adicionales al torneo</p>
                </div>
              ) : (
                specialSettings
                  .filter((sp) => ["campeon", "subcampeon", "tercer_lugar"].includes(sp.tipo))
                  .map((sp, idx) => {
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
                      <div key={idx} className={styles.specialCard} style={{ 
                        padding: "1.5rem", 
                        border: "1px solid var(--border)", 
                        borderRadius: "8px",
                        backgroundColor: sp.habilitada ? "var(--card)" : "var(--muted)",
                        opacity: sp.habilitada ? 1 : 0.6,
                        transition: "all 0.2s"
                      }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "1rem" }}>
                          <div style={{ flex: 1 }}>
                            <h3 style={{ fontWeight: 700, marginBottom: "0.25rem", fontSize: "1.1rem" }}>
                              {getIcon(sp.tipo)} {getLabel(sp.tipo)}
                            </h3>
                            <p style={{ fontSize: "0.85rem", color: "var(--muted-foreground)", lineHeight: 1.4 }}>
                              {sp.descripcion || "Sin descripción"}
                            </p>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--primary)" }}>
                              {sp.puntos_acierto || 50}
                            </div>
                            <div style={{ fontSize: "0.65rem", color: "var(--muted-foreground)", marginTop: "0.25rem" }}>
                              puntos
                            </div>
                          </div>
                        </div>

                        <div style={{ 
                          display: "grid", 
                          gridTemplateColumns: "1fr 1fr", 
                          gap: "1rem",
                          fontSize: "0.8rem", 
                          color: "var(--muted-foreground)", 
                          marginBottom: "1rem",
                          paddingBottom: "1rem",
                          borderBottom: "1px solid var(--border)"
                        }}>
                          <div>
                            <div style={{ fontSize: "0.7rem", fontWeight: 600, color: "var(--muted-foreground)", marginBottom: "0.25rem" }}>
                              CIERRE
                            </div>
                            📅 {sp.fecha_cierre ? new Date(sp.fecha_cierre).toLocaleDateString() : "—"} 
                            {sp.fecha_cierre && (
                              <div style={{ fontSize: "0.7rem" }}>
                                ⏰ {new Date(sp.fecha_cierre).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              </div>
                            )}
                          </div>
                          <div>
                            <div style={{ fontSize: "0.7rem", fontWeight: 600, color: "var(--muted-foreground)", marginBottom: "0.25rem" }}>
                              ESTADO
                            </div>
                            {sp.habilitada ? "✅ Habilitada" : "❌ Deshabilitada"}
                          </div>
                        </div>

                        <div style={{ display: "flex", gap: "0.5rem" }}>
                          <button className={styles.btnOutline} style={{ flex: 1, fontSize: "0.8rem" }} onClick={() => {
                            setEditingSpecialId(sp.id);
                            setFormSpecialType(sp.tipo);
                            setFormSpecialPoints(sp.puntos_acierto || 50);
                            setFormSpecialDeadline(sp.fecha_cierre || "");
                            setFormSpecialDescription(sp.descripcion || "");
                            setFormSpecialEnabled(sp.habilitada || false);
                            setFormSpecialEdicion(String(sp.edicion || ""));
                            setShowCreateSpecialModal(true);
                          }}>
                            ✏️ Editar
                          </button>
                          <button className={styles.btnOutline} style={{ flex: 1, fontSize: "0.8rem", color: "var(--destructive)" }} onClick={async () => {
                            if (confirm("¿Eliminar esta predicción especial?")) {
                              try {
                                await deleteConfigEspecial(sp.id);
                                await reloadSpecialSettings();
                                triggerSuccess("Predicción especial eliminada");
                              } catch (error) {
                                console.error("Error eliminando predicción especial:", error);
                                alert("Error al eliminar la predicción especial");
                              }
                            }
                          }}>
                            🗑️ Eliminar
                          </button>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </div>
        )}

        {/* ===== SETTINGS TAB ===== */}
        {activeTab === "settings" && (
          <div className={styles.settingsLayout}>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1rem" }}>⚙️ Configuración del Torneo</h2>

            {/* Sistema de Puntos Explicado */}
            <div style={{ 
              padding: "1.5rem", 
              backgroundColor: "var(--card)", 
              borderRadius: "8px", 
              border: "2px solid var(--primary)",
              marginBottom: "1.5rem"
            }}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                📊 Cómo Funciona el Sistema de Puntos
              </h3>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "1rem" }}>
                <div style={{ padding: "1rem", backgroundColor: "var(--muted)", borderRadius: "6px" }}>
                  <h4 style={{ fontSize: "0.9rem", fontWeight: 700, marginBottom: "0.5rem" }}>🎯 Resultado Exacto</h4>
                  <p style={{ fontSize: "0.8rem", color: "var(--muted-foreground)", lineHeight: 1.6 }}>
                    Acertar el resultado EXACTO del partido (ej: 2-1)
                  </p>
                  <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--primary)", marginTop: "0.5rem" }}>
                    = 3 puntos
                  </div>
                </div>

                <div style={{ padding: "1rem", backgroundColor: "var(--muted)", borderRadius: "6px" }}>
                  <h4 style={{ fontSize: "0.9rem", fontWeight: 700, marginBottom: "0.5rem" }}>🏆 Ganador Correcto</h4>
                  <p style={{ fontSize: "0.8rem", color: "var(--muted-foreground)", lineHeight: 1.6 }}>
                    Acertar solo quién gana (local, visitante o empate)
                  </p>
                  <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--primary)", marginTop: "0.5rem" }}>
                    = 1 punto
                  </div>
                </div>
              </div>

              <div style={{ padding: "1rem", backgroundColor: "var(--muted)", borderRadius: "6px", marginBottom: "1rem" }}>
                <h4 style={{ fontSize: "0.9rem", fontWeight: 700, marginBottom: "0.5rem" }}>✖️ Multiplicador por Fase</h4>
                <p style={{ fontSize: "0.8rem", color: "var(--muted-foreground)", lineHeight: 1.6, marginBottom: "0.75rem" }}>
                  Los puntos se multiplican según la importancia de la fase:
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0.5rem", fontSize: "0.8rem" }}>
                  <div>Grupos: <strong>x1</strong></div>
                  <div>16avos: <strong>x1.25</strong></div>
                  <div>Octavos: <strong>x1.5</strong></div>
                  <div>Cuartos: <strong>x1.75</strong></div>
                  <div>Semifinales: <strong>x2</strong></div>
                  <div>Tercer Puesto: <strong>x2.5</strong></div>
                  <div style={{ gridColumn: "1 / -1" }}>Final: <strong>x3</strong></div>
                </div>
              </div>

              <div style={{ padding: "0.75rem", backgroundColor: "rgba(59, 130, 246, 0.1)", borderLeft: "3px solid var(--primary)", borderRadius: "4px", fontSize: "0.8rem" }}>
                <strong>Ejemplo:</strong> Acertar resultado exacto en Semifinales = 3 puntos × 2 multiplicador = <strong>6 puntos</strong>
              </div>
            </div>

            {/* Configuración de Puntuación */}
            <div className={styles.settingsCard}>
              <h3 className={styles.settingsCardTitle}>📊 Sistema de Puntuación</h3>
              <p className={styles.settingsCardDesc}>Puntos otorgados por tipo de acierto.</p>
              <div className={styles.settingsRow}>
                <span>Resultado exacto</span>
                <input type="number" defaultValue={3} className={styles.settingsInput} />
              </div>
              <div className={styles.settingsRow}>
                <span>Ganador correcto</span>
                <input type="number" defaultValue={1} className={styles.settingsInput} />
              </div>
            </div>

            {/* Multiplicadores por Fase */}
            <div className={styles.settingsCard}>
              <h3 className={styles.settingsCardTitle}>✖️ Multiplicadores por Fase</h3>
              <p className={styles.settingsCardDesc}>Los puntos se multiplican según la fase.</p>
              {phases.map((phase) => (
                <div key={phase.value} className={styles.settingsRow}>
                  <span>{phase.label}</span>
                  <input type="text" defaultValue={phase.multiplier} className={styles.settingsInput} />
                </div>
              ))}
            </div>

            {/* Predicciones Especiales (desde ConfiguracionPrediccionEspecial) */}
            <div className={styles.settingsCard}>
              <h3 className={styles.settingsCardTitle}>⭐ Predicciones Especiales</h3>
              <p className={styles.settingsCardDesc}>Puntos adicionales configurados en predicciones especiales. Se gestionan en la pestaña "Especiales".</p>
              {specialSettings.filter((sp) => ["campeon", "subcampeon", "tercer_lugar"].includes(sp.tipo)).length > 0 ? (
                specialSettings
                  .filter((sp) => ["campeon", "subcampeon", "tercer_lugar"].includes(sp.tipo))
                  .map((sp, idx) => (
                  <div key={idx} className={styles.settingsRow}>
                    <span>
                      {sp.tipo === "campeon" && "🏆"} 
                      {sp.tipo === "subcampeon" && "🥈"}
                      {sp.tipo === "tercer_lugar" && "🥉"}
                      {" "}{sp.tipo_display || sp.tipo}
                    </span>
                    <span style={{ fontWeight: 600, color: "var(--primary)" }}>{sp.puntos_acierto || 50} pts</span>
                  </div>
                ))
              ) : (
                <div style={{ padding: "1rem", textAlign: "center", color: "var(--muted-foreground)", fontSize: "0.875rem" }}>
                  No hay predicciones especiales configuradas. Créalas en la pestaña "Especiales".
                </div>
              )}
            </div>

            <button className={styles.btnPrimary} style={{ width: "100%", marginTop: "1rem" }}>
              💾 Guardar Configuración
            </button>
          </div>
        )}
      </main>

      {/* ===== CREATE/EDIT MODAL ===== */}
      {showCreateModal && (
        <div className={styles.modalOverlay} onClick={() => setShowCreateModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                {editingMatch ? "✏️ Editar Partido" : "➕ Crear Nuevo Partido"}
              </h2>
              <button className={styles.modalClose} onClick={() => setShowCreateModal(false)}>✕</button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Equipo Local</label>
                  <select value={formHomeTeam} onChange={(e) => setFormHomeTeam(e.target.value)} className={styles.formSelect}>
                    <option value="">Seleccionar</option>
                    {teams.map((t) => (
                      <option key={t.id} value={String(t.id)}>
                        {t.bandera_emoji || ""} {t.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>Equipo Visitante</label>
                  <select value={formAwayTeam} onChange={(e) => setFormAwayTeam(e.target.value)} className={styles.formSelect}>
                    <option value="">Seleccionar</option>
                    {teams.map((t) => (
                      <option key={t.id} value={String(t.id)}>
                        {t.bandera_emoji || ""} {t.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Fecha</label>
                  <input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} className={styles.formInput} />
                </div>
                <div className={styles.formGroup}>
                  <label>Hora</label>
                  <input type="time" value={formTime} onChange={(e) => setFormTime(e.target.value)} className={styles.formInput} />
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Fase</label>
                  <select value={formPhase} onChange={(e) => setFormPhase(e.target.value)} className={styles.formSelect}>
                    <option value="">Seleccionar</option>
                    {phases.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label} ({p.multiplier})
                      </option>
                    ))}
                  </select>
                </div>
                {formPhase === "Grupos" && (
                  <div className={styles.formGroup}>
                    <label>Grupo</label>
                    <select value={formGroup} onChange={(e) => setFormGroup(e.target.value)} className={styles.formSelect}>
                      <option value="">Seleccionar</option>
                      {groups.map((g) => (
                        <option key={g} value={g}>
                          Grupo {g}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className={styles.formGroup}>
                <label>Estado del partido</label>
                <select value={formStatus} onChange={(e) => setFormStatus(e.target.value as "open" | "locked")} className={styles.formSelect}>
                  <option value="open">Abierto (se pueden hacer predicciones)</option>
                  <option value="locked">Bloqueado (predicciones cerradas)</option>
                </select>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.btnOutline} onClick={() => setShowCreateModal(false)}>Cancelar</button>
              <button
                className={styles.btnPrimary}
                onClick={handleSaveMatch}
                disabled={!formHomeTeam || !formAwayTeam || !formDate || !formTime || !formPhase}
              >
                {editingMatch ? "Guardar Cambios" : "Crear Partido"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== RESULT MODAL ===== */}
      {showResultModal && resultMatch && (
        <div className={styles.modalOverlay} onClick={() => setShowResultModal(false)}>
          <div className={styles.modalSmall} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>⚽ Registrar Resultado</h2>
              <button className={styles.modalClose} onClick={() => setShowResultModal(false)}>✕</button>
            </div>
            <div className={styles.modalBody}>
              <p style={{ textAlign: "center", fontSize: "0.875rem", color: "var(--muted-foreground)", marginBottom: "1.5rem", fontWeight: 500 }}>
                <strong>{resultMatch.fase || resultMatch.phase}</strong>
                {(resultMatch.grupo || resultMatch.group) ? ` - Grupo ${resultMatch.grupo || resultMatch.group}` : ""} | {formatDateES(resultMatch.fecha || resultMatch.date || "")} {resultMatch.hora || resultMatch.time}
              </p>

              <div className={styles.scoreContainer} style={{ marginBottom: "1.5rem" }}>
                <div className={styles.scoreTeam}>
                  <img src={resultMatch.equipo_local_bandera || resultMatch.homeFlag} alt={resultMatch.equipo_local_nombre || resultMatch.homeTeam} className={styles.scoreTeamFlagImg} />
                  <span className={styles.scoreTeamName}>{resultMatch.equipo_local_nombre || resultMatch.homeTeam}</span>
                  <input
                    type="number"
                    min="0"
                    value={resultHome}
                    onChange={(e) => setResultHome(parseInt(e.target.value) || 0)}
                    className={styles.resultInput}
                    style={{ fontSize: "1.5rem", fontWeight: 700, textAlign: "center" }}
                  />
                </div>
                <span className={styles.scoreDivider} style={{ fontSize: "1.5rem", fontWeight: 700 }}>-</span>
                <div className={styles.scoreTeam}>
                  <img src={resultMatch.equipo_visitante_bandera || resultMatch.awayFlag} alt={resultMatch.equipo_visitante_nombre || resultMatch.awayTeam} className={styles.scoreTeamFlagImg} />
                  <span className={styles.scoreTeamName}>{resultMatch.equipo_visitante_nombre || resultMatch.awayTeam}</span>
                  <input
                    type="number"
                    min="0"
                    value={resultAway}
                    onChange={(e) => setResultAway(parseInt(e.target.value) || 0)}
                    className={styles.resultInput}
                    style={{ fontSize: "1.5rem", fontWeight: 700, textAlign: "center" }}
                  />
                </div>
              </div>

              {/* Penaltis Section */}
              {resultHome === resultAway && (
                <div style={{ marginTop: "1.5rem", padding: "1rem", backgroundColor: "var(--muted)", borderRadius: "8px", border: "2px solid var(--warning)" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", fontSize: "14px", fontWeight: "500", color: "var(--foreground)" }}>
                    <input
                      type="checkbox"
                      checked={wentToPenalties}
                      onChange={(e) => {
                        setWentToPenalties(e.target.checked);
                        if (!e.target.checked) {
                          setPenaltiesHome(0);
                          setPenaltiesAway(0);
                        }
                      }}
                      style={{ width: "18px", height: "18px", cursor: "pointer" }}
                    />
                    <span>⚠️ El partido se fue a penaltis</span>
                  </label>

                  {wentToPenalties && (
                    <div style={{ marginTop: "1rem" }}>
                      <p style={{ fontSize: "12px", color: "var(--muted-foreground)", marginBottom: "1rem", fontWeight: 600 }}>
                        Resultado en penaltis:
                      </p>
                      <div className={styles.scoreContainer}>
                        <div className={styles.scoreTeam}>
                          <span className={styles.scoreTeamName} style={{ fontSize: "12px", fontWeight: 600 }}>
                            {resultMatch.equipo_local_nombre || resultMatch.homeTeam}
                          </span>
                          <span style={{ fontSize: "0.75rem", color: "var(--muted-foreground)" }}>Penaltis</span>
                          <input
                            type="number"
                            min="0"
                            value={penaltiesHome}
                            onChange={(e) => setPenaltiesHome(parseInt(e.target.value) || 0)}
                            className={styles.resultInput}
                            style={{ marginTop: "0.5rem", fontSize: "1.25rem", fontWeight: 700, textAlign: "center" }}
                          />
                        </div>
                        <span className={styles.scoreDivider} style={{ fontSize: "1.25rem" }}>-</span>
                        <div className={styles.scoreTeam}>
                          <span className={styles.scoreTeamName} style={{ fontSize: "12px", fontWeight: 600 }}>
                            {resultMatch.equipo_visitante_nombre || resultMatch.awayTeam}
                          </span>
                          <span style={{ fontSize: "0.75rem", color: "var(--muted-foreground)" }}>Penaltis</span>
                          <input
                            type="number"
                            min="0"
                            value={penaltiesAway}
                            onChange={(e) => setPenaltiesAway(parseInt(e.target.value) || 0)}
                            className={styles.resultInput}
                            style={{ marginTop: "0.5rem", fontSize: "1.25rem", fontWeight: 700, textAlign: "center" }}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Info Box */}
              <div style={{ marginTop: "1.5rem", padding: "1rem", backgroundColor: "var(--card)", borderRadius: "8px", border: "1px solid var(--border)" }}>
                <p style={{ fontSize: "0.75rem", color: "var(--muted-foreground)", lineHeight: 1.6, margin: 0 }}>
                  <strong>ℹ️ Información:</strong><br />
                  Al guardar el resultado, el sistema calculará automáticamente los puntos de cada participante según:<br />
                  • Fase: <strong>{resultMatch.fase}</strong><br />
                  • Multiplicador: <strong>{resultMatch.multiplicador || "x1"}</strong><br />
                  • Se registran <strong>{resultMatch.total_predicciones || 0}</strong> predicciones para este partido
                </p>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.btnOutline} onClick={() => setShowResultModal(false)}>Cancelar</button>
              <button className={styles.btnPrimary} onClick={handleSaveResult} style={{ flex: 1 }}>
                ✓ Guardar Resultado y Calcular Puntos
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== CREATE TEAM MODAL ===== */}
      {showCreateTeamModal && (
        <div className={styles.modalOverlay} onClick={() => setShowCreateTeamModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>➕ Crear Nuevo Equipo</h2>
              <button className={styles.modalClose} onClick={() => setShowCreateTeamModal(false)}>✕</button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.formGroup}>
                <label>Nombre del Equipo</label>
                <input
                  type="text"
                  value={formTeamName}
                  onChange={(e) => setFormTeamName(e.target.value)}
                  placeholder="Ej: Argentina, Brasil, México"
                  className={styles.formInput}
                />
              </div>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Código</label>
                  <input
                    type="text"
                    value={formTeamCodigo}
                    onChange={(e) => setFormTeamCodigo(e.target.value)}
                    placeholder="Ej: ARG"
                    className={styles.formInput}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Edición</label>
                  <input
                    type="text"
                    value={formTeamEdicion}
                    onChange={(e) => setFormTeamEdicion(e.target.value)}
                    placeholder="Ej: 2026"
                    className={styles.formInput}
                  />
                </div>
              </div>
              <div className={styles.formGroup}>
                <label>Imagen de Bandera</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFormTeamBanderaImagen(e.target.files?.[0] || null)}
                  className={styles.formInput}
                />
                {formTeamBanderaImagen && (
                  <p style={{ fontSize: "0.875rem", color: "var(--muted-foreground)", marginTop: "0.5rem" }}>
                    ✓ {formTeamBanderaImagen.name}
                  </p>
                )}
              </div>
              <div className={styles.formGroup}>
                <label>Emoji de Bandera</label>
                <input
                  type="text"
                  value={formTeamEmoji}
                  onChange={(e) => setFormTeamEmoji(e.target.value.slice(0, 2))}
                  placeholder="Ej: 🇦🇷"
                  className={styles.formInput}
                  maxLength={2}
                />
              </div>
              <div className={styles.formGroup} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <input
                  type="checkbox"
                  id="teamActive"
                  checked={formTeamActive}
                  onChange={(e) => setFormTeamActive(e.target.checked)}
                />
                <label htmlFor="teamActive" style={{ marginBottom: 0 }}>Equipo Activo</label>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.btnOutline} onClick={() => setShowCreateTeamModal(false)}>Cancelar</button>
              <button className={styles.btnPrimary} onClick={async () => {
                if (!formTeamName || !formTeamCodigo || !formTeamEdicion || !formTeamBanderaImagen) {
                  alert("Por favor completa todos los campos requeridos (Nombre, Código, Edición e Imagen)");
                  return;
                }
                try {
                  const formData = new FormData();
                  formData.append("nombre", formTeamName);
                  formData.append("codigo", formTeamCodigo);
                  formData.append("edicion", formTeamEdicion);
                  formData.append("bandera_emoji", formTeamEmoji || "");
                  formData.append("activo", formTeamActive ? "true" : "false");
                  // Asegurar que el archivo se añade correctamente
                  if (formTeamBanderaImagen instanceof File) {
                    formData.append("bandera_imagen", formTeamBanderaImagen);
                  }
                  
                  await createEquipo(formData);
                  await reloadTeams();
                  setShowCreateTeamModal(false);
                  triggerSuccess("Equipo creado");
                } catch (error) {
                  console.error("Error creando equipo:", error);
                  alert("Error al crear el equipo. Revisa que la imagen sea válida.");
                }
              }}>
                Crear Equipo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== CREATE SPECIAL PREDICTION MODAL ===== */}
      {showCreateSpecialModal && (
        <div className={styles.modalOverlay} onClick={() => setShowCreateSpecialModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>🎯 Crear Predicción Especial</h2>
              <button className={styles.modalClose} onClick={() => setShowCreateSpecialModal(false)}>✕</button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.formGroup}>
                <label>Edición del Mundial <span style={{ color: "var(--destructive)" }}>*</span></label>
                <select
                  value={formSpecialEdicion}
                  onChange={(e) => setFormSpecialEdicion(e.target.value)}
                  className={styles.formInput}
                >
                  <option value="">Seleccionar edición...</option>
                  {ediciones.map((ed: any) => (
                    <option key={ed.id} value={String(ed.id)}>
                      {ed.nombre || ed.anio || `Edición ${ed.id}`} {ed.activa ? "(Activa)" : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>Tipo de Predicción <span style={{ color: "var(--destructive)" }}>*</span></label>
                <select
                  value={formSpecialType}
                  onChange={(e) => setFormSpecialType(e.target.value)}
                  className={styles.formInput}
                >
                  <option value="">Seleccionar tipo...</option>
                  <option value="campeon">🏆 Campeón</option>
                  <option value="subcampeon">🥈 Subcampeón</option>
                  <option value="tercer_lugar">🥉 Tercer Lugar</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>Puntos por Acierto <span style={{ color: "var(--destructive)" }}>*</span></label>
                <input
                  type="number"
                  value={formSpecialPoints}
                  onChange={(e) => setFormSpecialPoints(parseInt(e.target.value) || 50)}
                  className={styles.formInput}
                  min="10"
                  step="10"
                  placeholder="Ej: 50, 100, 150"
                />
                <p style={{ fontSize: "0.75rem", color: "var(--muted-foreground)", marginTop: "0.25rem" }}>
                  Mínimo 10 puntos. Estos puntos se suman directamente si la predicción es correcta.
                </p>
              </div>

              <div className={styles.formGroup}>
                <label>Fecha y Hora de Cierre <span style={{ color: "var(--destructive)" }}>*</span></label>
                <input
                  type="datetime-local"
                  value={formSpecialDeadline}
                  onChange={(e) => setFormSpecialDeadline(e.target.value)}
                  className={styles.formInput}
                />
                <p style={{ fontSize: "0.75rem", color: "var(--muted-foreground)", marginTop: "0.25rem" }}>
                  Después de esta fecha, nadie podrá hacer la predicción
                </p>
              </div>

              <div className={styles.formGroup}>
                <label>Descripción <span style={{ color: "var(--destructive)" }}>*</span></label>
                <textarea
                  value={formSpecialDescription}
                  onChange={(e) => setFormSpecialDescription(e.target.value)}
                  placeholder="Describe esta predicción especial... Ej: Quién ganará la Copa Mundial"
                  className={styles.formInput}
                  rows={3}
                  style={{ resize: "vertical" }}
                />
              </div>

              <div className={styles.formGroup} style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <input
                  type="checkbox"
                  id="specialEnabled"
                  checked={formSpecialEnabled}
                  onChange={(e) => setFormSpecialEnabled(e.target.checked)}
                  style={{ width: "18px", height: "18px", cursor: "pointer" }}
                />
                <label htmlFor="specialEnabled" style={{ marginBottom: 0, cursor: "pointer", fontSize: "0.9rem" }}>
                  ✓ Habilitada (Activa para que los usuarios hagan predicciones)
                </label>
              </div>

              {/* Info Box */}
              <div style={{ 
                padding: "1rem", 
                backgroundColor: "var(--muted)", 
                borderRadius: "6px", 
                marginTop: "1rem",
                fontSize: "0.8rem",
                color: "var(--muted-foreground)",
                lineHeight: 1.6
              }}>
                <strong>📌 Recomendaciones:</strong><br/>
                • Establece el cierre antes de que comience el evento (ej: Final)<br/>
                • Campeón: ✓ Predecible  |  Máximo Goleador: ✓ Más competitivo<br/>
                • Mayor cantidad de puntos = Mayor dificultad/importancia
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.btnOutline} onClick={() => {
                setShowCreateSpecialModal(false);
                setEditingSpecialId(null);
              }}>Cancelar</button>
              <button className={styles.btnPrimary} onClick={async () => {
                if (!formSpecialType || !formSpecialDeadline || !formSpecialDescription) {
                  alert("Por favor completa todos los campos requeridos");
                  return;
                }
                
                if (!formSpecialEdicion) {
                  alert("Por favor selecciona una edición del mundial");
                  return;
                }

                if (formSpecialPoints < 10) {
                  alert("Los puntos deben ser al menos 10");
                  return;
                }

                try {
                  const payload = {
                    edicion: parseInt(formSpecialEdicion),
                    tipo: formSpecialType,
                    puntos_acierto: formSpecialPoints,
                    fecha_cierre: formSpecialDeadline,
                    descripcion: formSpecialDescription,
                    habilitada: formSpecialEnabled,
                    estado: "abierta"
                  };

                  if (editingSpecialId) {
                    // Editar predicción especial existente
                    await updateConfigEspecial(editingSpecialId, payload);
                    triggerSuccess("Predicción especial actualizada ✓");
                  } else {
                    // Crear nueva predicción especial
                    await createConfigEspecial(payload);
                    triggerSuccess("Predicción especial creada ✓");
                  }

                  await reloadSpecialSettings();
                  setShowCreateSpecialModal(false);
                  setEditingSpecialId(null);
                } catch (error: any) {
                  console.error("Error guardando predicción especial:", error);
                  const errorMsg = error.response?.data?.error || error.message || "Error desconocido";
                  alert(`Error: ${errorMsg}`);
                }
              }} disabled={!formSpecialType || !formSpecialDeadline || !formSpecialDescription || !formSpecialEdicion}>
                ✓ {editingSpecialId ? "Actualizar" : "Crear"} Predicción Especial
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== DELETE CONFIRM ===== */}
      {showDeleteConfirm !== null && (
        <div className={styles.modalOverlay} onClick={() => setShowDeleteConfirm(null)}>
          <div className={styles.modalSmall} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalBody}>
              <p style={{ fontSize: "2rem", marginBottom: "1rem", textAlign: "center" }}>⚠️</p>
              <p style={{ fontSize: "1.125rem", fontWeight: 700, marginBottom: "0.5rem", textAlign: "center" }}>Eliminar Partido</p>
              <p style={{ color: "var(--muted-foreground)", textAlign: "center", fontSize: "0.875rem" }}>
                Esta acción no se puede deshacer. Se eliminarán todas las predicciones asociadas.
              </p>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.btnOutline} onClick={() => setShowDeleteConfirm(null)}>Cancelar</button>
              <button className={styles.btnDestructive} onClick={() => showDeleteConfirm && handleDeleteMatch(showDeleteConfirm)}>
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== SUCCESS TOAST ===== */}
      {showSuccess && (
        <div className={styles.successToast}>
          <div className={styles.toastIcon}>✓</div>
          <div className={styles.toastText}>
            <strong>{showSuccess}</strong>
            <span>Operación exitosa</span>
          </div>
        </div>
      )}
    </div>
  );
}

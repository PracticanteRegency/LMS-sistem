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

        // Predicciones especiales
        if (res.data?.special_settings) setSpecialSettings(res.data.special_settings);
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
        setSpecialSettings([]);
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
      const res = await getConfiguracion();
      if (res.data?.special_settings) {
        setSpecialSettings(res.data.special_settings);
      }
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
    switch (status) {
      case "open":
        return <span className={styles.badgePrimary}>Abierto</span>;
      case "locked":
        return <span className={styles.badgeWarning}>Bloqueado</span>;
      case "finished":
        return <span className={styles.badgeAccent}>Finalizado</span>;
      default:
        return null;
    }
  };

  const totalOpen = matches.filter((m) => m.status === "open").length;
  const totalFinished = matches.filter((m) => m.status === "finished").length;
  const totalLocked = matches.filter((m) => m.status === "locked").length;

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
                    <th style={{ textAlign: "right" }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMatches.map((match) => (
                    <tr key={match.id} className={styles.matchTableRow}>
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
                      <td className={styles.matchTableCell} style={{ textAlign: "center" }}>
                        {match.resultado ? (
                          <span className={styles.resultDisplay}>
                            {match.resultado.goles_local || match.result?.home} - {match.resultado.goles_visitante || match.result?.away}
                          </span>
                        ) : (
                          <span className={styles.mutedText}>-</span>
                        )}
                      </td>
                      <td className={styles.matchTableCell}>
                        <div className={styles.actionButtons}>
                          <button
                            className={styles.actionBtn}
                            onClick={() => openEditModal(match)}
                            title="Editar"
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
                            title="Eliminar"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
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
            <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.5rem" }}>Cargar Resultados</h2>
            <p style={{ color: "var(--muted-foreground)", marginBottom: "1.5rem", fontSize: "0.875rem" }}>
              Selecciona un partido para registrar su resultado. El sistema calculará los puntos automáticamente.
            </p>

            <div className={styles.resultsLayout}>
              <div className={styles.resultsColumn}>
                <h3>⏳ Pendientes</h3>
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
                    >
                      <div className={styles.resultCardHeader}>
                        <div className={styles.resultTeams}>
                          <img src={match.equipo_local_bandera || match.homeFlag} alt={match.equipo_local_nombre || match.homeTeam} className={styles.resultTeamFlagImg} />
                          <span>{match.equipo_local_nombre || match.homeTeam}</span>
                          <span className={styles.vs}>VS</span>
                          <span>{match.equipo_visitante_nombre || match.awayTeam}</span>
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
                    </div>
                  ))}
              </div>

              {matches.filter((m) => {
                const estado = (m.estado || m.status || "").toLowerCase();
                return estado === "finalizado" || estado === "finished";
              }).length > 0 && (
                <div className={styles.resultsColumn}>
                  <h3>✅ Finalizados</h3>
                  {matches
                    .filter((m) => {
                      const estado = (m.estado || m.status || "").toLowerCase();
                      return estado === "finalizado" || estado === "finished";
                    })
                    .map((match) => (
                      <div key={match.id} className={styles.resultCard}>
                        <div className={styles.resultCardHeader}>
                          <div className={styles.resultTeams}>
                            <img src={match.equipo_local_bandera || match.homeFlag} alt={match.equipo_local_nombre || match.homeTeam} className={styles.resultTeamFlagImg} />
                            <span>{match.equipo_local_nombre || match.homeTeam}</span>
                          </div>
                          <span className={styles.resultScore}>
                            {match.resultado?.goles_local || match.result?.home} - {match.resultado?.goles_visitante || match.result?.away}
                          </span>
                          <div className={styles.resultTeams}>
                            <span>{match.equipo_visitante_nombre || match.awayTeam}</span>
                            <img src={match.equipo_visitante_bandera || match.awayFlag} alt={match.equipo_visitante_nombre || match.awayTeam} className={styles.resultTeamFlagImg} />
                          </div>
                        </div>
                      </div>
                    ))}
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
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700 }}>🎯 Predicciones Especiales</h2>
              <button className={styles.btnPrimary} onClick={() => {
                setFormSpecialType("");
                setFormSpecialPoints(50);
                setFormSpecialDeadline("");
                setFormSpecialDescription("");
                setFormSpecialEnabled(true);
                setShowCreateSpecialModal(true);
              }}>
                ➕ Crear Predicción Especial
              </button>
            </div>

            <div className={styles.specialPredictionsGrid}>
              {specialSettings.length === 0 ? (
                <div style={{ padding: "2rem", textAlign: "center", color: "var(--muted-foreground)" }}>
                  No hay predicciones especiales configuradas aún
                </div>
              ) : (
                specialSettings.map((sp, idx) => (
                  <div key={idx} className={styles.specialCard} style={{ padding: "1.5rem", border: "1px solid var(--border)", borderRadius: "8px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "1rem" }}>
                      <div>
                        <h3 style={{ fontWeight: 700, marginBottom: "0.25rem" }}>{sp.tipo || "Sin tipo"}</h3>
                        <p style={{ fontSize: "0.875rem", color: "var(--muted-foreground)" }}>{sp.descripcion}</p>
                      </div>
                      <span style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--primary)" }}>{sp.puntos_acierto || 50} pts</span>
                    </div>
                    <div style={{ fontSize: "0.875rem", color: "var(--muted-foreground)", marginBottom: "1rem" }}>
                      <div>📅 Cierra: {sp.fecha_cierre ? new Date(sp.fecha_cierre).toLocaleDateString() : "—"}</div>
                      <div>{sp.habilitada ? "✅ Habilitada" : "❌ Deshabilitada"}</div>
                    </div>
                    <button className={styles.btnOutline} style={{ width: "100%" }}>Editar</button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ===== SETTINGS TAB ===== */}
        {activeTab === "settings" && (
          <div className={styles.settingsLayout}>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1rem" }}>Configuración del Torneo</h2>

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

            <div className={styles.settingsCard}>
              <h3 className={styles.settingsCardTitle}>⭐ Predicciones Especiales (pts)</h3>
              <p className={styles.settingsCardDesc}>Puntos por aciertos en predicciones especiales.</p>
              {specialSettings.map((sp, idx) => (
                <div key={idx} className={styles.settingsRow}>
                  <span>{sp.name || `Especial ${idx + 1}`}</span>
                  <input type="number" defaultValue={sp.pts} className={styles.settingsInput} />
                </div>
              ))}
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
              <h2 className={styles.modalTitle}>🎯 Registrar Resultado</h2>
              <button className={styles.modalClose} onClick={() => setShowResultModal(false)}>✕</button>
            </div>
            <div className={styles.modalBody}>
              <p style={{ textAlign: "center", fontSize: "0.875rem", color: "var(--muted-foreground)", marginBottom: "1.5rem" }}>
                {resultMatch.fase || resultMatch.phase}{(resultMatch.grupo || resultMatch.group) ? ` - Grupo ${resultMatch.grupo || resultMatch.group}` : ""} | {formatDateES(resultMatch.fecha || resultMatch.date || "")}
              </p>

              <div className={styles.scoreContainer}>
                <div className={styles.scoreTeam}>
                  <img src={resultMatch.equipo_local_bandera || resultMatch.homeFlag} alt={resultMatch.equipo_local_nombre || resultMatch.homeTeam} className={styles.scoreTeamFlagImg} />
                  <span className={styles.scoreTeamName}>{resultMatch.equipo_local_nombre || resultMatch.homeTeam}</span>
                  <input
                    type="number"
                    min="0"
                    value={resultHome}
                    onChange={(e) => setResultHome(parseInt(e.target.value) || 0)}
                    className={styles.resultInput}
                  />
                </div>
                <span className={styles.scoreDivider}>-</span>
                <div className={styles.scoreTeam}>
                  <img src={resultMatch.equipo_visitante_bandera || resultMatch.awayFlag} alt={resultMatch.equipo_visitante_nombre || resultMatch.awayTeam} className={styles.scoreTeamFlagImg} />
                  <span className={styles.scoreTeamName}>{resultMatch.equipo_visitante_nombre || resultMatch.awayTeam}</span>
                  <input
                    type="number"
                    min="0"
                    value={resultAway}
                    onChange={(e) => setResultAway(parseInt(e.target.value) || 0)}
                    className={styles.resultInput}
                  />
                </div>
              </div>

              {/* Penaltis Section */}
              {resultHome === resultAway && (
                <div style={{ marginTop: "1.5rem", padding: "1rem", backgroundColor: "var(--muted)", borderRadius: "8px" }}>
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
                    <span>El partido se fue a penaltis/desempate</span>
                  </label>

                  {wentToPenalties && (
                    <div style={{ marginTop: "1rem" }}>
                      <p style={{ fontSize: "12px", color: "var(--muted-foreground)", marginBottom: "0.5rem" }}>
                        Ingresa los goles del desempate:
                      </p>
                      <div className={styles.scoreContainer}>
                        <div className={styles.scoreTeam}>
                          <span className={styles.scoreTeamName} style={{ fontSize: "12px" }}>
                            {resultMatch.equipo_local_nombre || resultMatch.homeTeam} (P)
                          </span>
                          <input
                            type="number"
                            min="0"
                            value={penaltiesHome}
                            onChange={(e) => setPenaltiesHome(parseInt(e.target.value) || 0)}
                            className={styles.resultInput}
                            style={{ marginTop: "0.5rem" }}
                          />
                        </div>
                        <span className={styles.scoreDivider}>-</span>
                        <div className={styles.scoreTeam}>
                          <span className={styles.scoreTeamName} style={{ fontSize: "12px" }}>
                            {resultMatch.equipo_visitante_nombre || resultMatch.awayTeam} (P)
                          </span>
                          <input
                            type="number"
                            min="0"
                            value={penaltiesAway}
                            onChange={(e) => setPenaltiesAway(parseInt(e.target.value) || 0)}
                            className={styles.resultInput}
                            style={{ marginTop: "0.5rem" }}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <p style={{ fontSize: "0.75rem", color: "var(--muted-foreground)", textAlign: "center", marginTop: "1rem", lineHeight: 1.6 }}>
                Al guardar el resultado, el sistema calculará automáticamente los puntos de cada participante según las reglas configuradas (multiplicador {resultMatch.multiplicador || resultMatch.multiplier}).
              </p>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.btnOutline} onClick={() => setShowResultModal(false)}>Cancelar</button>
              <button className={styles.btnPrimary} onClick={handleSaveResult}>
                Guardar Resultado y Calcular Puntos
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
                <label>Tipo de Predicción</label>
                <select
                  value={formSpecialType}
                  onChange={(e) => setFormSpecialType(e.target.value)}
                  className={styles.formInput}
                >
                  <option value="">Seleccionar...</option>
                  <option value="campeon">🏆 Campeón</option>
                  <option value="subcampeon">🥈 Subcampeón</option>
                  <option value="tercer_lugar">🥉 Tercer Lugar</option>
                  <option value="maximo_goleador">⚽ Máximo Goleador</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label>Puntos por Acierto</label>
                <input
                  type="number"
                  value={formSpecialPoints}
                  onChange={(e) => setFormSpecialPoints(parseInt(e.target.value) || 50)}
                  className={styles.formInput}
                  min="10"
                  step="10"
                />
              </div>
              <div className={styles.formGroup}>
                <label>Fecha y Hora de Cierre</label>
                <input
                  type="datetime-local"
                  value={formSpecialDeadline}
                  onChange={(e) => setFormSpecialDeadline(e.target.value)}
                  className={styles.formInput}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Descripción</label>
                <textarea
                  value={formSpecialDescription}
                  onChange={(e) => setFormSpecialDescription(e.target.value)}
                  placeholder="Describe esta predicción especial..."
                  className={styles.formInput}
                  rows={3}
                />
              </div>
              <div className={styles.formGroup} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <input
                  type="checkbox"
                  id="specialEnabled"
                  checked={formSpecialEnabled}
                  onChange={(e) => setFormSpecialEnabled(e.target.checked)}
                />
                <label htmlFor="specialEnabled" style={{ marginBottom: 0 }}>Habilitada</label>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.btnOutline} onClick={() => setShowCreateSpecialModal(false)}>Cancelar</button>
              <button className={styles.btnPrimary} onClick={async () => {
                if (!formSpecialType || !formSpecialDeadline) return;
                try {
                  await createConfigEspecial({
                    tipo: formSpecialType,
                    puntos_acierto: formSpecialPoints,
                    fecha_cierre: formSpecialDeadline,
                    descripcion: formSpecialDescription,
                    habilitada: formSpecialEnabled,
                    estado: "abierta"
                  });
                  await reloadSpecialSettings();
                  setShowCreateSpecialModal(false);
                  triggerSuccess("Predicción especial creada");
                } catch (error) {
                  console.error("Error creando predicción especial:", error);
                }
              }}>
                Crear Predicción Especial
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

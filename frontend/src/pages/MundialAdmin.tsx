import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import styles from "../styles/MundialAdmin.module.css";
import {
  getTeamFlag,
  getPhaseMultiplier,
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
} from "../services/mundial.js";

// All data from backend API

export default function MundialAdmin() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [activeTab, setActiveTab] = useState<AdminTab>("matches");
  const [searchTerm, setSearchTerm] = useState("");
  const [phaseFilter, setPhaseFilter] = useState("Todos");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [resultMatch, setResultMatch] = useState<Match | null>(null);
  const [resultHome, setResultHome] = useState(0);
  const [resultAway, setResultAway] = useState(0);
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

  useEffect(() => {
    // Obtener partidos
    getPartidosAdmin()
      .then((res: any): void => {
        setMatches(res.data || []);
      })
      .catch(() => {
        setMatches([]);
      });
    // Obtener equipos
    getEquipos()
      .then((res: any): void => {
        setTeams(res.data || []);
      })
      .catch(() => {
        setTeams([]);
      });
    // Obtener configuración (fases, grupos, etc)
    getConfiguracion()
      .then((res: any): void => {
        if (res.data?.phases) setPhases(res.data.phases);
        if (res.data?.groups) setGroups(res.data.groups);
        if (res.data?.special_settings) setSpecialSettings(res.data.special_settings);
      })
      .catch(() => {
        setPhases([]);
        setGroups([]);
        setSpecialSettings([]);
      });
  }, []);

  const filteredMatches = matches.filter((match) => {
    const phaseMatch = phaseFilter === "Todos" || match.phase === phaseFilter;
    const searchMatch =
      match.homeTeam.toLowerCase().includes(searchTerm.toLowerCase()) ||
      match.awayTeam.toLowerCase().includes(searchTerm.toLowerCase());
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
    setFormHomeTeam(match.homeTeam);
    setFormAwayTeam(match.awayTeam);
    setFormDate(match.date);
    setFormTime(match.time);
    setFormPhase(match.phase);
    setFormGroup(match.group || "");
    setFormStatus(match.status === "finished" ? "open" : match.status);
    setShowCreateModal(true);
  };

  const openResultModal = (match: Match) => {
    setResultMatch(match);
    setResultHome(match.result?.home ?? 0);
    setResultAway(match.result?.away ?? 0);
    setShowResultModal(true);
  };

  const handleSaveMatch = () => {
    if (!formHomeTeam || !formAwayTeam || !formDate || !formTime || !formPhase) return;

    const matchData: Match = {
      id: editingMatch ? editingMatch.id : Date.now(),
      homeTeam: formHomeTeam,
      homeFlag: getTeamFlag(formHomeTeam),
      awayTeam: formAwayTeam,
      awayFlag: getTeamFlag(formAwayTeam),
      date: formDate,
      time: formTime,
      phase: formPhase,
      group: formPhase === "Grupos" ? formGroup : null,
      multiplier: getPhaseMultiplier(formPhase),
      status: formStatus,
      result: editingMatch?.result || null,
    };

    if (editingMatch) {
      setMatches(matches.map((m) => (m.id === editingMatch.id ? matchData : m)));
      triggerSuccess("Partido actualizado");
    } else {
      setMatches([...matches, matchData]);
      triggerSuccess("Partido creado");
    }

    setShowCreateModal(false);
    resetForm();
  };

  const handleSaveResult = () => {
    if (!resultMatch) return;
    setMatches(
      matches.map((m) =>
        m.id === resultMatch.id
          ? { ...m, result: { home: resultHome, away: resultAway }, status: "finished" as const }
          : m
      )
    );
    setShowResultModal(false);
    triggerSuccess("Resultado registrado. Puntos calculados.");
  };

  const handleDeleteMatch = (id: number) => {
    setMatches(matches.filter((m) => m.id !== id));
    setShowDeleteConfirm(null);
    triggerSuccess("Partido eliminado");
  };

  const triggerSuccess = (msg: string) => {
    setShowSuccess(msg);
    setTimeout(() => setShowSuccess(null), 2000);
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
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <Link to="/mundial" className={styles.btnGhost}>← Volver</Link>
          <span className={styles.headerEmoji}>🛡️</span>
          <div>
            <h1 className={styles.headerTitle}>Panel de Administración — MICampeonato</h1>
            <p className={styles.headerSubtitle}>Gestiona partidos, resultados y configuración</p>
          </div>
        </div>
        <div className={styles.headerActions}>
          {activeTab === "matches" && (
            <button className={styles.btnPrimary} onClick={openCreateModal}>
              ➕ Crear Partido
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          className={activeTab === "matches" ? styles.tabBtnActive : styles.tabBtn}
          onClick={() => setActiveTab("matches")}
        >
          <span className={styles.tabEmoji}>📅</span> Partidos
        </button>
        <button
          className={activeTab === "results" ? styles.tabBtnActive : styles.tabBtn}
          onClick={() => setActiveTab("results")}
        >
          <span className={styles.tabEmoji}>📊</span> Resultados
        </button>
        <button
          className={activeTab === "settings" ? styles.tabBtnActive : styles.tabBtn}
          onClick={() => setActiveTab("settings")}
        >
          <span className={styles.tabEmoji}>⚙️</span> Configuración
        </button>
      </div>

      {/* Stats */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.statBgPrimary}`}>⚽</div>
          <div className={styles.statInfo}>
            <p className={styles.statLabel}>Total partidos</p>
            <p className={styles.statValue}>{matches.length}</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.statBgAccent}`}>✅</div>
          <div className={styles.statInfo}>
            <p className={styles.statLabel}>Abiertos</p>
            <p className={styles.statValue}>{totalOpen}</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.statBgWarning}`}>🔒</div>
          <div className={styles.statInfo}>
            <p className={styles.statLabel}>Bloqueados</p>
            <p className={styles.statValue}>{totalLocked}</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.statBgSecondary}`}>🏁</div>
          <div className={styles.statInfo}>
            <p className={styles.statLabel}>Finalizados</p>
            <p className={styles.statValue}>{totalFinished}</p>
          </div>
        </div>
      </div>

      {/* ===== MATCHES TAB ===== */}
      {activeTab === "matches" && (
        <>
          <div className={styles.toolbar}>
            <div className={styles.searchWrapper}>
              <span className={styles.searchIcon}>🔍</span>
              <input
                className={styles.searchInput}
                placeholder="Buscar por equipo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className={styles.filterGroup}>
              <select
                className={styles.filterSelect}
                value={phaseFilter}
                onChange={(e) => setPhaseFilter(e.target.value)}
              >
                <option value="Todos">Todas las fases</option>
                {phases.map((p) => (
                  <option key={p.value || p} value={p.value || p}>{p.label || p}</option>
                ))}
              </select>
            </div>
          </div>

          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Partido</th>
                  <th>Fase</th>
                  <th>Fecha</th>
                  <th>Estado</th>
                  <th>Resultado</th>
                  <th style={{ textAlign: "right" }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredMatches.map((match) => (
                  <tr key={match.id}>
                    <td data-label="Partido">
                      <div className={styles.tableTeam}>
                        <span className={styles.tableFlag}>{match.homeFlag}</span>
                        <span>{match.homeTeam}</span>
                        <span className={styles.tableVs}>vs</span>
                        <span>{match.awayTeam}</span>
                        <span className={styles.tableFlag}>{match.awayFlag}</span>
                      </div>
                    </td>
                    <td data-label="Fase">
                      <span className={styles.badgeMuted}>
                        {match.phase}{match.group ? ` ${match.group}` : ""}
                      </span>{" "}
                      <span className={styles.badgeMuted}>{match.multiplier}</span>
                    </td>
                    <td data-label="Fecha">
                      <div>
                        <p>{formatDateES(match.date)}</p>
                        <p style={{ fontSize: "0.75rem", opacity: 0.7 }}>{match.time}</p>
                      </div>
                    </td>
                    <td data-label="Estado">{getStatusBadge(match.status)}</td>
                    <td data-label="Resultado" style={{ textAlign: "center" }}>
                      {match.result ? (
                        <strong style={{ fontSize: "1.125rem" }}>
                          {match.result.home} - {match.result.away}
                        </strong>
                      ) : (
                        <span style={{ opacity: 0.5 }}>—</span>
                      )}
                    </td>
                    <td data-label="Acciones">
                      <div className={styles.actionGroup} style={{ justifyContent: "flex-end" }}>
                        <button
                          className={styles.actionBtnEdit}
                          onClick={() => openEditModal(match)}
                          title="Editar"
                        >
                          ✏️
                        </button>
                        <button
                          className={styles.actionBtnResult}
                          onClick={() => openResultModal(match)}
                          title="Resultado"
                        >
                          🎯
                        </button>
                        <button
                          className={styles.actionBtnDelete}
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
              <div className={styles.emptyState}>
                <p className={styles.emptyEmoji}>🔍</p>
                <p className={styles.emptyTitle}>Sin resultados</p>
                <p className={styles.emptyText}>No se encontraron partidos.</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* ===== RESULTS TAB ===== */}
      {activeTab === "results" && (
        <div>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.5rem" }}>Cargar Resultados</h2>
          <p style={{ color: "var(--admin-text-secondary)", marginBottom: "1.5rem", fontSize: "0.875rem" }}>
            Selecciona un partido para registrar su resultado. El sistema calculará los puntos automáticamente.
          </p>

          <div className={styles.resultsLayout}>
            <div className={styles.resultsColumn}>
              <h3>⏳ Pendientes</h3>
              {matches.filter((m) => m.status !== "finished").map((match) => (
                <div
                  key={match.id}
                  className={styles.resultCard}
                  style={{ cursor: "pointer" }}
                  onClick={() => openResultModal(match)}
                >
                  <div className={styles.resultCardHeader}>
                    <div className={styles.resultTeams}>
                      <span>{match.homeFlag}</span>
                      <span>{match.homeTeam}</span>
                      <span style={{ opacity: 0.5, fontWeight: 700 }}>VS</span>
                      <span>{match.awayTeam}</span>
                      <span>{match.awayFlag}</span>
                    </div>
                    {getStatusBadge(match.status)}
                  </div>
                  <div className={styles.resultMeta}>
                    <span className={styles.badgeMuted}>
                      {match.phase}{match.group ? ` - ${match.group}` : ""}
                    </span>
                    <span className={styles.badgeMuted}>📅 {formatDateES(match.date)}</span>
                    <span className={styles.badgeMuted}>⏰ {match.time}</span>
                  </div>
                </div>
              ))}
            </div>

            {matches.filter((m) => m.status === "finished").length > 0 && (
              <div className={styles.resultsColumn}>
                <h3>✅ Finalizados</h3>
                {matches.filter((m) => m.status === "finished").map((match) => (
                  <div key={match.id} className={styles.resultCard}>
                    <div className={styles.resultCardHeader}>
                      <div className={styles.resultTeams}>
                        <span>{match.homeFlag}</span>
                        <span>{match.homeTeam}</span>
                      </div>
                      <span className={styles.resultScore}>
                        {match.result?.home} - {match.result?.away}
                      </span>
                      <div className={styles.resultTeams}>
                        <span>{match.awayTeam}</span>
                        <span>{match.awayFlag}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== SETTINGS TAB ===== */}
      {activeTab === "settings" && (
        <div className={styles.settingsLayout}>
          <div className={styles.settingsCard}>
            <h3 className={styles.settingsCardTitle}>📊 Sistema de Puntuación</h3>
            <p className={styles.settingsCardDesc}>Puntos otorgados por tipo de acierto.</p>
            <div className={styles.settingsRow}>
              <span className={styles.settingsLabel}>Resultado exacto</span>
              <input type="number" defaultValue={3} className={styles.settingsInput} />
            </div>
            <div className={styles.settingsRow}>
              <span className={styles.settingsLabel}>Ganador correcto</span>
              <input type="number" defaultValue={1} className={styles.settingsInput} />
            </div>
          </div>

          <div className={styles.settingsCard}>
            <h3 className={styles.settingsCardTitle}>✖️ Multiplicadores por Fase</h3>
            <p className={styles.settingsCardDesc}>Los puntos se multiplican según la fase.</p>
            {phases.map((phase) => (
              <div key={phase.value || phase} className={styles.settingsRow}>
                <span className={styles.settingsLabel}>{phase.label || phase}</span>
                <input type="text" defaultValue={phase.multiplier} className={styles.settingsInput} />
              </div>
            ))}
          </div>

          <div className={styles.settingsCard}>
            <h3 className={styles.settingsCardTitle}>⭐ Predicciones Especiales (pts)</h3>
            <p className={styles.settingsCardDesc}>Puntos por aciertos en predicciones especiales.</p>
            {specialSettings.map((sp) => (
              <div key={sp.name || sp} className={styles.settingsRow}>
                <span className={styles.settingsLabel}>{sp.name || sp}</span>
                <input type="number" defaultValue={sp.pts} className={styles.settingsInput} />
              </div>
            ))}
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            <button className={styles.btnPrimary}>💾 Guardar Configuración</button>
          </div>
        </div>
      )}

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
                  <label className={styles.formLabel}>Equipo Local</label>
                  <select
                    className={styles.formSelect}
                    value={formHomeTeam}
                    onChange={(e) => setFormHomeTeam(e.target.value)}
                  >
                    <option value="">Seleccionar</option>
                    {teams.map((t) => (
                      <option key={t.name || t} value={t.name || t}>{t.flag || ""} {t.name || t}</option>
                    ))}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Equipo Visitante</label>
                  <select
                    className={styles.formSelect}
                    value={formAwayTeam}
                    onChange={(e) => setFormAwayTeam(e.target.value)}
                  >
                    <option value="">Seleccionar</option>
                    {teams.map((t) => (
                      <option key={t.name || t} value={t.name || t}>{t.flag || ""} {t.name || t}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Fecha</label>
                  <input
                    type="date"
                    className={styles.formInput}
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Hora</label>
                  <input
                    type="time"
                    className={styles.formInput}
                    value={formTime}
                    onChange={(e) => setFormTime(e.target.value)}
                  />
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Fase</label>
                  <select
                    className={styles.formSelect}
                    value={formPhase}
                    onChange={(e) => setFormPhase(e.target.value)}
                  >
                    <option value="">Seleccionar</option>
                    {phases.map((p) => (
                      <option key={p.value || p} value={p.value || p}>{p.label || p} ({p.multiplier})</option>
                    ))}
                  </select>
                </div>
                {formPhase === "Grupos" && (
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Grupo</label>
                    <select
                      className={styles.formSelect}
                      value={formGroup}
                      onChange={(e) => setFormGroup(e.target.value)}
                    >
                      <option value="">Grupo</option>
                      {groups.map((g) => (
                        <option key={g} value={g}>Grupo {g}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Estado del partido</label>
                <select
                  className={styles.formSelect}
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as "open" | "locked")}
                >
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
              <p style={{ textAlign: "center", fontSize: "0.875rem", color: "var(--admin-text-secondary)", marginBottom: "1.5rem" }}>
                {resultMatch.phase}{resultMatch.group ? ` - Grupo ${resultMatch.group}` : ""} | {formatDateES(resultMatch.date)}
              </p>

              <div className={styles.scoreContainer}>
                <div className={styles.scoreTeam}>
                  <span className={styles.scoreTeamFlag}>{resultMatch.homeFlag}</span>
                  <span className={styles.scoreTeamName}>{resultMatch.homeTeam}</span>
                  <input
                    type="number"
                    min="0"
                    value={resultHome}
                    onChange={(e) => setResultHome(parseInt(e.target.value) || 0)}
                    className={styles.formInputSmall}
                  />
                </div>
                <span className={styles.scoreDivider}>-</span>
                <div className={styles.scoreTeam}>
                  <span className={styles.scoreTeamFlag}>{resultMatch.awayFlag}</span>
                  <span className={styles.scoreTeamName}>{resultMatch.awayTeam}</span>
                  <input
                    type="number"
                    min="0"
                    value={resultAway}
                    onChange={(e) => setResultAway(parseInt(e.target.value) || 0)}
                    className={styles.formInputSmall}
                  />
                </div>
              </div>

              <p style={{ fontSize: "0.75rem", color: "var(--admin-text-secondary)", textAlign: "center", marginTop: "1rem", lineHeight: 1.6 }}>
                Al guardar el resultado, el sistema calculará automáticamente los puntos (multiplicador {resultMatch.multiplier}).
              </p>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.btnOutline} onClick={() => setShowResultModal(false)}>Cancelar</button>
              <button className={styles.btnSecondary} onClick={handleSaveResult}>
                Guardar Resultado
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
              <div className={styles.deleteContent}>
                <p className={styles.deleteIcon}>⚠️</p>
                <p className={styles.deleteTitle}>Eliminar Partido</p>
                <p className={styles.deleteText}>
                  Esta acción no se puede deshacer. Se eliminarán todas las predicciones asociadas.
                </p>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.btnOutline} onClick={() => setShowDeleteConfirm(null)}>Cancelar</button>
              <button className={styles.btnDestructive} onClick={() => handleDeleteMatch(showDeleteConfirm)}>
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== SUCCESS TOAST ===== */}
      {showSuccess && (
        <div className={styles.toast}>
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

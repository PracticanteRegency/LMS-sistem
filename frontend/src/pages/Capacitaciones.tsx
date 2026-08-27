import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Styles/Capacitaciones.module.css";
import CapListService from "../services/Capacitaciones.js";
import { getUserRole } from "../services/auth";

interface Capacitacion {
  id: number;
  titulo: string;
  descripcion?: string;
  fecha_creacion?: string;
  total_colaboradores?: number;
  completados?: number;
  porcentaje_completado?: number;
  fecha_inicio?: string;
  fecha_fin?: string;
  estado: number;
  tipo?: string;
}

interface MenuState {
  [key: number]: boolean;
}

export default function Capacitaciones() {
  const [capacitaciones, setCapacitaciones] = useState<Capacitacion[]>([]);
  const [filtradas, setFiltradas] = useState<Capacitacion[]>([]);
  const [page, setPage] = useState(1);
  const pageSize = 5;
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openMenus, setOpenMenus] = useState<MenuState>({});
  const menuRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
  const [menuCoords, setMenuCoords] = useState<{ [key: number]: { top: number; left: number } }>({});
  const navigate = useNavigate();
  const userRole = Number(getUserRole());
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportFechaInicio, setReportFechaInicio] = useState("");
  const [reportFechaFin, setReportFechaFin] = useState("");
  const [downloadingReport, setDownloadingReport] = useState(false);

  useEffect(() => {
    loadCapacitaciones();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      let clickedOutside = true;

      Object.entries(menuRefs.current).forEach(([, ref]) => {
        if (ref && ref.contains(target)) {
          clickedOutside = false;
        }
      });

      if (clickedOutside && Object.values(openMenus).some(Boolean)) {
        setOpenMenus({});
      }
    };

    if (Object.values(openMenus).some(Boolean)) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openMenus]);

  const loadCapacitaciones = async () => {
    try {
      setLoading(true);
      const data: any = await CapListService.getCapList();
      const list: Capacitacion[] = Array.isArray(data) ? data : data?.results ?? [];
      setCapacitaciones(list);
      setFiltradas(list);
      setPage(1);
    } catch (err) {
      setError("Error al cargar las capacitaciones");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    applyFilters(term);
  };

  const applyFilters = (term: string) => {
    let result = [...capacitaciones];

    if (term && term.trim()) {
      result = result.filter((cap) => (cap.titulo || "").toLowerCase().includes(term.toLowerCase()));
    }

    setFiltradas(result);
    setPage(1);
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const getStatusBadge = (estado: number) => {
    switch (estado) {
      case 1:
        return <span className={styles.badgeActive}>Activa</span>;
      case 0:
        return <span className={styles.badgeInactive}>Inactiva</span>;
      default:
        return <span className={styles.badgeDraft}>Borrador</span>;
    }
  };

  const toggleActionMenu = (id: number) => {
    setOpenMenus((prev) => {
      if (prev[id]) {
        setMenuCoords((mc) => {
          const copy = { ...mc };
          delete copy[id];
          return copy;
        });
        return {};
      }

      try {
        const el = menuRefs.current[id];
        if (el) {
          const rect = el.getBoundingClientRect();
          const menuWidth = 180;
          const menuHeight = 160; // Ajusta según el alto real del menú
          // Centrar verticalmente el menú respecto al botón y mostrar a la izquierda
          let left = rect.left - menuWidth - 8;
          if (left < 8) left = 8;
          // Centrado vertical respecto al botón
          let top = rect.top + rect.height / 2 - menuHeight / 2;
          if (top < 8) top = 8;
          if (top + menuHeight > window.innerHeight - 8) top = window.innerHeight - menuHeight - 8;
          setMenuCoords({ [id]: { top, left } });
        }
      } catch (e) {
        // ignore
      }

      return { [id]: true };
    });
  };

  const handleAction = async (action: string, cap: Capacitacion) => {
    toggleActionMenu(cap.id);

    if (action === "Ver") {
      navigate(`/capacitaciones/${cap.id}/users-cap`);
    }
    if (action === "Editar") {
      navigate(`/CrearCapacitacion/${cap.id}`);
    }
    if (action === "EditarColaboradores") {
      navigate(`/capacitaciones/${cap.id}/colaboradores`);
      return;
    }
    if (action === "ToggleEstado") {
      const willActivate = cap.estado === 0;
      const confirmMsg = willActivate ? "¿Está seguro que desea activar la capacitación?" : "¿Está seguro que desea desactivar la capacitación?";
      if (!window.confirm(confirmMsg)) return;
      try {
        setLoading(true);
        setError(null);
        const res = await (CapListService as any).toggleCapacitacion(cap.id);
        await loadCapacitaciones();
        alert(res?.mensaje || (willActivate ? 'Capacitación activada.' : 'Capacitación desactivada.'));
      } catch (err: any) {
        setError(err?.message || (willActivate ? 'Error al activar la capacitación' : 'Error al desactivar la capacitación'));
      } finally {
        setLoading(false);
      }
      return;
    }
    if (action === "Replicar") {
      navigate("/CrearCapacitacion", { state: { replicarId: cap.id } });
      return;
    }
    if (action === "Eliminar") {
      if (!window.confirm("¿Está seguro que desea eliminar la capacitación? Esta acción no se puede deshacer.")) {
        return;
      }
      try {
        setLoading(true);
        setError(null);
        await CapListService.eliminarCapacitacion(cap.id);
        // Recargar lista tras eliminar
        await loadCapacitaciones();
        alert("Capacitación eliminada exitosamente.");
      } catch (err: any) {
        setError(err?.message || "Error al eliminar la capacitación");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDescargarReporteRangoFechas = async () => {
    if (!reportFechaInicio || !reportFechaFin) {
      alert("Por favor, selecciona ambas fechas");
      return;
    }

    if (new Date(reportFechaInicio) > new Date(reportFechaFin)) {
      alert("La fecha de inicio no puede ser mayor que la fecha de fin");
      return;
    }

    try {
      setDownloadingReport(true);
      const blob = await CapListService.descargarReporteRangoFechas(reportFechaInicio, reportFechaFin);
      
      // Crear URL para descargar el archivo
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `reporte_capacitaciones_${reportFechaInicio}_${reportFechaFin}.xlsx`;
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
      
      // Cerrar modal
      setShowReportModal(false);
      setReportFechaInicio("");
      setReportFechaFin("");
    } catch (err: any) {
      alert("Error al descargar el reporte: " + (err.message || "Error desconocido"));
      console.error("Error descargando reporte:", err);
    } finally {
      setDownloadingReport(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <p className={styles.loading}>Cargando capacitaciones...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <p className={styles.error}>Error: {error}</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <div>
            <h1>Capacitaciones</h1>
            <p className={styles.subtitle}>Gestión de capacitaciones y entrenamientos</p>
          </div>
          <div className={styles.headerButtons}>
            <button
              className={styles.btnReport}
              onClick={() => setShowReportModal(true)}
              disabled={downloadingReport}
            >
              {downloadingReport ? "⏳ Descargando..." : "📊 Generar Reporte"}
            </button>
            <button
              className={styles.btnCreate}
              onClick={() => navigate("/CrearCapacitacion")}
            >
              + Crear Capacitación
            </button>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className={styles.searchSection}>
        <input
          type="text"
          className={styles.searchInput}
          placeholder="🔍 Buscar por nombre de capacitación..."
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
        />
        <span className={styles.resultCount}>
          {filtradas.length} de {capacitaciones.length} resultados
        </span>
      </div>

      {/* Table */}
      <div style={{ position: 'relative' }}>
        <div className={styles.tableWrapper}>
          {filtradas.length > 0 ? (
            <table className={styles.table}>
              <thead className={styles.thead}>
                <tr>
                  <th>Título</th>
                  <th>Descripción</th>
                  <th>fechacreacion</th>
                  <th>Colaboradores</th>
                  <th>Completados</th>
                  <th>% Completado</th>
                  <th>Fecha Inicio/Fin</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody className={styles.tbody}>
                {filtradas
                  .slice((page - 1) * pageSize, page * pageSize)
                  .map((cap) => (
                    <tr key={cap.id} className={styles.row}>
                      <td className={styles.tdTitulo}>
                        <div className={styles.titleContainer}>
                          <span>{cap.titulo}</span>
                        </div>
                      </td>
                      <td className={styles.tdDescripcion}>
                        <span className={styles.description}>{cap.descripcion}</span>
                      </td>
                      <td className={styles.tdFecha}>{formatDate(cap.fecha_creacion)}</td>
                      <td className={styles.tdNumber}>{cap.total_colaboradores ?? 0}</td>
                      <td className={styles.tdNumber}>{cap.completados ?? 0}</td>
                      <td className={styles.tdNumber}>{cap.porcentaje_completado}%</td>
                      <td className={styles.tdFecha}>
                        {formatDate(cap.fecha_inicio)}-{formatDate(cap.fecha_fin)}  
                      </td>
                      <td className={styles.tdEstado}>{getStatusBadge(cap.estado)}</td>
                      <td className={styles.tdAcciones}>
                        <div
                          className={styles.actionMenu}
                          ref={(el) => {
                            if (el) menuRefs.current[cap.id] = el;
                          }}
                        >
                          <button
                            className={styles.menuButton}
                            onClick={() => toggleActionMenu(cap.id)}
                            title="Opciones"
                          >
                            ☰
                          </button>
                          {openMenus[cap.id] && (
                            <div
                              className={styles.dropdownMenu}
                              style={{
                                position: "fixed",
                                top: menuCoords[cap.id]?.top ?? undefined,
                                left: menuCoords[cap.id]?.left ?? undefined,
                                right: undefined,
                                zIndex: 2147483647,
                              }}
                            >
                                <button
                                  className={`${styles.btn} ${styles.btn}`}
                                  onClick={() => handleAction("Ver", cap)}
                                >
                                  Ver
                                </button>
                              {userRole !== 3 && (
                                <button
                                  className={`${styles.btn} ${styles.btn}`}
                                  onClick={() => handleAction("Editar", cap)}
                                >
                                  Editar
                                </button>
                              )}
                              <button
                                className={`${styles.btn} ${styles.btn}`}
                                onClick={() => handleAction("Replicar", cap)}
                              >
                                Replicar
                              </button>
                              <button
                                className={`${styles.btn} ${styles.btn}`}
                                onClick={() => handleAction("EditarColaboradores", cap)}
                              >
                                Editar colaboradores
                              </button>
                              {userRole !== 3 && (
                                <button
                                  className={`${styles.btn} ${styles.btn}`}
                                  onClick={() => handleAction("ToggleEstado", cap)}
                                >
                                  {cap.estado === 0 ? 'Activar' : 'Desactivar'}
                                </button>
                              )}
                              {userRole !== 3 && (
                                <button
                                  className={`${styles.btn} ${styles.btn}`}
                                  onClick={() => handleAction("Eliminar", cap)}
                                >
                                  Eliminar
                                </button>
                              )}
                              
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          ) : (
            <div className={styles.emptyState}>
              <p>No se encontraron capacitaciones.</p>
            </div>
          )}
        </div>
        {filtradas.length > 0 && (
          <div className={styles.pagination + ' ' + styles.paginationFixed}>
              <button
                className={styles.pageBtn}
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                ← Anterior
              </button>
              <span className={styles.pageInfo}>
                Página {page} de {Math.max(1, Math.ceil(filtradas.length / pageSize))}
              </span>
              <button
                className={styles.pageBtn}
                disabled={page >= Math.ceil(filtradas.length / pageSize)}
                onClick={() => setPage((p) => Math.min(Math.ceil(filtradas.length / pageSize) || 1, p + 1))}
              >
                Siguiente →
              </button>
            </div>
        )}
      </div>

      {/* Modal para generar reporte por rango de fechas */}
      {showReportModal && (
        <div className={styles.modalOverlay} onClick={() => setShowReportModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Generar Reporte por Rango de Fechas</h2>
              <button
                className={styles.closeBtn}
                onClick={() => setShowReportModal(false)}
              >
                ✕
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.formGroup}>
                <label>Fecha de Inicio:</label>
                <input
                  type="date"
                  className={styles.dateInput}
                  value={reportFechaInicio}
                  onChange={(e) => setReportFechaInicio(e.target.value)}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Fecha de Fin:</label>
                <input
                  type="date"
                  className={styles.dateInput}
                  value={reportFechaFin}
                  onChange={(e) => setReportFechaFin(e.target.value)}
                />
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button
                className={styles.btnCancel}
                onClick={() => setShowReportModal(false)}
              >
                Cancelar
              </button>
              <button
                className={styles.btnConfirm}
                onClick={handleDescargarReporteRangoFechas}
                disabled={downloadingReport}
              >
                {downloadingReport ? "Descargando..." : "Descargar Reporte"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

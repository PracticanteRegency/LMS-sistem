import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Styles/Capacitaciones.module.css";
import CapListService from "../services/Capacitaciones.js";

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

const CAP_TYPES = ["Todos", "Curso", "Taller", "Seminario", "Evento"];

export default function Capacitaciones() {
  const [capacitaciones, setCapacitaciones] = useState<Capacitacion[]>([]);
  const [filtradas, setFiltradas] = useState<Capacitacion[]>([]);
  const [page, setPage] = useState(1);
  const pageSize = 5;
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTipo, setSelectedTipo] = useState(CAP_TYPES[0]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openMenus, setOpenMenus] = useState<MenuState>({});
  const menuRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
  const [menuCoords, setMenuCoords] = useState<{ [key: number]: { top: number; left: number } }>({});
  const navigate = useNavigate();

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
    applyFilters(term, selectedTipo);
  };

  const applyFilters = (term: string, tipo: string) => {
    let result = [...capacitaciones];

    if (tipo && tipo !== "Todos") {
      result = result.filter((c) => (c.tipo || "").toLowerCase() === tipo.toLowerCase());
    }

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
          let left = rect.right - menuWidth + 8;
          if (left < 8) left = 8;
          if (left + menuWidth > window.innerWidth - 8) left = window.innerWidth - menuWidth - 8;
          const top = rect.bottom + 8;
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
      navigate(`/capacitaciones/${cap.id}`);
    }
    if (action === "Editar") {
      navigate(`/CrearCapacitacion/${cap.id}`);
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
          <button
            className={styles.btnCreate}
            onClick={() => navigate("/CrearCapacitacion")}
          >
            + Crear Capacitación
          </button>
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
        <select
          className={styles.smallSelect}
          value={selectedTipo}
          onChange={(e) => {
            setSelectedTipo(e.target.value);
            applyFilters(searchTerm, e.target.value);
          }}
          style={{ marginLeft: 12 }}
        >
          {CAP_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <span className={styles.resultCount}>
          {filtradas.length} de {capacitaciones.length} resultados
        </span>
      </div>

      {/* Table */}
      <div className={styles.tableWrapper}>
        {filtradas.length > 0 ? (
          <>
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
                                className={`${styles.btn} ${styles.btnView}`}
                                onClick={() => handleAction("Ver", cap)}
                              >
                                Ver
                              </button>
                              <button
                                className={`${styles.btn} ${styles.btnEdit}`}
                                onClick={() => handleAction("Editar", cap)}
                              >
                                Editar
                              </button>
                              <button
                                className={`${styles.btn} ${styles.btnDelete}`}
                                onClick={() => handleAction("Eliminar", cap)}
                              >
                                Eliminar
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
            <div className={styles.pagination}>
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
          </>
        ) : (
          <div className={styles.emptyState}>
            <p>No se encontraron capacitaciones con ese nombre</p>
          </div>
        )}
      </div>
    </div>
  );
}

import { useState, useEffect, useRef } from "react";
import styles from "./Styles/Usuarios.module.css";
import Perfil from "../services/perfil";
import { useNavigate } from "react-router-dom";

interface Usuario {
  id_colaborador: number;
  cc_colaborador: string;
  nombre_colaborador: string;
  apellido_colaborador: string;
  correo_colaborador: string;
  nombrecargo: string;
  capacitaciones_totales: number;
  capacitaciones_completadas: number;
  estado_colaborador: number;
}

interface MenuState {
  [key: number]: boolean;
}

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 10;
  const [searchTerm, setSearchTerm] = useState("");
  const [pendingSearch, setPendingSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openMenus, setOpenMenus] = useState<MenuState>({});
  const menuRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
  const [menuCoords, setMenuCoords] = useState<{ [key: number]: { top: number; left: number } }>({});
  const navigate = useNavigate();


  useEffect(() => {
    if (searchTerm.trim()) {
      loadUsuarios(1);
    } else {
      loadUsuarios(page);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, searchTerm]);

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

  const loadUsuarios = async (pageToLoad: number) => {
    try {
      setLoading(true);
      const data: any = await Perfil.getListUsers(pageToLoad, pageSize);
      const list: Usuario[] = Array.isArray(data) ? data : data?.results ?? [];
      const count: number = Array.isArray(data) ? list.length : (data?.count ?? list.length);
      setUsuarios(list);
      setTotalCount(count);
    } catch (err) {
      setError("Error al cargar los usuarios");
    } finally {
      setLoading(false);
    }
  };


  const handleInputChange = (term: string) => {
    setPendingSearch(term);
  };

  const handleSearch = () => {
    setSearchTerm(pendingSearch);
    setPage(1);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const usuariosMostrados = usuarios;

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const getStatusBadge = (estado: number) => {
    switch (estado) {
      case 1:
        return <span className={styles.badgeActive}>Activo</span>;
      case 0:
        return <span className={styles.badgeInactive}>Inactivo</span>;
      default:
        return <span className={styles.badgeDraft}>Desconocido</span>;
    }
  };

  const toggleActionMenu = (id: number) => {
    setOpenMenus((prev) => {
      if (prev[id]) {
        // close and remove coords
        setMenuCoords((mc) => {
          const copy = { ...mc };
          delete copy[id];
          return copy;
        });
        return {};
      }

      // compute viewport coords for fixed menu
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

  const handleAction = (action: string, user: Usuario) => {
    toggleActionMenu(user.id_colaborador);

    if (action === "Ver") navigate(`/user/perfil/${user.id_colaborador}`);
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <p className={styles.loading}>Cargando usuarios...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <p className={styles.error}>{error}</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <div>
            <h1>Usuarios</h1>
            <p className={styles.subtitle}>Gestión de colaboradores</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className={styles.searchSection}>
        <input
          type="text"
          className={styles.searchInput}
          placeholder="🔍 Buscar por cédula..."
          value={pendingSearch}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleInputKeyDown}
        />
        <button
          className={styles.searchButton}
          style={{ marginLeft: 8 }}
          onClick={handleSearch}
        >
          Buscar
        </button>
        <span className={styles.resultCount}>
          {usuariosMostrados.length} de {totalCount} resultados
        </span>
      </div>

      {/* Tabla y paginación fija */}
      <div style={{ position: 'relative' }}>
        <div className={styles.tableWrapper}>
          {usuariosMostrados.length > 0 ? (
            <table className={styles.table}>
              <thead className={styles.thead}>
                <tr>
                  <th>Cédula</th>
                  <th>Nombre</th>
                  <th>Apellido</th>
                  <th>Correo</th>
                  <th>Cargo</th>
                  <th>Total Cap.</th>
                  <th>Completadas</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody className={styles.tbody}>
                {usuariosMostrados.map((u) => (
                  <tr key={u.id_colaborador} className={styles.row}>
                    <td>{u.cc_colaborador}</td>
                    <td>{u.nombre_colaborador}</td>
                    <td>{u.apellido_colaborador}</td>
                    <td>{u.correo_colaborador}</td>
                    <td>{u.nombrecargo}</td>
                    <td>{u.capacitaciones_totales}</td>
                    <td>{u.capacitaciones_completadas}</td>
                    <td>{getStatusBadge(u.estado_colaborador)}</td>
                    <td className={styles.tdAcciones}>
                      <div
                        className={styles.actionMenu}
                        ref={(el) => { menuRefs.current[u.id_colaborador] = el; }}
                      >
                        <button
                          className={styles.menuButton}
                          onClick={() => toggleActionMenu(u.id_colaborador)}
                        >
                          ☰
                        </button>
                        {openMenus[u.id_colaborador] && (
                          <div
                            className={styles.dropdownMenu}
                            style={{
                              position: 'fixed',
                              top: menuCoords[u.id_colaborador]?.top ?? undefined,
                              left: menuCoords[u.id_colaborador]?.left ?? undefined,
                              right: undefined,
                              zIndex: 2147483647,
                            }}
                          >
                            <button
                              className={`${styles.btn} ${styles.btnView}`}
                              onClick={() => handleAction("Ver", u)}
                            >
                              Ver
                            </button>
                            <button className={`${styles.btn} ${styles.btnEdit}`}>
                              Editar
                            </button>
                            <button className={`${styles.btn} ${styles.btnDelete}`}>
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
          ) : (
            <div className={styles.emptyState}>
              <p>No se encontraron usuarios.</p>
            </div>
          )}
        </div>
        {/* Paginación fuera del scroll horizontal */}
        <div className={styles.pagination + ' ' + styles.paginationFixed}>
          <button
            className={styles.pageBtn}
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            ← Anterior
          </button>
          <span className={styles.pageInfo}>
            Página {page} de {totalPages}
          </span>
          <button
            className={styles.pageBtn}
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages || 1, p + 1))}
          >
            Siguiente →
          </button>
        </div>
      </div>
    </div>
  );
}

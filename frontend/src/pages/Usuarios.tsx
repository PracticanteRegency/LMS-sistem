import { useState, useEffect, useRef } from "react";
import styles from "./Styles/Usuarios.module.css";
import Perfil from "../services/perfil";
import { useNavigate } from "react-router-dom";
import { getUserRole } from "../services/auth";
import axios from "axios";

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
  const [success, setSuccess] = useState<string | null>(null);
  const [openMenus, setOpenMenus] = useState<MenuState>({});
  const menuRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
  const [menuCoords, setMenuCoords] = useState<{ [key: number]: { top: number; left: number } }>({});
  const navigate = useNavigate();
  const userRole = Number(getUserRole());
  
  // Estados para el modal de carga masiva
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);


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
      let data: any;
      if (searchTerm.trim()) {
        data = await Perfil.getFiltrarUsuarios(searchTerm, pageToLoad, pageSize);
      } else {
        data = await Perfil.getListUsers(pageToLoad, pageSize);
      }
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

  const handleAction = (action: string, user: Usuario) => {
    toggleActionMenu(user.id_colaborador);

    if (action === "Ver") {
      navigate(`/user/perfil/${user.id_colaborador}`);
    } else if (action === "Cambiar Estado") {
      handleCambiarEstado(user);
    } else if (action === "Cambiar Rol") {
      handleCambiarRol(user);
    }
  };

  const handleCambiarEstado = async (user: Usuario) => {
    const nuevoEstado = user.estado_colaborador === 1 ? 0 : 1;
    const confirmMsg = nuevoEstado === 1 
      ? `¿Activar a ${user.nombre_colaborador} ${user.apellido_colaborador}?`
      : `¿Desactivar a ${user.nombre_colaborador} ${user.apellido_colaborador}?`;
    
    if (!confirm(confirmMsg)) return;

    try {
      await (Perfil as any).cambiarEstadoUsuario(user.id_colaborador, { estado: nuevoEstado });
      setSuccess(`Estado del usuario actualizado correctamente`);
      await loadUsuarios(page);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err?.response?.data?.error || "Error al cambiar estado del usuario");
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleCambiarRol = async (user: Usuario) => {
    const nuevoRol = prompt(
      "Ingresa el nuevo tipo de usuario (0=Usuario, 1=Admin Capacitaciones, 3=Admin Examenes, 4=SuperAdmin):"
    );
    
    if (nuevoRol === null) return;
    
    const rol = parseInt(nuevoRol);
    if (isNaN(rol) || ![0, 1, 3, 4].includes(rol)) {
      setError("Tipo de usuario inválido");
      setTimeout(() => setError(null), 3000);
      return;
    }

    try {
      await (Perfil as any).actualizarRolUsuario(user.id_colaborador, { tipousuario: rol });
      setSuccess(`Rol del usuario actualizado correctamente`);
      await loadUsuarios(page);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err?.response?.data?.error || "Error al cambiar rol del usuario");
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleUploadMasivo = async () => {
    if (!uploadFile) {
      setError("Por favor selecciona un archivo CSV");
      setTimeout(() => setError(null), 3000);
      return;
    }

    setUploadLoading(true);
    const formData = new FormData();
    formData.append("archivo", uploadFile);

    try {
      const response = await (Perfil as any).registrarUsuariosMasivo(uploadFile);

      setUploadResult(response);
      setSuccess(`Se registraron ${response.total_creados} usuarios correctamente`);
      setUploadFile(null);
      
      // Recargar usuarios después de 2 segundos
      setTimeout(() => {
        loadUsuarios(1);
        setShowUploadModal(false);
        setUploadResult(null);
      }, 2000);
    } catch (err: any) {
      const errorMsg = err?.response?.data?.error || "Error al cargar usuarios";
      const detalles = err?.response?.data?.detalles_errores || err?.response?.data?.detalles;
      setError(errorMsg);
      setUploadResult({
        error: errorMsg,
        detalles_errores: detalles,
      });
    } finally {
      setUploadLoading(false);
    }
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
          <div className={styles.headerButtons}>
            <button
              className={styles.btnReport}
              onClick={() => setShowUploadModal(true)}
              title="Registrar múltiples usuarios desde CSV"
              style={{ backgroundColor: "#4CAF50", marginRight: "8px" }}
            >
              📤 Registrar Masivo
            </button>
            <button
              className={styles.btnReport}
              onClick={() => navigate("/desactivar-usuarios")}
              title="Desactivar múltiples usuarios"
              style={{ backgroundColor: "#d32f2f" }}
            >
              🚫 Desactivar Usuarios
            </button>
          </div>
        </div>
      </div>

      {/* Mensajes de error y éxito */}
      {error && (
        <div className={styles.alertError}>
          {error}
        </div>
      )}
      
      {success && (
        <div className={styles.alertSuccess}>
          {success}
        </div>
      )}

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
                  <th>Capacitaciones Totales</th>
                  <th>Capacitaciones Completadas</th>
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
                              className={`${styles.btn} ${styles.btn}`}
                              onClick={() => handleAction("Ver", u)}
                            >
                              Ver
                            </button>
                            <button
                              className={`${styles.btn} ${styles.btn}`}
                              onClick={() => navigate(`/user/editar/${u.id_colaborador}`)}
                            >
                              Editar
                            </button>
                            {(userRole === 1 || userRole === 4) && (
                              <button
                                className={`${styles.btn} ${styles.btn}`}
                                onClick={() => handleAction("Cambiar Estado", u)}
                                title="Cambiar estado del usuario"
                              >
                                Cambiar Estado
                              </button>
                            )}
                            {userRole === 4 && (
                              <button
                                className={`${styles.btn} ${styles.btn}`}
                                onClick={() => handleAction("Cambiar Rol", u)}
                                title="Cambiar rol del usuario"
                              >
                                Cambiar Rol
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

      {/* Modal de Registro Masivo */}
      {showUploadModal && (
        <div className={styles.modalOverlay} onClick={() => {
          setShowUploadModal(false);
          setUploadResult(null);
          setUploadFile(null);
        }}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>📤 Registrar Usuarios Masivamente</h2>
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setUploadResult(null);
                  setUploadFile(null);
                }}
                className={styles.modalCloseBtn}
              >
                ✕
              </button>
            </div>

            {/* Instrucciones */}
            <div className={styles.instructionsBox}>
              <h3 className={styles.instructionsTitle}>📋 Formato esperado del CSV (UTF-8):</h3>
              <p className={styles.instructionsFormat}>
                cédula;Nombre;Correo;Número;Región;Nivel;Empresa;Unidad;Proyecto;Centro;Cargo
              </p>
              <ul className={styles.instructionsList}>
                <li><strong>cédula:</strong> Identificación única (se usa como usuario y contraseña)</li>
                <li><strong>Nombre:</strong> 2 primeras palabras = apellidos, resto = nombres</li>
                <li><strong>Correo:</strong> Email del usuario (opcional)</li>
                <li><strong>Número:</strong> Teléfono (opcional)</li>
                <li><strong>Región, Nivel:</strong> Deben existir en la base de datos</li>
                <li><strong>Empresa, Unidad, Proyecto, Centro:</strong> Se usan para filtrar el Centro de Operación</li>
                <li><strong>Cargo:</strong> Debe existir en la base de datos</li>
              </ul>
              <p className={styles.warningText}>
                ⚠️ Si hay cualquier error, se cancela el registro completo (sin crear ningún usuario)
              </p>
            </div>

            {/* Área de carga */}
            {!uploadResult && (
              <div className={styles.uploadArea}>
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  className={styles.uploadFileInput}
                  id="csvFileInput"
                />
                <label htmlFor="csvFileInput" className={styles.uploadLabel}>
                  Seleccionar archivo CSV
                </label>
                {uploadFile && (
                  <div className={styles.fileSelected}>
                    <strong>Archivo seleccionado:</strong> {uploadFile.name}
                  </div>
                )}
                
              </div>
              
            )}

            {/* Resultados */}
            {uploadResult && (
              <div className={`${styles.resultsBox} ${uploadResult.error ? styles.resultsBoxError : styles.resultsBoxSuccess}`}>
                {uploadResult.error ? (
                  <>
                    <p className={styles.resultErrorMsg}>
                      ❌ {uploadResult.error}
                    </p>
                    {uploadResult.detalles_errores && (
                      <div className={styles.resultDetailsList}>
                        <strong>Errores encontrados:</strong>
                        <ul>
                          {uploadResult.detalles_errores.slice(0, 10).map((err: any, idx: number) => (
                            <li key={idx}>
                              Fila {err.fila}: {err.error}
                            </li>
                          ))}
                        </ul>
                        {uploadResult.detalles_errores.length > 10 && (
                          <p className={styles.resultDetailsMore}>
                            ... y {uploadResult.detalles_errores.length - 10} errores más
                          </p>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <p className={styles.resultSuccessMsg}>
                      ✅ {uploadResult.mensaje}
                    </p>
                    {uploadResult.detalles && (
                      <div className={styles.resultDetailsList}>
                        <strong>Usuarios registrados:</strong>
                        <ul>
                          {uploadResult.detalles.slice(0, 5).map((user: any, idx: number) => (
                            <li key={idx}>
                              {user.cedula} - {user.nombre} {user.apellido}
                            </li>
                          ))}
                        </ul>
                        {uploadResult.detalles.length > 5 && (
                          <p className={styles.resultDetailsMore}>
                            ... y {uploadResult.detalles.length - 5} usuarios más
                          </p>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Botones */}
            <div className={styles.modalFooter}>
              <a 
                  href="/templates/Registrar-usuarios-ejemplo.csv"
                  download
                  className={styles.downloadButton}
                  style={{ marginRight: 12 }}
                >
                  📥 Descargar Formato Ejemplo (CSV)
                </a>
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setUploadResult(null);
                  setUploadFile(null);
                }}
                className={styles.modalBtnClose}
              >
                Cerrar
              </button>
              {!uploadResult && (
                <button
                  onClick={handleUploadMasivo}
                  disabled={!uploadFile || uploadLoading}
                  className={styles.modalBtnSubmit}
                >
                  {uploadLoading ? "Cargando..." : "Cargar Usuarios"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

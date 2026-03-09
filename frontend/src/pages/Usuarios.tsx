import { useState, useEffect, useRef } from "react";
import styles from "./Styles/Usuarios.module.css";
import Perfil from "../services/perfil";
import { useNavigate } from "react-router-dom";
import { getUserRole } from "../services/auth";

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
  const [uploadMode, setUploadMode] = useState<'create' | 'update'>('create');


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
      
      // Detectar y filtrar IDs duplicados
      const seenIds = new Set();
      const uniqueUsers = list.filter((u: Usuario) => {
        if (seenIds.has(u.id_colaborador)) {
          console.warn(`⚠️ Usuario duplicado detectado - ID: ${u.id_colaborador}, Nombre: ${u.nombre_colaborador}`);
          return false;
        }
        seenIds.add(u.id_colaborador);
        return true;
      });
      
      if (list.length !== uniqueUsers.length) {
        console.warn(`⚠️ Se encontraron ${list.length - uniqueUsers.length} usuarios duplicados y fueron removidos`);
      }
      
      setUsuarios(uniqueUsers);
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

  const handleDescargarReporte = async () => {
    try {
      setLoading(true);
      await (Perfil as any).descargarReporteUsuarios();
      setSuccess("Reporte descargado correctamente");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err?.response?.data?.error || "Error al descargar el reporte");
      setTimeout(() => setError(null), 3000);
    } finally {
      setLoading(false);
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
      const response = uploadMode === 'update'
        ? await (Perfil as any).actualizarUsuariosMasivo(uploadFile)
        : await (Perfil as any).registrarUsuariosMasivo(uploadFile);

      setUploadResult(response);

      if (uploadMode === 'update') {
        setSuccess(`Se actualizaron ${response.total_actualizados} usuarios correctamente`);
      } else {
        setSuccess(`Se registraron ${response.total_creados} usuarios correctamente`);
      }
      setUploadFile(null);

      // Recargar usuarios después de 2 segundos pero NO cerrar el modal automáticamente.
      // El panel con la respuesta permanecerá visible hasta que el usuario pulse "Cerrar".
      setTimeout(() => {
        loadUsuarios(1);
      }, 2000);
    } catch (err: any) {
      const errorData = err?.response?.data;
      const errorMsg = errorData?.error || "Error al cargar usuarios";
      const detalles = errorData?.detalles_errores || errorData?.detalles;
      const totalErrores = errorData?.total_errores || detalles?.length || 0;
      setUploadResult({
        error: errorMsg,
        total_errores: totalErrores,
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
              onClick={handleDescargarReporte}
              title="Descargar reporte de todos los usuarios en Excel"
              style={{ backgroundColor: "#2196F3", marginRight: "8px" }}
            >
              📊 Descargar Reporte
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
                {usuariosMostrados.map((u, idx) => (
                  <tr key={`${u.id_colaborador}-${idx}`} className={styles.row}>
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
          setUploadMode('create');
        }}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                {uploadMode === 'update' ? '🔄 Actualizar Usuarios Masivamente' : '📤 Registrar Usuarios Masivamente'}
              </h2>
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setUploadResult(null);
                  setUploadFile(null);
                  setUploadMode('create');
                }}
                className={styles.modalCloseBtn}
              >
                ✕
              </button>
            </div>

            {/* Selector de modo */}
            <div className={styles.uploadModeToggle}>
              <button
                className={`${styles.modeBtn} ${uploadMode === 'create' ? styles.modeBtnActive : ''}`}
                onClick={() => { setUploadMode('create'); setUploadResult(null); setUploadFile(null); }}
              >
                📤 Registrar Nuevos
              </button>
              <button
                className={`${styles.modeBtn} ${uploadMode === 'update' ? styles.modeBtnActive : ''}`}
                onClick={() => { setUploadMode('update'); setUploadResult(null); setUploadFile(null); }}
              >
                🔄 Actualizar Existentes
              </button>
            </div>

            {/* Instrucciones */}
            <div className={styles.instructionsBox}>
              <h3 className={styles.instructionsTitle}>📋 Formato esperado del CSV (UTF-8):</h3>
              <p className={styles.instructionsFormat}>
                cédula;Nombre;Correo;Número;Región;Nivel;Empresa;Unidad;Descripción Unidad;Proyecto;Centro;Cargo
              </p>
              <ul className={styles.instructionsList}>
                <li><strong>cédula:</strong> Identificación única (se usa como usuario y contraseña)</li>
                <li><strong>Nombre:</strong> 2 primeras palabras = apellidos, resto = nombres</li>
                <li><strong>Correo:</strong> Email del usuario (opcional)</li>
                <li><strong>Número:</strong> Teléfono (opcional)</li>
                <li><strong>Región, Nivel:</strong> Deben existir en la base de datos</li>
                <li><strong>Empresa, Unidad, Descripción Unidad:</strong> Identifica la unidad de negocio para filtrar el Centro de Operación</li>
                <li><strong>Proyecto, Centro:</strong> Se usan junto con Empresa y Unidad para filtrar el Centro de Operación</li>
                <li><strong>Cargo:</strong> Debe existir en la base de datos</li>
              </ul>
              <p className={styles.warningText}>
                {uploadMode === 'update'
                  ? '⚠️ Si hay cualquier error, se cancela la actualización completa (sin modificar ningún usuario). No se actualiza el estado del colaborador.'
                  : '⚠️ Si hay cualquier error, se cancela el registro completo (sin crear ningún usuario)'}
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
                    {/* Encabezado del error */}
                    <div className={styles.errorHeader}>
                      <span className={styles.errorIcon}>⚠️</span>
                      <div>
                        <p className={styles.resultErrorMsg}>
                          {uploadResult.error}
                        </p>
                        {uploadResult.detalles_errores && (
                          <p className={styles.errorCount}>
                            Se encontraron <strong>{uploadResult.detalles_errores.length}</strong> error{uploadResult.detalles_errores.length !== 1 ? 'es' : ''} en el archivo
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Resumen agrupado por tipo de error */}
                    {uploadResult.detalles_errores && uploadResult.detalles_errores.length > 1 && (
                      <div className={styles.errorSummary}>
                        <strong className={styles.errorSummaryTitle}>📊 Resumen de errores:</strong>
                        <div className={styles.errorTags}>
                          {Object.entries(
                            uploadResult.detalles_errores.reduce((acc: Record<string, number>, err: any) => {
                              const tipo = err.error?.includes('ya existe') ? 'Duplicados'
                                : err.error?.includes('no encontrad') ? 'No encontrados'
                                : err.error?.includes('vacío') ? 'Campos vacíos'
                                : 'Otros';
                              acc[tipo] = (acc[tipo] || 0) + 1;
                              return acc;
                            }, {} as Record<string, number>)
                          ).map(([tipo, count]) => (
                            <span key={tipo} className={styles.errorTag}>
                              {tipo}: {count as number}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Tabla detallada de errores */}
                    {uploadResult.detalles_errores && (
                      <div className={styles.errorTableWrapper}>
                        <table className={styles.errorTable}>
                          <thead>
                            <tr>
                              <th>Fila</th>
                              <th>Cédula</th>
                              <th>Error</th>
                            </tr>
                          </thead>
                          <tbody>
                            {uploadResult.detalles_errores.map((err: any, idx: number) => (
                              <tr key={idx}>
                                <td className={styles.errorRowNum}>{err.fila}</td>
                                <td className={styles.errorCedula}>{err.cedula || '—'}</td>
                                <td className={styles.errorMessage}>{err.error}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Botón para reintentar */}
                    <button
                      className={styles.retryBtn}
                      onClick={() => {
                        setUploadResult(null);
                        setUploadFile(null);
                      }}
                    >
                      🔄 Corregir y volver a intentar
                    </button>
                  </>
                ) : (
                  <>
                    <p className={styles.resultSuccessMsg}>
                      ✅ {uploadResult.mensaje}
                    </p>
                    {(uploadResult.total_creados || uploadResult.total_actualizados) && (
                      <p className={styles.successCount}>
                        {uploadResult.total_actualizados
                          ? <>Se actualizaron <strong>{uploadResult.total_actualizados}</strong> usuarios correctamente</>
                          : <>Se registraron <strong>{uploadResult.total_creados}</strong> usuarios correctamente</>
                        }
                      </p>
                    )}
                    {uploadResult.detalles && (
                      <div className={styles.resultDetailsList}>
                        <strong>{uploadResult.total_actualizados ? 'Usuarios actualizados:' : 'Usuarios registrados:'}</strong>
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
                  setUploadMode('create');
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
                  {uploadLoading ? "Cargando..." : uploadMode === 'update' ? "Actualizar Usuarios" : "Cargar Usuarios"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

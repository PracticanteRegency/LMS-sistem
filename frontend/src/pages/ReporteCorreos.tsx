import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Styles/ReporteCorreos.module.css";
import ExamenesService from "../services/Examenes";

interface TrabajadorInfo {
  id: number;
  nombre_trabajador: string;
  estado_trabajador: number;
}

interface ReporteCorreoItem {
  id: number;
  uuid_correo?: string;
  correos_destino: string;
  enviado_por_nombre: string;
  fecha_envio: string;
  enviado_correctamente: boolean;
  trabajadores_count?: number;
  trabajadores_ids?: TrabajadorInfo[];
  estado_nombre?: string;
}

interface Empresa {
  id: number;
  nombre: string;
}

interface Colaborador {
  id: number;
  nombre: string;
}

export default function ReporteCorreos() {
  const navigate = useNavigate();
  const [reportes, setReportes] = useState<ReporteCorreoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const itemsPerPage = 10;
  
  // Estados para el modal de Excel
  const [showExcelModal, setShowExcelModal] = useState(false);
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [empresasSeleccionadas, setEmpresasSeleccionadas] = useState<number[]>([]);
  const [loadingEmpresas, setLoadingEmpresas] = useState(false);
  const [generatingExcel, setGeneratingExcel] = useState(false);
  const [excelError, setExcelError] = useState<string | null>(null);
  
  // Estados para filtro por colaborador
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [loadingColaboradores, setLoadingColaboradores] = useState(false);
  const [colaboradorSeleccionado, setColaboradorSeleccionado] = useState<number | null>(null);
  const [filtroActivo, setFiltroActivo] = useState(false);
  
  // Estado para botón completar
  const [completingId, setCompletingId] = useState<number | null>(null);

  // Load reportes on mount
  const loadReportes = useCallback(async (page: number) => {
    try {
      setLoading(true);
      setError(null);
      console.log(`Cargando reportes página ${page}...`);
      const data = await ExamenesService.ObtenerReporteCorreos(page, itemsPerPage);
      console.log("Datos recibidos:", data);
      
      // Soportar ambos formatos: array directo o objeto paginado
      if (Array.isArray(data)) {
        // Backend devuelve array directo
        setReportes(data);
        setTotalCount(data.length);
      } else {
        // Backend devuelve objeto paginado {count, next, previous, results}
        setReportes(data.results || []);
        setTotalCount(data.count || 0);
      }
      setCurrentPage(page);
    } catch (err: any) {
      setError(err.message || "Error cargando reportes");
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  }, [itemsPerPage]);

  // Cargar colaboradores
  const loadColaboradores = useCallback(async () => {
    try {
      setLoadingColaboradores(true);
      const data = await ExamenesService.FiltrarExamenesPorColaborador();
      // El backend devuelve: { total, colaboradores: [...] }
      setColaboradores(data.colaboradores || []);
    } catch (err: any) {
      console.error("Error cargando colaboradores:", err);
    } finally {
      setLoadingColaboradores(false);
    }
  }, []);

  useEffect(() => {
    loadReportes(1);
    loadColaboradores();
  }, [loadReportes, loadColaboradores]);

  // Ejecutar búsqueda manualmente
  const handleEjecutarBusqueda = async () => {
    if (searchTerm.trim() === "") {
      // Si no hay término de búsqueda, cargar reportes normales
      loadReportes(1);
      return;
    }
    
    // Siempre buscar en el backend con el UUID escrito
    const searchValue = searchTerm.trim();
    console.log("Buscando UUID en backend:", searchValue);
    await handleBuscarPorUUID(searchValue);
  };

  // Manejar Enter en el input de búsqueda
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleEjecutarBusqueda();
    }
  };

  const paginatedReportes = reportes; // ya vienen paginados desde backend
  const totalPages = Math.max(1, Math.ceil(totalCount / itemsPerPage));

  const goToWorkers = (correoId: number) => {
    navigate(`/reportes-correos/${correoId}/trabajadores`);
  };

  const handleCambiarEstado = async (correoId: number, reporte: ReporteCorreoItem) => {
    const trabajadores = reporte.trabajadores_ids || [];
    if (trabajadores.length === 0) {
      setError("No hay trabajadores en este correo");
      return;
    }

    try {
      setCompletingId(correoId);
      setError(null);
      
      const ids = trabajadores.map(t => t.id);
      await ExamenesService.ActualizarEstadoTrabajadores({ trabajador_ids: ids });
      
      // Recargar reportes manteniendo el filtro o búsqueda activos
      if (filtroActivo && colaboradorSeleccionado !== null) {
        // Mantener el filtro por colaborador
        const data = await ExamenesService.FiltrarExamenesPorColaborador(colaboradorSeleccionado, currentPage, itemsPerPage);
        setReportes(data.results || []);
        setTotalCount(data.count || 0);
      } else if (searchTerm.trim() !== "") {
        // Mantener la búsqueda por UUID o nombre
        const data = await ExamenesService.FiltrarExamenesPorUUID(searchTerm.trim(), currentPage, itemsPerPage);
        
        if (data.results && Array.isArray(data.results)) {
          setReportes(data.results || []);
          setTotalCount(data.count || 0);
        } else if (data.correo) {
          setReportes([data.correo]);
          setTotalCount(1);
        }
      } else {
        // Recargar reportes normales si no hay filtro
        await loadReportes(currentPage);
      }
      
      setError(null);
    } catch (err: any) {
      setError(err.message || "Error al cambiar estado de trabajadores");
      console.error("Error:", err);
    } finally {
      setCompletingId(null);
    }
  };

  // Cargar empresas para el filtro de Excel
  const loadEmpresas = async () => {
    try {
      setLoadingEmpresas(true);
      const data = await ExamenesService.CargoEmpresaConExamenes();
      setEmpresas(data.empresas || []);
    } catch (err: any) {
      console.error("Error cargando empresas:", err);
      setError("Error cargando empresas");
    } finally {
      setLoadingEmpresas(false);
    }
  };

  // Abrir modal de Excel
  const handleOpenExcelModal = () => {
    // Establecer fechas por defecto (mes actual)
    const hoy = new Date();
    const primerDia = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const ultimoDia = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
    
    setFechaInicio(primerDia.toISOString().split('T')[0]);
    setFechaFin(ultimoDia.toISOString().split('T')[0]);
    setEmpresasSeleccionadas([]);
    setExcelError(null);
    setShowExcelModal(true);
    
    if (empresas.length === 0) {
      loadEmpresas();
    }
  };

  // Generar Excel
  const handleGenerarExcel = async () => {
    if (!fechaInicio || !fechaFin) {
      setExcelError("Debe seleccionar fecha de inicio y fin");
      return;
    }

    if (empresasSeleccionadas.length === 0) {
      setExcelError("Debe seleccionar al menos una empresa");
      return;
    }

    try {
      setGeneratingExcel(true);
      setExcelError(null);

      const empresasParam = empresasSeleccionadas.join(',');
      const url = `examenes/imprimir-reporte/?fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}&empresas=${empresasParam}`;
      
      console.log("Generando Excel con URL:", url);
      
      const blob = await ExamenesService.GenerarReporteExcel(fechaInicio, fechaFin, empresasParam);
      
      // Crear enlace de descarga
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `reporte_correos_${fechaInicio}_${fechaFin}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      
      setShowExcelModal(false);
      console.log("Excel generado correctamente");
    } catch (err: any) {
      // Manejo específico de 404 cuando no hay registros en el rango/empresas
      if (err?.response?.status === 404 && err?.response?.data) {
        try {
          const text = await err.response.data.text();
          const parsed = JSON.parse(text);
          setExcelError(parsed?.error || text || "No se encontraron registros para ese rango y empresas.");
        } catch {
          setExcelError("No se encontraron registros para ese rango y empresas.");
        }
      } else {
        setExcelError(err.message || "Error generando reporte Excel");
      }
      console.error("Error generando Excel:", err);
    } finally {
      setGeneratingExcel(false);
    }
  };

  // Aplicar filtro de colaborador
  const handleFiltrarPorColaborador = async () => {
    if (colaboradorSeleccionado === null) {
      setError("Selecciona un colaborador");
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      // El backend devuelve: { count, next, previous, results, enviado_por_id, nombre_colaborador, total_correos }
      const data = await ExamenesService.FiltrarExamenesPorColaborador(colaboradorSeleccionado, 1, itemsPerPage);
      setReportes(data.results || []);
      setTotalCount(data.count || 0);
      setCurrentPage(1);
      setFiltroActivo(true);
    } catch (err: any) {
      setError(err.message || "Error aplicando filtro");
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Paginar manteniendo el filtro si está activo
  const handlePaginar = async (page: number) => {
    try {
      setLoading(true);
      setError(null);
      
      if (filtroActivo && colaboradorSeleccionado !== null) {
        // Si hay filtro activo, mantenerlo al cambiar página
        const data = await ExamenesService.FiltrarExamenesPorColaborador(colaboradorSeleccionado, page, itemsPerPage);
        setReportes(data.results || []);
        setTotalCount(data.count || 0);
        setCurrentPage(page);
      } else if (searchTerm.trim() !== "") {
        // Si hay búsqueda activa, mantenerla al cambiar página
        // Para búsquedas múltiples, usar la API con paginación
        const data = await ExamenesService.FiltrarExamenesPorUUID(searchTerm.trim(), page, itemsPerPage);
        
        if (data.results && Array.isArray(data.results)) {
          setReportes(data.results || []);
          setTotalCount(data.count || 0);
          setCurrentPage(page);
        } else {
          // Fallback si solo hay un resultado
          setReportes([data.correo]);
          setTotalCount(1);
          setCurrentPage(1);
        }
      } else {
        // Si no hay filtro ni búsqueda, cargar normalmente
        await loadReportes(page);
      }
    } catch (err: any) {
      setError(err.message || "Error al cambiar página");
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Limpiar filtro
  const handleLimpiarFiltro = () => {
    setColaboradorSeleccionado(null);
    setFiltroActivo(false);
    loadReportes(1);
  };

  // Buscar por UUID o nombre del trabajador
  const handleBuscarPorUUID = async (uuid: string) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log("Buscando correo por UUID o nombre:", uuid);
      
      // Llamar al servicio directamente con el UUID o nombre
      // El servicio enviará: GET /examenes/filtrar-examenes/?uuid=<uuid_o_nombre>
      const data = await ExamenesService.FiltrarExamenesPorUUID(uuid);
      
      console.log("Respuesta del backend:", data);
      
      // Manejar respuesta con formato unitario (un correo encontrado)
      if (data.found && data.correo) {
        setReportes([data.correo]);
        setTotalCount(1);
        setCurrentPage(1);
        setError(null);
        setFiltroActivo(false);
      } 
      // Manejar respuesta con formato paginado (múltiples correos encontrados)
      else if (data.results && Array.isArray(data.results)) {
        setReportes(data.results || []);
        setTotalCount(data.count || 0);
        setCurrentPage(1);
        setError(null);
        setFiltroActivo(false);
      }
      // Fallback: solo viene correo sin "found"
      else if (data.correo) {
        setReportes([data.correo]);
        setTotalCount(1);
        setCurrentPage(1);
        setError(null);
        setFiltroActivo(false);
      } 
      else {
        setReportes([]);
        setTotalCount(0);
        setError(`No se encontró correo con UUID o nombre: ${uuid}`);
      }
    } catch (err: any) {
      setReportes([]);
      setTotalCount(0);
      setFiltroActivo(false);
      
      console.error("Error en búsqueda:", err);
      
      // Manejar error 404 específico
      if (err?.response?.status === 404) {
        setError(`No se encontró correo con UUID o nombre: ${uuid}`);
      } else {
        setError(`Error buscando: ${err.message || "Error desconocido"}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Toggle empresa seleccionada
  const toggleEmpresa = (empresaId: number) => {
    setEmpresasSeleccionadas(prev => 
      prev.includes(empresaId) 
        ? prev.filter(id => id !== empresaId)
        : [...prev, empresaId]
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <div>
            <h1>Reporte de Correos</h1>
            <p className={styles.subtitle}>Historial de exámenes enviados a trabajadores</p>
          </div>
          <div className={styles.headerButtons}>
            <button className={styles.backButton} onClick={() => navigate('/examenes')}>
              ← Volver a Exámenes
            </button>
            <button className={styles.excelButton} onClick={handleOpenExcelModal}>
              📊 Generar Excel
            </button>
          </div>
        </div>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {/* Buscador */}
      <div className={styles.searchContainer}>
        <input
          type="text"
          placeholder="🔍 Buscar por UUID o nombre del trabajador..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyPress={handleKeyPress}
          className={styles.searchInput}
        />
        <button
          className={styles.searchButton}
          onClick={handleEjecutarBusqueda}
          title="Buscar"
        >
          🔍 Buscar
        </button>
        {searchTerm && (
          <button
            className={styles.clearButton}
            onClick={() => {
              setSearchTerm("");
              loadReportes(1);
            }}
            title="Limpiar búsqueda"
          >
            ✕
          </button>
        )}
      </div>

      {/* Filtro por Colaborador */}
      <div className={styles.filterContainer}>
        <div className={styles.filterContent}>
          <div className={styles.filterGroup}>
            <label htmlFor="colaborador">Filtrar por Colaborador:</label>
            {loadingColaboradores ? (
              <p className={styles.loadingText}>Cargando colaboradores...</p>
            ) : (
              <>
                <select
                  id="colaborador"
                  value={colaboradorSeleccionado !== null ? String(colaboradorSeleccionado) : ""}
                  onChange={(e) => setColaboradorSeleccionado(e.target.value !== "" ? Number(e.target.value) : null)}
                  className={styles.filterSelect}
                >
                  <option value="">-- Selecciona un colaborador --</option>
                  {colaboradores.map((colab) => (
                    <option key={colab.id} value={colab.id}>
                      {colab.nombre}
                    </option>
                  ))}
                </select>
                <div className={styles.filterButtons}>
                  <button
                    className={styles.filterButton}
                    onClick={handleFiltrarPorColaborador}
                    disabled={colaboradorSeleccionado === null}
                  >
                    🔎 Aplicar Filtro
                  </button>
                  {filtroActivo && (
                    <button
                      className={styles.clearFilterButton}
                      onClick={handleLimpiarFiltro}
                    >
                      ✕ Limpiar Filtro
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {loading && !reportes.length ? (
        <div className={styles.loadingContainer}>Cargando reportes...</div>
      ) : (
        <div className={styles.content}>
          {!reportes || reportes.length === 0 ? (
            <div className={styles.emptyState}>
              <p>No hay reportes disponibles</p>
            </div>
          ) : (
            <>
              <div className={styles.tableContainer}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Enviado por</th>
                      <th>Fecha Envío</th>
                      <th className={styles.workerNameHeader}>Trabajador</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedReportes.map((reporte) => {
                      console.log('Reporte:', reporte.id, 'enviado_correctamente:', reporte.enviado_correctamente);
                      return (
                      <tr key={reporte.id}>
                        <td>{reporte.enviado_por_nombre}</td>
                        <td>{new Date(reporte.fecha_envio).toLocaleString("es-CO")}</td>
                        <td className={styles.workerNameCell}>
                          {reporte.trabajadores_ids && reporte.trabajadores_ids.length > 0
                            ? reporte.trabajadores_ids.length === 1
                              ? reporte.trabajadores_ids[0].nombre_trabajador
                              : `${reporte.trabajadores_ids.length} trabajadores`
                            : "Sin datos"}
                        </td>
                        <td>
                          <span className={`${styles.badge} ${reporte.estado_nombre === "Completado" ? styles.success : styles.pending}`}>
                            {reporte.estado_nombre === "Completado" ? "Completado" : "No Completado"}
                          </span>
                        </td>
                        <td>
                          <div className={styles.actionsCell}>
                            <button
                              className={styles.detailButton}
                              onClick={() => goToWorkers(reporte.id)}
                            >
                              Ver Trabajadores
                            </button>
                            {reporte.estado_nombre !== "Completado" && (
                              <button
                                className={styles.changeStateButton}
                                onClick={() => handleCambiarEstado(reporte.id, reporte)}
                                disabled={completingId === reporte.id || !reporte.trabajadores_ids?.length}
                                title="Marcar todos los trabajadores de este correo como completados"
                              >
                                {completingId === reporte.id ? "Procesando..." : "✅ Marcar Completado"}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className={styles.pagination}>
                    <button
                      onClick={() => handlePaginar(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                    >
                      ← Anterior
                    </button>
                    <span>
                      Página {currentPage} de {totalPages} ({totalCount} resultados)
                    </span>
                    <button
                      onClick={() => handlePaginar(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Siguiente →
                    </button>
                  </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Modal Generar Excel */}
      {showExcelModal && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <button className={styles.closeButton} onClick={() => setShowExcelModal(false)}>
              ✕
            </button>
            <h2>Generar Reporte Excel</h2>

            {excelError && (
              <div className={styles.error} style={{ marginBottom: 16 }}>
                {excelError}
              </div>
            )}

            <div className={styles.excelForm}>
              <div className={styles.formGroup}>
                <label htmlFor="fechaInicio">Fecha de Inicio:</label>
                <input
                  type="date"
                  id="fechaInicio"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                  className={styles.dateInput}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="fechaFin">Fecha de Fin:</label>
                <input
                  type="date"
                  id="fechaFin"
                  value={fechaFin}
                  onChange={(e) => setFechaFin(e.target.value)}
                  className={styles.dateInput}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Seleccionar Empresas:</label>
                {loadingEmpresas ? (
                  <p>Cargando empresas...</p>
                ) : (
                  <div className={styles.empresasList}>
                    {empresas.map((empresa) => (
                      <label key={empresa.id} className={styles.empresaCheckbox}>
                        <input
                          type="checkbox"
                          checked={empresasSeleccionadas.includes(empresa.id)}
                          onChange={() => toggleEmpresa(empresa.id)}
                        />
                        <span>{empresa.nombre}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <div className={styles.formActions}>
                <button
                  className={styles.cancelButton}
                  onClick={() => setShowExcelModal(false)}
                  disabled={generatingExcel}
                >
                  Cancelar
                </button>
                <button
                  className={styles.generateButton}
                  onClick={handleGenerarExcel}
                  disabled={generatingExcel || !fechaInicio || !fechaFin || empresasSeleccionadas.length === 0}
                >
                  {generatingExcel ? "Generando..." : "Generar Excel"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}


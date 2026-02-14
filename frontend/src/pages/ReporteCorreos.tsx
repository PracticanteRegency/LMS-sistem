import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Styles/ReporteCorreos.module.css";
import ExamenesService from "../services/Examenes";

interface ReporteCorreoItem {
  id: number;
  uuid_correo?: string;
  correos_destino: string;
  enviado_por_nombre: string;
  fecha_envio: string;
  enviado_correctamente: boolean;
}

interface DetalleCorreo {
  id: number;
  uuid_correo?: string;
  asunto?: string;
  correo_destino?: string;
  fecha_envio?: string;
  total_trabajadores?: number;
  cuerpo_correo?: string;
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
  const [selectedReporte, setSelectedReporte] = useState<DetalleCorreo | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
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

  const loadDetalleCorreo = async (correoId: number) => {
    try {
      setDetailLoading(true);
      const data = await ExamenesService.ObtenerDetalleCorreo(correoId);
      const mapped: DetalleCorreo = {
        id: (data as any)?.correo_id ?? correoId,
        uuid_correo: (data as any)?.uuid_correo,
        asunto: (data as any)?.asunto,
        correo_destino: (data as any)?.correos_destino || (data as any)?.correo_destino,
        fecha_envio: (data as any)?.fecha_envio,
        total_trabajadores: (data as any)?.total_trabajadores ?? (data as any)?.count,
        cuerpo_correo: (data as any)?.cuerpo_correo,
      };
      setSelectedReporte(mapped);
      setShowDetailModal(true);
    } catch (err: any) {
      setError(err.message || "Error cargando detalle");
      console.error("Error:", err);
    } finally {
      setDetailLoading(false);
    }
  };

  const goToWorkersPage = (correoId: number) => {
    navigate(`/reportes-correos/${correoId}/trabajadores`);
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

  // Limpiar filtro
  const handleLimpiarFiltro = () => {
    setColaboradorSeleccionado(null);
    setFiltroActivo(false);
    loadReportes(1);
  };

  // Buscar por UUID
  const handleBuscarPorUUID = async (uuid: string) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log("Buscando correo por UUID:", uuid);
      
      // Llamar al servicio directamente con el UUID
      // El servicio enviará: GET /examenes/filtrar-examenes/?uuid=<uuid>
      const data = await ExamenesService.FiltrarExamenesPorUUID(uuid);
      
      console.log("Respuesta del backend:", data);
      
      if (data.found && data.correo) {
        // Mostrar el correo encontrado
        setReportes([data.correo]);
        setTotalCount(1);
        setError(null);
      } else if (data.correo) {
        // Si solo viene correo sin "found"
        setReportes([data.correo]);
        setTotalCount(1);
        setError(null);
      } else {
        setReportes([]);
        setTotalCount(0);
        setError(`No se encontró correo con UUID: ${uuid}`);
      }
    } catch (err: any) {
      setReportes([]);
      setTotalCount(0);
      
      console.error("Error en búsqueda por UUID:", err);
      
      // Manejar error 404 específico
      if (err?.response?.status === 404) {
        setError(`No se encontró correo con UUID: ${uuid}`);
      } else {
        setError(`Error buscando UUID: ${err.message || "Error desconocido"}`);
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
          placeholder="🔍 Buscar por correo destino o UUID..."
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
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedReportes.map((reporte) => (
                      <tr key={reporte.id}>
                        <td>{reporte.enviado_por_nombre}</td>
                        <td>{new Date(reporte.fecha_envio).toLocaleString("es-CO")}</td>
                        <td>
                          <span className={`${styles.badge} ${reporte.enviado_correctamente ? styles.success : styles.pending}`}>
                            {reporte.enviado_correctamente ? "Enviado" : "Pendiente"}
                          </span>
                        </td>
                        <td>
                          <div className={styles.actionsCell}>
                            <button
                              className={styles.detailButton}
                              onClick={() => loadDetalleCorreo(reporte.id)}
                              disabled={detailLoading}
                            >
                              Ver Detalle
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className={styles.pagination}>
                    <button
                      onClick={() => loadReportes(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                    >
                      ← Anterior
                    </button>
                    <span>
                      Página {currentPage} de {totalPages} ({totalCount} resultados)
                    </span>
                    <button
                      onClick={() => loadReportes(Math.min(totalPages, currentPage + 1))}
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

      {/* Modal Detalle */}
      {showDetailModal && selectedReporte && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <button className={styles.closeButton} onClick={() => setShowDetailModal(false)}>
              ✕
            </button>
            <h2>Detalle del Correo</h2>

            <div className={styles.detailActions}>
              <button
                className={styles.workerButton}
                onClick={() => goToWorkersPage(selectedReporte.id)}
              >
                Ver trabajadores enviados
              </button>
            </div>

            <div className={styles.detailGrid}>
              {selectedReporte.uuid_correo && (
                <div className={styles.detailItem}>
                  <strong>UUID:</strong>
                  <p className={styles.uuidText}>{selectedReporte.uuid_correo}</p>
                </div>
              )}
              {selectedReporte.asunto && (
                <div className={styles.detailItem}>
                  <strong>Asunto:</strong>
                  <p>{selectedReporte.asunto}</p>
                </div>
              )}
              {selectedReporte.correo_destino && (
                <div className={styles.detailItem}>
                  <strong>Correos destino:</strong>
                  <p>{selectedReporte.correo_destino}</p>
                </div>
              )}
              {selectedReporte.fecha_envio && (
                <div className={styles.detailItem}>
                  <strong>Fecha de Envío:</strong>
                  <p>{new Date(selectedReporte.fecha_envio).toLocaleString("es-CO")}</p>
                </div>
              )}
              {selectedReporte.total_trabajadores !== undefined && (
                <div className={styles.detailItem}>
                  <strong>Total trabajadores:</strong>
                  <p>{selectedReporte.total_trabajadores}</p>
                </div>
              )}
            </div>

            {selectedReporte.cuerpo_correo && (
              <div className={styles.detailSection}>
                <strong>Cuerpo del Correo:</strong>
                <pre className={styles.emailBody}>{selectedReporte.cuerpo_correo}</pre>
              </div>
            )}
          </div>
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


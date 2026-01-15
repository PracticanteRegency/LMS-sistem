import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Styles/Examenes.module.css";
import ExamenesService from "../services/Examenes";

interface Examen {
  id: number;
  nombre: string;
}

type TipoExamen = "INGRESO" | "PERIODICO" | "RETIRO";

type ExamenesPorTipo = Partial<Record<TipoExamen, Examen[]>>;

interface Cargo {
  id: number;
  nombre: string;
  examenes_por_tipo?: ExamenesPorTipo;
}

interface Empresa {
  id: number;
  nombre: string;
  cargos: Cargo[];
}

interface CentroEstructura {
  id: number;
  nombre: string;
}

interface ProyectoEstructura {
  id: number;
  nombre: string;
  centros: CentroEstructura[];
}

interface UnidadEstructura {
  id: number;
  nombre: string;
  proyectos: ProyectoEstructura[];
}

interface EmpresaEstructura {
  id: number;
  nombre: string;
  unidades: UnidadEstructura[];
}

export default function Examenes() {
  const navigate = useNavigate();
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [examenesCatalog, setExamenesCatalog] = useState<Examen[]>([]);
  const [estructura, setEstructura] = useState<EmpresaEstructura[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEmpresa, setSelectedEmpresa] = useState<number | null>(null);
  const [selectedCargo, setSelectedCargo] = useState<number | null>(null);
  const [selectedTipoExamen, setSelectedTipoExamen] = useState<TipoExamen | "">("");
  const [examenesSeleccionados, setExamenesSeleccionados] = useState<Examen[]>([]);
  const [formData, setFormData] = useState({
    nombre_trabajador: "",
    documento_trabajador: "",
    ciudad: "",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [sending, setSending] = useState(false);
  const [selectedUnidad, setSelectedUnidad] = useState<number | null>(null);
  const [selectedProyecto, setSelectedProyecto] = useState<number | null>(null);
  const [selectedCentro, setSelectedCentro] = useState<number | null>(null);
  
  // Estados para envío masivo
  const [showMasivoModal, setShowMasivoModal] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [sendingMasivo, setSendingMasivo] = useState(false);
  const [masivoError, setMasivoError] = useState<string | null>(null);
  const [masivoResult, setMasivoResult] = useState<any>(null);

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  // Update exámenes cuando se selecciona empresa o cargo
  useEffect(() => {
    if (selectedEmpresa && selectedCargo && selectedTipoExamen) {
      const empresa = empresas.find((e) => e.id === selectedEmpresa);
      const cargo = empresa?.cargos.find((c) => c.id === selectedCargo);
      const examenes = cargo?.examenes_por_tipo?.[selectedTipoExamen] || [];
      setExamenesSeleccionados(examenes);
    } else {
      setExamenesSeleccionados([]);
    }
  }, [selectedEmpresa, selectedCargo, selectedTipoExamen, empresas]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await ExamenesService.CargoEmpresaConExamenes();
      setEmpresas(data.empresas);
      // Mapear estructura a los tipos esperados por el frontend
      if (Array.isArray(data.estructura)) {
        const estructuraMapeada: EmpresaEstructura[] = data.estructura.map((empresa: any) => ({
          id: empresa.idempresa,
          nombre: empresa.empresa,
          unidades: (empresa.unidades || []).map((unidad: any) => ({
            id: unidad.idunidad,
            nombre: unidad.unidad,
            proyectos: (unidad.proyectos || []).map((proyecto: any) => ({
              id: proyecto.idproyecto,
              nombre: proyecto.proyecto,
              centros: (proyecto.centrosop || []).map((centro: any) => ({
                id: centro.idcentrop,
                nombre: centro.centro_op,
              })),
            })),
          })),
        }));
        setEstructura(estructuraMapeada);
      } else {
        setEstructura([]);
      }
      if (Array.isArray(data.examenes)) {
        const catalog = data.examenes.map((ex: any) => ({
          id: ex.id_examen ?? ex.id,
          nombre: ex.nombre,
        }));
        setExamenesCatalog(catalog);
      }
    } catch (err: any) {
      setError(err.message || "Error cargando datos");
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedEmpresa || !selectedCargo) {
      setError("Selecciona empresa y cargo");
      return;
    }

    if (!selectedTipoExamen) {
      setError("Selecciona el tipo de examen");
      return;
    }


    if (!formData.nombre_trabajador || !formData.documento_trabajador) {
      setError("Completa todos los campos del formulario");
      return;
    }

    if (!selectedCentro) {
      setError("Selecciona el centro operativo del proyecto");
      return;
    }

    if (examenesSeleccionados.length === 0) {
      setError("Selecciona al menos un examen");
      return;
    }


    try {
      setSending(true);
      setError(null);

      const payload = {
        nombre_trabajador: formData.nombre_trabajador,
        documento_trabajador: formData.documento_trabajador,
        ciudad: formData.ciudad,
        cargo_id: selectedCargo,
        centro_id: selectedCentro,
        tipo_examen: selectedTipoExamen,
        examenes_ids: examenesSeleccionados.map((ex) => ex.id),
      };

      await ExamenesService.EnviarCorreo(payload);

      // Reset form
      setFormData({
        nombre_trabajador: "",
        documento_trabajador: "",
        ciudad: "",
      });
      setSelectedEmpresa(null);
      setSelectedCargo(null);
      setExamenesSeleccionados([]);
      setSelectedTipoExamen("");
      setSelectedUnidad(null);
      setSelectedProyecto(null);
      setSelectedCentro(null);

      alert("Correo enviado exitosamente");
    } catch (err: any) {
      setError(err.message || "Error enviando correo");
      console.error("Error:", err);
    } finally {
      setSending(false);
    }
  };

  const cargosDisponibles = selectedEmpresa
    ? empresas.find((e) => e.id === selectedEmpresa)?.cargos || []
    : [];

  const unidadesDisponibles = selectedEmpresa
    ? estructura.find((e) => e.id === selectedEmpresa)?.unidades || []
    : [];

  const proyectosDisponibles = selectedUnidad
    ? unidadesDisponibles.find((u) => u.id === selectedUnidad)?.proyectos || []
    : [];

  const centrosDisponibles = selectedProyecto
    ? proyectosDisponibles.find((p) => p.id === selectedProyecto)?.centros || []
    : [];

  const handleOpenMasivoModal = () => {
    setCsvFile(null);
    setMasivoError(null);
    setMasivoResult(null);
    setShowMasivoModal(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.csv')) {
        setMasivoError("El archivo debe ser formato CSV");
        setCsvFile(null);
        return;
      }
      setCsvFile(file);
      setMasivoError(null);
    }
  };

  const handleRemoveExamen = (examenId: number) => {
    setExamenesSeleccionados((prev) => prev.filter((ex) => ex.id !== examenId));
  };

  const handleAddExamen = (examen: Examen) => {
    setExamenesSeleccionados((prev) => {
      const exists = prev.some((ex) => ex.id === examen.id);
      if (exists) return prev;
      return [...prev, examen];
    });
  };

  const filteredCatalog = examenesCatalog
    .filter((ex) => ex.nombre.toLowerCase().includes(searchTerm.toLowerCase()))
    .filter((ex) => !examenesSeleccionados.some((sel) => sel.id === ex.id));

  const handleEnviarMasivo = async () => {
    if (!csvFile) {
      setMasivoError("Selecciona un archivo CSV");
      return;
    }

    try {
      setSendingMasivo(true);
      setMasivoError(null);
      setMasivoResult(null);

      const result = await ExamenesService.EnviarCorreoMasivo(csvFile);
      setMasivoResult(result);
      setCsvFile(null);
      
      if (result.enviados > 0) {
        alert(`Envío masivo completado: ${result.enviados} correos enviados`);
      }
    } catch (err: any) {
      const backendData = err?.response?.data;
      if (backendData) {
        if (typeof backendData === "string") {
          setMasivoError(backendData);
        } else if (Array.isArray(backendData)) {
          setMasivoError(backendData.join("\n"));
        } else if (typeof backendData === "object") {
          const messages: string[] = [];
          for (const [key, value] of Object.entries(backendData)) {
            if (Array.isArray(value)) {
              messages.push(`${key}: ${value.join(", ")}`);
            } else if (typeof value === "string") {
              messages.push(`${key}: ${value}`);
            } else {
              messages.push(`${key}: ${JSON.stringify(value)}`);
            }
          }
          setMasivoError(messages.join("\n"));
        } else {
          setMasivoError("Error en envío masivo");
        }
      } else {
        setMasivoError(err.message || "Error en envío masivo");
      }
      console.error("Error:", err);
    } finally {
      setSendingMasivo(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <div>
            <h1>Enviar Exámenes</h1>
            <p className={styles.subtitle}>Envía exámenes a trabajadores por correo</p>
          </div>
          <div className={styles.headerButtons}>
            <button className={styles.masivoButton} onClick={handleOpenMasivoModal}>
              📤 Envío Masivo (CSV)
            </button>
            <button className={styles.reportButton} onClick={() => navigate("/reportes-correos")}>
              📊 Ver Reportes
            </button>
          </div>
        </div>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {loading ? (
        <div className={styles.loadingContainer}>Cargando...</div>
      ) : (
        <div className={styles.formSection}>
          <div className={styles.formGroup}>
            <label>Empresa</label>
            <select
              value={selectedEmpresa || ""}
              onChange={(e) => {
                setSelectedEmpresa(Number(e.target.value) || null);
                setSelectedCargo(null);
                setSelectedTipoExamen("");
                setSelectedUnidad(null);
                setSelectedProyecto(null);
                setSelectedCentro(null);
              }}
              disabled={sending}
            >
              <option value="">Selecciona una empresa</option>
              {empresas.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>Unidad</label>
            <select
              value={selectedUnidad || ""}
              onChange={(e) => {
                const unidadId = Number(e.target.value) || null;
                setSelectedUnidad(unidadId);
                setSelectedProyecto(null);
                setSelectedCentro(null);
              }}
              disabled={!selectedEmpresa || unidadesDisponibles.length === 0 || sending}
            >
              <option value="">Selecciona una unidad</option>
              {unidadesDisponibles.map((unidad) => (
                <option key={unidad.id} value={unidad.id}>
                  {unidad.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>Proyecto</label>
            <select
              value={selectedProyecto || ""}
              onChange={(e) => {
                const proyectoId = Number(e.target.value) || null;
                setSelectedProyecto(proyectoId);
                setSelectedCentro(null);
              }}
              disabled={!selectedUnidad || proyectosDisponibles.length === 0 || sending}
            >
              <option value="">Selecciona un proyecto</option>
              {proyectosDisponibles.map((proyecto) => (
                <option key={proyecto.id} value={proyecto.id}>
                  {proyecto.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>Centro Operativo</label>
            <select
              value={selectedCentro || ""}
              onChange={(e) => setSelectedCentro(Number(e.target.value) || null)}
              disabled={!selectedProyecto || centrosDisponibles.length === 0 || sending}
            >
              <option value="">Selecciona un centro operativo</option>
              {centrosDisponibles.map((centro) => (
                <option key={centro.id} value={centro.id}>
                  {centro.nombre}
                </option>
              ))}
            </select>
            {!selectedProyecto && selectedEmpresa && unidadesDisponibles.length > 0 && (
              <p className={styles.smallNote}>Selecciona primero una unidad y un proyecto.</p>
            )}
          </div>

          <div className={styles.formGroup}>
            <label>Cargo</label>
            <select
              value={selectedCargo || ""}
              onChange={(e) => {
                setSelectedCargo(Number(e.target.value) || null);
                setSelectedTipoExamen("");
              }}
              disabled={!selectedEmpresa || sending}
            >
              <option value="">Selecciona un cargo</option>
              {cargosDisponibles.map((cargo) => (
                <option key={cargo.id} value={cargo.id}>
                  {cargo.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>Tipo de Examen</label>
            <select
              value={selectedTipoExamen}
              onChange={(e) => setSelectedTipoExamen((e.target.value as any) || "")}
              disabled={!selectedCargo || sending}
            >
              <option value="">Selecciona un tipo</option>
                <option value="INGRESO">INGRESO</option>
                <option value="PERIODICO">PERIÓDICO</option>
                <option value="RETIRO">RETIRO</option>
                <option value="ESPECIAL">ESPECIAL</option>
                <option value="POST_INCAPACIDAD">POST INCAPACIDAD</option>
            </select>
          </div>

          {examenesSeleccionados.length > 0 && (
            <div className={styles.previewSection}>
              <h3>Exámenes a Enviar ({examenesSeleccionados.length})</h3>
              <ul className={styles.examenList}>
                {examenesSeleccionados.map((exam) => (
                  <li key={exam.id}>
                    ✓ {exam.nombre}
                    <button
                      type="button"
                      className={styles.removeButton}
                      onClick={() => handleRemoveExamen(exam.id)}
                    >
                      Quitar
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className={styles.searchPanel}>
            <div className={styles.searchHeader}>
              <h3>Agregar exámenes manualmente</h3>
              <p className={styles.smallNote}>Puedes quitar los sugeridos y añadir otros exámenes por búsqueda.</p>
            </div>
            <input
              type="text"
              placeholder="Buscar examen por nombre"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={sending}
              className={styles.searchInput}
            />
            <div className={styles.searchResults}>
              {filteredCatalog.slice(0, 8).map((exam) => (
                <button
                  key={exam.id}
                  type="button"
                  className={styles.addButton}
                  onClick={() => handleAddExamen(exam)}
                  disabled={sending}
                >
                  ➕ {exam.nombre}
                </button>
              ))}
              {filteredCatalog.length === 0 && (
                <p className={styles.smallNote}>No hay resultados o ya fueron agregados.</p>
              )}
            </div>
          </div>


          <form onSubmit={handleSendEmail} className={styles.emailForm}>
            <div className={styles.formGroup}>
              <label>Nombre del Trabajador</label>
              <input
                type="text"
                placeholder="Ej: Juan Pérez Gómez"
                value={formData.nombre_trabajador}
                onChange={(e) => setFormData({ ...formData, nombre_trabajador: e.target.value })}
                disabled={sending}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label>Número de Documento</label>
              <input
                type="text"
                placeholder="Ej: 1234567890"
                value={formData.documento_trabajador}
                onChange={(e) => setFormData({ ...formData, documento_trabajador: e.target.value })}
                disabled={sending}
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label>Ciudad</label>
              <input
                type="text"
                placeholder="Ej: Bogota"
                value={formData.ciudad}
                onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })}
                disabled={sending}
              />
            </div>

            {/* Correo destino oculto: el backend se encarga de los destinatarios */}



            <button
              type="submit"
              className={styles.submitButton}
              disabled={sending || !selectedCargo || !selectedTipoExamen || examenesSeleccionados.length === 0}
            >
              {sending ? "Enviando..." : "Enviar Exámenes por Correo"}
            </button>
          </form>
        </div>
      )}

      {/* Modal Envío Masivo */}
      {showMasivoModal && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <button className={styles.closeButton} onClick={() => setShowMasivoModal(false)}>
              ✕
            </button>
            <h2>Envío Masivo de Exámenes</h2>

            {masivoError && (
              <div className={styles.error} style={{ marginBottom: 16 }}>
                {masivoError}
              </div>
            )}

            {masivoResult && (
              <div className={styles.resultSection}>
                <h3>Resultado del Envío</h3>
                <div className={styles.resultStats}>
                  <div className={styles.stat}>
                    <span className={styles.statLabel}>Enviados:</span>
                    <span className={styles.statValue}>{masivoResult.enviados || 0}</span>
                  </div>
                  <div className={styles.stat}>
                    <span className={styles.statLabel}>Errores:</span>
                    <span className={styles.statValue}>{masivoResult.errores?.length || 0}</span>
                  </div>
                </div>

                {masivoResult.errores && masivoResult.errores.length > 0 && (
                  <div className={styles.errorList}>
                    <h4>Detalles de Errores:</h4>
                    <ul>
                      {masivoResult.errores.map((error: any, idx: number) => (
                        <li key={idx}>
                          <strong>Fila {error.fila || idx + 1}:</strong> {error.error || error.mensaje}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <div className={styles.masivoForm}>
              <div className={styles.formGroup}>
                <label>Seleccionar Archivo CSV:</label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  disabled={sendingMasivo}
                  className={styles.fileInput}
                />
                {csvFile && (
                  <p className={styles.fileName}>📄 {csvFile.name}</p>
                )}
              </div>

              <div className={styles.formInfo}>
                <p><strong>Formato requerido del CSV:</strong></p>
                <p>• Archivo delimitado por comas (,)</p>
                <p>• Los tipos se examenes son: INGRESO", "PERIODICO", "RETIRO", "ESPECIAL", "POST_INCAPACIDAD"</p>
                <p>• Debe contener las columnas necesarias según lo definido por el backend</p>
                <p>• Codificación recomendada: UTF-8</p>
              </div>

              <div className={styles.formActions}>
                
                <a
                  href="/templates/cargar_examanes.csv"
                  download
                  className={styles.downloadButton}
                  style={{ marginRight: 12 }}
                >
                  📥 Descargar Formato Ejemplo (CSV)
                </a>
                
                <button
                  className={styles.cancelButton}
                  onClick={() => setShowMasivoModal(false)}
                  disabled={sendingMasivo}
                >
                  Cancelar
                </button>
                <button
                  className={styles.sendButton}
                  onClick={handleEnviarMasivo}
                  disabled={sendingMasivo || !csvFile}
                >
                  {sendingMasivo ? "Enviando..." : "Enviar Correos"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

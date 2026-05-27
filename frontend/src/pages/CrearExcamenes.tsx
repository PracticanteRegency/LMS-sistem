import React, { useEffect, useState } from 'react';
import ExamenesService from '../services/Examenes';
import styles from './Styles/CrearExamenes.module.css';

type Empresa = { idempresa: number; nombre_empresa: string };
type Cargo = { idcargo: number; nombrecargo: string };
type ExamenDisponible = { id_examen: number; nombre: string };
type AsignacionExamen = { id_asignacion: number; id_examen: number; nombre_examen: string };

const TIPOS_EXAMEN = [
  { value: "INGRESO", label: "Examen de Ingreso" },
  { value: "PERIODICO", label: "Examen Periódico" },
  { value: "RETIRO", label: "Examen de Retiro" },
  { value: "ESPECIAL", label: "Examen Especial" },
  { value: "POST_INCAPACIDAD", label: "Examen Post-Incapacidad" },
  { value: "ALTURAS", label: "Examen con énfasis en alturas"}
];

const CrearExamenes: React.FC = () => {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [nombre, setNombre] = useState('');
  const [empresasSeleccionadas, setEmpresasSeleccionadas] = useState<Empresa[]>([]);
  const [cargosSeleccionados, setCargosSeleccionados] = useState<Cargo[]>([]);
  const [empresaSearch, setEmpresaSearch] = useState("");
  const [cargoSearch, setCargoSearch] = useState("");
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [tiposSeleccionados, setTiposSeleccionados] = useState<string[]>([]);
  const [tipoSearch, setTipoSearch] = useState("");

  // Estados para editar asignaciones
  const [activeTab, setActiveTab] = useState<'crear' | 'editar'>('crear');
  const [editEmpresaId, setEditEmpresaId] = useState<number | null>(null);
  const [editCargoId, setEditCargoId] = useState<number | null>(null);
  const [editTipo, setEditTipo] = useState<string>('');
  const [asignaciones, setAsignaciones] = useState<Record<string, AsignacionExamen[]>>({});
  const [todosExamenes, setTodosExamenes] = useState<ExamenDisponible[]>([]);
  const [editLoading, setEditLoading] = useState(false);
  const [editMensaje, setEditMensaje] = useState('');
  const [editError, setEditError] = useState('');
  const [addExamenSearch, setAddExamenSearch] = useState('');
  const [editEmpresaSearch, setEditEmpresaSearch] = useState('');
  const [editCargoSearch, setEditCargoSearch] = useState('');

  // Estados para cambios pendientes
  const [examenesAEliminar, setExamenesAEliminar] = useState<Set<number>>(new Set());
  const [examenesAGregar, setExamenesAGregar] = useState<Set<number>>(new Set());

  useEffect(() => {
    ExamenesService.EmpresaCargo().then((data: { empresas: Empresa[]; cargos: Cargo[] }) => {
      setEmpresas(data.empresas || []);
      setCargos(data.cargos || []);
    });
  }, []);

  const handleCrearExamen = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensaje("");
    setError("");
    if (!nombre || empresasSeleccionadas.length === 0 || cargosSeleccionados.length === 0 || tiposSeleccionados.length === 0) {
      setError("Debes ingresar un nombre, seleccionar al menos una empresa, un cargo y al menos un tipo de examen.");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        nombre,
        empresas_ids: empresasSeleccionadas.map(e => e.idempresa),
        cargos_ids: cargosSeleccionados.map(c => c.idcargo),
        tipos: tiposSeleccionados,
      };
      await ExamenesService.crearExamen(payload);
      setMensaje("Examen creado correctamente.");
      setNombre("");
      setEmpresasSeleccionadas([]);
      setCargosSeleccionados([]);
      setTiposSeleccionados([]);
    } catch (err: any) {
      setError(err?.response?.data?.error || "Error al crear el examen.");
    } finally {
      setLoading(false);
    }
  };

  // --- Funciones para editar asignaciones ---
  const cargarAsignaciones = async () => {
    if (!editEmpresaId || !editCargoId) return;
    setEditLoading(true);
    setEditError('');
    setEditMensaje('');
    try {
      const data = await ExamenesService.ObtenerExamenesCargo(editEmpresaId, editCargoId);
      setAsignaciones(data.asignaciones_por_tipo || {});
      setTodosExamenes(data.todos_examenes || []);
    } catch (err: any) {
      setEditError(err?.response?.data?.error || "Error al cargar asignaciones.");
    } finally {
      setEditLoading(false);
    }
  };

  useEffect(() => {
    if (editEmpresaId && editCargoId && activeTab === 'editar') {
      cargarAsignaciones();
      setEditTipo('');
      // Limpiar cambios pendientes cuando se cambia de cargo
      setExamenesAEliminar(new Set());
      setExamenesAGregar(new Set());
    }
  }, [editEmpresaId, editCargoId, activeTab]);

  const handleAgregarExamen = (examenId: number) => {
    // Agregar a la lista de cambios pendientes
    setExamenesAGregar(prev => {
      const newSet = new Set(prev);
      newSet.add(examenId);
      return newSet;
    });
    // Si estaba marcado para eliminar, removerlo
    setExamenesAEliminar(prev => {
      const newSet = new Set(prev);
      newSet.delete(examenId);
      return newSet;
    });
  };

  const handleEliminarExamen = (examenId: number) => {
    // Agregar a la lista de cambios pendientes
    setExamenesAEliminar(prev => {
      const newSet = new Set(prev);
      newSet.add(examenId);
      return newSet;
    });
    // Si estaba marcado para agregar, removerlo
    setExamenesAGregar(prev => {
      const newSet = new Set(prev);
      newSet.delete(examenId);
      return newSet;
    });
  };

  const handleAplicarCambios = async () => {
    if (!editEmpresaId || !editCargoId || !editTipo) return;
    if (examenesAEliminar.size === 0 && examenesAGregar.size === 0) {
      setEditMensaje('No hay cambios pendientes para aplicar.');
      return;
    }

    setEditLoading(true);
    setEditError('');
    setEditMensaje('');

    try {
      // Primero eliminar
      if (examenesAEliminar.size > 0) {
        await ExamenesService.EliminarExamenesCargo({
          empresa_id: editEmpresaId,
          cargo_id: editCargoId,
          tipo: editTipo,
          examenes_ids: Array.from(examenesAEliminar),
        });
      }

      // Luego agregar
      if (examenesAGregar.size > 0) {
        await ExamenesService.AgregarExamenesCargo({
          empresa_id: editEmpresaId,
          cargo_id: editCargoId,
          tipo: editTipo,
          examenes_ids: Array.from(examenesAGregar),
        });
      }

      // Limpiar cambios pendientes
      setExamenesAEliminar(new Set());
      setExamenesAGregar(new Set());

      // Recargar asignaciones
      await cargarAsignaciones();
      const eliminados = examenesAEliminar.size;
      const agregados = examenesAGregar.size;
      setEditMensaje(
        `Cambios aplicados correctamente. ${eliminados > 0 ? `${eliminados} eliminados. ` : ''}${agregados > 0 ? `${agregados} agregados.` : ''}`
      );
    } catch (err: any) {
      setEditError(err?.response?.data?.error || "Error al aplicar cambios.");
    } finally {
      setEditLoading(false);
    }
  };

  const handleCancelarCambios = () => {
    setExamenesAEliminar(new Set());
    setExamenesAGregar(new Set());
    setEditMensaje('Cambios cancelados.');
  };

  // Exámenes asignados para el tipo seleccionado
  const examenesAsignadosTipo: AsignacionExamen[] = editTipo ? (asignaciones[editTipo] || []) : [];
  const idsAsignados = new Set(examenesAsignadosTipo.map(a => a.id_examen));
  const examenesDisponiblesParaAgregar = todosExamenes.filter(
    e => !idsAsignados.has(e.id_examen) && e.nombre.toLowerCase().includes(addExamenSearch.toLowerCase())
  );

  const empresaNombreSeleccionada = empresas.find(e => e.idempresa === editEmpresaId)?.nombre_empresa || '';
  const cargoNombreSeleccionado = cargos.find(c => c.idcargo === editCargoId)?.nombrecargo || '';

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        {/* TABS */}
        <div className={styles.tabContainer}>
          <button
            className={`${styles.tab} ${activeTab === 'crear' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('crear')}
          >
            ➕ Crear Examen
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'editar' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('editar')}
          >
            ✏️ Editar Asignaciones
          </button>
        </div>

        {/* TAB: CREAR EXAMEN */}
        {activeTab === 'crear' && (
          <>
            <h2 className={styles.title}>Crear Examen</h2>
            <form onSubmit={handleCrearExamen} autoComplete="off">
              <div className="mb-3">
                <label className={styles.label}>Nombre del examen</label>
                <input type="text" className={styles.input + ' form-control'} value={nombre} onChange={e => setNombre(e.target.value)} required maxLength={100} />
              </div>
              <div className={styles.searchPanel}>
                <div className={styles.searchHeader}>
                  <h3>Seleccionar Tipos de Examen</h3>
                  <p className={styles.smallNote}>Busca y agrega tipos de examen.</p>
                </div>
                <input
                  type="text"
                  placeholder="Buscar tipo de examen"
                  value={tipoSearch}
                  onChange={e => setTipoSearch(e.target.value)}
                  className={styles.searchInput}
                />
                <div className={styles.searchResults}>
                  {TIPOS_EXAMEN.filter(tipo => tipo.label.toLowerCase().includes(tipoSearch.toLowerCase()) && !tiposSeleccionados.includes(tipo.value)).map(tipo => (
                    <button
                      key={tipo.value}
                      type="button"
                      className={styles.addButton}
                      onClick={() => setTiposSeleccionados([...tiposSeleccionados, tipo.value])}
                    >
                      ➕ {tipo.label}
                    </button>
                  ))}
                  {TIPOS_EXAMEN.filter(tipo => tipo.label.toLowerCase().includes(tipoSearch.toLowerCase()) && !tiposSeleccionados.includes(tipo.value)).length === 0 && (
                    <p className={styles.smallNote}>No hay resultados o ya fueron agregados.</p>
                  )}
                </div>
                {tiposSeleccionados.length > 0 && (
                  <div className={styles.previewSection}>
                    <h4>Tipos seleccionados</h4>
                    <ul className={styles.examenList}>
                      {tiposSeleccionados.map(tipoValue => {
                        const tipo = TIPOS_EXAMEN.find(t => t.value === tipoValue);
                        return (
                          <li key={tipoValue}>
                            ✓ {tipo ? tipo.label : tipoValue}
                            <button
                              type="button"
                              className={styles.removeButton}
                              onClick={() => setTiposSeleccionados(tiposSeleccionados.filter(t => t !== tipoValue))}
                            >
                              Quitar
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </div>
              <div className={styles.searchPanel}>
                <div className={styles.searchHeader}>
                  <h3>Seleccionar Empresas</h3>
                  <p className={styles.smallNote}>Busca y agrega empresas para el examen.</p>
                </div>
                <input
                  type="text"
                  placeholder="Buscar empresa por nombre"
                  value={empresaSearch}
                  onChange={e => setEmpresaSearch(e.target.value)}
                  className={styles.searchInput}
                />
                <div className={styles.searchResults}>
                  {empresas.filter(emp => emp.nombre_empresa.toLowerCase().includes(empresaSearch.toLowerCase()) && !empresasSeleccionadas.some(sel => sel.idempresa === emp.idempresa)).slice(0, 8).map(emp => (
                    <button
                      key={emp.idempresa}
                      type="button"
                      className={styles.addButton}
                      onClick={() => setEmpresasSeleccionadas([...empresasSeleccionadas, emp])}
                    >
                      ➕ {emp.nombre_empresa}
                    </button>
                  ))}
                  {empresas.filter(emp => emp.nombre_empresa.toLowerCase().includes(empresaSearch.toLowerCase()) && !empresasSeleccionadas.some(sel => sel.idempresa === emp.idempresa)).length === 0 && (
                    <p className={styles.smallNote}>No hay resultados o ya fueron agregados.</p>
                  )}
                </div>
                {empresasSeleccionadas.length > 0 && (
                  <div className={styles.previewSection}>
                    <h4>Empresas seleccionadas</h4>
                    <ul className={styles.examenList}>
                      {empresasSeleccionadas.map(emp => (
                        <li key={emp.idempresa}>
                          ✓ {emp.nombre_empresa}
                          <button
                            type="button"
                            className={styles.removeButton}
                            onClick={() => setEmpresasSeleccionadas(empresasSeleccionadas.filter(e => e.idempresa !== emp.idempresa))}
                          >
                            Quitar
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              <div className={styles.searchPanel}>
                <div className={styles.searchHeader}>
                  <h3>Seleccionar Cargos</h3>
                  <p className={styles.smallNote}>Busca y agrega cargos para el examen.</p>
                </div>
                <input
                  type="text"
                  placeholder="Buscar cargo por nombre"
                  value={cargoSearch}
                  onChange={e => setCargoSearch(e.target.value)}
                  className={styles.searchInput}
                />
                <div className={styles.searchResults}>
                  {cargos.filter(cargo => cargo.nombrecargo.toLowerCase().includes(cargoSearch.toLowerCase()) && !cargosSeleccionados.some(sel => sel.idcargo === cargo.idcargo)).slice(0, 8).map(cargo => (
                    <button
                      key={cargo.idcargo}
                      type="button"
                      className={styles.addButton}
                      onClick={() => setCargosSeleccionados([...cargosSeleccionados, cargo])}
                    >
                      ➕ {cargo.nombrecargo}
                    </button>
                  ))}
                  {cargos.filter(cargo => cargo.nombrecargo.toLowerCase().includes(cargoSearch.toLowerCase()) && !cargosSeleccionados.some(sel => sel.idcargo === cargo.idcargo)).length === 0 && (
                    <p className={styles.smallNote}>No hay resultados o ya fueron agregados.</p>
                  )}
                </div>
                {cargosSeleccionados.length > 0 && (
                  <div className={styles.previewSection}>
                    <h4>Cargos seleccionados</h4>
                    <ul className={styles.examenList}>
                      {cargosSeleccionados.map(cargo => (
                        <li key={cargo.idcargo}>
                          ✓ {cargo.nombrecargo}
                          <button
                            type="button"
                            className={styles.removeButton}
                            onClick={() => setCargosSeleccionados(cargosSeleccionados.filter(c => c.idcargo !== cargo.idcargo))}
                          >
                            Quitar
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              <button type="submit" className={styles.button + ' btn btn-primary'} disabled={loading}>
                {loading ? 'Creando...' : 'Crear Examen'}
              </button>
            </form>
            {mensaje && <div className="alert alert-success mt-3 text-center">{mensaje}</div>}
            {error && <div className="alert alert-danger mt-3 text-center">{error}</div>}
          </>
        )}

        {/* TAB: EDITAR ASIGNACIONES */}
        {activeTab === 'editar' && (
          <>
            <h2 className={styles.title}>Editar Asignaciones de Exámenes</h2>
            <p className={styles.smallNote} style={{ textAlign: 'center', marginBottom: 20 }}>
              Selecciona empresa, cargo y tipo para ver y gestionar los exámenes asignados.
            </p>

            {/* Selector de Empresa */}
            <div className={styles.searchPanel}>
              <div className={styles.searchHeader}>
                <h3>1. Seleccionar Empresa</h3>
              </div>
              <input
                type="text"
                placeholder="Buscar empresa..."
                value={editEmpresaSearch}
                onChange={e => setEditEmpresaSearch(e.target.value)}
                className={styles.searchInput}
              />
              {!editEmpresaId && (
                <div className={styles.searchResults}>
                  {empresas
                    .filter(emp => emp.nombre_empresa.toLowerCase().includes(editEmpresaSearch.toLowerCase()))
                    .slice(0, 8)
                    .map(emp => (
                      <button
                        key={emp.idempresa}
                        type="button"
                        className={styles.addButton}
                        onClick={() => { setEditEmpresaId(emp.idempresa); setEditCargoId(null); setEditTipo(''); setAsignaciones({}); }}
                      >
                        {emp.nombre_empresa}
                      </button>
                    ))}
                </div>
              )}
              {editEmpresaId && (
                <div className={styles.previewSection}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>✓ <strong>{empresaNombreSeleccionada}</strong></span>
                    <button type="button" className={styles.removeButton} onClick={() => { setEditEmpresaId(null); setEditCargoId(null); setEditTipo(''); setAsignaciones({}); }}>
                      Cambiar
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Selector de Cargo */}
            {editEmpresaId && (
              <div className={styles.searchPanel}>
                <div className={styles.searchHeader}>
                  <h3>2. Seleccionar Cargo</h3>
                </div>
                <input
                  type="text"
                  placeholder="Buscar cargo..."
                  value={editCargoSearch}
                  onChange={e => setEditCargoSearch(e.target.value)}
                  className={styles.searchInput}
                />
                {!editCargoId && (
                  <div className={styles.searchResults}>
                    {cargos
                      .filter(c => c.nombrecargo.toLowerCase().includes(editCargoSearch.toLowerCase()))
                      .slice(0, 8)
                      .map(c => (
                        <button
                          key={c.idcargo}
                          type="button"
                          className={styles.addButton}
                          onClick={() => { setEditCargoId(c.idcargo); setEditTipo(''); }}
                        >
                          {c.nombrecargo}
                        </button>
                      ))}
                  </div>
                )}
                {editCargoId && (
                  <div className={styles.previewSection}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>✓ <strong>{cargoNombreSeleccionado}</strong></span>
                      <button type="button" className={styles.removeButton} onClick={() => { setEditCargoId(null); setEditTipo(''); setAsignaciones({}); }}>
                        Cambiar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Selector de Tipo */}
            {editEmpresaId && editCargoId && (
              <div className={styles.searchPanel}>
                <div className={styles.searchHeader}>
                  <h3>3. Seleccionar Tipo de Examen</h3>
                </div>
                <div className={styles.tipoButtonGroup}>
                  {TIPOS_EXAMEN.map(tipo => {
                    const count = (asignaciones[tipo.value] || []).length;
                    return (
                      <button
                        key={tipo.value}
                        type="button"
                        className={`${styles.tipoButton} ${editTipo === tipo.value ? styles.tipoButtonActive : ''}`}
                        onClick={() => { 
                          setEditTipo(tipo.value); 
                          setAddExamenSearch(''); 
                          setEditMensaje(''); 
                          setEditError('');
                          // Limpiar cambios pendientes cuando se cambia de tipo
                          setExamenesAEliminar(new Set());
                          setExamenesAGregar(new Set());
                        }}
                      >
                        {tipo.label}
                        {count > 0 && <span className={styles.tipoBadge}>{count}</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Loading */}
            {editLoading && <p style={{ textAlign: 'center', color: '#666' }}>Cargando...</p>}

            {/* Mensajes */}
            {editMensaje && <div className="alert alert-success mt-3 text-center">{editMensaje}</div>}
            {editError && <div className="alert alert-danger mt-3 text-center">{editError}</div>}

            {/* Exámenes asignados y disponibles */}
            {editTipo && editEmpresaId && editCargoId && !editLoading && (
              <div className={styles.editGrid}>
                {/* Columna: Exámenes asignados */}
                <div className={styles.editColumn}>
                  <h3 className={styles.editColumnTitle}>
                    Exámenes Asignados
                    <span className={styles.editColumnCount}>{examenesAsignadosTipo.length}</span>
                  </h3>
                  {examenesAsignadosTipo.length === 0 ? (
                    <p className={styles.smallNote}>No hay exámenes asignados para este tipo.</p>
                  ) : (
                    <ul className={styles.examenList}>
                      {examenesAsignadosTipo.map(asig => (
                        <li key={asig.id_examen} style={{ opacity: examenesAEliminar.has(asig.id_examen) ? 0.5 : 1, textDecoration: examenesAEliminar.has(asig.id_examen) ? 'line-through' : 'none' }}>
                          <span>{asig.nombre_examen}</span>
                          <button
                            type="button"
                            className={styles.removeButton}
                            onClick={() => handleEliminarExamen(asig.id_examen)}
                            disabled={editLoading}
                            style={{ backgroundColor: examenesAEliminar.has(asig.id_examen) ? '#dc3545' : '' }}
                          >
                            {examenesAEliminar.has(asig.id_examen) ? '↩️ Deshacer' : '✕ Quitar'}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Columna: Agregar exámenes */}
                <div className={styles.editColumn}>
                  <h3 className={styles.editColumnTitle}>Agregar Exámenes</h3>
                  <input
                    type="text"
                    placeholder="Buscar examen disponible..."
                    value={addExamenSearch}
                    onChange={e => setAddExamenSearch(e.target.value)}
                    className={styles.searchInput}
                  />
                  <div className={styles.addExamenList}>
                    {examenesDisponiblesParaAgregar.slice(0, 15).map(ex => (
                      <button
                        key={ex.id_examen}
                        type="button"
                        className={styles.addButton}
                        onClick={() => handleAgregarExamen(ex.id_examen)}
                        disabled={editLoading}
                        style={{ 
                          marginTop: 6, 
                          width: '100%',
                          opacity: examenesAGregar.has(ex.id_examen) ? 0.7 : 1,
                          backgroundColor: examenesAGregar.has(ex.id_examen) ? '#28a745' : ''
                        }}
                      >
                        {examenesAGregar.has(ex.id_examen) ? '✓ Agregar (pendiente)' : '➕ ' + ex.nombre}
                      </button>
                    ))}
                    {examenesDisponiblesParaAgregar.length === 0 && (
                      <p className={styles.smallNote}>No hay más exámenes disponibles para agregar.</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Sección de validación de cambios pendientes */}
            {(examenesAEliminar.size > 0 || examenesAGregar.size > 0) && editTipo && editEmpresaId && editCargoId && (
              <div className={styles.searchPanel} style={{ marginTop: 20, border: '2px solid #ffc107' }}>
                <div className={styles.searchHeader}>
                  <h3>⚠️ Cambios Pendientes de Validación</h3>
                  <p className={styles.smallNote}>Revisa los cambios antes de aplicarlos</p>
                </div>

                {/* Resumen de cambios */}
                <div style={{ marginBottom: 15 }}>
                  {examenesAEliminar.size > 0 && (
                    <div style={{ marginBottom: 10, padding: '10px', backgroundColor: '#f8d7da', borderRadius: '4px', borderLeft: '4px solid #dc3545' }}>
                      <strong style={{ color: '#721c24' }}>🗑️ A Eliminar ({examenesAEliminar.size}):</strong>
                      <ul style={{ margin: '8px 0 0 20px', fontSize: '0.9em', color: '#721c24' }}>
                        {Array.from(examenesAEliminar).map(examenId => {
                          const examen = examenesAsignadosTipo.find(e => e.id_examen === examenId);
                          return <li key={examenId}>{examen?.nombre_examen || 'Examen desconocido'}</li>;
                        })}
                      </ul>
                    </div>
                  )}

                  {examenesAGregar.size > 0 && (
                    <div style={{ marginBottom: 10, padding: '10px', backgroundColor: '#d4edda', borderRadius: '4px', borderLeft: '4px solid #28a745' }}>
                      <strong style={{ color: '#155724' }}>✓ A Agregar ({examenesAGregar.size}):</strong>
                      <ul style={{ margin: '8px 0 0 20px', fontSize: '0.9em', color: '#155724' }}>
                        {Array.from(examenesAGregar).map(examenId => {
                          const examen = todosExamenes.find(e => e.id_examen === examenId);
                          return <li key={examenId}>{examen?.nombre || 'Examen desconocido'}</li>;
                        })}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Botones de acción */}
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleCancelarCambios}
                    disabled={editLoading}
                  >
                    ✕ Cancelar Cambios
                  </button>
                  <button
                    type="button"
                    className="btn btn-warning"
                    onClick={handleAplicarCambios}
                    disabled={editLoading}
                    style={{ fontWeight: 'bold' }}
                  >
                    {editLoading ? '⏳ Aplicando...' : '✓ Aplicar Cambios'}
                  </button>
                </div>
              </div>
            )}

            {/* Resumen de todos los tipos */}
            {editEmpresaId && editCargoId && !editLoading && Object.keys(asignaciones).length > 0 && (
              <div className={styles.searchPanel} style={{ marginTop: 20 }}>
                <div className={styles.searchHeader}>
                  <h3>📋 Resumen de Asignaciones</h3>
                  <p className={styles.smallNote}>
                    {empresaNombreSeleccionada} → {cargoNombreSeleccionado}
                  </p>
                </div>
                {Object.entries(asignaciones).map(([tipo, exams]) => (
                  <div key={tipo} style={{ marginBottom: 12 }}>
                    <strong>{TIPOS_EXAMEN.find(t => t.value === tipo)?.label || tipo}</strong>
                    <span className={styles.tipoBadge} style={{ marginLeft: 8 }}>{exams.length}</span>
                    <ul className={styles.examenList} style={{ marginTop: 4 }}>
                      {exams.map(ex => (
                        <li key={ex.id_examen} style={{ fontSize: '0.9rem', padding: '4px 0' }}>
                          • {ex.nombre_examen}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CrearExamenes;
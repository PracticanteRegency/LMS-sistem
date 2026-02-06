import React, { useEffect, useState } from 'react';
import ExamenesService from '../services/Examenes';
import styles from './Styles/CrearExamenes.module.css';

type Empresa = { idempresa: number; nombre_empresa: string };
type Cargo = { idcargo: number; nombrecargo: string };

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

  const TIPOS_EXAMEN = [
    { value: "INGRESO", label: "Examen de Ingreso" },
    { value: "PERIODICO", label: "Examen Periódico" },
    { value: "RETIRO", label: "Examen de Retiro" },
    { value: "ESPECIAL", label: "Examen Especial" },
    { value: "POST_INCAPACIDAD", label: "Examen Post-Incapacidad" },
  ];

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

  return (
    <div className={styles.container}>
      <div className={styles.card}>
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
      </div>
    </div>
  );
};

export default CrearExamenes;
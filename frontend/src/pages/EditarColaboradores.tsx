import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

import CapListService from "../services/Capacitaciones.js";
import styles from "./Styles/CrearCapacitacion.module.css";

export default function EditarColaboradores() {
  const { id } = useParams();
  const capId = Number(id);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [colaboradores, setColaboradores] = useState<any[]>([]);
  const [colaboradoresIds, setColaboradoresIds] = useState<number[]>([]);
  const [csvWarnings, setCsvWarnings] = useState<string | null>(null);
  // const [csvPreview, setCsvPreview] = useState<any[] | null>(null);
  // Guardar la lista original de IDs para detectar cambios
  const [originalColaboradoresIds, setOriginalColaboradoresIds] = useState<number[]>([]);

  // Cargar colaboradores asignados con nombre, apellido y cédula y guardar la lista original de IDs al cargar
  const load = async () => {
    if (!capId) return;
    try {
      setLoading(true);
      setError(null);
      // Usar la API GET /editar-colaborador-capacitacion/<id>/
      const data: any = await CapListService.getEditarColaboradores(capId);
      // El backend ahora retorna { colaboradores: [{id, nombre, apellido, cc}] }
      setColaboradores(data.colaboradores || []);
      const cols = data.colaboradores || [];
      setColaboradoresIds((cols || []).map((c: any) => c.id).filter((x: any) => typeof x === 'number'));
      setOriginalColaboradoresIds((cols || []).map((c: any) => c.id).filter((x: any) => typeof x === 'number'));
    } catch (err: any) {
      setError(err?.message || "Error al cargar colaboradores");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Quitar colaborador solo localmente, no ejecuta PUT
  const quitar = async (colId: number) => {
    if (!window.confirm("¿Seguro que deseas eliminar este colaborador?")) return;
    setColaboradores((prev) => prev.filter((c) => c.id !== colId));
    setColaboradoresIds((prev) => prev.filter((id) => id !== colId));
    try {
      setLoading(true);
      setError(null);
      await CapListService.putEditarColaboradores(capId, { add: [], remove: [colId] });
      await load();
    } catch (err: any) {
      setError(err?.message || "Error al eliminar colaborador");
    } finally {
      setLoading(false);
    }
  };

  // Cargar colaboradores desde CSV solo localmente, no ejecuta PUT
  const handleCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      setError(null);
      setCsvWarnings(null);

      const response: any = await CapListService.cargarColaboradores(file);
      const encontrados = response.colaboradores_encontrados || response.colaboradores || (Array.isArray(response) ? response : []);
      const no_encontrados = response.colaboradores_no_encontrados || [];

      if (no_encontrados && no_encontrados.length) {
        setCsvWarnings(`Advertencia: ${no_encontrados.length} colaboradores no encontrados: ${no_encontrados.join(', ')}`);
      }

      // Reemplazar la lista local de colaboradores por los encontrados en el CSV
      setColaboradores(encontrados || []);
      setColaboradoresIds((encontrados || []).map((c: any) => c.id));
      
    } catch (err: any) {
      console.error('Error al procesar CSV:', err);
      
      // Mostrar solo lo que el backend responde
      const message = err.response?.data?.error || err.response?.data?.message || err.message || 'Error desconocido';
      setError(message);
    } finally {
      setLoading(false);
      try { (e.target as HTMLInputElement).value = ''; } catch {}
    }
  };

  // (Función agregar eliminada: solo se edita localmente y se guarda con el botón Guardar cambios)

  // Guardar cambios de colaboradores (PUT)
  const handleGuardar = async () => {
    if (!capId) return;
    try {
      setLoading(true);
      setError(null);
      // Calcular IDs a agregar y quitar
      const nuevos = colaboradoresIds.filter(id => !originalColaboradoresIds.includes(id));
      const removidos = originalColaboradoresIds.filter(id => !colaboradoresIds.includes(id));
      // Solo enviar add/remove si hay cambios
      if (nuevos.length > 0 || removidos.length > 0) {
        await CapListService.putEditarColaboradores(capId, { add: nuevos, remove: removidos });
      }
      await load();
    } catch (err: any) {
      setError(err?.message || "Error al guardar cambios");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.headerLeft}>
            <button className={styles.backButton} onClick={() => navigate(-1)}>
              ← Volver
            </button>
          </div>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <button className={styles.btnGuardar} onClick={handleGuardar} disabled={loading}>
              {loading ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <h2>Configuración Pública</h2>
        <p className={styles.sectionDescription}>Agregar Colaboradores</p>

        <div className={styles.csvSection}>
          <a
            href={"data:text/csv;charset=utf-8," + encodeURIComponent("cedula\n")}
            download="colaboradores.csv"
            className={styles.csvLink}
          >
            CSV Ejemplo
          </a>
          <label className={styles.btnSubirCsv}>
            Subir CSV
            <input
              type="file"
              accept=".csv"
              onChange={handleCsvUpload}
              style={{ display: "none" }}
            />
          </label>
        </div>

        {loading && <p className={styles.loading}>Cargando...</p>}
        {error && <p className={styles.error}>{error}</p>}
        {csvWarnings && <p className={styles.error}>{csvWarnings}</p>}

        {colaboradores.length > 0 && (
          <div className={styles.colaboradoresTable}>
            <div className={styles.colaboradoresHeader}>
              <h4>Previsualización de colaboradores cargados ({colaboradores.length})</h4>
            </div>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Nombre</th>
                  <th>Apellido</th>
                  <th>Cédula</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {colaboradores.map((colab, index) => (
                  <tr key={`${colab.id}-${index}`}>
                    <td>{index + 1}</td>
                    <td><strong>{colab.nombre || "N/A"}</strong></td>
                    <td>{colab.apellido || "N/A"}</td>
                    <td>{colab.cc || "N/A"}</td>
                    <td>
                      <button
                        type="button"
                        className={styles.btnEliminar}
                        onClick={() => {
                          if (window.confirm("¿Seguro que deseas eliminar este colaborador?")) quitar(colab.id);
                        }}
                        title="Eliminar colaborador"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

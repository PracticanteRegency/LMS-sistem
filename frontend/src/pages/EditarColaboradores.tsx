import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import CapListService from "../services/Capacitaciones.js";
import styles from "./Styles/Capacitaciones.module.css";

export default function EditarColaboradores() {
  const { id } = useParams();
  const capId = Number(id);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [colaboradores, setColaboradores] = useState<any[]>([]);
  const [newColId, setNewColId] = useState("");
  const [csvPreview, setCsvPreview] = useState<any[] | null>(null);
  const [csvWarnings, setCsvWarnings] = useState<string | null>(null);

  const load = async () => {
    if (!capId) return;
    try {
      setLoading(true);
      setError(null);
      const data: any = await CapListService.getCapacitacionDetalle(capId);
      // se espera que `colaboradores` venga en la respuesta
      setColaboradores(Array.isArray(data.colaboradores) ? data.colaboradores : []);
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

  const quitar = async (colId: number) => {
    if (!capId) return;
    if (!window.confirm("Quitar este colaborador de la capacitación?")) return;
    try {
      setLoading(true);
      await CapListService.updateColaboradores(capId, { remove: [colId] });
      await load();
    } catch (err: any) {
      setError(err?.message || "Error al quitar colaborador");
    } finally {
      setLoading(false);
    }
  };

  const handleCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      setError(null);
      setCsvPreview(null);
      setCsvWarnings(null);

      const response: any = await CapListService.cargarColaboradores(file);

      // estructura esperada similar a CrearCapacitacion
      const encontrados = response.colaboradores_encontrados || response.colaboradores || (Array.isArray(response) ? response : []);
      const no_encontrados = response.colaboradores_no_encontrados || [];

      setCsvPreview(encontrados || []);
      if (no_encontrados && no_encontrados.length) {
        setCsvWarnings(`Advertencia: ${no_encontrados.length} colaboradores no encontrados: ${no_encontrados.join(', ')}`);
      }

      // Calcular add/remove respecto a la lista actual de la capacitación
      const currentIds = (colaboradores || []).map((c: any) => (c.id_colaborador ?? c.id) as number).filter(Boolean as any);
      const fileIds = (encontrados || []).map((c: any) => (c.id_colaborador ?? c.id) as number).filter(Boolean as any);

      const add = fileIds.filter((x: number) => !currentIds.includes(x));
      const remove = currentIds.filter((x: number) => !fileIds.includes(x));

      if ((add && add.length) || (remove && remove.length)) {
        try {
          const resUpdate: any = await CapListService.updateColaboradores(capId, { add, remove });
          // Mostrar resultado: backend puede devolver { added: [...], removed: [...] }
          const added = resUpdate.added || resUpdate.add || [];
          const removed = resUpdate.removed || resUpdate.remove || [];
          let msg = [] as string[];
          if (added.length) msg.push(`Nuevos agregados: ${added.join(', ')}`);
          if (removed.length) msg.push(`Eliminados: ${removed.join(', ')}`);
          if (msg.length) alert(msg.join('\n'));
        } catch (err: any) {
          console.error('Error sincronizando desde CSV', err);
          setError(err?.message || 'Error sincronizando colaboradores');
        }
        await load();
      } else {
        // No cambios detectados
        if ((encontrados || []).length) alert('CSV procesado: no se detectaron cambios en la lista de colaboradores');
      }
    } catch (err: any) {
      console.error('Error al procesar CSV:', err);
      setError(err?.message || 'Error al procesar el archivo CSV');
    } finally {
      setLoading(false);
      // limpiar input
      try { (e.target as HTMLInputElement).value = ''; } catch {}
    }
  };

  const agregar = async () => {
    if (!capId) return;
    const parsed = parseInt(newColId + "", 10);
    if (Number.isNaN(parsed)) {
      setError("Id de colaborador inválido");
      return;
    }
    try {
      setLoading(true);
      setError(null);
      await CapListService.updateColaboradores(capId, { add: [parsed] });
      setNewColId("");
      await load();
    } catch (err: any) {
      setError(err?.message || "Error al agregar colaborador");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.headerContent}>
        <button className={styles.pageBtn} onClick={() => navigate(-1)}>← Volver</button>
        <h2>Editar colaboradores - Capacitación {capId}</h2>
      </div>

      {loading && <p>Cargando...</p>}
      {error && <p className={styles.error}>{error}</p>}

      {!loading && (
        <div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', marginBottom: 6 }}>Cargar Excel/CSV para sincronizar colaboradores</label>
            <input type="file" accept=".csv, .xlsx" onChange={handleCsvUpload} />
            {csvWarnings && <p className={styles.error}>{csvWarnings}</p>}
            {csvPreview && csvPreview.length > 0 && (
              <p>{csvPreview.length} colaboradores encontrados en el archivo.</p>
            )}
          </div>
          <div style={{ marginBottom: 12 }}>
            <input
              placeholder="Id colaborador a agregar"
              value={newColId}
              onChange={(e) => setNewColId(e.target.value)}
              style={{ marginRight: 8 }}
            />
            <button className={styles.btn} onClick={agregar}>Agregar</button>
          </div>

          <table className={styles.table}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {colaboradores.map((c) => (
                <tr key={c.id}>
                  <td>{c.id}</td>
                  <td>{c.nombre || c.nombrecolaborador || c.full_name || `${c.nombre} ${c.apellido}`}</td>
                  <td>
                    <button className={`${styles.btn} ${styles.btnDelete}`} onClick={() => quitar(c.id)}>Quitar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

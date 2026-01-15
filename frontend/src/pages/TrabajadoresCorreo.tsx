import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import styles from "./Styles/ReporteCorreos.module.css";
import ExamenesService from "../services/Examenes";

interface TrabajadorCorreo {
  id: number;
  correo_id: number;
  uuid_trabajador: string;
  nombre_trabajador: string;
  documento_trabajador: string;
  cargo_nombre: string;
  empresa_nombre: string;
  estado_trabajador: number;
  estado_nombre: string;
}

interface TrabajadoresResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: TrabajadorCorreo[];
  correo_id?: number;
  uuid_correo?: string;
  asunto?: string;
  fecha_envio?: string;
  total_trabajadores?: number;
}

export default function TrabajadoresCorreo() {
  const { correoId } = useParams<{ correoId: string }>();
  const navigate = useNavigate();

  const [workers, setWorkers] = useState<TrabajadorCorreo[]>([]);
  const [allWorkers, setAllWorkers] = useState<TrabajadorCorreo[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
    // Actualizar estado de trabajadores seleccionados
    const handleActualizarEstado = async () => {
      if (selectedIds.length === 0) return;
      setLoading(true);
      setError(null);
      try {
        await ExamenesService.ActualizarEstadoTrabajadores({ trabajador_ids: selectedIds });
        // Recargar trabajadores
        await loadWorkers(page);
        setSelectedIds([]);
      } catch (err: any) {
        // Mejor manejo de errores: mostrar mensaje desde la respuesta si existe
        const apiMessage = err?.response?.data || err?.message;
        setError(apiMessage || "Error actualizando estado");
      } finally {
        setLoading(false);
      }
    };
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [meta, setMeta] = useState<{ asunto?: string; fecha_envio?: string; uuid_correo?: string; total_trabajadores?: number }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const pageSize = 10;

  const loadWorkers = async (p: number) => {
    if (!correoId) return;
    try {
      setLoading(true);
      setError(null);
      const data: TrabajadoresResponse = await ExamenesService.ObtenerTrabajadoresCorreo(Number(correoId), p, pageSize);
      setWorkers(data.results || []);
      setAllWorkers(data.results || []);
      setTotal(data.count || (data.results ? data.results.length : 0));
      setMeta({
        asunto: data.asunto,
        fecha_envio: data.fecha_envio,
        uuid_correo: data.uuid_correo,
        total_trabajadores: data.total_trabajadores,
      });
      setPage(p);
    } catch (err: any) {
      setError(err?.message || "Error cargando trabajadores");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkers(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [correoId]);

  // Búsqueda por UUID en el frontend
  const handleSearch = () => {
    if (!searchTerm.trim()) {
      setWorkers(allWorkers);
      setPage(1);
      setTotal(allWorkers.length);
      return;
    }
    const filtered = allWorkers.filter(w => w.uuid_trabajador && w.uuid_trabajador.toLowerCase().includes(searchTerm.trim().toLowerCase()));
    setWorkers(filtered);
    setPage(1);
    setTotal(filtered.length);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <div>
            <h1>Trabajadores enviados</h1>
            <p className={styles.subtitle}>
              Correo ID: {correoId} {meta.uuid_correo ? `· UUID ${meta.uuid_correo}` : ""}
            </p>
            {meta.asunto && <p className={styles.subtitle}>Asunto: {meta.asunto}</p>}
            {meta.fecha_envio && (
              <p className={styles.subtitle}>Fecha envío: {new Date(meta.fecha_envio).toLocaleString("es-CO")}</p>
            )}
            {typeof meta.total_trabajadores === "number" && (
              <p className={styles.subtitle}>Total trabajadores: {meta.total_trabajadores}</p>
            )}
          </div>
          <button className={styles.detailButton} onClick={() => navigate(-1)}>
            ← Volver
          </button>
        </div>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {loading ? (
        <div className={styles.loadingContainer}>Cargando trabajadores...</div>
      ) : workers.length === 0 ? (
        <div className={styles.emptyState}>
          <p>No hay trabajadores para este envío.</p>
        </div>
      ) : (
        <>
          <div className={styles.searchContainer}>
            <input
              type="text"
              placeholder="Buscar por UUID del trabajador..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              onKeyDown={handleInputKeyDown}
              className={styles.searchInput}
              style={{ maxWidth: 320, marginRight: 8 }}
            />
            <button className={styles.searchButton} onClick={handleSearch} style={{ marginRight: 8 }}>Buscar</button>
            {searchTerm && (
              <button
                className={styles.clearButton}
                style={{
                  background: '#f44336',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 4,
                  padding: '6px 16px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                  transition: 'background 0.2s',
                  marginLeft: 4
                }}
                onMouseOver={e => (e.currentTarget.style.background = '#d32f2f')}
                onMouseOut={e => (e.currentTarget.style.background = '#f44336')}
                onClick={() => { setSearchTerm(""); setWorkers(allWorkers); setPage(1); setTotal(allWorkers.length); }}
              >
                ✕ Limpiar
              </button>
            )}
          </div>
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      checked={selectedIds.length === workers.length && workers.length > 0}
                      onChange={e => {
                        if (e.target.checked) {
                          setSelectedIds(workers.map(w => w.id));
                        } else {
                          setSelectedIds([]);
                        }
                      }}
                    />
                  </th>
                  <th>UUID</th>
                  <th>Nombre</th>
                  <th>Documento</th>
                  <th>Cargo</th>
                  <th>Empresa</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {workers.map((w) => (
                  <tr key={w.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(w.id)}
                        onChange={e => {
                          if (e.target.checked) {
                            setSelectedIds(prev => [...prev, w.id]);
                          } else {
                            setSelectedIds(prev => prev.filter(id => id !== w.id));
                          }
                        }}
                      />
                    </td>
                    <td style={{ fontFamily: 'monospace', fontSize: 13 }}>{w.uuid_trabajador}</td>
                    <td>{w.nombre_trabajador}</td>
                    <td>{w.documento_trabajador}</td>
                    <td>{w.cargo_nombre}</td>
                    <td>{w.empresa_nombre}</td>
                    <td>
                      <span className={`${styles.badge} ${w.estado_trabajador === 1 ? styles.success : styles.pending}`}>
                        {w.estado_nombre || (w.estado_trabajador === 1 ? "Completado" : "Pendiente")}
                      </span>
                    </td>
                    <td>
                      <div className={styles.actionsCell}>
                        <button
                          className={styles.detailButton}
                          onClick={() => navigator.clipboard.writeText(w.uuid_trabajador)}
                          title="Copiar UUID"
                        >
                          Copiar UUID
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {selectedIds.length > 0 && (
              <div style={{ margin: '16px 0', textAlign: 'right' }}>
                <button
                  className={styles.sendButton}
                  onClick={handleActualizarEstado}
                  disabled={loading}
                  style={{ padding: '8px 24px', fontWeight: 600 }}
                >
                  Cambiar estado de seleccionados
                </button>
              </div>
            )}
            {totalPages > 1 && (
              <div className={styles.pagination}>
                <button onClick={() => loadWorkers(Math.max(1, page - 1))} disabled={page === 1 || loading}>
                  ← Anterior
                </button>
                <span>
                  Página {page} de {totalPages} ({total} resultados)
                </span>
                <button onClick={() => loadWorkers(Math.min(totalPages, page + 1))} disabled={page >= totalPages || loading}>
                  Siguiente →
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

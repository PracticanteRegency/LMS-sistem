import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styles from "./Styles/UsersCap.module.css";
import CapListService from "../services/Capacitaciones.js";

interface UserCap {
  id: number;
  nombre: string;
  apellido: string;
  cedula: string;
  progreso: number;
  completada: boolean;
  fecha_registro: string;
  fecha_completada: string | null;
}

export default function UsersCap() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserCap[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserCap[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [downloadingReport, setDownloadingReport] = useState(false);
  const pageSize = 20;
  const [filterCompleted, setFilterCompleted] = useState<'all'|'yes'|'no'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchUsers();
  }, [id, page]);

  useEffect(() => {
    let result = [...users];
    if (filterCompleted === 'yes') result = result.filter(u => u.completada);
    if (filterCompleted === 'no') result = result.filter(u => !u.completada);
    if (searchTerm.trim()) {
      const term = searchTerm.trim().toLowerCase();
      result = result.filter(u =>
        u.nombre.toLowerCase().includes(term) ||
        u.apellido.toLowerCase().includes(term) ||
        u.cedula.toLowerCase().includes(term)
      );
    }
    setFilteredUsers(result);
    setPage(1);
  }, [users, filterCompleted, searchTerm]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      // Asume que el servicio acepta solo el id como parámetro
      if (!id) {
        setError("ID de capacitación no especificado");
        setUsers([]);
        setLoading(false);
        return;
      }
      const data: any = await CapListService.GetUsersCapacitacion(id);
      setUsers(data.results || []);
    } catch (err: any) {
      setError("Error al cargar usuarios");
    } finally {
      setLoading(false);
    }
  };

  const handleDescargarReporte = async () => {
    if (!id) {
      alert("ID de capacitación no especificado");
      return;
    }

    try {
      setDownloadingReport(true);
      const blob = await CapListService.descargarReporteCapacitacion(id);
      
      // Crear URL para descargar el archivo
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `reporte_capacitacion_${id}_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
    } catch (err: any) {
      alert("Error al descargar el reporte: " + (err.message || "Error desconocido"));
      console.error("Error descargando reporte:", err);
    } finally {
      setDownloadingReport(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1 style={{fontSize:'2rem', fontWeight:800, marginBottom:8}}>Usuarios de la capacitación</h1>
          <div style={{display:'flex', gap:12, alignItems:'center'}}>
            <button 
              className={styles.btnReport}
              onClick={handleDescargarReporte}
              disabled={downloadingReport}
              title="Descargar reporte de capacitación en Excel"
            >
              {downloadingReport ? '⏳ Descargando...' : '📊 Generar Reporte'}
            </button>
            <button className={styles.btnBack} onClick={() => navigate(-1)}>
              ← Volver
            </button>
          </div>
        </div>
      </div>
      {loading ? (
        <p className={styles.loading}>Cargando usuarios...</p>
      ) : error ? (
        <p className={styles.error}>{error}</p>
      ) : (
        <>
          <div style={{display:'flex', gap:16, marginBottom:16, flexWrap:'wrap', alignItems:'center'}}>
            <select
              value={filterCompleted}
              onChange={e => setFilterCompleted(e.target.value as 'all'|'yes'|'no')}
              className={styles.select}
              style={{minWidth:140}}
            >
              <option value="all">Todos</option>
              <option value="yes">Completados</option>
              <option value="no">No completados</option>
            </select>
            <input
              type="text"
              className={styles.input}
              style={{minWidth:180}}
              placeholder="Buscar por nombre, apellido o cédula..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            <span style={{fontSize:13, color:'#666', fontWeight:500}}>
              {filteredUsers.length} resultados
            </span>
          </div>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead className={styles.thead}>
                <tr>
                  <th className={styles.thCenter}>Nombre</th>
                  <th className={styles.thCenter}>Apellido</th>
                  <th className={styles.thCenter}>Cédula</th>
                  <th className={styles.thCenter}>Progreso</th>
                  <th className={styles.thCenter}>Fecha registro</th>
                  <th className={styles.thCenter}>Fecha completada</th>
                </tr>
              </thead>
              <tbody className={styles.tbody}>
                {filteredUsers
                  .slice((page - 1) * pageSize, page * pageSize)
                  .map(u => (
                    <tr key={u.id}>
                      <td className={styles.tdNombre}>{u.nombre}</td>
                      <td className={styles.tdApellido}>{u.apellido}</td>
                      <td className={styles.tdCedula}>{u.cedula}</td>
                      <td className={styles.progressCell}>
                        <div className={styles.progressBar}>
                          <div
                            className={styles.progressFill}
                            style={{width:`${u.progreso}%`, background:u.progreso===100?'#2e7d32':'#d32f2f'}}
                          />
                          <span className={styles.progressPercent}>{u.progreso}%</span>
                        </div>
                      </td>
                      <td className={styles.tdFecha}>{u.fecha_registro ? new Date(u.fecha_registro).toLocaleDateString() : ""}</td>
                      <td className={styles.tdFechaCompletada}>
                        {u.fecha_completada
                          ? new Date(u.fecha_completada).toLocaleDateString()
                          : <span className={styles.noCompletado}>No completado</span>}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          <div className={styles.pagination}>
            <button className={styles.pageBtn} disabled={page === 1} onClick={() => setPage(page - 1)}>
              ← Anterior
            </button>
            <span className={styles.pageInfo}>
              Página {page} de {Math.max(1, Math.ceil(filteredUsers.length / pageSize))}
            </span>
            <button className={styles.pageBtn} disabled={page >= Math.ceil(filteredUsers.length / pageSize)} onClick={() => setPage(page + 1)}>
              Siguiente →
            </button>
          </div>
        </>
      )}
    </div>
  );
}

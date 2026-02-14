import { useState } from "react";
import { useNavigate } from "react-router-dom";

import CapListService from "../services/Capacitaciones.js";
import Perfil from "../services/perfil.js";
import styles from "./Styles/CrearCapacitacion.module.css";

export default function DesactivarUsuarios() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [usuariosIds, setUsuariosIds] = useState<number[]>([]);
  const [csvWarnings, setCsvWarnings] = useState<string | null>(null);

  // Cargar usuarios desde CSV
  const handleCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      setCsvWarnings(null);

      const response: any = await CapListService.cargarColaboradores(file);
      const encontrados = response.colaboradores_encontrados || response.colaboradores || (Array.isArray(response) ? response : []);
      const no_encontrados = response.colaboradores_no_encontrados || [];

      if (no_encontrados && no_encontrados.length) {
        setCsvWarnings(`Advertencia: ${no_encontrados.length} colaboradores no encontrados: ${no_encontrados.join(', ')}`);
      }

      setUsuarios(encontrados || []);
      setUsuariosIds((encontrados || []).map((c: any) => c.id));
    } catch (err: any) {
      console.error('Error al procesar CSV:', err);
      setError(err?.message || 'Error al procesar el archivo CSV');
    } finally {
      setLoading(false);
      try { (e.target as HTMLInputElement).value = ''; } catch {}
    }
  };

  // Eliminar usuario de la lista
  const quitarUsuario = (usuarioId: number) => {
    if (!window.confirm("¿Seguro que deseas eliminar este usuario de la lista?")) return;
    setUsuarios((prev) => prev.filter((u) => u.id !== usuarioId));
    setUsuariosIds((prev) => prev.filter((id) => id !== usuarioId));
  };

  // Desactivar usuarios (POST a endpoint)
  const handleDesactivar = async () => {
    if (usuariosIds.length === 0) {
      setError("Debes cargar al menos un usuario para desactivar");
      return;
    }

    const confirmMsg = `¿Estás seguro que deseas DESACTIVAR a ${usuariosIds.length} usuario(s)? Esta acción no se puede deshacer.`;
    if (!window.confirm(confirmMsg)) return;

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      // Llamar a endpoint para desactivar múltiples usuarios
      const resultado: any = await (Perfil as any).desactivarMultiplesUsuarios({
        colaborador_ids: usuariosIds,
        estado: 0  // 0 = desactivado
      });

      setSuccess(`✅ ${resultado.actualizados} usuario(s) desactivado(s) exitosamente`);
      
      // Limpiar después de 3 segundos
      setTimeout(() => {
        setUsuarios([]);
        setUsuariosIds([]);
        setCsvWarnings(null);
      }, 2000);

    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || "Error al desactivar usuarios");
    } finally {
      setLoading(false);
    }
  };

  // Reactivar usuarios (POST a endpoint con estado=1)
  const handleReactivar = async () => {
    if (usuariosIds.length === 0) {
      setError("Debes cargar al menos un usuario para reactivar");
      return;
    }

    const confirmMsg = `¿Estás seguro que deseas REACTIVAR a ${usuariosIds.length} usuario(s)?`;
    if (!window.confirm(confirmMsg)) return;

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      // Llamar a endpoint para reactivar múltiples usuarios
      const resultado: any = await (Perfil as any).desactivarMultiplesUsuarios({
        colaborador_ids: usuariosIds,
        estado: 1  // 1 = activo
      });

      setSuccess(`✅ ${resultado.actualizados} usuario(s) reactivado(s) exitosamente`);
      
      // Limpiar después de 3 segundos
      setTimeout(() => {
        setUsuarios([]);
        setUsuariosIds([]);
        setCsvWarnings(null);
      }, 2000);

    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || "Error al reactivar usuarios");
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
            <h1>Gestionar Estado de Usuarios</h1>
          </div>
          <div className={styles.actionButtons}>
            <button
              className={`${styles.btnGuardar} ${styles.btnDesactivar}`}
              onClick={handleDesactivar}
              disabled={loading || usuariosIds.length === 0}
              title="Desactivar usuarios seleccionados"
            >
              {loading ? "Procesando..." : `🚫 Desactivar (${usuariosIds.length})`}
            </button>
            <button
              className={`${styles.btnGuardar} ${styles.btnReactivar}`}
              onClick={handleReactivar}
              disabled={loading || usuariosIds.length === 0}
              title="Reactivar usuarios seleccionados"
            >
              {loading ? "Procesando..." : `✅ Reactivar (${usuariosIds.length})`}
            </button>
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <h2>Cargar Usuarios</h2>
        <p className={styles.sectionDescription}>Carga un archivo CSV con los colaboradores a desactivar o reactivar</p>

        <div className={styles.csvSection}>
          <a
            href={"data:text/csv;charset=utf-8," + encodeURIComponent("cedula\n")}
            download="usuarios.csv"
            className={styles.csvLink}
          >
            📋 Descargar Plantilla CSV
          </a>
          <label className={styles.btnSubirCsv}>
            📁 Subir CSV
            <input
              type="file"
              accept=".csv, .xlsx"
              onChange={handleCsvUpload}
              disabled={loading}
              style={{ display: "none" }}
            />
          </label>
        </div>

        {loading && <p className={styles.loading}>⏳ Procesando...</p>}
        {error && <p className={styles.error}>❌ {error}</p>}
        {success && <p className={styles.successMessage}>
          {success}
        </p>}
        {csvWarnings && <p className={styles.error}>⚠️ {csvWarnings}</p>}

        {usuarios.length > 0 && (
          <div className={styles.colaboradoresTable}>
            <div className={styles.colaboradoresHeader}>
              <h4>Usuarios Cargados ({usuarios.length})</h4>
              <small>
                Revisa los datos antes de desactivar o reactivar
              </small>
            </div>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Nombre</th>
                  <th>Apellido</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map((usuario, index) => (
                  <tr key={usuario.id}>
                    <td>{index + 1}</td>
                    <td><strong>{usuario.nombre || "N/A"}</strong></td>
                    <td>{usuario.apellido || "N/A"}</td>
                    <td>
                      <button
                        type="button"
                        className={styles.btnEliminar}
                        onClick={() => {
                          if (window.confirm("¿Seguro que deseas eliminar este usuario de la lista?")) {
                            quitarUsuario(usuario.id);
                          }
                        }}
                        title="Eliminar de la lista"
                        disabled={loading}
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className={styles.summaryBox}>
              <h4>Resumen de Acciones</h4>
              <ul>
                <li><strong>Total de usuarios:</strong> {usuariosIds.length}</li>
                <li><strong>Acción:</strong> Selecciona desactivar o reactivar</li>
                <li><strong>Efecto:</strong> Usuarios desactivados no recibirán correos ni aparecerán en reportes</li>
              </ul>
            </div>
          </div>
        )}

        {usuarios.length === 0 && !loading && (
          <div className={styles.emptyState}>
            <p>📤 Carga un archivo CSV para comenzar</p>
          </div>
        )}
      </div>
    </div>
  );
}

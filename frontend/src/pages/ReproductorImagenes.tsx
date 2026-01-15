import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styles from "./Styles/ReproductorVideo.module.css"; // reuse styles
import CapListService from "../services/Capacitaciones";
import { normalizeDataUrl } from "../utils/media";

interface Leccion {
  id?: number;
  titulo_leccion: string;
  tipo_leccion: string;
  url: string;
  descripcion?: string;
  completada?: boolean;
}

export default function ReproductorImagenes() {
  const { capacitacionId, moduloIndex, leccionIndex } = useParams<{
    capacitacionId: string;
    moduloIndex: string;
    leccionIndex: string;
  }>();
  const navigate = useNavigate();
  const [leccion, setLeccion] = useState<Leccion | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [marking, setMarking] = useState(false);

  useEffect(() => {
    loadLeccion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [capacitacionId, moduloIndex, leccionIndex]);

  const loadLeccion = async () => {
    try {
      setLoading(true);
      setError(null);
      if (!capacitacionId) {
        setError("ID de capacitación no válido");
        setLoading(false);
        return;
      }

      const data: any = await CapListService.getCapacitacionById(capacitacionId);
      const modIdx = parseInt(moduloIndex || "-1");
      const lecIdx = parseInt(leccionIndex || "-1");
      const found = data?.modulos?.[modIdx]?.lecciones?.[lecIdx];
      if (!found) {
        setError("Lección no encontrada");
        setLoading(false);
        return;
      }
      setLeccion(found);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Error al cargar la lección");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsCompleted = async () => {
    if (!capacitacionId || !leccion) return;
    try {
      setMarking(true);
      const lecIdx = parseInt(leccionIndex || "-1");
      const leccionId = (leccion as any)?.id || lecIdx;
      await (CapListService as any).postCompletarLeccion(capacitacionId, leccionId);
      // volver a la vista de capacitación
      navigate(`/capacitaciones/${capacitacionId}`);
    } catch (err: any) {
      console.error(err);
      alert('No se pudo marcar la lección como completada. Intenta de nuevo.');
    } finally {
      setMarking(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <p className={styles.loading}>Cargando imagen...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.errorBox}>
          <p className={styles.error}>Error: {error}</p>
        </div>
      </div>
    );
  }

  if (!leccion) {
    return (
      <div className={styles.container}>
        <p className={styles.error}>Lección no encontrada</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.playerContainer}>
        <div className={styles.header}>
          <h1 className={styles.title}>{leccion.titulo_leccion}</h1>
        </div>

        <div className={styles.videoWrapper}>
          <div className={styles.mediaWrapper}>
            {leccion.tipo_leccion === 'pdf' ? (
              <iframe
                src={normalizeDataUrl(leccion.url, 'pdf') + '#toolbar=0'}
                title={leccion.titulo_leccion}
                className={styles.pdfContent}
                style={{
                  width: '100%',
                  minHeight: '70vh',
                  height: '80vh',
                  maxHeight: '90vh',
                  border: 'none',
                  borderRadius: '12px',
                  boxShadow: '0 2px 16px rgba(0,0,0,0.12)'
                }}
                allowFullScreen
              />
            ) : (
              <img
                src={normalizeDataUrl(leccion.url, 'image')}
                alt={leccion.titulo_leccion}
                className={styles.imageContent}
              />
            )}
          </div>
        </div>

        {leccion.descripcion && (
          <div className={styles.descriptionBox}>
            <h3 className={styles.descriptionTitle}>Descripción</h3>
            <p className={styles.description}>{leccion.descripcion}</p>
          </div>
        )}

        <div className={styles.warningBox}>
          <button className={styles.btnMarcarCompletado} disabled={marking} onClick={handleMarkAsCompleted}>
            {marking ? 'Marcando...' : 'Finalizar lección y volver'}
          </button>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import CapListService from "../services/Capacitaciones";
import perfilStyles from "../usuario/Styles/perfil.module.css";
import styles from "./Styles/Home.module.css";
import { normalizeDataUrl } from "../utils/media";

export default function Home() {
  const navigate = useNavigate();
  const [caps, setCaps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCaps();
  }, []);

  const loadCaps = async () => {
    try {
      setLoading(true);
      setError(null);
      const data: any = await CapListService.getMisCapacitaciones();
      const list = Array.isArray(data) ? data : data?.results || data?.data || [];
      // Ordenar para mostrar primero capacitaciones incompletas y al final las completadas
      const isCompleted = (c: any) => {
        return !!(
          c.completada ||
          (c.progreso !== undefined && Number(c.progreso) >= 100) ||
          (c.porcentaje_completado !== undefined && Number(c.porcentaje_completado) >= 100)
        );
      };

      const sorted = (list || []).slice().sort((a: any, b: any) => Number(isCompleted(a)) - Number(isCompleted(b)));
      setCaps(sorted);
    } catch (err: any) {
      console.error("Error cargando capacitaciones:", err);
      setError(err.message || "Error al cargar capacitaciones");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className={styles.container}><p>Cargando capacitaciones...</p></div>;
  if (error) return <div className={styles.container}><p style={{color:'#d32f2f'}}>Error: {error}</p></div>;

  return (
    <div className={styles.container}>
      <h1>Capacitaciones</h1>
      <div className={styles.grid}>
        {caps.map((cap: any) => {
          const id = cap.id || cap.id_capacitacion || cap.pk;
          const title = cap.titulo || cap.nombre || cap.nombre_capacitacion || "Sin título";
          // Handle multiple possible image fields and decode base64 when needed
          const imageCandidate = cap.imagen || cap.image || cap.url_imagen || cap.url_imagen_base64 || cap.imagen_base64 || cap.imagen_b64 || cap.image_base64 || cap.url;
          const imageSrc = normalizeDataUrl(imageCandidate, 'image');
          const progreso = cap.progreso ?? cap.porcentaje_completado ?? Math.round(((cap.lecciones_completadas || cap.completados || 0) / Math.max(1, (cap.total_lecciones || 1))) * 100);
          const leccionesTxt = `${cap.lecciones_completadas ?? cap.completados ?? 0}/${cap.total_lecciones ?? cap.total_lecciones ?? 0}`;

          return (
            <div key={id} className={styles.card}>
              <div className={perfilStyles.cardImage}>
                {imageSrc ? (
                  <img src={imageSrc} alt={title} />
                ) : (
                  <div style={{color:'white', padding:8}}>Sin imagen</div>
                )}
              </div>

              <div className={styles.cardBody}>
                <h3 className={styles.cardTitle}>{title}</h3>

                <div className={styles.progressRow}>
                  <div style={{flex:1}}>
                    <div className={perfilStyles.progressBar}>
                      <div className={perfilStyles.progressFill} style={{width: `${progreso}%`}} />
                    </div>
                  </div>
                  <div className={styles.metaSmall}>{progreso}%</div>
                </div>

                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                  <div className={styles.metaSmall}>Lecciones</div>
                  <div className={styles.metaSmall}>{leccionesTxt}</div>
                </div>

                <div className={styles.btnRow}>
                  <button
                    className={perfilStyles.buttonContinuar}
                    onClick={() => navigate(`/capacitaciones/${id}`)}
                  >
                    ▶ continuar
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

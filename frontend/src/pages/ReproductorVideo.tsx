import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styles from "./Styles/ReproductorVideo.module.css";
import CapListService from "../services/Capacitaciones";
import { normalizeDataUrl } from "../utils/media";

interface Leccion {
  titulo_leccion: string;
  tipo_leccion: 'video' | 'imagen' | 'pdf' | 'formulario' | string;
  url: string;
  duracion?: string;
  descripcion?: string;
  completada?: boolean;
}

interface Modulo {
  nombre_modulo: string;
  lecciones: Leccion[];
}

interface Capacitacion {
  id: number;
  titulo: string;
  modulos?: Modulo[];
}

export default function ReproductorVideo() {
  const { capacitacionId, moduloIndex, leccionIndex } = useParams<{
    capacitacionId: string;
    moduloIndex: string;
    leccionIndex: string;
  }>();
  const navigate = useNavigate();
  const [capacitacion, setCapacitacion] = useState<Capacitacion | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [videoEnded, setVideoEnded] = useState(false);
  const [marking, setMarking] = useState(false);
  const [pdfOpened, setPdfOpened] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const youtubeContainerRef = useRef<HTMLDivElement | null>(null);
  const youtubePlayerRef = useRef<any>(null);

  useEffect(() => {
    loadCapacitacion();
  }, [capacitacionId]);

  const loadCapacitacion = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!capacitacionId) {
        setError("ID de capacitación no válido");
        setLoading(false);
        return;
      }

      const data: any = await CapListService.getCapacitacionById(capacitacionId);
      setCapacitacion(data);
    } catch (err: any) {
      console.error("Error:", err);
      setError(err.message || "Error al cargar la capacitación");
    } finally {
      setLoading(false);
    }
  };

  // (YouTube embed conversion removed: we now use direct videoId extraction)

  // Extraer videoId de distintas formas de URL de YouTube
  const getYouTubeVideoId = (url: string) => {
    if (!url || typeof url !== 'string') return null;
    if (url.includes('youtube.com/watch?v=')) return url.split('v=')[1]?.split('&')[0] || null;
    if (url.includes('youtu.be/')) return url.split('youtu.be/')[1]?.split('?')[0] || null;
    if (url.includes('youtube.com/embed/')) return url.split('embed/')[1]?.split('?')[0] || null;
    return null;
  };

  const handleVideoEnded = async () => {
    // Cuando el video local termina, intentar marcar la lección como completada en la API
    try {
      const leccionId = (leccion as any)?.id || (leccion as any)?.id_leccion || lecIdx;
      await (CapListService as any).postCompletarLeccion(capacitacionId, leccionId);
    } catch (err) {
      console.error("Error marcando lección completada:", err);
      // No bloqueamos al usuario: aún mostramos completado en UI
    } finally {
      setVideoEnded(true);
    }
  };

  const handleFinalizarLeccion = () => {
    navigate(`/capacitaciones/${capacitacionId}`);
  };

  // Derivar índices y la lección tempranamente para que los Hooks
  // (como el useEffect de YouTube) se declaren siempre en el mismo orden
  const modIdx = moduloIndex ? parseInt(moduloIndex) : -1;
  const lecIdx = leccionIndex ? parseInt(leccionIndex) : -1;
  const leccion = capacitacion?.modulos?.[modIdx]?.lecciones?.[lecIdx];
  const isYouTubeUrl = typeof leccion?.url === 'string' && (leccion.url.includes("youtube.com") || leccion.url.includes("youtu.be"));

  // Abrir automáticamente el PDF en una nueva pestaña cuando la lección sea de tipo 'pdf'
  useEffect(() => {
    if (leccion?.tipo_leccion === 'pdf' && leccion?.url && !pdfOpened) {
      const pdfUrl = normalizeDataUrl(leccion.url, 'pdf');
      try {
        window.open(pdfUrl, '_blank', 'noopener,noreferrer');
        setPdfOpened(true);
      } catch (err) {
        // Si el navegador bloquea el popup, el usuario aún puede usar el botón "Abrir PDF" en la UI
        console.error('No se pudo abrir el PDF automáticamente:', err);
      }
    }
  }, [leccion?.tipo_leccion, leccion?.url, pdfOpened]);

  // Inicializar API de YouTube y jugador sólo para URLs de YouTube
  useEffect(() => {
    if (!isYouTubeUrl) return;

    const videoId = getYouTubeVideoId(leccion?.url || '');
    if (!videoId) return;

    const initPlayer = () => {
      if (!(window as any).YT || !youtubeContainerRef.current) return;
      try {
        // Crear player y escuchar eventos
        youtubePlayerRef.current = new (window as any).YT.Player(youtubeContainerRef.current, {
          videoId,
          events: {
            onStateChange: (e: any) => {
              // YT.PlayerState.ENDED === 0
              if (e.data === (window as any).YT.PlayerState.ENDED) {
                setVideoEnded(true);
                // Intentar marcar como completada en background
                try {
                  const leccionId = (leccion as any)?.id || (leccion as any)?.id_leccion || lecIdx;
                  (CapListService as any).postCompletarLeccion(capacitacionId, leccionId).catch((err: any) => console.error('Error marcando lección completada (YouTube auto):', err));
                } catch (err) {
                  console.error('Error al postear completado (YouTube):', err);
                }
              }
            }
          }
        });
        // player initialized
      } catch (err) {
        console.error('Error inicializando YouTube Player:', err);
      }
    };

    if ((window as any).YT && (window as any).YT.Player) {
      initPlayer();
    } else {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      document.body.appendChild(tag);
      (window as any).onYouTubeIframeAPIReady = () => {
        initPlayer();
      };
    }

    return () => {
      try {
        youtubePlayerRef.current?.destroy?.();
      } catch (err) {
        // ignore
      }
    };
  }, [isYouTubeUrl, leccion?.url, lecIdx, capacitacionId]);

  if (loading) {
    return (
      <div className={styles.container}>
        <p className={styles.loading}>Cargando video...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.errorBox}>
          <p className={styles.error}>Error: {error}</p>
          <button className={styles.btnBack} onClick={() => navigate(`/capacitaciones/${capacitacionId}`)}>
            ← Volver
          </button>
        </div>
      </div>
    );
  }

  if (!capacitacion || !moduloIndex || !leccionIndex) {
    return (
      <div className={styles.container}>
        <p className={styles.error}>Parámetros inválidos</p>
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
          {leccion.tipo_leccion === 'video' && !videoEnded && (
            <p className={styles.subtitle}>Debes ver el video completo para continuar</p>
          )}
        </div>

        <div className={styles.videoWrapper}>
          {leccion.tipo_leccion === 'video' ? (
            isYouTubeUrl ? (
              <div className={styles.youtubeWrapper}>
                {/* Contenedor que rellena la YouTube IFrame API */}
                <div ref={youtubeContainerRef} id={`youtube-player-${capacitacionId}-${modIdx}-${lecIdx}`} className={styles.youtubePlayer} />
              </div>
            ) : (
              <video
                ref={videoRef}
                className={styles.videoPlayer}
                controls
                autoPlay
                onEnded={handleVideoEnded}
              >
                <source src={leccion.url} type="video/mp4" />
                Tu navegador no soporta el elemento de video.
              </video>
            )
          ) : leccion.tipo_leccion === 'imagen' ? (
            <div className={styles.mediaWrapper}>
              <img src={normalizeDataUrl(leccion.url, 'image')} alt={leccion.titulo_leccion} className={styles.imageContent} />
            </div>
          ) : leccion.tipo_leccion === 'pdf' ? (
            <div className={styles.mediaWrapper}>
              <iframe src={normalizeDataUrl(leccion.url, 'pdf')} title={leccion.titulo_leccion} className={styles.pdfViewer} />
              <a href={normalizeDataUrl(leccion.url, 'pdf')} target="_blank" rel="noreferrer" className={styles.btnDescargar}>
                Abrir PDF en nueva pestaña
              </a>
            </div>
          ) : (
            <div className={styles.unsupported}>
              <p>Tipo de lección no soportado para visualización directa.</p>
            </div>
          )}
        </div>

        {leccion.descripcion && (
          <div className={styles.descriptionBox}>
            <h3 className={styles.descriptionTitle}>Descripción</h3>
            <p className={styles.description}>{leccion.descripcion}</p>
          </div>
        )}

        {videoEnded ? (
          <div className={styles.completedBox}>
            <div className={styles.successIcon}>✓</div>
            <p className={styles.completedText}>¡Video completado!</p>
            <button className={styles.btnFinalizar} onClick={handleFinalizarLeccion}>
              Finalizar lección y volver
            </button>
          </div>
        ) : (
          <div className={styles.warningBox}>
            <p className={styles.warningText}>
              ⏱️ {isYouTubeUrl ? 'Marque como completado cuando termine de ver' : 'Debe ver el video completo antes de poder finalizar'}
            </p>
            {isYouTubeUrl && (
              <button
                className={styles.btnMarcarCompletado}
                disabled={!videoEnded || marking}
                onClick={async () => {
                  if (!videoEnded) return; // safety guard
                  try {
                    setMarking(true);
                    const leccionId = (leccion as any)?.id || (leccion as any)?.id_leccion || lecIdx;
                    await (CapListService as any).postCompletarLeccion(capacitacionId, leccionId);
                    setVideoEnded(true);
                    // Navigate back after marking
                    navigate(`/capacitaciones/${capacitacionId}`);
                  } catch (err: any) {
                    console.error('Error al completar lección (YouTube):', err);
                    alert('No se pudo marcar la lección como completada. Intenta de nuevo.');
                  } finally {
                    setMarking(false);
                  }
                }}
                style={{ marginTop: '10px' }}
              >
                {marking ? 'Marcando...' : (videoEnded ? 'Marcar como completado' : 'Debes ver el video entero completar la leccion')}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

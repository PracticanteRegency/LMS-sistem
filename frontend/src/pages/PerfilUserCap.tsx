import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styles from "./Styles/VerCapacitacion.module.css";
import CapListService from "../services/Capacitaciones";
import perfilService from "../services/perfil";

interface Leccion {
  titulo_leccion: string;
  tipo_leccion: string;
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
  descripcion: string;
  imagen: string;
  estado: number;
  fecha_creacion: string;
  fecha_inicio: string;
  fecha_fin: string;
  total_colaboradores: number;
  completados: number;
  porcentaje_completado: number;
  modulos?: Modulo[];
}

export default function PerfilUserCap() {
  const { id_colaborador, id_capacitacion } = useParams();
  const navigate = useNavigate();
  const [capacitacion, setCapacitacion] = useState<Capacitacion | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedModulos, setExpandedModulos] = useState<{ [key: number]: boolean }>({});

    useEffect(() => {
    loadCapacitacion();
    }, [id_colaborador, id_capacitacion]);

    const loadCapacitacion = async () => {
    try {
        setLoading(true);
        setError(null);
      if (!id_colaborador || !id_capacitacion) {
      setError("ID no válido");
      setLoading(false);
      return;
      }

      // 1. Datos generales de capacitación
      const infoCap = await CapListService.getCapacitacionById(Number(id_capacitacion));

      // 2. Datos de progreso del colaborador para esta capacitación
      // Casting to any because typings for getPerfilCapById may not reflect the detailed response with modulos
      const perfil = await (perfilService as any).getPerfilCapById(Number(id_colaborador), Number(id_capacitacion));

      // Combina la info de la capacitación con el progreso del colaborador
      const fullData: any = {
      ...infoCap,
      modulos: perfil.modulos ?? infoCap.modulos,
      };

      console.log('PerfilUserCap - infoCap:', infoCap);
      console.log('PerfilUserCap - progreso colaborador:', perfil);

      setCapacitacion(fullData as Capacitacion);
    } catch (err) {
        console.error(err);
        setError("Error cargando la capacitación");
    } finally {
        setLoading(false);
    }
    };


  const toggleModulo = (index: number) => {
    setExpandedModulos((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <p className={styles.loading}>Cargando capacitación...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.errorBox}>
          <p className={styles.error}>Error: {error}</p>
          <button className={styles.btnBack} onClick={() => navigate(`/user/perfil/${id_colaborador}`)}>
            ← Volver al perfil del colaborador
          </button>
        </div>
      </div>
    );
  }

  if (!capacitacion) {
    return (
      <div className={styles.container}>
        <p className={styles.loading}>No se encontró la capacitación</p>
      </div>
    );
  }

  const totalLecciones = capacitacion.modulos?.reduce(
    (acc, mod) => acc + (mod.lecciones?.length || 0),
    0
  ) || 0;
  const leccionesCompletadas = capacitacion.modulos?.reduce(
    (acc, mod) =>
      acc +
      (mod.lecciones?.filter((lec) => lec.completada)?.length || 0),
    0
  ) || 0;
  const porcentajeLecciones = totalLecciones > 0 ? Math.round((leccionesCompletadas / totalLecciones) * 100) : 0;

  return (
    <div className={styles.container}>
      {/* Encabezado con imagen y datos principales */}
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <h2 className={styles.headerTitle}>{capacitacion.titulo}</h2>
        </div>
        <div className={styles.imageContainer}>
          {capacitacion.imagen ? (
            <img src={capacitacion.imagen} alt={capacitacion.titulo} className={styles.headerImage} />
          ) : (
            <div className={styles.imagePlaceholder}>Sin imagen</div>
          )}
        </div>

        <div className={styles.headerContent}>
          <h3 className={styles.descriptionTitle}>Descripción</h3>
          <p className={styles.description}>{capacitacion.descripcion}</p>

          <div className={styles.progressSection}>
            <div className={styles.progressLabel}>Tu progreso</div>
            <div className={styles.progressBarContainer}>
              <div className={styles.progressBar}>
                <div
                  className={styles.progressFill}
                  style={{ width: `${porcentajeLecciones}%` }}
                />
              </div>
              <span className={styles.progressPercent}>
                {leccionesCompletadas} de {totalLecciones} lecciones completadas
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Sección de módulos y lecciones */}
      <div className={styles.modulosList}>
        {capacitacion.modulos && capacitacion.modulos.length > 0 ? (
          capacitacion.modulos.map((modulo, moduloIndex) => (
            <div key={moduloIndex} className={styles.moduloCard}>
              <div
                className={styles.moduloHeader}
                onClick={() => toggleModulo(moduloIndex)}
              >
                <div className={styles.moduloHeaderLeft}>
                  <h3 className={styles.moduloTitle}>{modulo.nombre_modulo}</h3>
                  <p className={styles.moduloInfo}>
                    {modulo.lecciones?.length || 0} de {modulo.lecciones?.length || 0} lecciones · {modulo.lecciones?.[0]?.duracion || '2h 30m'}
                  </p>
                </div>
                <div className={styles.moduloProgress}>
                  <div className={styles.progressBarSmall}>
                    <div
                      className={styles.progressFillSmall}
                      style={{ width: `${Math.round((modulo.lecciones?.filter(l => l.completada)?.length || 0) / (modulo.lecciones?.length || 1) * 100)}%` }}
                    />
                  </div>
                  <span className={styles.progressPercentSmall}>
                    {Math.round((modulo.lecciones?.filter(l => l.completada)?.length || 0) / (modulo.lecciones?.length || 1) * 100)}%
                  </span>
                  <span className={styles.expandIcon}>
                    {expandedModulos[moduloIndex] ? "˄" : "˅"}
                  </span>
                </div>
              </div>

              {expandedModulos[moduloIndex] && (
                <div className={styles.leccionesList}>
                  {modulo.lecciones && modulo.lecciones.length > 0 ? (
                    modulo.lecciones.map((leccion, leccionIndex) => (
                      <div key={leccionIndex} className={styles.leccionItem}>
                        <div className={styles.leccionCheckbox}>
                          {leccion.completada ? (
                            <span className={styles.checkmark}>✓</span>
                          ) : (
                            <span className={styles.circleEmpty}>○</span>
                          )}
                        </div>
                        <div className={styles.leccionInfo}>
                          <p className={styles.leccionTitle}>{leccion.titulo_leccion}</p>
                          <div className={styles.leccionDuration}>{leccion.duracion}</div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className={styles.noLecciones}>No hay lecciones en este módulo</p>
                  )}
                </div>
              )}
            </div>
          ))
        ) : (
          <p className={styles.noModulos}>No hay módulos disponibles</p>
        )}
      </div>
    </div>
  )
}

import { useState, useEffect} from "react";
import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import styles from "./Styles/perfil.module.css";
import perfilService from "../services/perfil";

interface Capacitacion {
  id_capacitacion: number;
  nombre_capacitacion: string;
  completada: boolean;
  progreso: number;
  total_lecciones?: number;
  lecciones_completadas?: number;
}

interface PerfilData {
  id_colaborador: number;
  nombre_colaborador: string;
  apellido_colaborador: string;
  correo_colaborador: string;
  telefo_colaborador: string;
  nombre_centroOP: string;
  nombre_empresa: string;
  nombre_nivel: string;
  nombre_regional: string;
  nombre_cargo: string;
  nombre_proyecto: string;
  nombre_unidad: string;
  capacitaciones_totales: number;
  capacitaciones_completadas: number;
  capacitaciones: Capacitacion[];
}


export default function PerfilUser() {
  const navigate = useNavigate();
  const { id_colaborador } = useParams(); // coincide con :id_colaborador from route  
  const [perfil, setPerfil] = useState<PerfilData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"capacitaciones" | "certificados" | "informacion">("capacitaciones");

    useEffect(() => {
    if (id_colaborador) {
      cargarPerfilPorId(Number(id_colaborador));
    } else {
      loadPerfilUsuarioLogueado();
    }
    }, [id_colaborador]);

    const loadPerfilUsuarioLogueado = async () => {
    try {
        setLoading(true);
        setError(null);
      // El servicio sin id corresponde al perfil del usuario logueado
      const data = await perfilService.getPerfil();
      console.log("Perfil (logueado) cargado:", data);
        setPerfil(data);
    } catch (err: any) {
        console.error("Error al cargar perfil logueado:", err);
        setError(err.message || "Error al cargar el perfil");
    } finally {
        setLoading(false);
    }
    };

    
    const cargarPerfilPorId = async (id: number) => {
    try {
        setLoading(true);
        setError(null);
      const data = await perfilService.getPerfilUserById(id); // <-- CORRECTO: obtiene perfil por id de colaborador
      console.log(`Perfil cargado por id ${id}:`, data);
        setPerfil(data);
    } catch (err: any) {
        console.error("Error al cargar perfil por ID:", err);
        setError(err.message || "Error al cargar el perfil por ID");
    } finally {
        setLoading(false);
    }
    };


  if (loading) {
    return (
      <div className={styles.container}>
        <p className={styles.loading}>Cargando perfil...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <p className={styles.error}>Error: {error}</p>
      </div>
    );
  }

  if (!perfil) {
    return (
      <div className={styles.container}>
        <p className={styles.error}>No se encontró información del perfil</p>
      </div>
    );
  }
  

  return (
    <div className={styles.container}>
      {/* Header del Perfil */}
      <div className={styles.profileHeader}>
        <div className={styles.avatarContainer}>
          <div className={styles.avatar}>
            {perfil.nombre_colaborador.charAt(0).toUpperCase()}
            {perfil.apellido_colaborador.charAt(0).toUpperCase()}
          </div>
        </div>

        <div className={styles.profileInfo}>
          <h1 className={styles.profileName}>
            {perfil.nombre_colaborador} {perfil.apellido_colaborador}
          </h1>
          <p className={styles.profileEmail}>{perfil.correo_colaborador}</p>
          <div className={styles.profileDetails}>
            <div className={styles.detailItem}>
              <p className={styles.profileLabel}>Teléfono</p>
              <p className={styles.profileValue}>{perfil.telefo_colaborador}</p>
            </div>
            <div className={styles.detailItem}>
              <p className={styles.profileLabel}>Empresa</p>
              <p className={styles.profileValue}>{perfil.nombre_empresa}</p>
            </div>
            <div className={styles.detailItem}>
              <p className={styles.profileLabel}>Cargo</p>
              <p className={styles.profileValue}>{perfil.nombre_cargo}</p>
            </div>
          </div>
        </div>

        <div className={styles.statsContainer}>
          <div className={styles.stat}>
            <div className={styles.statIcon}>📚</div>
            <p className={styles.statLabel}>Capacitaciones</p>
            <p className={styles.statValue}>{perfil.capacitaciones_totales}</p>
          </div>
          <div className={styles.stat}>
            <div className={styles.statIcon}>✅</div>
            <p className={styles.statLabel}>Capacitaciones completadas</p>
            <p className={styles.statValue}>{perfil.capacitaciones_completadas}</p>
          </div>
          <div className={styles.stat}>
            <div className={styles.statIcon}>🏆</div>
            <p className={styles.statLabel}>Certificados</p>
            <p className={styles.statValue}>{perfil.capacitaciones_completadas}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabsContainer}>
        <button
          className={`${styles.tab} ${activeTab === "capacitaciones" ? styles.active : ""}`}
          onClick={() => setActiveTab("capacitaciones")}
        >
          Capacitaciones
        </button>
        <button
          className={`${styles.tab} ${activeTab === "informacion" ? styles.active : ""}`}
          onClick={() => setActiveTab("informacion")}
        >
          Información
        </button>
      </div>

      {/* Content */}
      <div className={styles.content}>
        {activeTab === "capacitaciones" && (
          <div className={styles.capacitacionesGrid}>
            {perfil.capacitaciones.map((cap) => (
              <div key={cap.id_capacitacion} className={styles.capacitacionCard}>
                <div className={styles.cardHeader}>
                  <h3 className={styles.cardTitle}>{cap.nombre_capacitacion}</h3>
                </div>

                <p className={styles.progressLabel}>Progreso</p>

                <div className={styles.progressContainer}>
                  <div className={styles.progressBar}>
                    <div
                      className={styles.progressFill}
                      style={{ width: `${cap.progreso}%` }}
                    ></div>
                  </div>
                </div>

                <p className={styles.progressText}>
                  Lecciones <span className={styles.progressNumber}>{cap.progreso}%</span>
                </p>

                <p className={styles.leccionesInfo}>
                  {cap.lecciones_completadas || 0} de {cap.total_lecciones || 0} lecciones completadas
                </p>

                <button 
                  className={styles.buttonContinuar}
                  onClick={() => {
                      navigate(`/user/perfil/${id_colaborador}/capacitaciones/${cap.id_capacitacion}`);     
                  }}
                >
                  ▶ ver avance
                </button>
              </div>
            ))}
          </div>
        )}

        {activeTab === "certificados" && (
          <div className={styles.emptyState}>
            <p>No hay certificados disponibles</p>
          </div>
        )}

        {activeTab === "informacion" && (
          <div className={styles.informacionContainer}>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <label className={styles.infoLabel}>Empresa</label>
                <p className={styles.infoValue}>{perfil.nombre_empresa}</p>
              </div>
              <div className={styles.infoItem}>
                <label className={styles.infoLabel}>Centro de Operación</label>
                <p className={styles.infoValue}>{perfil.nombre_centroOP}</p>
              </div>
              <div className={styles.infoItem}>
                <label className={styles.infoLabel}>Regional</label>
                <p className={styles.infoValue}>{perfil.nombre_regional}</p>
              </div>
              <div className={styles.infoItem}>
                <label className={styles.infoLabel}>Proyecto</label>
                <p className={styles.infoValue}>{perfil.nombre_proyecto}</p>
              </div>
              <div className={styles.infoItem}>
                <label className={styles.infoLabel}>Unidad</label>
                <p className={styles.infoValue}>{perfil.nombre_unidad}</p>
              </div>
              <div className={styles.infoItem}>
                <label className={styles.infoLabel}>Nivel</label>
                <p className={styles.infoValue}>{perfil.nombre_nivel}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


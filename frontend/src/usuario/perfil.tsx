import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Styles/perfil.module.css";
// @ts-ignore
import perfilService from "../services/perfil.js";
// @ts-ignore
import CapListService from "../services/Capacitaciones.js";

interface Capacitacion {
  id_capacitacion: number;
  nombre_capacitacion: string;
  completada: boolean;
  progreso: number;
  fecha_completacion?: string;
  estado_capacitacion?: number;
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

export default function Perfil() {
  const navigate = useNavigate();
  const [perfil, setPerfil] = useState<PerfilData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<Record<number, boolean>>({});
  const [activeTab, setActiveTab] = useState<"capacitaciones" | "certificados" | "informacion">("capacitaciones");

  useEffect(() => {
    loadPerfil();
  }, []);

  const loadPerfil = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await perfilService.getPerfil();
      setPerfil(data as PerfilData);
    } catch (err: any) {
      console.error("Error al cargar perfil:", err);
      setError(err.message || "Error al cargar el perfil");
    } finally {
      setLoading(false);
    }
  };

  // Función memoizada para descargar certificado
  // Esto evita que se cree una nueva función en cada render
  const handleDescargarCertificado = useCallback(
    async (cap: Capacitacion) => {
      const capId = cap.id_capacitacion;
      
      // Verificar que tenemos el ID del colaborador
      if (!perfil || !perfil.id_colaborador) {
        alert('Error: No se pudo obtener el ID del colaborador');
        return;
      }
      
      const colaboradorId = perfil.id_colaborador;
      
      try {
        // Cambiar a descargando
        console.log(`[${capId}] Iniciando descarga de certificado para colaborador ${colaboradorId}...`);
        setDownloading((prev) => ({ ...prev, [capId]: true }));

        // Hacer petición al backend CON el ID del colaborador
        console.log(`[${capId}] Solicitando certificado al backend (capacitacion: ${capId}, colaborador: ${colaboradorId})...`);
        const blob = await CapListService.certificadoDescargar(capId, colaboradorId);

        // Verificar si es error JSON
        if (blob.type === 'application/json') {
          const text = await blob.text();
          try {
            const json = JSON.parse(text);
            alert(json.error || json.detail || text);
          } catch {
            alert(text);
          }
          // Resetear estado incluso en error
          setDownloading((prev) => ({ ...prev, [capId]: false }));
          return;
        }

        // Solo aceptar PDF - rechazar cualquier otro tipo
        if (blob.type !== 'application/pdf') {
          console.error('Tipo de blob incorrecto:', {
            esperado: 'application/pdf',
            recibido: blob.type,
            size: blob.size,
            firstBytes: await blob.slice(0, 50).text().catch(() => 'error reading')
          });
          alert(`Error: El servidor retornó un tipo de archivo incorrecto.\n\nEsperado: application/pdf\nRecibido: ${blob.type}\n\nContacte al administrador si el problema persiste.`);
          // Resetear estado incluso en error
          setDownloading((prev) => ({ ...prev, [capId]: false }));
          return;
        }

        // Crear descarga PDF con nombre basado en capacitación (sin cache)
        console.log(`[${capId}] Creando descarga...`);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        
        // Nombre de archivo: certificado_[nombre_capacitacion].pdf
        const nombreCapacitacion = cap.nombre_capacitacion
          .toLowerCase()
          .replace(/\s+/g, '_')
          .replace(/[^a-z0-9_]/g, '');
        a.download = `certificado_${nombreCapacitacion}.pdf`;
        
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);

        console.log(`✓ [${capId}] Certificado generado sin cache: certificado_${nombreCapacitacion}.pdf`);

        // Resetear estado SIEMPRE al final de una descarga exitosa
        setDownloading((prev) => ({ ...prev, [capId]: false }));
        
      } catch (err: any) {
        console.error(`[${capId}] Error al descargar certificado:`, err);
        
        // Si la respuesta es un blob (error del backend), intenta leer el mensaje
        if (err?.response?.data instanceof Blob) {
          err.response.data.text().then((text: string) => {
            try {
              const json = JSON.parse(text);
              alert(json.error || json.detail || text);
            } catch {
              alert(text);
            }
          });
        } else {
          alert(err?.message || 'Error al descargar el certificado');
        }

        // Resetear estado EN EL CATCH TAMBIÉN
        setDownloading((prev) => ({ ...prev, [capId]: false }));
      }
    },
    [perfil] // Agregar perfil como dependencia para acceder al valor actual
  );

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
          className={`${styles.tab} ${activeTab === "certificados" ? styles.active : ""}`}
          onClick={() => setActiveTab("certificados")}
        >
          Certificados
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

                {/* Botón según estado y completada */}
                {cap.completada ? (
                  <button className={styles.buttonCompletada} disabled>
                    Capacitación completada
                  </button>
                ) : cap.estado_capacitacion !== 1 ? (
                  <button className={styles.buttonFinalizada} disabled>
                    Capacitación desactivada
                  </button>
                ) : (
                  <button 
                    className={styles.buttonContinuar}
                    onClick={() => navigate(`/capacitaciones/${cap.id_capacitacion}`)}
                  >
                    ▶ Continuar
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === "certificados" && (
          <div>
            {perfil.capacitaciones.filter((c) => c.completada).length === 0 ? (
              <div className={styles.emptyState}>
                <p>No hay certificados disponibles</p>
              </div>
            ) : (
              <div className={styles.certificadosGrid}>
                {perfil.capacitaciones
                  .filter((c) => c.completada)
                  .map((cap) => (
                    <div key={cap.id_capacitacion} className={styles.certCard}>
                      <div className={styles.certTop}>
                        <div className={styles.certIcon}>🏅</div>
                        <div className={styles.certBadgeScore}>Puntuación: {cap.progreso}%</div>
                      </div>

                      <h3 className={styles.certTitle}>{cap.nombre_capacitacion}</h3>

                      <p className={styles.certMeta}>
                        Emitido: {cap.fecha_completacion ? new Date(cap.fecha_completacion).toLocaleDateString('es-ES') : ' -- '}
                      </p>
                      <p className={styles.certNumber}>CERT-{String(cap.id_capacitacion).padStart(6, "0")}</p>

                      <div className={styles.certActions}>
                        {
                        <button
                          className={styles.buttonGenerar}
                          disabled={!!downloading[cap.id_capacitacion]}
                          onClick={() => handleDescargarCertificado(cap)}
                        >
                          {downloading[cap.id_capacitacion] ? 'Descargando...' : 'Generar PDF'}
                        </button>
                        }
                      </div>
                    </div>
                  ))}
              </div>
            )}
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


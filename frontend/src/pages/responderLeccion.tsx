import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styles from "./Styles/responderLeccion.module.css";
import CapListService from "../services/Capacitaciones";
import { normalizeDataUrl } from "../utils/media";

interface Respuesta {
  id: number;
  valor: string;
  es_correcto: number;
  url_archivo?: string;
}

interface Pregunta {
  id: number;
  pregunta: string;
  tipo_pregunta: string;
  url_multimedia?: string;
  respuestas: Respuesta[];
}

interface Leccion {
  id: number;
  titulo_leccion: string;
  tipo_leccion: string;
  url: string;
  duracion?: string;
  descripcion?: string;
  completada?: boolean;
  intentos?: number;
  preguntas?: Pregunta[];
}

export default function ResponderLeccion() {
  const { capacitacionId, moduloIndex, leccionIndex } = useParams<{
    capacitacionId: string;
    moduloIndex: string;
    leccionIndex: string;
  }>();
  const navigate = useNavigate();
  const [leccion, setLeccion] = useState<Leccion | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Respuestas seleccionadas: { preguntaId: respuestaId } para opción única
  // o { preguntaId: [respuestaIds] } para múltiple
  const [respuestasSeleccionadas, setRespuestasSeleccionadas] = useState<{
    [key: number]: number | number[];
  }>({});

  // Respuestas abiertas: { preguntaId: texto } para preguntas de tipo abierta
  const [respuestasAbiertas, setRespuestasAbiertas] = useState<{
    [key: number]: string;
  }>({});
  const [preguntasInvalidas, setPreguntasInvalidas] = useState<Set<number>>(new Set());

  useEffect(() => {
    loadCapacitacion();
  }, [capacitacionId, moduloIndex, leccionIndex]);

  const loadCapacitacion = async () => {
    try {
      setLoading(true);
      setError(null);

      if (
        !capacitacionId ||
        moduloIndex === undefined ||
        leccionIndex === undefined
      ) {
        setError("Parámetros no válidos");
        setLoading(false);
        return;
      }

      const data: any = await CapListService.getCapacitacionById(
        capacitacionId
      );

      // Obtener la lección específica
      const modIdx = parseInt(moduloIndex);
      const lecIdx = parseInt(leccionIndex);

      if (
        data.modulos &&
        data.modulos[modIdx] &&
        data.modulos[modIdx].lecciones[lecIdx]
      ) {
        const leccionData = data.modulos[modIdx].lecciones[lecIdx];
        // Normalize fields that may differ depending on backend naming
        if (leccionData.preguntas && Array.isArray(leccionData.preguntas)) {
          leccionData.preguntas = leccionData.preguntas.map((p: any) => ({
            ...p,
            url_multimedia: p.url_multimedia || p.url_media || null,
            respuestas: (p.respuestas || []).map((r: any) => ({
              ...r,
              url_archivo: r.url_archivo || r.url_imagen || r.url || null,
            })),
          }));
        }
        setLeccion(leccionData);
      } else {
        setError("Lección no encontrada");
      }
    } catch (err: any) {
      console.error("Error:", err);
      setError(err.message || "Error al cargar la lección");
    } finally {
      setLoading(false);
    }
  };

  const handleRespuestaChange = (
    preguntaId: number,
    respuestaId: number,
    esMultiple: boolean
  ) => {
    // Asegurar que los IDs sean números para comparaciones estrictas
    const pId = Number(preguntaId);
    const rId = Number(respuestaId);
    setRespuestasSeleccionadas((prev) => {
      // crear copia superficial del objeto de estado
      const nuevas: { [key: number]: number | number[] } = { ...prev };

      if (esMultiple) {
        // Para múltiple selección: no mutar arrays en sitio, crear copia
        const prevArr = Array.isArray(prev[pId])
          ? (prev[pId] as number[])
          : [];
        const arr = [...prevArr];

        const index = arr.indexOf(rId);
        if (index > -1) {
          // quitar
          const newArr = arr.filter((id) => id !== rId);
          if (newArr.length === 0) {
            delete nuevas[pId];
          } else {
            nuevas[pId] = newArr;
          }
        } else {
          // agregar
          nuevas[pId] = [...arr, rId];
        }
      } else {
        // Para opción única: si ya está seleccionada la misma respuesta, deseleccionar
        const current = prev[pId];
        if (current === rId) {
          // quitar selección
          delete nuevas[pId];
        } else {
          nuevas[pId] = rId;
        }
      }

      return nuevas;
    });
  };

  const isAbiertaTipo = (tipo: string) => {
    if (!tipo) return false;
    const normalizado = tipo
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "_")
      .trim();
    return /abierta|open|libre|texto/.test(normalizado);
  };

  const enviarRespuestas = async () => {
    try {
      setSubmitting(true);
      setError(null);

      if (!leccion || !leccion.id) {
        setError("Lección no válida");
        return;
      }

      // Validar que todas las preguntas tengan respuesta
      const invalidas = new Set<number>();
      for (const pregunta of leccion.preguntas || []) {
        const pId = Number(pregunta.id);
        if (isAbiertaTipo(pregunta.tipo_pregunta)) {
          if (!(respuestasAbiertas[pId] || "").trim()) invalidas.add(pId);
        } else {
          const sel = respuestasSeleccionadas[pId];
          if (!sel || (Array.isArray(sel) && sel.length === 0)) invalidas.add(pId);
        }
      }
      if (invalidas.size > 0) {
        setPreguntasInvalidas(invalidas);
        setError("Por favor responde todas las preguntas marcadas en rojo.");
        // Scroll a la primera pregunta inválida
        const primerInvalido = leccion.preguntas.find(p => invalidas.has(Number(p.id)));
        if (primerInvalido) {
          document.getElementById(`pregunta-${primerInvalido.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
        }
        return;
      }
      setPreguntasInvalidas(new Set());

      // Construir array de IDs de respuestas (cerradas)
      const respuestas: number[] = [];
      Object.values(respuestasSeleccionadas).forEach((val) => {
        if (Array.isArray(val)) {
          respuestas.push(...val);
        } else {
          respuestas.push(val);
        }
      });

      // Construir textos de respuestas abiertas
      const textosAbiertos: { [key: string]: string } = {};
      for (const pregunta of leccion.preguntas || []) {
        if (!isAbiertaTipo(pregunta.tipo_pregunta)) continue;
        const pId = Number(pregunta.id);
        textosAbiertos[String(pId)] = (respuestasAbiertas[pId] || "").trim();
      }

      // Llamar servicio para enviar respuestas
      const payload = {
        respuestas,
        respuestas_abiertas: textosAbiertos,
      };

      await (CapListService as any).enviarRespuestasFormulario(
        capacitacionId,
        leccion.id,
        payload
      );

      // Mostrar éxito y redirigir
      alert("¡Respuestas enviadas correctamente!");
      navigate(`/capacitaciones/${capacitacionId}`);
    } catch (err: any) {
      console.error("Error al enviar respuestas:", err);
      setError(err.message || "Error al enviar las respuestas");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <p className={styles.loading}>Cargando formulario...</p>
      </div>
    );
  }

  // El error de validación se muestra dentro del formulario, no como pantalla completa

  if (
    !leccion ||
    !leccion.preguntas ||
    leccion.preguntas.length === 0
  ) {
    return (
      <div className={styles.container}>
        <p className={styles.loading}>
          No hay preguntas en este formulario
        </p>
      </div>
    );
  }

  // Detectar si la pregunta permite múltiples respuestas según su tipo
  // Se normaliza y luego se busca por palabras clave como 'multiple' u 'unica'
  const normalizeType = (s: string) => {
    if (!s) return "";
    // eliminar marcas diacríticas
    const noDiacritics = s
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
    return noDiacritics
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "_")
      .trim();
  };

  const preguntasMultiples = leccion.preguntas.map((p) => {
    const tipoRaw = (p.tipo_pregunta || "").toString();
    const tipo = normalizeType(tipoRaw);

    // Detectar explícitamente selección única -> no múltiple
    const isUnica = /unica|seleccion_unica|seleccion_unica/.test(tipo);

    // Detectar múltiples mediante palabras clave normalizadas
    const isMultiple =
      /multiple|opcion_multiple|multiple_choice|seleccion_multiple/.test(tipo);

    if (isMultiple && !isUnica) return true;

    // Fallback: si el backend no define tipo, inferir por respuestas correctas
    const respuestasCorrectas = p.respuestas.filter(
      (r) => r.es_correcto
    ).length;
    return respuestasCorrectas > 1;
  });

  const preguntasAbiertas = leccion.preguntas.map((p: Pregunta) => {
    const tipo = normalizeType((p.tipo_pregunta || "").toString());
    return /abierta|open|libre|texto/.test(tipo);
  });

  // Calcular la altura mínima de respuesta para cada pregunta basada en el texto más largo
  const calculateMinHeightPerQuestion = (preguntas: Pregunta[]) => {
    const minHeights: { [key: number]: number } = {};
    preguntas.forEach((pregunta) => {
      const maxLongitud = Math.max(
        ...pregunta.respuestas.map((r) => r.valor.length)
      );
      // Estimar altura: ~50 caracteres por línea en el ancho típico
      const lineasEstimadas = Math.ceil(maxLongitud / 50);
      // Altura mínima: 44px base + (líneas - 1) * 24px (altura aproximada de línea)
      const alturaMinima = Math.max(44, 44 + (lineasEstimadas - 1) * 24);
      minHeights[pregunta.id] = alturaMinima;
    });
    return minHeights;
  };

  const minHeightsPorPregunta = calculateMinHeightPerQuestion(
    leccion.preguntas
  );

  // Helper: determine if we can show an image and get its normalized src
  const normalizeImageSrc = (u?: string | null) => {
    const normalized = normalizeDataUrl(u as any, "image");
    return normalized || null;
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.headerTitle}>{leccion.titulo_leccion}</h2>
        {leccion.descripcion && (
          <p className={styles.description}>{leccion.descripcion}</p>
        )}
      </div>

      <div className={styles.formularioContainer}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            enviarRespuestas();
          }}
        >
          {leccion.preguntas.map((pregunta, preguntaIdx) => {
            const esMultiple = preguntasMultiples[preguntaIdx];
            const esAbierta = preguntasAbiertas[preguntaIdx];
            const pIdNum = Number(pregunta.id);
            const respuestasSeleccionadasPregunta =
              respuestasSeleccionadas[pIdNum];

            const esInvalida = preguntasInvalidas.has(pIdNum);

            return (
              <div
                key={pregunta.id}
                id={`pregunta-${pregunta.id}`}
                className={styles.preguntaCard}
                style={esInvalida ? { border: "2px solid #C0281B", borderRadius: 8 } : undefined}
              >
                <div className={styles.preguntaHeader}>
                  <div className={styles.questionLabel}>
                    pregunta {preguntaIdx + 1}.
                  </div>
                  {esAbierta && (
                    <span className={styles.badge}>
                      Respuesta abierta
                    </span>
                  )}
                  {!esAbierta && esMultiple && (
                    <span className={styles.badge}>
                      Selecciona múltiples
                    </span>
                  )}
                </div>

                {normalizeImageSrc(pregunta.url_multimedia) && (
                  <div className={styles.preguntaMedia}>
                    <img
                      src={
                        normalizeImageSrc(
                          pregunta.url_multimedia
                        ) as string
                      }
                      alt={`Pregunta ${preguntaIdx + 1}`}
                      className={styles.preguntaImage}
                      onError={(e) => {
                        (
                          e.currentTarget as HTMLImageElement
                        ).style.display = "none";
                      }}
                    />
                  </div>
                )}

                <div className={styles.questionBox}>
                  {pregunta.pregunta}
                </div>

                {esAbierta ? (
                  <>
                    <textarea
                      className={styles.textareaAbierta}
                      placeholder="Escribe tu respuesta aquí..."
                      value={respuestasAbiertas[pIdNum] || ""}
                      onChange={(e) => {
                        setRespuestasAbiertas((prev) => ({ ...prev, [pIdNum]: e.target.value }));
                        if (e.target.value.trim()) setPreguntasInvalidas(prev => { const s = new Set(prev); s.delete(pIdNum); return s; });
                      }}
                      rows={5}
                      required
                    />
                    {esInvalida && <span style={{ color: "#C0281B", fontSize: 13, marginTop: 4, display: "block" }}>Este campo es obligatorio.</span>}
                  </>
                ) : (
                  <>
                  {esInvalida && <span style={{ color: "#C0281B", fontSize: 13, marginBottom: 6, display: "block" }}>Debes seleccionar al menos una opción.</span>}
                  <div
                    className={styles.answersList}
                    style={{
                      minHeight: `${
                        minHeightsPorPregunta[pregunta.id]
                      }px`,
                    }}
                  >
                    {pregunta.respuestas.map(
                      (respuesta, respIdx) => {
                        const rIdNum = Number(respuesta.id);
                        let isSelected = false;
                        if (
                          Array.isArray(
                            respuestasSeleccionadasPregunta
                          )
                        ) {
                          isSelected = (
                            respuestasSeleccionadasPregunta as number[]
                          ).includes(rIdNum);
                        } else {
                          isSelected =
                            respuestasSeleccionadasPregunta === rIdNum;
                        }

                        return (
                          <div
                            key={respuesta.id}
                            className={styles.respuestaItem}
                          >
                            <div className={styles.respuestaCard}>
                              {normalizeImageSrc(
                                respuesta.url_archivo
                              ) && (
                                <div
                                  className={
                                    styles.respuestaMediaTop
                                  }
                                >
                                  <img
                                    src={
                                      normalizeImageSrc(
                                        respuesta.url_archivo
                                      ) as string
                                    }
                                    alt={`Respuesta ${
                                      respIdx + 1
                                    }`}
                                    className={
                                      styles.respuestaImage
                                    }
                                    onError={(e) => {
                                      (
                                        e.currentTarget as HTMLImageElement
                                      ).style.display = "none";
                                    }}
                                  />
                                </div>
                              )}
                              <div className={styles.answerRow}>
                                <button
                                  type="button"
                                  className={
                                    styles.selector +
                                    " " +
                                    (esMultiple
                                      ? styles.square
                                      : styles.circle) +
                                    (isSelected
                                      ? " " + styles.selected
                                      : "")
                                  }
                                  onClick={() => {
                                    handleRespuestaChange(pIdNum, rIdNum, esMultiple);
                                    setPreguntasInvalidas(prev => { const s = new Set(prev); s.delete(pIdNum); return s; });
                                  }}
                                  aria-pressed={isSelected}
                                />
                                <div
                                  className={styles.answerField}
                                >
                                  {respuesta.valor}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      }
                    )}
                  </div>
                  </>
                )}
              </div>
            );
          })}

          {error && (
            <div style={{ background: "#fee", border: "1px solid #C0281B", borderRadius: 6, padding: "10px 16px", marginBottom: 16, color: "#C0281B", fontWeight: 500 }}>
              {error}
            </div>
          )}
          <div className={styles.formActions}>
            <button
              type="button"
              className={styles.btnCancel}
              onClick={() =>
                navigate(`/capacitaciones/${capacitacionId}`)
              }
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={styles.btnSubmit}
              disabled={submitting}
            >
              {submitting ? "Enviando..." : "Enviar Respuestas"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
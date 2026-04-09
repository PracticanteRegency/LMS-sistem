import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import styles from "./Styles/CrearCapacitacion.module.css";
import { useNavigate } from "react-router-dom";
import CapListService from "../services/Capacitaciones";
import { normalizeDataUrl } from "../utils/media";
import FileUploadError from "../components/FileUploadError";

const STORAGE_KEY = "crearCapacitacion_formData";
const STORAGE_KEY_MODULOS = "crearCapacitacion_modulos";

interface Respuesta {
  valor: string;
  es_correcto: number;
  url_imagen?: string; // URL (uploadado al servidor)
  preview?: string | null;
  file?: File | null;
}

interface Pregunta {
  file?: File | null;
  pregunta: string;
  tipo_pregunta: string;
  url_multimedia?: string; // URL (uploadado al servidor)
  respuestas: Respuesta[];
  preview?: string | null; // URL temporal para previsualización
}

interface Leccion {
  titulo_leccion: string;
  descripcion?: string;
  duracion?: string;
  tipo_leccion: "video" | "imagen" | "pdf" | "formulario";
  url?: string;          // URL (uploadado al servidor)
  preview?: string | null;   // URL temporal para previsualización en el front
  file?: File | null;        // Para cargar/reemplazar archivo
  preguntas?: Pregunta[];
}


interface Modulo {
  nombre_modulo: string;
  lecciones: Leccion[];
}

interface Colaborador {
  id?: number;
  id_colaborador?: number;
  nombre?: string;
  nombre_colaborador?: string;
  email?: string;
  cargo?: string;
  empresa?: string;
  cc?: string;
  tipo?: string;
  cc_colaborador?: string;
  apellido?: string;
  apellido_colaborador?: string;
}

interface FormDataType {
  titulo: string;
  descripcion: string;
  imagen: string;
  fecha_inicio: string;
  fecha_fin: string;
  tipo: string;
  imagenFile: File | null;
  imagenPreview: string | null;
}

interface ExpandedState {
  [key: number]: boolean;
}

interface ExpandedLeccionesState {
  [key: string]: boolean;
}

interface FileUploadErrorType {
  message: string;
  type: 'error' | 'success' | 'warning';
}

export default function CrearCapacitacion(): React.ReactElement {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormDataType>({
    titulo: "",
    descripcion: "",
    imagen: "",
    fecha_inicio: "",
    fecha_fin: "",
    tipo: "CONOCIMIENTOS ORGANIZACIONALES",
    imagenFile: null as File | null,
    imagenPreview: "" as string | null,
  });
  // Cargar datos guardados al montar
  useEffect(() => {
    // Si venimos con un id, cargamos la capacitación para editar
    const loadIfEdit = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const data: any = await (CapListService as any).getCapacitacionDetalle(id);
        if (!data) return;

        setFormData((prev) => ({
          ...prev,
          titulo: data.titulo || prev.titulo,
          descripcion: data.descripcion || prev.descripcion,
          imagen: normalizeDataUrl(data.imagen) || "",
          fecha_inicio: data.fecha_inicio ? (data.fecha_inicio.split("T")[0]) : prev.fecha_inicio,
          fecha_fin: data.fecha_fin ? (data.fecha_fin.split("T")[0]) : prev.fecha_fin,
          tipo: data.tipo || prev.tipo,
          imagenFile: null,
          imagenPreview: normalizeDataUrl(data.imagen) || "",
        }));

        // Normalizar URLs de imágenes en módulos, lecciones y respuestas, y mapear escorrecto a es_correcto
        const modulosNorm = (data.modulos || []).map((mod: Modulo) => ({
          ...mod,
          lecciones: (mod.lecciones || []).map((lec: Leccion) => ({
            ...lec,
            file: null,  // ← Inicializar file para que no se envíe vacío en edición
            url: normalizeDataUrl(lec.url),
            preview: lec.preview ? normalizeDataUrl(lec.preview) : undefined,
            preguntas: (lec.preguntas || []).map((preg: Pregunta) => ({
              ...preg,
              file: null,  // ← Inicializar file para preguntas
              url_multimedia: normalizeDataUrl(preg.url_multimedia),
              preview: preg.preview ? normalizeDataUrl(preg.preview) : undefined,
              respuestas: (preg.respuestas || []).map((resp: any) => ({
                valor: resp.valor || "",
                file: null,  // ← Inicializar file para respuestas
                url_imagen: normalizeDataUrl(resp.url_imagen),
                preview: resp.preview ? normalizeDataUrl(resp.preview) : undefined,
                es_correcto: typeof resp.escorrecto !== 'undefined' ? (resp.escorrecto === 1 ? 1 : 0) : (typeof resp.es_correcto !== 'undefined' ? (resp.es_correcto === 1 ? 1 : 0) : 0),
              })),
            })),
          })),
        }));
        setModulos(modulosNorm);
        const cols = data.colaboradores || [];
        setColaboradores(cols);
        setColaboradoresFiltrados(cols);
      } catch (e) {
        console.error('Error cargando capacitación para editar', e);
      } finally {
        setLoading(false);
      }
    };

    loadIfEdit();
    // Eliminar carga de datos guardados en localStorage para que siempre inicie vacío
  }, []);

  // Auto-guardar formData
  useEffect(() => {
    const { imagenFile, imagenPreview, ...safeData } = formData as any;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(safeData));
  }, [formData]);

  const CAP_TYPES = [
    "CONOCIMIENTOS ORGANIZACIONALES",
    "CONOCIMIENTOS TÉCNICOS",
    "HABILIDADES BLANDAS",
    "HABILIDADES TECNICAS",
    "SOCIAL",
    "LEGAL",
    "INDUCCIÓN CORPORATIVA",
    "ENCUESTA",
  ];

  const [modulos, setModulos] = useState<Modulo[]>([]);

  // Auto-guardar modulos
  useEffect(() => {
    if (modulos.length > 0) {
      localStorage.setItem(STORAGE_KEY_MODULOS, JSON.stringify(modulos));
    }
  }, [modulos]);

  const [expandedModulos, setExpandedModulos] = useState<ExpandedState>({});
  const [expandedLecciones, setExpandedLecciones] = useState<ExpandedLeccionesState>({});
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [colaboradoresFiltrados, setColaboradoresFiltrados] = useState<Colaborador[]>([]);
  const [searchColaborador, setSearchColaborador] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [fileUploadError, setFileUploadError] = useState<FileUploadErrorType | null>(null);
  const today = new Date().toISOString().split("T")[0];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

const handleImagenPrincipal = async (file: File | null): Promise<void> => {
  if (!file) {
    // Limpiar imagen seleccionada
    setFormData({ ...formData, imagen: "", imagenFile: null as any, imagenPreview: "" as any });
    return;
  }

  // Validar que sea imagen permitida por backend
  const nameLower = (file.name || '').toLowerCase();
  const isImg = file.type?.startsWith('image/') && (nameLower.endsWith('.jpg') || nameLower.endsWith('.jpeg') || nameLower.endsWith('.png'));
  if (!isImg) {
    alert("Solo se aceptan imágenes .jpg/.jpeg/.png");
    return;
  }

  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    alert("La imagen no puede superar los 5MB");
    return;
  }

  // Guardar el archivo para subir en el submit y mostrar preview temporal
  try {
    try {
      const oldPrev = (formData as any).imagenPreview as string | null;
      if (oldPrev) URL.revokeObjectURL(oldPrev);
    } catch {}
    const previewUrl = URL.createObjectURL(file);
    // Nota: almacenamos imagenFile y imagenPreview para uso en submit
    setFormData({ ...formData, imagen: "", imagenFile: file as any, imagenPreview: previewUrl as any });
  } catch {}
};


  // Filtrar colaboradores por búsqueda
  useEffect(() => {
    if (!searchColaborador.trim()) {
      setColaboradoresFiltrados(colaboradores);
    } else {
      const search = searchColaborador.toLowerCase();
      const filtered = colaboradores.filter((colab) => {
        const nombre = (colab.nombre_colaborador || colab.nombre || "").toLowerCase();
        const apellido = (colab.apellido_colaborador || colab.apellido || "").toLowerCase();
        const cc = (colab.cc_colaborador || colab.cc || "").toLowerCase();
        const id = String(colab.id_colaborador || colab.id || "").toLowerCase();
        
        return nombre.includes(search) || apellido.includes(search) || cc.includes(search) || id.includes(search);
      });
      setColaboradoresFiltrados(filtered);
    }
  }, [searchColaborador, colaboradores]);

  // Crear una nueva lección vacía
const agregarLeccionDirecta = (moduloIndex: number): void => {
  const nuevos = [...modulos];

  const nuevaLeccionIndex = nuevos[moduloIndex].lecciones.length;

  nuevos[moduloIndex].lecciones.push({
    titulo_leccion: "",
    duracion: "",
    descripcion: "",
    tipo_leccion: "video",
    url: "",
    preview: "",
    file: null,
    preguntas: []
  });

  setModulos(nuevos);

  // 👉 abrir automáticamente la nueva lección
  const key = `${moduloIndex}-${nuevaLeccionIndex}`;
  setExpandedLecciones((prev) => ({
    ...prev,
    [key]: true,
  }));
};


const toggleLeccion = (moduloIndex: number, leccionIndex: number): void => {
  const key = `${moduloIndex}-${leccionIndex}`;
  setExpandedLecciones((prev) => ({
    ...prev,
    [key]: !prev[key],
  }));
};

// Eliminar una lección
const eliminarLeccion = (moduloIndex: number, leccionIndex: number): void => {
  const nuevos = [...modulos];

  nuevos[moduloIndex].lecciones.splice(leccionIndex, 1);

  setModulos(nuevos);
};

  const toggleModulo = (index: number): void => {
    setExpandedModulos((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };


  const agregarModulo = (): void => {
    const nuevoModulo: Modulo = {
      nombre_modulo: modulos.length + 1 + ". Módulo",
      lecciones: [],
    };
    setModulos([...modulos, nuevoModulo]);
  };

  // Eliminar un módulo completo
  const eliminarModulo = (index: number): void => {
    if (!confirm('¿Eliminar módulo? Esta acción no se puede deshacer.')) return;
    const nuevos = [...modulos];
    nuevos.splice(index, 1);
    setModulos(nuevos);
    // ajustar estado de expansión
    setExpandedModulos((prev) => {
      const copy: any = {};
      Object.keys(prev).forEach((k) => {
        const num = Number(k);
        if (num < index) copy[num] = prev[num];
        else if (num > index) copy[num - 1] = prev[num];
      });
      return copy;
    });
  };


// Subida de archivos de lección se realizará en handleSubmit

// agregarLeccion was replaced by a modal-based flow: use abrirModalNuevaLeccion(moduloIndex)

const handleLeccionChange = async (
  moduloIndex: number,
  leccionIndex: number,
  field: string,
  value: string | File | null
): Promise<void> => {
  const nuevos = [...modulos];
  const leccion = nuevos[moduloIndex].lecciones[leccionIndex];

  if (field === "file") {
    // No subir aún; guardar archivo y mostrar preview
    if (value instanceof File) {
      const nameLower = (value.name || '').toLowerCase();
      if (leccion.tipo_leccion === 'pdf') {
        const isPdf = value.type === 'application/pdf' || nameLower.endsWith('.pdf');
        if (!isPdf) { alert('Solo se aceptan archivos PDF (.pdf)'); return; }
        leccion.file = value;
        try { leccion.preview = URL.createObjectURL(value); } catch { leccion.preview = null; }
        leccion.url = '';
      } else if (leccion.tipo_leccion === 'imagen') {
        const isImg = value.type?.startsWith('image/') && (nameLower.endsWith('.jpg') || nameLower.endsWith('.jpeg') || nameLower.endsWith('.png'));
        if (!isImg) { alert('Solo se aceptan imágenes .jpg/.jpeg/.png'); return; }
        leccion.file = value;
        try { leccion.preview = URL.createObjectURL(value); } catch { leccion.preview = null; }
        leccion.url = '';
      } else {
        // video/formulario: set url text directly
        leccion.file = null;
      }
      setModulos(nuevos);
    } else {
      leccion.url = "";
      leccion.preview = null;
      leccion.file = null;
      setModulos(nuevos);
    }
  } else {
    (leccion as any)[field] = value;
    setModulos(nuevos);
  }
};

    /* ---------- Formulario handlers (questions & answers) ---------- */
    const agregarPregunta = (moduloIndex: number, leccionIndex: number): void => {
      const nuevos = [...modulos];
      const leccion = nuevos[moduloIndex].lecciones[leccionIndex];
      if (!leccion.preguntas) leccion.preguntas = [];
      const nueva: Pregunta = {
        pregunta: "",
        tipo_pregunta: "opcion_multiple",
        url_multimedia: "",
        respuestas: [
          { valor: "", es_correcto: 0 },
        ],
      };
      leccion.preguntas.push(nueva);
      setModulos(nuevos);
    };

    const eliminarPregunta = (moduloIndex: number, leccionIndex: number, preguntaIndex: number): void => {
      const nuevos = [...modulos];
      const arr = nuevos[moduloIndex].lecciones[leccionIndex].preguntas || [];
      const p = arr[preguntaIndex];
      // revoke any object URLs used for preview to avoid memory leaks
      try {
        if (p?.preview) {
          URL.revokeObjectURL(p.preview as string);
        }
        if ((p as any)?.previewUrlObject) {
          URL.revokeObjectURL((p as any).previewUrlObject);
        }
        (p?.respuestas || []).forEach((r: any) => {
          if (r?.preview) URL.revokeObjectURL(r.preview as string);
        });
      } catch (e) {
        // ignore
      }
      arr.splice(preguntaIndex, 1);
      setModulos(nuevos);
    };

    const agregarRespuesta = (moduloIndex: number, leccionIndex: number, preguntaIndex: number): void => {
      const nuevos = [...modulos];
      const q = nuevos[moduloIndex].lecciones[leccionIndex].preguntas![preguntaIndex];
      q.respuestas.push({ valor: "", es_correcto: 0 });
      setModulos(nuevos);
    };

    const eliminarRespuesta = (moduloIndex: number, leccionIndex: number, preguntaIndex: number, respIndex: number): void => {
      const nuevos = [...modulos];
      const q = nuevos[moduloIndex].lecciones[leccionIndex].preguntas![preguntaIndex];
      const r = q.respuestas[respIndex];
      try {
        if (r?.preview) URL.revokeObjectURL(r.preview as string);
      } catch (e) {}
      q.respuestas.splice(respIndex, 1);
      setModulos(nuevos);
    };

    const handlePreguntaChange = async (
        moduloIndex: number,
        leccionIndex: number,
        preguntaIndex: number,
        field: string,
        value: File | string | null
        ): Promise<void> => {
        const nuevos = structuredClone(modulos);
        const pregunta = nuevos[moduloIndex].lecciones[leccionIndex].preguntas![preguntaIndex];

        if (field === "file") {
            if (value instanceof File) {
              const nameLower = (value.name || '').toLowerCase();
              const isImg = value.type?.startsWith('image/') && (nameLower.endsWith('.jpg') || nameLower.endsWith('.jpeg') || nameLower.endsWith('.png'));
              if (!isImg) { alert('Solo se aceptan imágenes .jpg/.jpeg/.png'); return; }
              // Guardar para subir en submit y previsualizar
              pregunta.file = value;
              try {
                if ((pregunta as any).previewUrlObject) {
                  URL.revokeObjectURL((pregunta as any).previewUrlObject);
                }
              } catch (e) {}
              const obj = URL.createObjectURL(value);
              pregunta.preview = obj;
              (pregunta as any).previewUrlObject = obj;
              // Limpiar URL hasta subir en submit
              pregunta.url_multimedia = "";
              setModulos(nuevos);
            } else {
              pregunta.url_multimedia = "";
              pregunta.preview = null;
              pregunta.file = null;
              setModulos(nuevos);
            }
        } else {
            (pregunta as any)[field] = value;
            setModulos(nuevos);
        }

        // If the question type changes, handle special cases
        if (field === "tipo_pregunta" && (pregunta as any).respuestas) {
          if (value === "opcion_unica") {
            let seen = false;
            (pregunta as any).respuestas.forEach((r: any) => {
              if (r.es_correcto && !seen) {
                seen = true;
              } else {
                r.es_correcto = 0;
              }
            });
          } else if (value === "pregunta_abierta") {
            // Pregunta abierta: una sola respuesta, siempre correcta
            (pregunta as any).respuestas = [{ valor: "", es_correcto: 1 }];
          }
        }
    };



const handleRespuestaChange = async (
  moduloIndex: number,
  leccionIndex: number,
  preguntaIndex: number,
  respIndex: number,
  field: string,
  value: string | number | File | null
): Promise<void> => {
  const nuevos = structuredClone(modulos);
  const respuesta =
    nuevos[moduloIndex].lecciones[leccionIndex].preguntas![preguntaIndex].respuestas[respIndex];

  // 👉 Si el campo es la imagen
  if (field === "file") {
    if (value instanceof File) {
      const nameLower = (value.name || '').toLowerCase();
      const isImg = (value.type?.startsWith('image/') && (nameLower.endsWith('.jpg') || nameLower.endsWith('.jpeg') || nameLower.endsWith('.png')));
      if (!isImg) { alert('Solo se aceptan imágenes .jpg/.jpeg/.png'); return; }
      respuesta.file = value as File;
      try { respuesta.preview = URL.createObjectURL(value); } catch { respuesta.preview = null; }
      respuesta.url_imagen = ""; // se seteará en submit
      setModulos(nuevos);
    } else {
      respuesta.file = null;
      respuesta.url_imagen = "";
      respuesta.preview = null;
      setModulos(nuevos);
      // Mantener el texto de la respuesta si existe
    }
  }

  // 👉 cambiar si es correcta
  else if (field === "es_correcto") {
    respuesta.es_correcto = value as number;
    // detectar tipo de pregunta según número de respuestas correctas
    const q = nuevos[moduloIndex].lecciones[leccionIndex].preguntas![preguntaIndex];
    const correctCount = q.respuestas.filter((ans: any) => ans.es_correcto).length;
    (q as any).tipo_pregunta = correctCount > 1 ? "opcion_multiple" : "opcion_unica";
    setModulos(nuevos);
  }

  // 👉 cualquier otro campo (texto)
  else {
    (respuesta as any)[field] = value;
    setModulos(nuevos);
  }
};


    const toggleRespuestaCorrecta = (
      moduloIndex: number,
      leccionIndex: number,
      preguntaIndex: number,
      respIndex: number
    ): void => {
      const nuevos = [...modulos];
      const q = nuevos[moduloIndex].lecciones[leccionIndex].preguntas![preguntaIndex];
      const r = q.respuestas[respIndex];
      // Alternar el estado de la respuesta (si es opción única mantiene la regla de una sola)
      if ((q as any).tipo_pregunta === "opcion_unica") {
        // En modo única, seleccionar esta hace que las demás se desmarquen
        q.respuestas.forEach((ans: any, idx: number) => {
          ans.es_correcto = idx === respIndex ? 1 : 0;
        });
      } else {
        // En modo múltiple, alternar esta respuesta
        r.es_correcto = r.es_correcto ? 0 : 1;
      }

      // Detectar automáticamente el tipo de pregunta según respuestas correctas:
      const correctCount = q.respuestas.filter((ans: any) => ans.es_correcto).length;
      (q as any).tipo_pregunta = correctCount > 1 ? "opcion_multiple" : "opcion_unica";
      setModulos(nuevos);
    };

    // NOTE: preguntaTieneMultiples removed — rendering now uses pregunta.tipo_pregunta to decide single vs multiple behavior

  const handleCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      setError(null);
      setFileUploadError(null);
      setColaboradores([]);
      
      console.log("Cargando archivo de colaboradores:", file.name);
      
      // Enviar archivo a la API
      const response = await CapListService.cargarColaboradores(file);
      
      console.log("Respuesta del servidor:", response);
      
      // Procesar respuesta
      if (response.colaboradores_encontrados && Array.isArray(response.colaboradores_encontrados)) {
        setColaboradores(response.colaboradores_encontrados);
        console.log(`✓ ${response.colaboradores_encontrados.length} colaboradores cargados exitosamente`);
      } else if (response.colaboradores && Array.isArray(response.colaboradores)) {
        setColaboradores(response.colaboradores);
        console.log(`✓ ${response.colaboradores.length} colaboradores cargados exitosamente`);
      } else if (response && Array.isArray(response)) {
        setColaboradores(response);
        console.log(`✓ ${response.length} colaboradores cargados exitosamente`);
      }
      
    } catch (err: any) {
      console.error("Error al procesar CSV:", err);
      
      // Mostrar solo lo que el backend responde
      const message = err.response?.data?.error || err.response?.data?.message || err.message || 'Error desconocido';
      setFileUploadError({
        message,
        type: 'error'
      });
    } finally {
      setLoading(false);
      e.target.value = "";
    }
  };

  // Función para remover un colaborador de la previsualización
  const handleRemoveColaborador = (index: number): void => {
    setColaboradores((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e?: { preventDefault?: () => void }): Promise<void> => {
    e?.preventDefault?.();
    try {
      setLoading(true);
      setError(null);

      // Validar datos obligatorios
      if (!formData.titulo.trim()) {
        setError("El título de la capacitación es obligatorio");
        setLoading(false);
        return;
      }

      if (!formData.descripcion.trim()) {
        setError("La descripción es obligatoria");
        setLoading(false);
        return;
      }

      if (!formData.fecha_inicio || !formData.fecha_fin) {
        setError("Las fechas de inicio y fin son obligatorias");
        setLoading(false);
        return;
      }

      if (modulos.length === 0) {
        setError("Debe agregar al menos un módulo");
        setLoading(false);
        return;
      }

      // Validar que cada módulo tenga al menos una lección
      for (let i = 0; i < modulos.length; i++) {
        if (!modulos[i].lecciones || modulos[i].lecciones.length === 0) {
          setError(`El módulo "${modulos[i].nombre_modulo}" debe tener al menos una lección`);
          setLoading(false);
          return;
        }
      }
      

      for (let m = 0; m < modulos.length; m++) {
      const modulo = modulos[m];

      for (let l = 0; l < modulo.lecciones.length; l++) {
        const leccion = modulo.lecciones[l];

        if (!leccion.titulo_leccion.trim()) {
          setError(`El título es obligatorio en el módulo ${m + 1}, lección ${l + 1}`);
          setLoading(false);
          return;
        }

        if (!leccion.tipo_leccion) {
          setError(`El tipo de contenido es obligatorio en el módulo ${m + 1}, lección ${l + 1}`);
          setLoading(false);
          return;
        }

        if (leccion.tipo_leccion === "video" && !leccion.url) {
          setError(`La URL del video es obligatoria en el módulo ${m + 1}, lección ${l + 1}`);
          setLoading(false);
          return;
        }

        // Para imagen/pdf permitir 'file' (para subir en submit) o 'url' ya existente
        if (leccion.tipo_leccion === "imagen" || leccion.tipo_leccion === "pdf") {
          if (!leccion.file && !leccion.url) {
            setError(`Debe adjuntar un archivo en el módulo ${m + 1}, lección ${l + 1}`);
            setLoading(false);
            return;
          }
        }

        if (leccion.tipo_leccion === "formulario") {
          if (!leccion.preguntas || leccion.preguntas.length === 0) {
            setError(`La lección ${l + 1} del módulo ${m + 1} debe tener al menos una pregunta`);
            setLoading(false);
            return;
          }

          for (let p = 0; p < leccion.preguntas.length; p++) {
            const pregunta = leccion.preguntas[p];

            if (!pregunta.pregunta.trim()) {
              setError(`lección ${l + 1} del módulo ${m + 1}, La pregunta ${p + 1} está vacía`);
              setLoading(false);
              return;
            }

            if (pregunta.tipo_pregunta !== "pregunta_abierta") {
              const correctas = pregunta.respuestas.filter(r => r.es_correcto === 1);
              if (correctas.length === 0) {
                setError(`La pregunta ${p + 1} del módulo ${m + 1}, lección ${l + 1} debe tener una respuesta correcta`);
                setLoading(false);
                return;
              }

              for (let r = 0; r < pregunta.respuestas.length; r++) {
                if (!pregunta.respuestas[r].valor.trim()) {
                  setError(`Hay respuestas vacías en la pregunta ${p + 1} del módulo ${m + 1}, lección ${l + 1}`);
                  setLoading(false);
                  return;
                }
              }
            }
            // Solo validar colaboradores si es creación, no edición
            if (!id && (!colaboradores || colaboradores.length === 0)) {
              setError("Debe cargar al menos un colaborador para esta capacitación");
              setLoading(false);
              return;
            }
          }
        }
      }
    }

      // ============ NUEVO: ENVIAR TODO EN UN SOLO POST CON FormData ============
      // Construir el payload con estructura normalizada (sin archivos)
      const modulosParaEnviar = structuredClone(modulos).map((m) => ({
        nombre_modulo: m.nombre_modulo,
        lecciones: (m.lecciones || []).map((l: any) => ({
          titulo_leccion: l.titulo_leccion,
          descripcion: l.descripcion,
          duracion: l.duracion,
          tipo_leccion: l.tipo_leccion,
          url: l.url || "", // Mantener cadena vacía si no hay URL (BD requiere valor)
          preguntas: (l.preguntas || []).map((p: any) => ({
            pregunta: p.pregunta,
            tipo_pregunta: p.tipo_pregunta,
            url_multimedia: p.url_multimedia || "", // Mantener cadena vacía
            respuestas: (p.respuestas || []).map((r: any) => ({
              valor: r.valor,
              es_correcto: r.es_correcto,
              url_imagen: r.url_imagen || "", // Mantener cadena vacía
            })),
          })),
        })),
      }));

      const payloadBasico = {
        titulo: formData.titulo,
        descripcion: formData.descripcion,
        tipo: formData.tipo,
        fecha_inicio: formData.fecha_inicio + "T08:00:00Z",
        fecha_fin: formData.fecha_fin + "T18:00:00Z",
        modulos: modulosParaEnviar,
        colaboradores: !id ? colaboradores.map((c) => c.id_colaborador || c.id) : [],
        imagenFile: (formData as any).imagenFile, // Archivo de imagen principal
      };

      // Construir FormData con todos los archivos incrustados (mismo flujo para crear y editar)
      const formDataMultipart = new FormData();
      
      // Campos simples
      formDataMultipart.append('titulo', payloadBasico.titulo);
      formDataMultipart.append('descripcion', payloadBasico.descripcion);
      formDataMultipart.append('tipo', payloadBasico.tipo);
      formDataMultipart.append('fecha_inicio', payloadBasico.fecha_inicio);
      formDataMultipart.append('fecha_fin', payloadBasico.fecha_fin);

      // Imagen principal como archivo si hay una nueva seleccionada
      if (payloadBasico.imagenFile) {
        formDataMultipart.append('imagen', payloadBasico.imagenFile);
      }

      // Agregar archivos de lecciones, preguntas y respuestas directamente al FormData
      // El backend (POST y PATCH) procesa estos archivos con procesar_archivo_multimedia
      modulos.forEach((modulo, moduloIdx) => {
        modulo.lecciones.forEach((leccion, leccionIdx) => {
          if (leccion.file) {
            formDataMultipart.append(
              `leccion_${moduloIdx}_${leccionIdx}`,
              leccion.file
            );
          }

          if (leccion.preguntas) {
            leccion.preguntas.forEach((pregunta, preguntaIdx) => {
              if (pregunta.file) {
                formDataMultipart.append(
                  `pregunta_${moduloIdx}_${leccionIdx}_${preguntaIdx}`,
                  pregunta.file
                );
              }

              if (pregunta.respuestas) {
                pregunta.respuestas.forEach((respuesta, respuestaIdx) => {
                  if (respuesta.file) {
                    formDataMultipart.append(
                      `respuesta_${moduloIdx}_${leccionIdx}_${preguntaIdx}_${respuestaIdx}`,
                      respuesta.file
                    );
                  }
                });
              }
            });
          }
        });
      });

      // Módulos y colaboradores como JSON strings
      formDataMultipart.append('modulos', JSON.stringify(payloadBasico.modulos));
      formDataMultipart.append('colaboradores', JSON.stringify(payloadBasico.colaboradores));

      console.log("Enviando capacitación con FormData multipart...");
      
      if (id) {
        // Editar existente
        const response = await (CapListService as any).patchCapacitacion(id, formDataMultipart);
        console.log("Capacitación actualizada exitosamente:", response);
      } else {
        // Crear nueva - usa crearCapacitacionCompleta que detecta FormData automáticamente
        const response = await CapListService.crearCapacitacionCompleta(formDataMultipart);
        console.log("Capacitación creada exitosamente:", response);
      }
      
      // Mostrar mensaje de éxito
      alert("¡Capacitación creada exitosamente!");
      
      // Limpiar localStorage
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(STORAGE_KEY_MODULOS);
      
      // Redirigir a la página de capacitaciones
      navigate("/capacitaciones/list");
    } catch (err: any) {
      console.error("Error al crear capacitación:", err);
      
      // Extraer mensaje de error del backend
      let errorMessage = "Error al crear la capacitación";
      
      // Intentar obtener detalles del error desde diferentes fuentes
      if (err.response?.data) {
        const data = err.response.data;
        
        // Si hay un mensaje de error directo
        if (typeof data === 'string') {
          errorMessage = data;
        } else if (data.error) {
          errorMessage = data.error;
        } else if (data.message) {
          errorMessage = data.message;
        } else if (data.detail) {
          errorMessage = data.detail;
        } else if (typeof data === 'object') {
          // Buscar errores en los campos
          const errors = Object.entries(data)
            .map(([field, messages]: any) => {
              if (Array.isArray(messages)) {
                return `${field}: ${messages.join(", ")}`;
              } else if (typeof messages === 'object') {
                return `${field}: ${JSON.stringify(messages)}`;
              }
              return `${field}: ${messages}`;
            })
            .filter(msg => msg);
          
          if (errors.length > 0) {
            errorMessage = errors.join(" | ");
          }
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = (): void => {
    navigate("/capacitaciones/list");
  };

  const handleLimpiarDatos = (): void => {
    if (!confirm("¿Estás seguro de que quieres limpiar todos los datos?")) return;
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_KEY_MODULOS);
    setFormData({
      titulo: "",
      descripcion: "",
      imagen: "",
      fecha_inicio: "",
      fecha_fin: "",
      tipo: "CONOCIMIENTOS ORGANIZACIONALES",
      imagenFile: null as File | null,
      imagenPreview: "" as string | null,
    });
    setModulos([]);
    alert("Datos limpios exitosamente");
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.headerLeft}>
            <button className={styles.backButton} onClick={handleCancel}>
              ←  {id ? "Editar Capacitación" : "Crear Nueva Capacitación"}
            </button>
          </div>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <button className={styles.btnLimpiar} onClick={handleLimpiarDatos} type="button" title="Limpiar datos guardados">
              🗑 Limpiar
            </button>
            <button className={styles.btnGuardar} onClick={() => handleSubmit()} disabled={loading}>
              {loading ? "Guardando..." : "Guardar Capacitación"}
            </button>
          </div>
        </div>
      </div>

      {/* Form */}
      <form className={styles.form}>
        {/* Sección 1: Información Básica */}
        <div className={styles.section}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Título de la capacitación</label>
            <input
              type="text"
              name="titulo"
              value={formData.titulo}
              onChange={handleChange}
              className={styles.input}
              placeholder="E.j: capacitación de inducción"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>descripción</label>
            <textarea
              name="descripcion"
              value={formData.descripcion}
              onChange={handleChange}
              className={styles.textarea}
              placeholder="Describe el contenido u objetivos del curso"
              rows={4}
              required
            ></textarea>
          </div>

          <div className={styles.formGroup}>
            <div className={styles.sectionRow}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Tipo de capacitación</label>
                <select
                  name="tipo"
                  value={formData.tipo}
                  onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                  className={styles.input}
                >
                  {CAP_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Fecha de inicio</label>
                <input
                  type="date"
                  name="fecha_inicio"
                  value={formData.fecha_inicio}
                  onChange={handleChange}
                  className={styles.input}
                  min={today}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Fecha Final</label>
                <input
                  type="date"
                  name="fecha_fin"
                  value={formData.fecha_fin}
                  onChange={handleChange}
                  className={styles.input}
                  min={formData.fecha_inicio || today}
                  required
                />
              </div>
            </div>
          </div>
        
          
          <div className={styles.sectionRow}>
            <div
              className={`${styles.sectionformupload} ${
                ((formData as any).imagenPreview || formData.imagen) ? styles.withPreview : ""
              }`}
            >
              {!((formData as any).imagenPreview || formData.imagen) ? (
                <label htmlFor="dropzone-file" className={styles.dropzoneLabel}>
                  <svg
                    className={styles.dropzoneIcon}
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 5v9m-5 0H5a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4a1 1 0 0 0-1-1h-2M8 9l4-5 4 5m1 8h.01"
                    />
                  </svg>

                  <p className={styles.dropzoneText}>
                    <span>Click to upload</span> or drag and drop
                  </p>

                  <p className={styles.dropzoneSubtext}>
                    SVG, PNG, JPG or GIF (MAX. 800×400px)
                  </p>

                  <input
                    id="dropzone-file"
                    type="file"
                    accept="image/jpeg, image/png, image/jpg"
                    className={styles.hiddenInput}
                    onChange={(e) =>
                      handleImagenPrincipal(e.target.files?.[0] || null)
                    }
                  />
                </label>
              ) : (
                <div className={styles.previewWrapper}>
                  <img
                    src={normalizeDataUrl((formData as any).imagenPreview || formData.imagen)}
                    alt="vista previa"
                    className={styles.previewThumb}
                  />

                  {/* ESTE label funciona como botón */}
                  <label htmlFor="change-image" className={styles.changeImageBtn}>
                    Cambiar imagen
                  </label>

                  <input
                    id="change-image"
                    type="file"
                    accept="image/jpeg, image/png, image/jpg"
                    className={styles.hiddenInput}
                    onChange={(e) =>
                      handleImagenPrincipal(e.target.files?.[0] || null)
                    }
                  />
                </div>
              )}
            </div>
          </div>
        </div>
        {/* Sección 2: Gestión de Contenido */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>Gestión de Contenido</h2>
            <button
              type="button"
              className={styles.btnAgregarModulo}
              onClick={agregarModulo}
            >
              + Agregar Módulo
            </button>
          </div>

          {modulos.map((modulo, moduloIndex) => (
            <div key={moduloIndex} className={styles.modulo}>
              <div
                className={styles.moduloHeader}
                onClick={() => toggleModulo(moduloIndex)}
              >
                <span className={styles.expandIcon}>
                  {expandedModulos[moduloIndex] ? "▼" : ">"}
                </span>
                <h3>{modulo.nombre_modulo}</h3>
                  {!id || !(modulo as any).id ? (
                    <button
                      type="button"
                      className={styles.trashBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        eliminarModulo(moduloIndex);
                      }}
                    >
                      🗑 Eliminar módulo
                    </button>
                  ) : null}
                <button
                  type="button"
                  className={styles.btnAgregarLeccion}
                  onClick={(e) => {
                    e.stopPropagation();
                    agregarLeccionDirecta(moduloIndex);
                    setExpandedModulos((prev) => ({
                      ...prev,
                      [moduloIndex]: true,
                    }));
                  }}
                >
                  + agregar leccion
                </button>
              </div>

              {expandedModulos[moduloIndex] && (
                <div className={styles.moduloContent}>
                  {modulo.lecciones.map((leccion, leccionIndex) => (
                    <div key={leccionIndex} className={styles.leccion}>
                      {/* ===== HEADER DE LECCIÓN (SIEMPRE VISIBLE) ===== */}
                      <div className={styles.leccionHeader}>
                        {/* 👉 Título cuando está cerrada */}
                        {!expandedLecciones[`${moduloIndex}-${leccionIndex}`] && (
                          <strong className={styles.label}>
                            {leccion.titulo_leccion?.trim() || "Lección sin título"}
                          </strong>
                        )}

                        <div className={styles.leccionActions}>
                          {/* 👉 Botón mostrar SOLO cuando está cerrada */}
                          {!expandedLecciones[`${moduloIndex}-${leccionIndex}`] && (
                            <button
                              type="button"
                              className={styles.btnAgregarLeccion}
                              onClick={() => toggleLeccion(moduloIndex, leccionIndex)}
                            >
                              ▶ Mostrar lección
                            </button>
                          )}

                          {!id || !(leccion as any).id ? (
                            <button
                              type="button"
                              className={styles.trashBtn}
                              onClick={() => eliminarLeccion(moduloIndex, leccionIndex)}
                            >
                              🗑 Eliminar lección
                            </button>
                          ) : null}
                        </div>
                      </div>
                      {expandedLecciones[`${moduloIndex}-${leccionIndex}`] && (
                      <div className={styles.leccionForm}>
                        <div className={styles.formGroup}>
                          <label className={styles.label}>Titulo de la lección</label>
                          <input
                            type="text"
                            value={leccion.titulo_leccion}
                            onChange={(e) =>
                              handleLeccionChange(moduloIndex, leccionIndex, "titulo_leccion", e.target.value)
                            }
                            className={styles.input}
                            placeholder="EJ: lección ejemplo"
                          />
                        </div>

                        <div className={styles.formGroup}>
                          <label className={styles.label}>Duración</label>
                          <input
                            type="text"
                            value={leccion.duracion || ""}
                            onChange={(e) =>
                              handleLeccionChange(moduloIndex, leccionIndex, "duracion", e.target.value)
                            }
                            className={styles.input}
                            placeholder="EJ: 20:30"
                          />
                        </div>

                        <div className={styles.formGroup}>
                          <label className={styles.label}>descripción</label>
                          <textarea
                            value={leccion.descripcion || ""}
                            onChange={(e) =>
                              handleLeccionChange(moduloIndex, leccionIndex, "descripcion", e.target.value)
                            }
                            className={styles.textarea}
                            placeholder="Describe el contenido y objetos del curso"
                            rows={4}
                          />
                        </div>

                        <div className={styles.fieldRow}>
                          <div className={styles.formGroup}>
                            <label className={styles.label}>Tipo de contenido</label>
                            <select
                              className={styles.input}
                              value={leccion.tipo_leccion}
                              onChange={(e) =>
                                handleLeccionChange(moduloIndex, leccionIndex, "tipo_leccion", e.target.value)
                              }
                            >
                              <option value="video">Video</option>
                              <option value="imagen">Imagen</option>
                              <option value="pdf">PDF</option>
                              <option value="formulario">Formulario</option>
                            </select>
                          </div>

                          {leccion.tipo_leccion === "video" && (
                            <div className={styles.formGroup}>
                              <label className={styles.label}>Url del Video</label>
                              <input
                                type="text"
                                value={leccion.url || ""}
                                onChange={(e) =>
                                  handleLeccionChange(moduloIndex, leccionIndex, "url", e.target.value)
                                }
                                className={styles.input}
                                placeholder="www.video.com"
                              />
                            </div>
                          )}

                          {leccion.tipo_leccion === "imagen" && (
                            <div className={styles.formGroup}>
                              <label className={styles.label}>Imagen</label>
                              <label className={styles.btnCargar}>
                                Cargar
                                <input
                                    type="file"
                                    accept="image/*"
                                    style={{ display: "none" }}
                                    onChange={(e) =>
                                    handleLeccionChange(
                                        moduloIndex,
                                        leccionIndex,
                                        "file",
                                        e.target.files?.[0] || null
                                    )
                                    }
                                />
                              </label>
                              {/* Previsualización para imagen (si hay url o preview) */}
                              {(leccion.preview || leccion.url) && (
                                <img
                                  src={normalizeDataUrl(leccion.preview || leccion.url)}
                                  alt="Vista previa"
                                  className={styles.previewThumb}
                                  style={{ marginTop: 8 }}
                                />
                              )}
                            </div>
                          )}

                          {leccion.tipo_leccion === "pdf" && (
                            <div className={styles.formGroup}>
                              <label className={styles.label}>Archivo PDF</label>
                              <label className={styles.btnCargar}>
                                Cargar PDF
                                <input
                                    type="file"
                                    accept=".pdf,application/pdf"
                                    style={{ display: "none" }}
                                    onChange={(e) =>
                                    handleLeccionChange(
                                        moduloIndex,
                                        leccionIndex,
                                        "file",
                                        e.target.files?.[0] || null
                                    )
                                    }
                                />
                              </label>
                              {/* Indicador cuando es PDF */}
                              {(leccion.file || leccion.url) && (
                                <div style={{ marginTop: 8 }}>
                                  {leccion.file && (
                                    <p className="text-sm text-gray-500">
                                      PDF cargado: <strong>{leccion.file.name}</strong>
                                      {leccion.url && <span> ✓ (URL guardada)</span>}
                                    </p>
                                  )}
                                  {/* Previsualización PDF (si hay url o preview) */}
                                  {(leccion.preview || leccion.url) && (
                                    <iframe
                                      src={normalizeDataUrl(leccion.preview || leccion.url, 'pdf')}
                                      title={leccion.titulo_leccion || 'Vista previa PDF'}
                                      style={{ width: '100%', height: 240, border: '1px solid #ddd', borderRadius: 6 }}
                                    />
                                  )}
                                </div>
                              )}
                            </div>
                          )}

                          {leccion.tipo_leccion === "formulario" && (
                            <div className={styles.formGroup}>
                              <div className={styles.formCard}>
                                {(leccion.preguntas || []).map((q, preguntaIndex) => (
                                  <div key={preguntaIndex} className={styles.questionCard}>
                                    <div className={styles.questionHeader}>
                                      <strong>pregunta {preguntaIndex + 1}.</strong>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <select
                                          className={styles.smallSelect}
                                          value={q.tipo_pregunta}
                                          onChange={(e) => handlePreguntaChange(moduloIndex, leccionIndex, preguntaIndex, 'tipo_pregunta', e.target.value)}
                                        >
                                          <option value="opcion_multiple">Opción múltiple</option>
                                          <option value="opcion_unica">Opción única</option>
                                          <option value="pregunta_abierta">Pregunta abierta</option>
                                        </select>

                                        {q.tipo_pregunta !== "pregunta_abierta" && (
                                          <button
                                            type="button"
                                            className={styles.btnSmall}
                                            onClick={() => agregarRespuesta(moduloIndex, leccionIndex, preguntaIndex)}
                                          >
                                            + Agregar respuesta
                                          </button>
                                        )}
                                        {!id || !(q as any).id ? (
                                          <button
                                            type="button"
                                            className={styles.trashBtn}
                                            onClick={() => eliminarPregunta(moduloIndex, leccionIndex, preguntaIndex)}
                                          >
                                            🗑
                                          </button>
                                        ) : null}
                                      </div>
                                    </div>

                                    <div className={styles.formGroup}>
                                      <input
                                        type="text"
                                        className={styles.input}
                                        placeholder="EJ: lección ejemplo"
                                        value={q.pregunta}
                                        onChange={(e) =>
                                          handlePreguntaChange(moduloIndex, leccionIndex, preguntaIndex, "pregunta", e.target.value)
                                        }
                                      />
                                    </div>

                                    <div className={styles.formGroup}>
                                      <label className={styles.label}>Imagen (pregunta)</label>
                                      <label className={styles.btnCargar}>
                                        Cargar
                                        <input
                                          type="file"
                                          accept="image/*"
                                          style={{ display: "none" }}
                                          onChange={(e) =>
                                            handlePreguntaChange(moduloIndex, leccionIndex, preguntaIndex, "file", e.target.files?.[0] || null)
                                          }
                                        />
                                      </label>
                                      {/* Previsualización para imagen o PDF de pregunta */}
                                      {(q.url_multimedia || q.preview) && (
                                        <div style={{ marginTop: 8 }}>
                                          {q.url_multimedia && q.url_multimedia.toLowerCase().endsWith('.pdf') ? (
                                            <iframe
                                              src={normalizeDataUrl(q.preview || q.url_multimedia, 'pdf')}
                                              title={`Preview pregunta ${preguntaIndex + 1}`}
                                              className={styles.previewThumbSmall}
                                              style={{ height: 120 }}
                                            />
                                          ) : (
                                            <img
                                              src={normalizeDataUrl(q.preview || q.url_multimedia)}
                                              alt={`Preview pregunta ${preguntaIndex + 1}`}
                                              className={styles.previewThumbSmall}
                                            />
                                          )}
                                        </div>
                                      )}
                                    </div>

                                    <div className={styles.answersList}>
                                        {q.tipo_pregunta === "pregunta_abierta" ? (
                                          <div className={styles.formGroup}>
                                            <textarea
                                              className={styles.textarea}
                                              placeholder="Escriba su respuesta"
                                              value={q.respuestas[0]?.valor || ""}
                                              onChange={(e) =>
                                                handleRespuestaChange(moduloIndex, leccionIndex, preguntaIndex, 0, "valor", e.target.value)
                                              }
                                            />
                                          </div>
                                        ) : q.respuestas.map((r, respIndex) => {
                                          const multiple = (q as any).tipo_pregunta !== "opcion_unica";

                                            return (
                                            <div key={respIndex} className={styles.answerRow}>

                                                {/* Botón para seleccionar correcta */}
                                                <button
                                                type="button"
                                                className={
                                                    styles.selector +
                                                    " " +
                                                    (multiple ? styles.square : styles.circle) +
                                                    (r.es_correcto ? " " + styles.selected : "")
                                                }
                                                onClick={() =>
                                                    toggleRespuestaCorrecta(
                                                    moduloIndex,
                                                    leccionIndex,
                                                    preguntaIndex,
                                                    respIndex
                                                    )
                                                }
                                                aria-pressed={!!r.es_correcto}
                                                />

                                                {/* Texto de respuesta */}
                                                <input
                                                type="text"
                                                className={styles.input}
                                                placeholder="Respuesta"
                                                value={r.valor}
                                                onChange={(e) =>
                                                    handleRespuestaChange(
                                                    moduloIndex,
                                                    leccionIndex,
                                                    preguntaIndex,
                                                    respIndex,
                                                    "valor",
                                                    e.target.value
                                                    )
                                                }
                                                />

                                                {/* Cargar Imagen */}
                                                <label className={styles.btnCargar} title="Adjuntar imagen">
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    style={{ display: "none" }}
                                                    onChange={(e) =>
                                                    handleRespuestaChange(
                                                        moduloIndex,
                                                        leccionIndex,
                                                        preguntaIndex,
                                                        respIndex,
                                                        "file",
                                                        e.target.files?.[0] || null
                                                    )
                                                    }
                                                />
                                                🖼
                                                </label>

                                                {/* El nombre del archivo ya no se muestra por UI */}

                                                {/* Vista previa de la imagen */}
                                                {/* Vista previa de la imagen de la respuesta */}
                                                {(r.preview || r.url_imagen) && (
                                                  <img
                                                    src={normalizeDataUrl(r.preview || r.url_imagen)}
                                                    alt="Vista previa"
                                                    className={styles.previewTiny}
                                                    style={{ marginLeft: 8 }}
                                                  />
                                                )}

                                                {/* Eliminar respuesta */}
                                                {!id ? (
                                                  <button
                                                  type="button"
                                                  className={styles.trashBtn}
                                                  onClick={() =>
                                                      eliminarRespuesta(
                                                      moduloIndex,
                                                      leccionIndex,
                                                      preguntaIndex,
                                                      respIndex
                                                      )
                                                  }
                                                  >
                                                  🗑
                                                  </button>
                                                ) : null}

                                            </div>
                                            );
                                        })}
                                        </div>

                                  </div>
                                ))}

                                <div style={{ marginTop: 12 }}>
                                  <button
                                    type="button"
                                    className={styles.btnAgregarLeccion}
                                    onClick={() => agregarPregunta(moduloIndex, leccionIndex)}
                                  >
                                    + Agregar pregunta
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                        <div>
                          <button
                            type="button"
                            className={styles.btnAgregarLeccion}
                            onClick={() => toggleLeccion(moduloIndex, leccionIndex)}
                            style={{ marginBottom: 12 }}
                          >
                            ▼ Ocultar lección
                          </button>
                        </div>
                      </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Sección 3: Configuración Pública - Solo si es crear, no editar */}
        {!id && (
          <div className={styles.section}>
            <h2>Configuración Pública</h2>
            <p className={styles.sectionDescription}>Agregar Colaboradores</p>

          <div className={styles.csvSection}>
            <a
              href={"data:text/csv;charset=utf-8," + encodeURIComponent("cedula\n")}
              download="colaboradores.csv"
              className={styles.csvLink}
            >
              CSV Ejemplo
            </a>
            <label className={styles.btnSubirCsv}>
              Subir CSV
              <input
                type="file"
                accept=".csv"
                onChange={handleCsvUpload}
                style={{ display: "none" }}
              />
            </label>
          </div>

          {/* Componente mejorado para mostrar errores/advertencias de carga de archivos */}
          {fileUploadError && (
            <FileUploadError
              error={fileUploadError.type === 'error' ? fileUploadError.message : null}
              type={fileUploadError.type}
              onClose={() => setFileUploadError(null)}
            />
          )}

          {colaboradores.length > 0 && (
            <div className={styles.colaboradoresTable}>
              <div className={styles.colaboradoresHeader}>
                <h4>Previsualización de colaboradores cargados ({colaboradores.length})</h4>
                <input
                  type="text"
                  placeholder="Buscar por nombre, apellido, cédula o ID..."
                  value={searchColaborador}
                  onChange={(e) => setSearchColaborador(e.target.value)}
                  className={styles.searchInput}
                />
              </div>
              {colaboradoresFiltrados.length > 0 ? (
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Nombre</th>
                      <th>Apellido</th>
                      <th>Cédula</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {colaboradoresFiltrados.map((colab: any, index: number) => (
                      <tr key={index}>
                        <td>{index + 1}</td>
                        <td>
                          <strong>{colab.nombre_colaborador || colab.nombre || "N/A"}</strong>
                        </td>
                        <td>{colab.apellido_colaborador || colab.apellido || "N/A"}</td>
                        <td>{colab.cc_colaborador || colab.cc || "N/A"}</td>
                        <td>
                          <button
                            type="button"
                            className={styles.btnEliminar}
                            onClick={() => handleRemoveColaborador(
                              colaboradores.findIndex((c) =>
                                (c.id_colaborador || c.id) === (colab.id_colaborador || colab.id)
                              )
                            )}
                            title="Eliminar colaborador"
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className={styles.noResults}>No se encontraron colaboradores con "{searchColaborador}"</p>
              )}
            </div>
          )}
        </div>
        )}
        {error && (
          <div className={styles.errorContainer} style={{
            backgroundColor: "#fee2e2",
            border: "1px solid #fca5a5",
            borderRadius: "6px",
            padding: "16px",
            marginTop: "16px",
            marginBottom: "16px"
          }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
              <div style={{ fontSize: "20px", color: "#dc2626", flexShrink: 0 }}>⚠️</div>
              <div style={{ flex: 1 }}>
                <p style={{ margin: "0 0 8px 0", fontWeight: "600", color: "#991b1b" }}>
                  Error al guardar la capacitación
                </p>
                <p style={{ 
                  margin: "0", 
                  color: "#7f1d1d", 
                  fontSize: "14px", 
                  lineHeight: "1.5",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word"
                }}>
                  {error}
                </p>
                <button
                  type="button"
                  onClick={() => setError(null)}
                  style={{
                    marginTop: "8px",
                    padding: "4px 8px",
                    fontSize: "12px",
                    backgroundColor: "#dc2626",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer"
                  }}
                >
                  Descartar
                </button>
              </div>
            </div>
          </div>
        )}
        </form>
      </div>
  );
}

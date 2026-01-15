import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import styles from "./Styles/CrearCapacitacion.module.css";
import { useNavigate } from "react-router-dom";
import CapListService from "../services/Capacitaciones";

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

export default function CrearCapacitacion() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    titulo: "",
    descripcion: "",
    imagen: "",
    fecha_inicio: "",
    fecha_fin: "",
    tipo: "CONOCIMIENTOS ORGANIZACIONALES",
    imagenFile: null as File | null,
    imagenPreview: "" as string | null,
  });
  const [originalColaboradoresIds, setOriginalColaboradoresIds] = useState<number[]>([]);

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
          imagen: data.imagen || "",
          fecha_inicio: data.fecha_inicio ? (data.fecha_inicio.split("T")[0]) : prev.fecha_inicio,
          fecha_fin: data.fecha_fin ? (data.fecha_fin.split("T")[0]) : prev.fecha_fin,
          tipo: data.tipo || prev.tipo,
          imagenFile: null,
          imagenPreview: data.imagen || "",
        }));

        setModulos(data.modulos || []);
        const cols = data.colaboradores || [];
        setColaboradores(cols);
        setColaboradoresFiltrados(cols);
        try {
          const ids = (cols || [])
            .map((c: any) => (c.id_colaborador ?? c.id) as number | undefined)
            .filter((x: number | undefined): x is number => typeof x === 'number');
          setOriginalColaboradoresIds(ids);
        } catch (e) {}
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
  ];

  const [modulos, setModulos] = useState<Modulo[]>([]);

  // Auto-guardar modulos
  useEffect(() => {
    if (modulos.length > 0) {
      localStorage.setItem(STORAGE_KEY_MODULOS, JSON.stringify(modulos));
    }
  }, [modulos]);

  const [expandedModulos, setExpandedModulos] = useState<{ [key: number]: boolean }>({});
  const [expandedLecciones, setExpandedLecciones] = useState<{[key: string]: boolean;}>({});
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [colaboradoresFiltrados, setColaboradoresFiltrados] = useState<Colaborador[]>([]);
  const [searchColaborador, setSearchColaborador] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const today = new Date().toISOString().split("T")[0];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

const handleImagenPrincipal = async (file: File | null) => {
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
const agregarLeccionDirecta = (moduloIndex: number) => {
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


const toggleLeccion = (moduloIndex: number, leccionIndex: number) => {
  const key = `${moduloIndex}-${leccionIndex}`;
  setExpandedLecciones((prev) => ({
    ...prev,
    [key]: !prev[key],
  }));
};

// Eliminar una lección
const eliminarLeccion = (moduloIndex: number, leccionIndex: number) => {
  const nuevos = [...modulos];

  nuevos[moduloIndex].lecciones.splice(leccionIndex, 1);

  setModulos(nuevos);
};

  const toggleModulo = (index: number) => {
    setExpandedModulos((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };


  const agregarModulo = () => {
    const nuevoModulo: Modulo = {
      nombre_modulo: modulos.length + 1 + ". Módulo",
      lecciones: [],
    };
    setModulos([...modulos, nuevoModulo]);
  };

  // Eliminar un módulo completo
  const eliminarModulo = (index: number) => {
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
) => {
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
    const agregarPregunta = (moduloIndex: number, leccionIndex: number) => {
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

    const eliminarPregunta = (moduloIndex: number, leccionIndex: number, preguntaIndex: number) => {
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

    const agregarRespuesta = (moduloIndex: number, leccionIndex: number, preguntaIndex: number) => {
      const nuevos = [...modulos];
      const q = nuevos[moduloIndex].lecciones[leccionIndex].preguntas![preguntaIndex];
      q.respuestas.push({ valor: "", es_correcto: 0 });
      setModulos(nuevos);
    };

    const eliminarRespuesta = (moduloIndex: number, leccionIndex: number, preguntaIndex: number, respIndex: number) => {
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
        ) => {
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

        // If the question type changes to single-option, ensure only one correct exists
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
) => {
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
    ) => {
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

  const handleCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      setError(null);
      setColaboradores([]); // Limpiar colaboradores previos
      
      console.log("Cargando archivo de colaboradores:", file.name);
      
      // Enviar archivo a la API
      const response = await CapListService.cargarColaboradores(file);
      
      console.log("Respuesta del servidor:", response);
      
      // Procesar respuesta - estructura: { colaboradores_encontrados: [...], colaboradores_no_encontrados: [...] }
      if (response.colaboradores_encontrados && Array.isArray(response.colaboradores_encontrados)) {
        setColaboradores(response.colaboradores_encontrados);
        console.log(`✓ ${response.colaboradores_encontrados.length} colaboradores cargados exitosamente`);
      } else if (response.colaboradores && Array.isArray(response.colaboradores)) {
        // Fallback para estructura alternativa
        setColaboradores(response.colaboradores);
        console.log(`✓ ${response.colaboradores.length} colaboradores cargados exitosamente`);
      } else if (response && Array.isArray(response)) {
        // Si retorna directamente un array
        setColaboradores(response);
        console.log(`✓ ${response.length} colaboradores cargados exitosamente`);
      }
      
      // Mostrar advertencia si hay colaboradores no encontrados
      if (response.colaboradores_no_encontrados && response.colaboradores_no_encontrados.length > 0) {
        console.warn("Colaboradores no encontrados:", response.colaboradores_no_encontrados);
        setError(`Advertencia: ${response.colaboradores_no_encontrados.length} colaboradores no fueron encontrados en el sistema: ${response.colaboradores_no_encontrados.join(", ")}`);
      }
    } catch (err: any) {
      console.error("Error al procesar CSV:", err);
      setError("Error al procesar el archivo CSV: " + (err.message || "Error desconocido"));
    } finally {
      setLoading(false);
      // Limpiar el input file para permitir subir el mismo archivo nuevamente
      e.target.value = "";
    }
  };

  // Función para remover un colaborador de la previsualización
  const handleRemoveColaborador = (index: number) => {
    setColaboradores((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
            if (!colaboradores || colaboradores.length === 0) {
              setError("Debe cargar al menos un colaborador para esta capacitación");
              setLoading(false);
              return;
            }
          }
        }
      }
    }

      // SUBIR ARCHIVOS PENDIENTES Y CONSTRUIR PAYLOAD CON URLS
      try {
        // Imagen principal
        let imagenFinalUrl = formData.imagen || "";
        const imagenFile = (formData as any).imagenFile as File | undefined;
        if (imagenFile) {
          const resp: any = await CapListService.uploadImagenCapacitacion(imagenFile);
          imagenFinalUrl = resp?.url || resp?.file_url || resp?.download_url || resp?.location || imagenFinalUrl;
          if (!imagenFinalUrl) throw new Error('No se obtuvo URL para imagen principal');
        }

        // Clonar modulos para mutar urls después de subir
        const nuevos = structuredClone(modulos);
        for (let mm = 0; mm < nuevos.length; mm++) {
          for (let ll = 0; ll < nuevos[mm].lecciones.length; ll++) {
            const lec = nuevos[mm].lecciones[ll];
            if (lec.tipo_leccion === 'imagen' && lec.file && !lec.url) {
              const r: any = await CapListService.uploadImagenLeccion(lec.file);
              const u = r?.url || r?.file_url || r?.download_url || r?.location;
              if (!u) throw new Error(`No se obtuvo URL para la imagen de la lección ${ll + 1}`);
              lec.url = u;
            }
            if (lec.tipo_leccion === 'pdf' && lec.file && !lec.url) {
              const r: any = await CapListService.uploadPdfLeccion(lec.file);
              const u = r?.url || r?.file_url || r?.download_url || r?.location;
              if (!u) throw new Error(`No se obtuvo URL para el PDF de la lección ${ll + 1}`);
              lec.url = u;
            }
            if (lec.tipo_leccion === 'formulario' && lec.preguntas) {
              for (let pp = 0; pp < lec.preguntas.length; pp++) {
                const pq = lec.preguntas[pp];
                if (pq.file && !pq.url_multimedia) {
                  const r: any = await CapListService.uploadImagenPregunta(pq.file);
                  const u = r?.url || r?.file_url || r?.download_url || r?.location;
                  if (!u) throw new Error(`No se obtuvo URL para la imagen de la pregunta ${pp + 1}`);
                  pq.url_multimedia = u;
                }
                for (let rdx = 0; rdx < (pq.respuestas || []).length; rdx++) {
                  const resp = (pq.respuestas as any)[rdx];
                  if (resp.file && !resp.url_imagen) {
                    const rr: any = await CapListService.uploadImagenRespuesta(resp.file);
                    const u = rr?.url || rr?.file_url || rr?.download_url || rr?.location;
                    if (!u) throw new Error(`No se obtuvo URL para la imagen de la respuesta ${rdx + 1}`);
                    resp.url_imagen = u;
                  }
                }
              }
            }
          }
        }

        // Construir el payload
        const normalizedModulos = (nuevos).map((m) => ({
          ...m,
          lecciones: (m.lecciones || []).map((l: any) => ({
            ...l,
            url: l.url || "",
            preguntas: (l.preguntas || []).map((p: any) => ({
              ...p,
              url_multimedia: p.url_multimedia || p.url_media || "",
              respuestas: (p.respuestas || []).map((r: any) => ({
                ...r,
                url_imagen: r.url_imagen || r.url_archivo || r.url || "",
                url_archivo: r.url_archivo || r.url_imagen || r.url || "",
              })),
            })),
          })),
        }));

        const payload = {
          titulo: formData.titulo,
          descripcion: formData.descripcion,
          tipo: formData.tipo,
          imagen: imagenFinalUrl || "",
          fecha_inicio: formData.fecha_inicio + "T08:00:00Z",
          fecha_fin: formData.fecha_fin + "T18:00:00Z",
          modulos: normalizedModulos,
          colaboradores: colaboradores.map((c) => c.id_colaborador || c.id),
        };

        console.log("Enviando capacitación:", payload);
        if (id) {
          // Editar existente
          // Primero sincronizar colaboradores con add/remove si hubo cambios
          try {
            const currentIds = (colaboradores || [])
              .map((c: any) => (c.id_colaborador ?? c.id) as number | undefined)
              .filter((x): x is number => typeof x === 'number');
            const orig = originalColaboradoresIds || [];
            const add = currentIds.filter((x) => !orig.includes(x));
            const remove = orig.filter((x) => !currentIds.includes(x));

            if ((add && add.length) || (remove && remove.length)) {
              // Llamada POST add/remove
              const resUpdate: any = await (CapListService as any).updateColaboradores(id, { add, remove });
              console.log('updateColaboradores result:', resUpdate);
              // actualizar estado local de referencia
              setOriginalColaboradoresIds(currentIds);
            }
          } catch (err: any) {
            console.error('Error actualizando colaboradores:', err);
            setError(err.message || 'Error actualizando colaboradores');
            setLoading(false);
            return;
          }

          // Ahora aplicar PATCH con el resto de campos (colaboradores ya sincronizados)
          const payloadForPatch = { ...payload } as any;
          delete payloadForPatch.colaboradores;
          const response = await (CapListService as any).patchCapacitacion(id, payloadForPatch);
          console.log("Capacitación actualizada exitosamente:", response);
        } else {
          const response = await CapListService.crearCapacitacionCompleta(payload);
          console.log("Capacitación creada exitosamente:", response);
        }
      } catch (uploadErr: any) {
        console.error(uploadErr);
        setError(uploadErr.message || 'Error subiendo archivos');
        setLoading(false);
        return;
      }
      
      // Mostrar mensaje de éxito
      alert("¡Capacitación creada exitosamente!");
      
      // Redirigir a la página de capacitaciones
      navigate("/capacitaciones/list");
    } catch (err: any) {
      console.error("Error al crear capacitación:", err);
      setError(err.message || "Error al crear la capacitación");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate("/capacitaciones/list");
  };

  const handleLimpiarDatos = () => {
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
            <button className={styles.btnGuardar} onClick={handleSubmit} disabled={loading}>
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
                    src={(formData as any).imagenPreview || formData.imagen}
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

                          <button
                            type="button"
                            className={styles.trashBtn}
                            onClick={() => eliminarLeccion(moduloIndex, leccionIndex)}
                          >
                            🗑 Eliminar lección
                          </button>
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

                                {/* Previsualización para imagen */}
                                {leccion.preview && leccion.tipo_leccion === "imagen" && (
                                <img
                                  src={leccion.preview}
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
                                {leccion.file && leccion.tipo_leccion === "pdf" && (
                                  <div style={{ marginTop: 8 }}>
                                    <p className="text-sm text-gray-500">
                                      PDF cargado: <strong>{leccion.file.name}</strong>
                                      {leccion.url && <span> ✓ (URL guardada)</span>}
                                    </p>
                                    {/* Previsualización temporal del PDF */}
                                    {leccion.preview && (
                                      <iframe
                                        src={leccion.preview}
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
                                        </select>

                                        <button
                                          type="button"
                                          className={styles.btnSmall}
                                          onClick={() => agregarRespuesta(moduloIndex, leccionIndex, preguntaIndex)}
                                        >
                                          + Agregar respuesta
                                        </button>
                                        <button
                                          type="button"
                                          className={styles.trashBtn}
                                          onClick={() => eliminarPregunta(moduloIndex, leccionIndex, preguntaIndex)}
                                        >
                                          🗑
                                        </button>
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
                                      {/* Previsualización para imagen de pregunta */}
                                      {(q.url_multimedia || q.preview) && (
                                        <div style={{ marginTop: 8 }}>
                                          <img
                                            src={q.preview || q.url_multimedia}
                                            alt={`Preview pregunta ${preguntaIndex + 1}`}
                                            className={styles.previewThumbSmall}
                                          />
                                        </div>
                                      )}
                                    </div>

                                    <div className={styles.answersList}>
                                        {q.respuestas.map((r, respIndex) => {
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
                                                {r.preview && (
                                                <img
                                                  src={r.preview}
                                                  alt="Vista previa"
                                                  className={styles.previewTiny}
                                                  style={{ marginLeft: 8 }}
                                                />
                                                )}

                                                {/* Eliminar respuesta */}
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

        {/* Sección 3: Configuración Pública */}
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
                onChange={handleCsvUpload}
                style={{ display: "none" }}
              />
            </label>
          </div>

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
        {error && <p className={styles.error}>{error}</p>}
        </form>
      </div>
  );
}

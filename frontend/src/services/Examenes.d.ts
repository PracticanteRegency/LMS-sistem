type TipoExamen = "INGRESO" | "PERIODICO" | "RETIRO";

interface Examen {
  id: number;
  nombre: string;
}

interface ExamenCatalogItem {
  id_examen?: number;
  id?: number;
  nombre: string;
}

type ExamenesPorTipo = Partial<Record<TipoExamen, Examen[]>>;

interface Cargo {
  id: number;
  nombre: string;
  examenes_por_tipo?: ExamenesPorTipo;
}

interface Empresa {
  id: number;
  nombre: string;
  cargos: Cargo[];
}

interface CentroEstructura {
  id: number;
  nombre: string;
}

interface ProyectoEstructura {
  id: number;
  nombre: string;
  centros: CentroEstructura[];
}

interface UnidadEstructura {
  id: number;
  nombre: string;
  proyectos: ProyectoEstructura[];
}

interface EmpresaEstructura {
  id: number;
  nombre: string;
  unidades: UnidadEstructura[];
}

interface CargoEmpresaExamenesResponse {
  empresas: Empresa[];
  examenes?: ExamenCatalogItem[];
  estructura?: EmpresaEstructura[];
}

interface EnviarCorreoPayload {
  nombre_trabajador: string;
  documento_trabajador: string;
  centro_id: number;
  cargo_id: number;
  tipo_examen: TipoExamen;
  examenes_ids: number[];
}

interface EnviarCorreoResponse {
  mensaje: string;
  uuid_correo?: string;
  uuid_trabajador?: string;
  trabajador?: string;
  destinatario?: string;
  tipo_examen?: TipoExamen;
  examenes_asignados?: { id: number; nombre: string }[];
  total_examenes?: number;
}

interface ReporteCorreoItem {
  id: number;
  uuid_correo?: string;
  correos_destino: string;
  enviado_por_nombre: string;
  fecha_envio: string;
  enviado_correctamente: boolean;
}

interface ReporteCorreosResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: ReporteCorreoItem[];
}

interface TrabajadorCorreoItem {
  id: number;
  correo_id: number;
  uuid_trabajador: string;
  nombre_trabajador: string;
  documento_trabajador: string;
  cargo_nombre: string;
  empresa_nombre: string;
  estado_trabajador: number;
  estado_nombre: string;
}

interface TrabajadoresCorreoResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: TrabajadorCorreoItem[];
  correo_id: number;
  uuid_correo?: string;
  asunto?: string;
  fecha_envio?: string;
  total_trabajadores?: number;
}

interface DetalleCorreoResponse extends TrabajadoresCorreoResponse {
  asunto?: string;
  correo_destino?: string;
  cuerpo_correo?: string;
  enviado_correctamente?: boolean;
  enviado_por_nombre?: string;
}

interface ExamenesService {
  CargoEmpresaConExamenes(): Promise<CargoEmpresaExamenesResponse>;
  EnviarCorreo(payload: EnviarCorreoPayload): Promise<EnviarCorreoResponse>;
  ObtenerReporteCorreos(page?: number, pageSize?: number): Promise<ReporteCorreosResponse>;
  ObtenerDetalleCorreo(correoId: number): Promise<DetalleCorreoResponse>;
  ObtenerTrabajadoresCorreo(correoId: number, page?: number, pageSize?: number): Promise<TrabajadoresCorreoResponse>;
  GenerarReporteExcel(fechaInicio: string, fechaFin: string, empresas: string): Promise<Blob>;
  EnviarCorreoMasivo(file: File): Promise<any>;
  ActualizarEstadoTrabajadores(payload: { trabajador_ids: number[] }): Promise<any>;
}

declare const ExamenesService: ExamenesService;
export default ExamenesService;

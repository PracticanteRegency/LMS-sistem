// Interfaces del perfil y capacitaciones
export interface Capacitacion {
  id_capacitacion: number;
  nombre_capacitacion: string;
  completada: boolean;
  progreso: number;
}

export interface PerfilResponse {
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

export interface PerfilService {
  id_colaborador: number;
  cc_colaborador: number;
  nombre_colaborador: string;
  apellido_colaborador: string;
  correo_colaborador: string;
  nombre_cargo: string;
  capacitaciones_totales: number;
  capacitaciones_completadas: number;
  estado_colaborador: number;
}

export interface LeccionProgress {
  titulo_leccion?: string;
  tipo_leccion?: string;
  url?: string;
  duracion?: string;
  descripcion?: string;
  completada?: boolean;
}

export interface ModuloProgress {
  nombre_modulo?: string;
  lecciones?: LeccionProgress[];
}

export interface PerfilCapProgress {
  modulos?: ModuloProgress[];
}

// Esta firma representa el servicio PERO NO LO IMPLEMENTA
declare const Perfil: {
  getPerfil: () => Promise<PerfilResponse>;
  getListUsers: (page?: number, pageSize?: number) => Promise<any>;
  // Firma para obtener progreso de un colaborador en una capacitacion
  getPerfilCapById: (colaboradorId: string | number, capacitacionId: string | number) => Promise<PerfilCapProgress>;
  getPerfilUserById: (id: string | number) => Promise<PerfilResponse>;
};

export default Perfil;

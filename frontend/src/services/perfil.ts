interface PerfilResponse {
  idcolaborador?: number;
  nombrecolaborador?: string;
  apellidocolaborador?: string;
  correo_colaborador?: string;
  tipousuario?: number;
  tipo_usuario?: number;
  capacitaciones?: any[];
}

interface ListUsuariosResponse {
  count?: number;
  results?: Array<{
    id_colaborador: number;
    cc_colaborador: string;
    nombre_colaborador: string;
    apellido_colaborador: string;
    correo_colaborador: string;
    nombrecargo: string;
    capacitaciones_totales: number;
    capacitaciones_completadas: number;
    estado_colaborador: number;
  }>;
}

interface CargoNivelRegionalResponse {
  cargos: Array<{
    idcargo?: number;
    id?: number;
    nombrecargo?: string;
    nombre?: string;
  }>;
  niveles: Array<{
    idnivel?: number;
    id?: number;
    nombrenivel?: string;
    nombre?: string;
  }>;
  regionales: Array<{
    idregional?: number;
    id?: number;
    nombreregional?: string;
    nombre?: string;
  }>;
}

interface CambiarEstadoPayload {
  estado?: number;
  estadocolaborador?: number;
}

interface ActualizarRolPayload {
  tipo_usuario?: number;
  tipousuario?: number;
  rol?: number;
}

declare const Perfil: {
  getPerfil(): Promise<PerfilResponse>;
  getListUsers(page?: number, pageSize?: number, search?: string): Promise<ListUsuariosResponse>;
  getPerfilCapById(idcolaborador: number, capacitacion_id: number): Promise<any>;
  getPerfilUserById(idcolaborador: number): Promise<any>;
  getCargoRegionesNiveles(): Promise<CargoNivelRegionalResponse>;
  getFiltrarUsuarios(q?: string, page?: number, pageSize?: number): Promise<any>;
  PatchCambiarEstadoUsuario(idcolaborador: number, payload: CambiarEstadoPayload): Promise<any>;
  registerTemporalUser(payload: any): Promise<any>;
  PutEditarPerfil(idcolaborador: number, payload: any): Promise<any>;
  GetEditarPerfil(idcolaborador: number, payload: any): Promise<any>;
  BuscarCorreoPorUUID(uuid: string): Promise<any>;
  cambiarEstadoUsuario(idcolaborador: number, payload: CambiarEstadoPayload): Promise<any>;
  actualizarRolUsuario(idcolaborador: number, payload: ActualizarRolPayload): Promise<any>;
  registrarUsuariosMasivo(file: File): Promise<any>;
  actualizarUsuariosMasivo(file: File): Promise<any>;
  descargarReporteUsuarios(): Promise<any>;
};

export default Perfil;

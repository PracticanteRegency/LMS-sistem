interface CapListService {
  getMisCapacitaciones(): Promise<any[]>;
  getCapList(): Promise<any[]>;
  getCapacitacionById(id: string | number): Promise<any>;
  createCapacitacion(data: any): Promise<any>;
  crearCapacitacionCompleta(payload: any): Promise<any>;
  uploadFile(file: File): Promise<any>;
  uploadFilePDF(file: File): Promise<any>;
  uploadImagenCapacitacion(file: File): Promise<any>;
  uploadImagenLeccion(file: File): Promise<any>;
  uploadPdfLeccion(file: File): Promise<any>;
  uploadImagenPregunta(file: File): Promise<any>;
  uploadImagenRespuesta(file: File): Promise<any>;
  createLeccion(data: any): Promise<any>;
  createLeccionFormData(formData: FormData): Promise<any>;
  uploadColaboradoresCSV(file: File): Promise<any>;
  cargarColaboradores(file: File): Promise<any>;
  postCapList(): Promise<any>;
  certificadoDescargar(capacitacionId: string | number): Promise<Blob>;
  postCargarColab(): Promise<any>;
  eliminarCapacitacion(capacitacionId: string | number): Promise<any>;
  getMiCapacitacion(): Promise<any>;
  postCompletarLeccion(capacitacionId: string | number, leccionId: number, token: string): Promise<any>;
  responderLeccion(capacitacionId: string | number, leccionId: number, token: string): Promise<any>;
  enviarRespuestasFormulario(capacitacionId: string | number, leccionId: number, payload: { respuestas: number[] }): Promise<any>;
}

declare const CapListService: CapListService;
export default CapListService;

export interface CentroOp {
  centro_op: string;
  porcentaje: number;
  tipo: "centro_op";
}

export interface Proyecto {
  proyecto: string;
  tipo: "proyecto";
  porcentaje: number;
  centrosop: CentroOp[];
}

export interface Unidad {
  unidad: string;
  tipo: "unidad";
  porcentaje: number;
  proyectos: Proyecto[];
}

export interface Empresa {
  empresa: string;
  tipo: "empresa";
  porcentaje: number;
  estructura: Unidad[];
}

// Only declare the service shape we need
declare const analiticaService: {
  // backend returns an object with `estructura: Unidad[]`
  getProgreso(): Promise<any>;
  getEmpresas(): Promise<any>;
  getUnidades(): Promise<any>;
  getProyectos(): Promise<any>;
  getCentros(): Promise<any>;
  createEmpresa(payload: any): Promise<any>;
  updateEmpresa(id: number, payload: any): Promise<any>;
  createUnidad(payload: any): Promise<any>;
  updateUnidad(id: number, payload: any): Promise<any>;
  createProyecto(payload: any): Promise<any>;
  updateProyecto(id: number, payload: any): Promise<any>;
  createCentro(payload: any): Promise<any>;
  updateCentro(id: number, payload: any): Promise<any>;
      getProgreso(): Promise<any>;
    getEmpresas(): Promise<any>;
    getUnidades(): Promise<any>;
    getProyectos(): Promise<any>;
    getCentros(): Promise<any>;
    createEmpresa(payload: any): Promise<any>;
    updateEmpresa(id: number, payload: any): Promise<any>;
    createUnidad(payload: any): Promise<any>;
    updateUnidad(id: number, payload: any): Promise<any>;
    createProyecto(payload: any): Promise<any>;
    updateProyecto(id: number, payload: any): Promise<any>;
    createCentro(payload: any): Promise<any>;
    updateCentro(id: number, payload: any): Promise<any>;
    getCargos(): Promise<any>;
    createCargo(payload: any): Promise<any>;
    updateCargo(id: number, payload: any): Promise<any>;
    deleteCargo(id: number): Promise<any>;
    getNiveles(): Promise<any>;
    createNivel(payload: any): Promise<any>;
    updateNivel(id: number, payload: any): Promise<any>;
    deleteNivel(id: number): Promise<any>;
    getRegionales(): Promise<any>;
    createRegional(payload: any): Promise<any>;
    updateRegional(id: number, payload: any): Promise<any>;
    deleteRegional(id: number): Promise<any>;
};

export default analiticaService;
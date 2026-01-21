interface CentroOp {
  centro_op: string;
  porcentaje: number;
  tipo: "centro_op";
}

interface Proyecto {
  proyecto: string;
  tipo: "proyecto";
  porcentaje: number;
  centrosop: CentroOp[];
}

interface Unidad {
  unidad: string;
  tipo: "unidad";
  porcentaje: number;
  proyectos: Proyecto[];
}

interface Empresa {
  empresa: string;
  tipo: "empresa";
  porcentaje: number;
  unidades: Unidad[];
}

// Only declare the service shape we need
declare const analiticaService: {
  // backend returns an object with `estructura: Unidad[]`
  getProgreso(): Promise<any>;
  getEmpresas?(): Promise<any>;
};

export default analiticaService;
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
  getProgreso(): Promise<Empresa | Empresa[]>;
};

export default analiticaService;
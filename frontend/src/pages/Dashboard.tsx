import { useState, useEffect } from "react";
import styles from "./Styles/Dashboard.module.css";
import analiticaService from "../services/analitica";

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

interface OrgItem {
  id: string;
  name: string;
  type: string;
  porcentaje: number;
  children?: OrgItem[];
  isExpanded?: boolean;
}

interface Analytics {
  empresaPromedio: number;
  totalEmpresas: number;
  totalUnidades: number;
  totalProyectos: number;
  totalCentros: number;
  topProyectos: Array<{
    nombre: string;
    porcentaje: number;
    empresa: string;
  }>;
}

export default function Dashboard() {
  const [orgData, setOrgData] = useState<OrgItem[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAnalyticsData();
  }, []);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data: any = await analiticaService.getProgreso();
      
      console.log('Received data:', data);
      
      // El backend ahora envía un array de empresas
      if (Array.isArray(data) && data.length > 0) {
        // Filtrar empresas vacías o con nombre "eliminar"
        const validEmpresas = data.filter((emp: Empresa) => 
          emp.empresa && 
          emp.empresa.trim().toLowerCase() !== 'eliminar' &&
          emp.unidades && 
          emp.unidades.length > 0
        );
        
        if (validEmpresas.length > 0) {
          const transformed = transformMultipleEmpresas(validEmpresas);
          setOrgData(transformed);
          calculateAnalyticsFromMultiple(validEmpresas);
        } else {
          setError("No hay empresas válidas para mostrar");
        }
      } else {
        console.error('Invalid data format:', data);
        setError("Formato de datos inválido del servidor");
      }
    } catch (err: any) {
      setError(err.message || "Error al cargar los datos de analítica");
      console.error("Error loading analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  const transformMultipleEmpresas = (empresas: Empresa[]): OrgItem[] => {
    return empresas.map((empresa, empIdx) => ({
      id: "empresa-" + empIdx + "-" + empresa.empresa.trim(),
      name: empresa.empresa.trim(),
      type: empresa.tipo,
      porcentaje: empresa.porcentaje,
      children: empresa.unidades.map((unidad, uIdx) => ({
        id: "unidad-" + empIdx + "-" + uIdx + "-" + unidad.unidad,
        name: unidad.unidad,
        type: unidad.tipo,
        porcentaje: unidad.porcentaje,
        children: unidad.proyectos.map((proyecto, pIdx) => ({
          id: "proyecto-" + empIdx + "-" + uIdx + "-" + pIdx + "-" + proyecto.proyecto,
          name: proyecto.proyecto,
          type: proyecto.tipo,
          porcentaje: proyecto.porcentaje,
          children: proyecto.centrosop.map((centro, cIdx) => ({
            id: "centro-" + empIdx + "-" + uIdx + "-" + pIdx + "-" + cIdx,
            name: centro.centro_op,
            type: centro.tipo,
            porcentaje: centro.porcentaje,
          })),
        })),
      })),
      isExpanded: true,
    }));
  };

  const calculateAnalyticsFromMultiple = (empresas: Empresa[]) => {
    let totalUnidades = 0;
    let totalProyectos = 0;
    let totalCentros = 0;
    let sumaPromedios = 0;
    const allProyectos: { nombre: string; porcentaje: number; empresa: string }[] = [];

    empresas.forEach((empresa) => {
      sumaPromedios += empresa.porcentaje;
      totalUnidades += empresa.unidades.length;
      
      empresa.unidades.forEach((unidad) => {
        unidad.proyectos.forEach((proyecto) => {
          totalProyectos++;
          allProyectos.push({ 
            nombre: proyecto.proyecto, 
            porcentaje: proyecto.porcentaje,
            empresa: empresa.empresa.trim()
          });
          totalCentros += proyecto.centrosop.length;
        });
      });
    });

    const empresaPromedio = empresas.length > 0 ? sumaPromedios / empresas.length : 0;

    const topProyectos = allProyectos
      .filter(p => p.porcentaje > 0)
      .sort((a, b) => b.porcentaje - a.porcentaje)
      .slice(0, 5);

    const analytics: Analytics = {
      empresaPromedio,
      totalEmpresas: empresas.length,
      totalUnidades,
      totalProyectos,
      totalCentros,
      topProyectos,
    };
    setAnalytics(analytics);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "empresa":
        return "🏢";
      case "unidad":
        return "💼";
      case "proyecto":
        return "📁";
      case "centro_op":
        return "🎯";
      default:
        return "📋";
    }
  };

  const toggleExpand = (id: string) => {
    const updateItems = (items: OrgItem[]): OrgItem[] => {
      return items.map((item) => {
        if (item.id === id) {
          return { ...item, isExpanded: !item.isExpanded };
        }
        if (item.children) {
          return { ...item, children: updateItems(item.children) };
        }
        return item;
      });
    };
    setOrgData(updateItems(orgData));
  };

  const renderOrgTree = (items: OrgItem[], level: number = 0) => {
    return (
      <>
        {items.map((item) => (
          <div key={item.id}>
            <div className={styles.orgRow} style={{ paddingLeft: `${level * 40}px` }}>
              <div className={styles.itemLeft}>
                {item.children && item.children.length > 0 ? (
                  <button
                    className={`${styles.expandBtn} ${
                      item.isExpanded ? styles.expanded : ""
                    }`}
                    onClick={() => toggleExpand(item.id)}
                  >
                    ▼
                  </button>
                ) : (
                  <span className={styles.arrow}>→</span>
                )}
                <span className={styles.icon}>{getIcon(item.type)}</span>
                <span className={styles.itemName}>{item.name}</span>
              </div>
              <div className={styles.progressContainer}>
                <div className={styles.progressBar}>
                  <div
                    className={styles.progressFill}
                    style={{ width: `${item.porcentaje}%` }}
                  ></div>
                </div>
                <span className={styles.progressText}>{item.porcentaje}%</span>
              </div>
            </div>
            {item.isExpanded && item.children && item.children.length > 0 && (
              <div>
                {renderOrgTree(item.children, level + 1)}
              </div>
            )}
          </div>
        ))}
      </>
    );
  };

  if (loading) {
    return (
      <div className={styles.dashboardContainer}>
        <p>Cargando datos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.dashboardContainer}>
        <p style={{ color: "red" }}>Error: {error}</p>
      </div>
    );
  }

  return (
    <div className={styles.dashboardContainer}>
      <div className={styles.header}>
        <h1>Analíticas del Sistema</h1>
        <p className={styles.subtitle}>Métricas y estadísticas detalladas de todas las empresas</p>
      </div>

      {/* KPI Cards */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiContent}>
            <div>
              <p className={styles.kpiLabel}>Progreso Promedio</p>
              <p className={styles.kpiValue}>{(analytics?.empresaPromedio ?? 0).toFixed(2)}%</p>
              <p className={styles.kpiTrend}>Todas las empresas</p>
            </div>
            <span className={styles.kpiIcon}>📊</span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiContent}>
            <div>
              <p className={styles.kpiLabel}>Total Empresas</p>
              <p className={styles.kpiValue}>{analytics?.totalEmpresas || 0}</p>
              <p className={styles.kpiTrend}>Empresas registradas</p>
            </div>
            <span className={styles.kpiIcon}>🏢</span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiContent}>
            <div>
              <p className={styles.kpiLabel}>Total Unidades</p>
              <p className={styles.kpiValue}>{analytics?.totalUnidades || 0}</p>
              <p className={styles.kpiTrend}>Unidades organizativas</p>
            </div>
            <span className={styles.kpiIcon}>💼</span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiContent}>
            <div>
              <p className={styles.kpiLabel}>Total Proyectos</p>
              <p className={styles.kpiValue}>{analytics?.totalProyectos || 0}</p>
              <p className={styles.kpiTrend}>Proyectos activos</p>
            </div>
            <span className={styles.kpiIcon}>📁</span>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className={styles.chartsGrid}>
        {/* Top Projects Card */}
        <div className={styles.chartCard}>
          <h2 className={styles.chartTitle}>Proyectos con Mayor Progreso</h2>
          <div className={styles.coursesList}>
            {analytics?.topProyectos && analytics.topProyectos.length > 0 ? (
              analytics.topProyectos.map((proyecto: { nombre: string; porcentaje: number; empresa: string }, index: number) => (
                <div key={index} className={styles.courseItem}>
                  <div>
                    <p className={styles.courseName}>{proyecto.nombre}</p>
                    <p className={styles.courseInfo}>{proyecto.empresa}</p>
                  </div>
                  <span className={styles.completionBadge}>{proyecto.porcentaje.toFixed(2)}%</span>
                </div>
              ))
            ) : (
              <p>No hay proyectos con progreso</p>
            )}
          </div>
        </div>

        {/* Organizational Activity Card */}
        <div className={styles.chartCard}>
          <h2 className={styles.chartTitle}>Estructura Organizacional Completa</h2>
          <p className={styles.hierarchyInfo}>Empresas → Unidades → Proyectos → Centros de Operación</p>
          <div className={styles.orgTree}>
            {orgData.length > 0 ? (
              renderOrgTree(orgData)
            ) : (
              <p>No hay datos disponibles</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


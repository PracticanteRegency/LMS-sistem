import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
// import { EmpresaCargo } from "../services/Examenes"; // Remove or uncomment and fix if you actually need it
import styles from "./Styles/Usuarios.module.css";
import Perfil from "../services/perfil";
import analiticaService from "../services/analitica";
export default function EditarUsuario() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState<any>({});
  const [cargos, setCargos] = useState<any[]>([]);
  const [niveles, setNiveles] = useState<any[]>([]);
  const [regionales, setRegionales] = useState<any[]>([]);
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [selectedEmpresa, setSelectedEmpresa] = useState<number | null>(null);
  const [selectedUnidad, setSelectedUnidad] = useState<number | null>(null);
  const [selectedProyecto, setSelectedProyecto] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        if (!id) throw new Error("ID de usuario no válido.");
        const userData = await Perfil.GetEditarPerfil(Number(id), {});
        setForm(userData);
        const { cargos, niveles, regionales } = await Perfil.getCargoRegionesNiveles();
        // Adaptar estructura a {id, nombre}
        setCargos((cargos || []).map((c: any) => ({ id: c.idcargo || c.id, nombre: c.nombrecargo || c.nombre })));
        setNiveles((niveles || []).map((n: any) => ({ id: n.idnivel || n.id, nombre: n.nombrenivel || n.nombre })));
        setRegionales((regionales || []).map((r: any) => ({ id: r.idregional || r.id, nombre: r.nombreregional || r.nombre })));
        // Traer empresas y setear selects según centroop_id
        let empresasData: any = [];
        if (typeof analiticaService.getEmpresas === "function") {
          empresasData = await analiticaService.getEmpresas();
        } else {
          throw new Error("El servicio de empresas no está disponible.");
        }
        setEmpresas(empresasData?.empresas || empresasData || []);
        if (userData.centroop_id) {
          // Buscar empresa, unidad, proyecto a partir del centroop_id
          let found = false;
          for (const emp of empresasData?.empresas || empresasData || []) {
            for (const unidad of emp.unidades || []) {
              for (const proyecto of unidad.proyectos || []) {
                for (const centro of proyecto.centros || []) {
                  if (centro.idcentrop === userData.centroop_id) {
                    setSelectedEmpresa(emp.idempresa);
                    setSelectedUnidad(unidad.idunidad);
                    setSelectedProyecto(proyecto.idproyecto);
                    found = true;
                    break;
                  }
                }
                if (found) break;
              }
              if (found) break;
            }
            if (found) break;
          }
        }
      } catch (e: any) {
        setError("Error al cargar datos: " + (e?.message || e));
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const confirmado = window.confirm("¿Está seguro que desea editar los datos de este colaborador?");
    if (!confirmado) return;
    setSaving(true);
    setError(null);
    try {
      if (!id) {
        setError("ID de usuario no válido.");
        setSaving(false);
        return;
      }
      await Perfil.PutEditarPerfil(Number(id), form);
      navigate("/usuarios");
    } catch (e: any) {
      setError("Error al guardar cambios: " + (e?.message || e));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className={styles.crearContainer}><p>Cargando datos...</p></div>;
  }
  if (error) {
    return <div className={styles.crearContainer}><p className={styles.error}>{error}</p></div>;
  }

  return (
    <div className={styles.crearContainer}>
      <div className={styles.crearHeader}>
        <h2>Editar Usuario</h2>
      </div>
      <form className={styles.completoForm} onSubmit={handleSubmit}>
        <div className={styles.completoRow} style={{ flexDirection: 'column', gap: 16 }}>
          <div style={{ marginBottom: 8 }}>
            <label htmlFor="nombre" style={{ fontWeight: 500, display: 'block', marginBottom: 4 }}>Nombre</label>
            <input
              className={styles.input}
              id="nombre"
              name="nombre"
              placeholder="Nombre"
              value={form.nombre || form.nombre_colaborador || ''}
              onChange={e => setForm({ ...form, nombre: e.target.value })}
              required
            />
          </div>
          <div style={{ marginBottom: 8 }}>
            <label htmlFor="apellido" style={{ fontWeight: 500, display: 'block', marginBottom: 4 }}>Apellido</label>
            <input
              className={styles.input}
              id="apellido"
              name="apellido"
              placeholder="Apellido"
              value={form.apellido || form.apellido_colaborador || ''}
              onChange={e => setForm({ ...form, apellido: e.target.value })}
              required
            />
          </div>
          <div style={{ marginBottom: 8 }}>
            <label htmlFor="correo" style={{ fontWeight: 500, display: 'block', marginBottom: 4 }}>Correo</label>
            <input
              className={styles.input}
              id="correo"
              name="correo"
              placeholder="Correo"
              value={form.correo || form.correo_colaborador || ''}
              onChange={e => setForm({ ...form, correo: e.target.value })}
              required
            />
          </div>
          <div style={{ marginBottom: 8 }}>
            <label htmlFor="telefono" style={{ fontWeight: 500, display: 'block', marginBottom: 4 }}>Teléfono</label>
            <input
              className={styles.input}
              id="telefono"
              name="telefono"
              placeholder="Teléfono"
              value={form.telefono || form.telefo_colaborador || ''}
              onChange={e => setForm({ ...form, telefono: e.target.value })}
            />
          </div>
          <div style={{ marginBottom: 8 }}>
            <label htmlFor="cargo" style={{ fontWeight: 500, display: 'block', marginBottom: 4 }}>Cargo</label>
            <select
              className={styles.select}
              name="cargo"
              value={form.cargo || ''}
              onChange={e => setForm({ ...form, cargo: Number(e.target.value) })}
              required
            >
              <option value="">Seleccionar cargo</option>
              {cargos.map((c: any) => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
          </div>
          <div style={{ marginBottom: 8 }}>
            <label htmlFor="nivel" style={{ fontWeight: 500, display: 'block', marginBottom: 4 }}>Nivel</label>
            <select
              className={styles.select}
              name="nivel"
              value={form.nivel || ''}
              onChange={e => setForm({ ...form, nivel: Number(e.target.value) })}
              required
            >
              <option value="">Seleccionar nivel</option>
              {niveles.map((n: any) => (
                <option key={n.id} value={n.id}>{n.nombre}</option>
              ))}
            </select>
          </div>
          <div style={{ marginBottom: 8 }}>
            <label htmlFor="region" style={{ fontWeight: 500, display: 'block', marginBottom: 4 }}>Regional</label>
            <select
              className={styles.select}
              name="region"
              value={form.region || ''}
              onChange={e => setForm({ ...form, region: Number(e.target.value) })}
              required
            >
              <option value="">Seleccionar regional</option>
              {regionales.map((r: any) => (
                <option key={r.id} value={r.id}>{r.nombre}</option>
              ))}
            </select>
          </div>
        </div>
        <div className={styles.completoRow} style={{ flexWrap: 'wrap', gap: 16 }}>
          <div style={{ minWidth: 200, marginBottom: 8 }}>
            <label htmlFor="empresa" style={{ fontWeight: 500, display: 'block', marginBottom: 4 }}>Empresa</label>
            <select className={styles.select} id="empresa" value={selectedEmpresa ?? ''} onChange={e => {
              setSelectedEmpresa(e.target.value ? Number(e.target.value) : null);
              setSelectedUnidad(null);
              setSelectedProyecto(null);
              setForm((f: any) => ({ ...f, centroop_id: '' }));
            }}>
              <option value="">Seleccionar empresa</option>
              {empresas.map((emp: any) => (
                <option key={emp.idempresa} value={emp.idempresa}>{emp.nombre_empresa}</option>
              ))}
            </select>
          </div>
          <div style={{ minWidth: 200, marginBottom: 8 }}>
            <label htmlFor="unidad" style={{ fontWeight: 500, display: 'block', marginBottom: 4 }}>Unidad</label>
              <select className={styles.select} id="unidad" value={selectedUnidad ?? ''} onChange={e => {
              setSelectedUnidad(e.target.value ? Number(e.target.value) : null);
              setSelectedProyecto(null);
              setForm((f: any) => ({ ...f, centroop_id: '' }));
            }}>
              <option value="">Seleccionar unidad</option>
              {empresas.find((em: any) => em.idempresa === selectedEmpresa)?.unidades?.map((u: any) => (
                <option key={u.idunidad} value={u.idunidad}>{u.nombreunidad}{u.descripcionunidad ? ` (${u.descripcionunidad})` : ''}</option>
              ))}
            </select>
          </div>
          <div style={{ minWidth: 200, marginBottom: 8 }}>
            <label htmlFor="proyecto" style={{ fontWeight: 500, display: 'block', marginBottom: 4 }}>Proyecto</label>
            <select className={styles.select} id="proyecto" value={selectedProyecto ?? ''} onChange={e => {
              setSelectedProyecto(e.target.value ? Number(e.target.value) : null);
              setForm((f: any) => ({ ...f, centroop_id: '' }));
            }}>
              <option value="">Seleccionar proyecto</option>
              {empresas.find((em: any) => em.idempresa === selectedEmpresa)?.unidades?.find((uu: any) => uu.idunidad === selectedUnidad)?.proyectos?.map((p: any) => (
                <option key={p.idproyecto} value={p.idproyecto}>{p.nombreproyecto || p.nombre}</option>
              ))}
            </select>
          </div>
          <div style={{ minWidth: 200, marginBottom: 8 }}>
            <label htmlFor="centroop_id" style={{ fontWeight: 500, display: 'block', marginBottom: 4 }}>CentroOP</label>
            <select className={styles.select} name="centroop_id" id="centroop_id" value={form.centroop_id || ''} onChange={handleChange} required>
              <option value="">Seleccionar centro</option>
              {empresas.find((em: any) => em.idempresa === selectedEmpresa)?.unidades?.find((uu: any) => uu.idunidad === selectedUnidad)?.proyectos?.find((pp: any) => pp.idproyecto === selectedProyecto)?.centros?.map((c: any) => (
                <option key={c.idcentrop} value={c.idcentrop}>{c.nombrecentrop}</option>
              ))}
            </select>
          </div>
        </div>
        <div style={{ marginTop: 16 }}>
          <button type="submit" className={styles.btnPrimary} disabled={saving}>{saving ? "Guardando..." : "Guardar cambios"}</button>
          <button type="button" className={styles.btnPrimary} style={{ marginLeft: 8, background: '#aaa' }} onClick={() => navigate("/usuarios")}>Cancelar</button>
        </div>
      </form>
    </div>
  );
}

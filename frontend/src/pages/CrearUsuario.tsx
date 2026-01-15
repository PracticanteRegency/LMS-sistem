import { useState, useEffect } from "react";
import styles from "./Styles/Usuarios.module.css";
import { useNavigate } from "react-router-dom";
import { getUserId, getUserRole } from "../services/auth";
import PerfilService from "../services/perfil";
import AnaliticaService from "../services/analitica";
import api from "../services/axios";

export default function CrearUsuario() {
  const navigate = useNavigate();
  const [allowed, setAllowed] = useState(false);
  const [role, setRole] = useState<number>(0);

  const [empresas, setEmpresas] = useState<any[]>([]);
  const [cargosData, setCargosData] = useState<any>(null);

  // temporal form
  const [tempForm, setTempForm] = useState({ cc: "", nombre: "", apellido: "", correo: "", telefono: "" });

  // completo form
  const [fullForm, setFullForm] = useState({ usuario: "", is_staff: "0", idcolaborador: { cc_colaborador: "", nombre_colaborador: "", apellido_colaborador: "", cargo_colaborador: undefined as number | undefined, correo_colaborador: "", telefo_colaborador: "", nivel_colaborador: undefined as number | undefined, regional_colab: undefined as number | undefined, centroOP: undefined as number | undefined } });

  const [selectedEmpresa, setSelectedEmpresa] = useState<number | null>(null);
  const [selectedUnidad, setSelectedUnidad] = useState<number | null>(null);
  const [selectedProyecto, setSelectedProyecto] = useState<number | null>(null);

  // UI: which form to show
  // 0: none, 1: temporal, 2: completo
  const [selectedForm, setSelectedForm] = useState<number>(() => {
    // default: if role 3, show temporal; if 1, show completo; if 4, show none
    const r = getUserRole();
    if (r === 3) return 1;
    if (r === 1) return 2;
    return 0;
  });

  useEffect(() => {
    const uid = getUserId();
    const r = getUserRole();
    setRole(r);
    if (!uid) { setAllowed(false); return; }
    if ([1,3,4].includes(uid) || r === 1 || r === 4 || r === 3) setAllowed(true);
    else setAllowed(false);

    // fetch cargos/niveles/regionales and empresas
        (async () => {
          try {
            const data = await (PerfilService as any).getCargoRegionesNiveles();
            setCargosData(data);
          } catch (e) {
            console.error('Error cargando cargos/regiones/niveles', e);
          }
    
          try {
            const res = await (AnaliticaService as any).getEmpresas();
            setEmpresas(res?.empresas || res || []);
          } catch (e) {
            console.error('Error cargando empresas', e);
          }
        })();
  }, []);

  if (!allowed) {
    return (
      <div style={{ padding: 20 }}>
        <h2>No autorizado</h2>
        <p>No tienes permisos para crear usuarios.</p>
      </div>
    );
  }

  return (
    <div className={styles.crearContainer}>
      <div className={styles.crearHeader}>
        <h2>Crear Usuario</h2>
      </div>

      {/* Selector for form type */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        {(role === 3 || role === 4) && (
          <button
            className={selectedForm === 1 ? styles.btnPrimary : ''}
            style={{ border: '1px solid #2563eb', background: selectedForm === 1 ? '#2563eb' : 'white', color: selectedForm === 1 ? 'white' : '#2563eb', borderRadius: 4, padding: '8px 16px', cursor: 'pointer' }}
            onClick={() => setSelectedForm(1)}
          >
            Crear Usuario Temporal
          </button>
        )}
        {(role === 1 || role === 4) && (
          <button
            className={selectedForm === 2 ? styles.btnPrimary : ''}
            style={{ border: '1px solid #2563eb', background: selectedForm === 2 ? '#2563eb' : 'white', color: selectedForm === 2 ? 'white' : '#2563eb', borderRadius: 4, padding: '8px 16px', cursor: 'pointer' }}
            onClick={() => setSelectedForm(2)}
          >
            Crear Usuario Completo
          </button>
        )}
      </div>

      {/* Show only the selected form */}
      {selectedForm === 1 && (role === 3 || role === 4) && (
        <div style={{ marginBottom: 20 }}>
          <h3>Crear Usuario Temporal</h3>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <input className={styles.input} placeholder="cedula" value={tempForm.cc} onChange={(e) => setTempForm({...tempForm, cc: e.target.value})} />
            <input className={styles.input} placeholder="nombre" value={tempForm.nombre} onChange={(e) => setTempForm({...tempForm, nombre: e.target.value})} />
            <input className={styles.input} placeholder="apellido" value={tempForm.apellido} onChange={(e) => setTempForm({...tempForm, apellido: e.target.value})} />
            <input className={styles.input} placeholder="correo" value={tempForm.correo} onChange={(e) => setTempForm({...tempForm, correo: e.target.value})} />
            <input className={styles.input} placeholder="telefono" value={tempForm.telefono} onChange={(e) => setTempForm({...tempForm, telefono: e.target.value})} />
            <button className={styles.btnPrimary} onClick={async () => {
              const payload = {
                usuario: tempForm.cc,
                password: tempForm.cc,
                idcolaborador: {
                  cc_colaborador: tempForm.cc,
                  nombre_colaborador: tempForm.nombre,
                  apellido_colaborador: tempForm.apellido,
                  correo_colaborador: tempForm.correo,
                  telefo_colaborador: tempForm.telefono,
                }
              };
              try {
                await (PerfilService as any).registerTemporalUser(payload);
              } catch (err) {
                // Opcional: manejar error aquí si se desea feedback
              }
            }}>Crear Temporal</button>
          </div>
        </div>
      )}

      {selectedForm === 2 && (role === 1 || role === 4) && (
        <div style={{ marginBottom: 20 }}>
          <h3>Crear Usuario Completo</h3>
          <form className={styles.completoForm}>
            <div className={styles.completoRow}>
              <input className={styles.input} placeholder="cedula" value={fullForm.idcolaborador.cc_colaborador} onChange={(e) => {
                const cc = e.target.value;
                setFullForm(f => ({
                  ...f,
                  usuario: cc,
                  idcolaborador: {
                    ...f.idcolaborador,
                    cc_colaborador: cc
                  },
                  is_staff: "0"
                }));
              }} />
            </div>
            <div className={styles.completoRow}>
              <input className={styles.input} placeholder="nombre" value={fullForm.idcolaborador.nombre_colaborador} onChange={(e) => setFullForm({...fullForm, idcolaborador: {...fullForm.idcolaborador, nombre_colaborador: e.target.value}, is_staff: "0"})} />
              <input className={styles.input} placeholder="apellido" value={fullForm.idcolaborador.apellido_colaborador} onChange={(e) => setFullForm({...fullForm, idcolaborador: {...fullForm.idcolaborador, apellido_colaborador: e.target.value}, is_staff: "0"})} />
            </div>
            <div className={styles.completoRow}>
              <select className={styles.select} value={fullForm.idcolaborador.cargo_colaborador || ''} onChange={(e) => setFullForm({...fullForm, idcolaborador: {...fullForm.idcolaborador, cargo_colaborador: e.target.value ? Number(e.target.value) : undefined}, is_staff: "0"})}>
                <option value="">Seleccionar cargo</option>
                {(cargosData?.cargos || []).map((c: any) => (
                  <option key={c.idcargo} value={c.idcargo}>{c.nombrecargo}</option>
                ))}
              </select>
              <select className={styles.select} value={fullForm.idcolaborador.nivel_colaborador || ''} onChange={(e) => setFullForm({...fullForm, idcolaborador: {...fullForm.idcolaborador, nivel_colaborador: e.target.value ? Number(e.target.value) : undefined}, is_staff: "0"})}>
                <option value="">Seleccionar nivel</option>
                {(cargosData?.niveles || []).map((n: any) => (
                  <option key={n.idnivel} value={n.idnivel}>{n.nombrenivel}</option>
                ))}
              </select>
              <select className={styles.select} value={fullForm.idcolaborador.regional_colab || ''} onChange={(e) => setFullForm({...fullForm, idcolaborador: {...fullForm.idcolaborador, regional_colab: e.target.value ? Number(e.target.value) : undefined}, is_staff: "0"})}>
                <option value="">Seleccionar regional</option>
                {(cargosData?.regionales || []).map((r: any) => (
                  <option key={r.idregional} value={r.idregional}>{r.nombreregional}</option>
                ))}
              </select>
            </div>
            <div className={styles.completoRow}>
              <select className={styles.select} value={selectedEmpresa ?? ''} onChange={(e) => { setSelectedEmpresa(e.target.value ? Number(e.target.value) : null); setSelectedUnidad(null); setSelectedProyecto(null); setFullForm(f => ({...f, is_staff: "0"})); }}>
                <option value="">Seleccionar empresa</option>
                {empresas.map((emp: any) => (
                  <option key={emp.idempresa} value={emp.idempresa}>{emp.nombre_empresa}</option>
                ))}
              </select>
              <select className={styles.select} value={selectedUnidad ?? ''} onChange={(e) => { setSelectedUnidad(e.target.value ? Number(e.target.value) : null); setSelectedProyecto(null); setFullForm(f => ({...f, is_staff: "0"})); }}>
                <option value="">Seleccionar unidad</option>
                {empresas.find((em) => em.idempresa === selectedEmpresa)?.unidades?.map((u: any) => (
                  <option key={u.idunidad} value={u.idunidad}>{u.nombreunidad}</option>
                ))}
              </select>
              <select className={styles.select} value={selectedProyecto ?? ''} onChange={(e) => { setSelectedProyecto(e.target.value ? Number(e.target.value) : null); setFullForm(f => ({...f, is_staff: "0"})); }}>
                <option value="">Seleccionar proyecto</option>
                {empresas.find((em) => em.idempresa === selectedEmpresa)?.unidades?.find((uu: any) => uu.idunidad === selectedUnidad)?.proyectos?.map((p: any) => (
                  <option key={p.idproyecto} value={p.idproyecto}>{p.nombreproyecto || p.nombre}</option>
                ))}
              </select>
              <select className={styles.select} value={fullForm.idcolaborador.centroOP || ''} onChange={(e) => setFullForm({...fullForm, idcolaborador: {...fullForm.idcolaborador, centroOP: e.target.value ? Number(e.target.value) : undefined}, is_staff: "0"})}>
                <option value="">Seleccionar centro</option>
                {empresas.find((em) => em.idempresa === selectedEmpresa)?.unidades?.find((uu: any) => uu.idunidad === selectedUnidad)?.proyectos?.find((pp: any) => pp.idproyecto === selectedProyecto)?.centros?.map((c: any) => (
                  <option key={c.idcentrop} value={c.idcentrop}>{c.nombrecentrop}</option>
                ))}
              </select>
            </div>
            <div className={styles.completoRow}>
              <input className={styles.input} placeholder="correo colaborador" value={fullForm.idcolaborador.correo_colaborador} onChange={(e) => setFullForm({...fullForm, idcolaborador: {...fullForm.idcolaborador, correo_colaborador: e.target.value}, is_staff: "0"})} />
              <input className={styles.input} placeholder="telefono" value={fullForm.idcolaborador.telefo_colaborador} onChange={(e) => setFullForm({...fullForm, idcolaborador: {...fullForm.idcolaborador, telefo_colaborador: e.target.value}, is_staff: "0"})} />
            </div>
            <div style={{ marginTop: 16 }}>
              <button className={styles.btnPrimary} type="button" onClick={async () => {
                try {
                  const payload = { ...fullForm, usuario: fullForm.idcolaborador.cc_colaborador, password: fullForm.idcolaborador.cc_colaborador, is_staff: "0" };
                  const resp = await api.post('user/register/', payload);
                  alert('Usuario creado');
                  console.log(resp.data);
                } catch (err: any) {
                  console.error(err);
                  alert('Error: ' + (err.response?.data?.detail || err.message));
                }
              }}>Crear Usuario</button>
            </div>
          </form>
        </div>
      )}

      <button onClick={() => navigate('/usuarios')}>Volver a Usuarios</button>
    </div>
  );
}

  import { Link } from "react-router-dom";
import { useLocation } from "react-router-dom";
import styles from "./Navbar.module.css";

  interface SidebarProps {
    userType?: number; // 1 = usuario, 2 = admin, 3 = staff especial, 4 = superadmin
    isOpen?: boolean;
    userId?: number;
  }
  

  export default function Sidebar({ userType = 1, isOpen = true, userId }: SidebarProps) {
  const location = useLocation();
  const isMundial = location.pathname.includes('/mundial');
  const isSuperAdmin = userType === 4;
  const isAdmin = userType === 2 || isSuperAdmin;
  // allow specific user IDs to see Usuarios menu
  const allowedUserIdsForUsuarios = new Set([1, 3, 4, 2, 5]);
  const canSeeUsuarios = isAdmin || (typeof userId === 'number' && allowedUserIdsForUsuarios.has(userId));

    return (
      <aside className={`${styles.sidebar} ${isOpen ? styles.open : styles.closed}`}
        style={{ display: 'flex', flexDirection: 'column', height: '100dvh', minHeight: '100vh' }}>
        <div className={styles.logo} style={{ flexShrink: 0 }}>
          <Link to="/perfil" className={styles.logoLink}>
            <div className="logo-placeholder">
              <img
                src={isMundial ? "/img/logoMICompe.png" : "/img/logoMIC.png"}
                alt="Logo"
                className="logo-img"
              />
            </div>
          </Link>
        </div>

        <nav
          className={styles.menu}
          style={{ flex: '1 1 auto', overflowY: 'auto', minHeight: 0, paddingBottom: 32 }}
        >
          <ul>
            {/* Mi Campeonato Menu */}
            <li className={styles.menuSection}>
              <span className={styles.sectionTitle}>Mi Campeonato</span>
              <ul className={styles.submenu}>
                <li><Link to="/mundial" className={styles.submenuItem}>Inicio</Link></li>
                {(userType === 2 || userType === 4) && (
                  <li><Link to="/mundial/admin" className={styles.submenuItem}>Administracion</Link></li>
                )}
              </ul>
            </li>

            {isAdmin ? (
              <>
                <li className={styles.menuSection}>
                  <span className={styles.sectionTitle}>Capacitaciones</span>
                  <ul className={styles.submenu}>
                    <li><Link to="/dashboard" className={styles.submenuItem}>Analítica</Link></li>
                    <li><Link to="/capacitaciones/list" className={styles.submenuItem}>Capacitaciones</Link></li>
                    <li><Link to="/CrearCapacitacion" className={styles.submenuItem}>Crear Capacitación</Link></li>
                    <li><Link to="/" className={styles.submenuItem}>Mis Capacitaciones</Link></li>
                  </ul>
                </li>

                <span className={styles.sectionTitle}>Usuarios</span>
                <li className={styles.menuSection}>
                  <Link to="/usuarios" className={styles.submenuItem}>Gestionar Usuarios</Link>
                  {canSeeUsuarios && (
                    <div style={{ marginTop: 8 }}>
                      <Link to="/usuarios/crear" className={styles.submenuItem}>Crear Usuario</Link>
                    </div>
                  )}
                </li>
              </>
            ) : userType === 3 ? (
              <>
                <li className={styles.menuSection}>
                  <span className={styles.sectionTitle}>Capacitaciones</span>
                  <ul className={styles.submenu}>
                    <li><Link to="/capacitaciones/list" className={styles.submenuItem}>Capacitaciones</Link></li>
                    <li><Link to="/" className={styles.submenuItem}>Mis Capacitaciones</Link></li>
                  </ul>
                </li>
                <li className={styles.menuSection}>
                  <span className={styles.sectionTitle}>Usuarios</span>
                  <ul className={styles.submenu}>
                    <li><Link to="/usuarios" className={styles.submenuItem}>Gestionar Usuarios</Link></li>
                    <li><Link to="/usuarios/crear" className={styles.submenuItem}>Crear Usuario Temporal</Link></li>
                  </ul>
                </li>
              </>
            ) : userType === 5 ? (
              <>
                <li className={styles.menuSection}>
                  <span className={styles.sectionTitle}>Capacitaciones</span>
                  <ul className={styles.submenu}>
                    <li><Link to="/capacitaciones/list" className={styles.submenuItem}>Capacitaciones</Link></li>
                    <li><Link to="/" className={styles.submenuItem}>Mis Capacitaciones</Link></li>
                  </ul>
                </li>
              </>
            ):  (
              <li className={styles.menuSection}>
                <span className={styles.sectionTitle}>Capacitaciones</span>
                <Link to="/" className={styles.submenuItem}>Mis Capacitaciones</Link>
              </li>
            )}

            {(userType === 3 || userType === 4) && (
              <>
                <li className={styles.menuSection}>
                  <span className={styles.sectionTitle}>Examenes</span>
                  <ul className={styles.submenu}>
                    <li><Link to="/CrearExamenes" className={styles.submenuItem}>Crear Exámenes</Link></li>
                    <li><Link to="/examenes" className={styles.submenuItem}>Enviar Exámenes</Link></li>
                    <li><Link to="/reportes-correos" className={styles.submenuItem}>Reporte de Correos</Link></li>
                  </ul>
                </li>
              </>
            )}

            {(userType === 2 || userType === 3 || userType === 4) && (
              <li className={styles.menuSection}>
                <span className={styles.sectionTitle}>Gestión Empresarial</span>
                <ul className={styles.submenu}>
                  <li><Link to="/datos-empresa" className={styles.submenuItem}>Datos de Empresa</Link></li>
                  <li><Link to="/cargo-nivel-region" className={styles.submenuItem}>Cargo, Nivel y Regional</Link></li>
                </ul>
              </li>
            )}
          </ul>
        </nav>
      </aside>
    );
  }

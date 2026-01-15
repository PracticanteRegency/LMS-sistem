  import { Link } from "react-router-dom";
  import styles from "./Navbar.module.css";

  interface SidebarProps {
    userType?: number; // 1 = usuario, 2 = admin, 3 = staff especial, 4 = superadmin
    isOpen?: boolean;
    userId?: number;
  }
  
  export default function Sidebar({ userType = 1, isOpen = true, userId }: SidebarProps) {
    const isSuperAdmin = userType === 4;
    const isAdmin = userType === 2 || isSuperAdmin;
    const isStaff = userType === 3 || isSuperAdmin;
    // allow specific user IDs to see Usuarios menu
    const allowedUserIdsForUsuarios = new Set([1,3,4]);
    const canSeeUsuarios = isAdmin || (typeof userId === 'number' && allowedUserIdsForUsuarios.has(userId));

    return (
      <aside className={`${styles.sidebar} ${isOpen ? styles.open : styles.closed}`}>
        <div className={styles.logo}>
          <Link to="/perfil" className={styles.logoLink}>
            <div className="logo-placeholder">
              <img 
                src="/img/REGENCYL.png" 
                alt="Logo" 
                className="logo-img"
              />
            </div>
          </Link>
        </div>

        <nav className={styles.menu}>
          <ul>
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
            ) : (
              <li className={styles.menuSection}>
                <span className={styles.sectionTitle}>Capacitaciones</span>
                <Link to="/" className={styles.submenuItem}>Mis Capacitaciones</Link>
              </li>
            )}

            {isStaff && (
              <li className={styles.menuSection}>
                <span className={styles.sectionTitle}>Examenes</span>
                <ul className={styles.submenu}>
                  <li><Link to="/examenes" className={styles.submenuItem}>Enviar Exámenes</Link></li>
                  <li><Link to="/reportes-correos" className={styles.submenuItem}>Reporte de Correos</Link></li>
                </ul>
              </li>
            )}
          </ul>
        </nav>
      </aside>
    );
  }

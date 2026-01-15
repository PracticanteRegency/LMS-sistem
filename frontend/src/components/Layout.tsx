import { useState, useEffect } from "react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import { Outlet } from "react-router-dom";
import { getUserRole, getUserId } from "../services/auth";


export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    // Initialize based on screen size
    return window.innerWidth > 768;
  });
  const [userType, setUserType] = useState(1); // 1 = usuario, 2 = admin, 3 = staff especial, 4 = superadmin
  const [userId, setUserId] = useState<number | null>(null);

  useEffect(() => {
    // Determinar tipo de usuario a partir de is_staff / is_admin devuelto por login
    const role = getUserRole(); // backend: 1 = admin, 3 = staff, 4 = superadmin, 0 = usuario
    if (role === 4) setUserType(4); // superadmin UI (todo acceso)
    else if (role === 1) setUserType(2); // admin UI
    else if (role === 3) setUserType(3); // staff especial UI
    else setUserType(1); // usuario normal
    // set user id for components that need it
    try { setUserId(getUserId()); } catch { setUserId(null); }

    // Detectar cambios de tamaño de pantalla
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      // Cerrar sidebar automáticamente en móvil
      if (mobile && sidebarOpen) {
        setSidebarOpen(false);
      }
    };  

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [sidebarOpen]);
  
  return (
    <div style={{ 
      display: "flex", 
      height: "100vh",
      width: "100%",
      overflow: "hidden",
      position: "relative"
    }}>
      {/* Overlay for all screen sizes when sidebar is open */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.5)",
            zIndex: 998,
            transition: "opacity 0.3s ease"
          }}
        />
      )}

      <Sidebar userType={userType} isOpen={sidebarOpen} userId={userId ?? undefined} />

      <div 
        style={{ 
        flex: 1,
        display: "flex", 
        flexDirection: "column",
        width: "100%",
        overflow: "hidden",
        minWidth: 0
      }}>
        <Navbar userType={userType} onMenuToggle={setSidebarOpen} />
        <main 
          style={{ 
          padding: "16px",
          overflow: "auto", 
          flex: 1,
          width: "100%",
          boxSizing: "border-box"
        }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

import { BrowserRouter, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { AdminRoute } from "./AdminRoute.tsx";
import { AuthContext } from "./context/AuthContext";
import { getUser, isAuthenticated } from "./services/auth";

import Layout from "./components/Layout";
import Home from "./pages/Home";
import LoginPage from "./pages/login";
import Dashboard from "./pages/Dashboard";
import Capacitaciones from "./pages/Capacitaciones";
import Examenes from "./pages/Examenes";
import ReporteCorreos from "./pages/ReporteCorreos";
import TrabajadoresCorreo from "./pages/TrabajadoresCorreo";
import Usuarios from "./pages/Usuarios";
import Perfil from "./usuario/perfil";
import PerfilUser from "./usuario/perfilUser";
import PerfilUserCap from "./pages/PerfilUserCap";
import CrearCapacitacion from "./pages/CrearCapacitacion";
import VerCapacitacion from "./pages/VerCapacitacion";
import EditarColaboradores from "./pages/EditarColaboradores";
import CrearUsuario from "./pages/CrearUsuario";
import ReproductorVideo from "./pages/ReproductorVideo";
import ReproductorImagenes from "./pages/ReproductorImagenes";
import ResponderLeccion from "./pages/responderLeccion";
import NoAutorizado from "./pages/NoAutorizado";
import ProtectedRoute from "./ProtectedRoute.tsx";
import CrearExamenes from "./pages/CrearExcamenes";
import EditarUsuario from "./pages/EditarUsuario";
import UsersCap from "./pages/UsersCap.tsx";
import DatosEmpresa from "./pages/DatosEmpresa";
import CargoNivelRegion from "./pages/CargoNivelRegion";

export default function App() {
  const user = getUser();

  function AuthGate() {
    const navigate = useNavigate();
    const location = useLocation();

    // If there's no active token, and user is not on the login page, redirect to /login
    // This keeps public routes like /login accessible.
    if (!isAuthenticated() && location.pathname !== "/login") {
      navigate("/login", { replace: true });
    }
    return null;
  }

  return (
    <AuthContext.Provider value={{ user }}>
      <BrowserRouter>
        <AuthGate />
        <Routes>

          {/* RUTAS CON LAYOUT */}
          <Route element={<Layout />}>

            {/* Rutas accesibles para todos los usuarios */}
            <Route path="/capacitaciones/:id" element={<VerCapacitacion />} />
            <Route path="/perfil" element={<Perfil />} />
            <Route path="/user/perfil/:id_colaborador" element={<AdminRoute><PerfilUser /></AdminRoute>} />
            <Route path="/user/perfil/:id_colaborador/capacitaciones/:id_capacitacion" element={<AdminRoute><PerfilUserCap /></AdminRoute>} />
            <Route path="/examenes" element={<ProtectedRoute><Examenes /></ProtectedRoute>} />
            <Route path="/reportes-correos" element={<ProtectedRoute><ReporteCorreos /></ProtectedRoute>} />
            <Route path="/reportes-correos/:correoId/trabajadores" element={<ProtectedRoute><TrabajadoresCorreo /></ProtectedRoute>} />
            <Route path="/CrearExamenes" element={<ProtectedRoute><CrearExamenes /></ProtectedRoute>} />
            <Route path="/datos-empresa" element={<ProtectedRoute><DatosEmpresa /></ProtectedRoute>} />
            <Route path="/cargo-nivel-region" element={<ProtectedRoute><CargoNivelRegion /></ProtectedRoute>} />

            {/* RUTAS SOLO ADMIN */}
            <Route path="/dashboard" element={
              <AdminRoute><Dashboard /></AdminRoute>
            }/>
            <Route path="/capacitaciones/list" element={
              <AdminRoute><Capacitaciones /></AdminRoute>
              } />


            {/* Ruta para ver usuarios de una capacitación, solo para roles 1 y 4 */}
            <Route path="/capacitaciones/:id/users-cap" element={
              <AdminRoute><UsersCap /></AdminRoute>
            } />

            <Route path="/capacitaciones/:id/colaboradores" element={
              <AdminRoute><EditarColaboradores /></AdminRoute>
            } />

            <Route path="/" element={
              <ProtectedRoute><Home /></ProtectedRoute>
          } />

            <Route path="/usuarios" element={
              <AdminRoute><Usuarios /></AdminRoute>
            }/>
            <Route path="/usuarios/crear" element={
              <ProtectedRoute><CrearUsuario /></ProtectedRoute>
            }/>
            <Route path="/CrearCapacitacion" element={
              <AdminRoute><CrearCapacitacion /></AdminRoute>
            }/>
            <Route path="/CrearCapacitacion/:id" element={
              <AdminRoute><CrearCapacitacion /></AdminRoute>
            }/>
            <Route path="/user/editar/:id" element={<EditarUsuario />} />

          </Route>

          {/* RUTAS SIN LAYOUT */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/no-autorizado" element={<NoAutorizado />} />

          {/* RUTAS REPRODUCIR/FORMULARIO */}
          <Route path="/capacitaciones/:capacitacionId/reproducir/:moduloIndex/:leccionIndex" element={<ReproductorVideo />} />
          {/* legacy video route kept for compatibility */}
          <Route path="/capacitaciones/:capacitacionId/video/:moduloIndex/:leccionIndex" element={<ReproductorVideo />} />
          <Route path="/capacitaciones/:capacitacionId/imagen/:moduloIndex/:leccionIndex" element={<ReproductorImagenes />} />
          <Route path="/capacitaciones/:capacitacionId/formulario/:moduloIndex/:leccionIndex" element={<ResponderLeccion />} />

        </Routes>
      </BrowserRouter>
    </AuthContext.Provider>
  );
}

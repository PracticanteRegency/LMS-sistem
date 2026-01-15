import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AdminRoute } from "./AdminRoute.tsx";

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
import CrearUsuario from "./pages/CrearUsuario";
import ReproductorVideo from "./pages/ReproductorVideo";
import ReproductorImagenes from "./pages/ReproductorImagenes";
import ResponderLeccion from "./pages/responderLeccion";
import NoAutorizado from "./pages/NoAutorizado";
import ProtectedRoute from "./ProtectedRoute.tsx";

export default function App() {
  return (
    <BrowserRouter>
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
          

          {/* RUTAS SOLO ADMIN */}
          <Route path="/dashboard" element={
            <AdminRoute><Dashboard /></AdminRoute>
          }/>
          <Route path="/capacitaciones/list" element={
            <AdminRoute><Capacitaciones /></AdminRoute>
            } />

          <Route path="/" element={
            <ProtectedRoute><Home /></ProtectedRoute>
        } />

          <Route path="/usuarios" element={
            <AdminRoute><Usuarios /></AdminRoute>
          }/>
          <Route path="/usuarios/crear" element={
            <CrearUsuario />
          }/>
          <Route path="/CrearCapacitacion" element={
            <AdminRoute><CrearCapacitacion /></AdminRoute>
          }/>
          <Route path="/CrearCapacitacion/:id" element={
            <AdminRoute><CrearCapacitacion /></AdminRoute>
          }/>

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
  );
}

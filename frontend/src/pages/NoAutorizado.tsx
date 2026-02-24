import { Navigate } from "react-router-dom";

export default function NoAutorizado() {
  return <Navigate to="/" replace />;
}

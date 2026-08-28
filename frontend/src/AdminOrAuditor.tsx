import { Navigate } from "react-router-dom";
import { isAuthenticated, isAdmin, isSuperAdmin, isAdminExamenes, isUseraditoria } from "./services/auth";
import type { JSX } from "react";

interface RouteProps {
  children: JSX.Element;
}

export const AdminOrAuditorRoute = ({ children }: RouteProps) => {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin() && !isSuperAdmin() && !isAdminExamenes() && !isUseraditoria()) {
    return <Navigate to="/no-autorizado" replace />;
  }

  return children;
};

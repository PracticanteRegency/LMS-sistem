  import { Navigate } from "react-router-dom";
  import { isAuthenticated, isAdmin, isSuperAdmin } from "./services/auth";
import type { JSX } from "react";

  interface AdminRouteProps {
    children: JSX.Element;
  }

  export const AdminRoute = ({ children }: AdminRouteProps) => {
    if (!isAuthenticated()) {
      return <Navigate to="/login" replace />;
    }

    if (!isAdmin() && !isSuperAdmin()) {
      return <Navigate to="/no-autorizado" replace />;
    }

    return children;
  };

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { isAuthenticated } from './services/auth';

interface Props {
  children: React.ReactElement;
}

export default function ProtectedRoute({ children }: Props) {
  const location = useLocation();

  if (!isAuthenticated()) {
    // redirect to login and preserve where we were going
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}

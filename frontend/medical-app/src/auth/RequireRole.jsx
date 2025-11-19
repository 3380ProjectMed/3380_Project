import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthProvider";

export default function RequireRole({ roles, children }) {
  const { user, loading } = useAuth();
  const loc = useLocation();

  if (loading) return <div style={{ padding: 24 }}>Loading…</div>;
  if (!user)   return <Navigate to="/login" state={{ from: loc }} replace />;

  const role = String(user.role || '').toUpperCase();

  if (roles && !roles.map(r => String(r).toUpperCase()).includes(role)) {
    return <Navigate to={homeFor(role)} replace />;
  }
  return children;
}

function homeFor(role) {
  switch (role) {
    case 'ADMIN':        return '/admin';
    case 'DOCTOR':       return '/doctor';
    case 'NURSE':        return '/nurse';
    case 'RECEPTIONIST': return '/receptionist';
    case 'PATIENT':
    default:             return '/patientportal';
  }
}

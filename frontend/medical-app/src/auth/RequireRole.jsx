import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthProvider";

export default function RequireRole({ roles, children }) {
  const { user, loading } = useAuth();
  const loc = useLocation();

  if (loading) return <div style={{ padding: 24 }}>Loading…</div>;
  if (!user)   return <Navigate to="/login" state={{ from: loc }} replace />;

  if (roles && !roles.includes(user.role)) {
    const home = user.role === 'DOCTOR' ? '/doctor'
               : user.role === 'ADMIN'  ? '/admin'
               : '/patientportal';
    return <Navigate to={home} replace />;
  }
  return children;
}
 
import { Navigate } from "react-router-dom";

const SESSION_DURATION = 90 * 60 * 1000; // 90 minutes

export default function ProtectedRoute({ children }: { children: JSX.Element }) {
  const authData = localStorage.getItem("auth");
  if (!authData) return <Navigate to="/login" replace />;

  const { loggedIn, timestamp } = JSON.parse(authData);
  const isExpired = Date.now() - timestamp > SESSION_DURATION;

  if (!loggedIn || isExpired) {
    localStorage.removeItem("auth");
    return <Navigate to="/login" replace />;
  }

  return children;
}

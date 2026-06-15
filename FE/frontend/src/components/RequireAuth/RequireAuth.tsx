import { Navigate, Outlet } from "react-router";
import { useAuthStore } from "../../store/auth";

/**
 * Route guard: anonymous visitors (including freshly logged-out ones)
 * are sent back to the home page.
 */
export default function RequireAuth() {
  const token = useAuthStore((state) => state.token);
  if (!token) {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
}

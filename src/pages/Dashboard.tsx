import DashboardPage from "@/components/dashboard/DashboardPage";
import { NoAccess } from "@/components/dashboard/NoAccess";
import { useAuth } from "@/context/AuthContext";

export default function Dashboard() {
  const { user } = useAuth();
  // Sin ningún permiso, el panel solo dispararía 403 en todas sus consultas.
  if (user && !user.permissions?.length) return <NoAccess />;
  return <DashboardPage />;
}

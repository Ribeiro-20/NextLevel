import { useAdmin } from "../hooks/useAdmin";
import AdminPanel from "./AdminPanel";

export default function AdminRoute() {
  const { isAdmin, loading } = useAdmin();

  if (loading) return <div className="text-center mt-20 text-white">Verificando acesso...</div>;
  if (!isAdmin) return <div className="text-center mt-20 text-red-500">🚫 Acesso negado.</div>;

  return <AdminPanel />;
}

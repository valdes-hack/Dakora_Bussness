// src/components/layout/AdminLayout.jsx (Version propre)
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AdminSidebar from './AdminSidebar';
import AdminNavbar from './AdminNavbar';

const AdminLayout = () => {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (!user) return <Navigate to="/admin/login" />;

  return (
    <div className="flex min-h-screen bg-gray-100">
      <AdminSidebar /> {/* Uniquement ça à gauche */}
      <div className="flex-1 flex flex-col">
        <AdminNavbar /> {/* Uniquement ça en haut */}
        <main className="p-8"><Outlet /></main>
      </div>
    </div>
  );
};
export default AdminLayout;
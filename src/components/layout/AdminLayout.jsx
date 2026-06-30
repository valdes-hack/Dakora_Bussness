// src/components/layout/AdminLayout.jsx
import { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AdminSidebar from './AdminSidebar';
import AdminNavbar from './AdminNavbar';

const PageLoader = () => (
  <div className="min-h-screen bg-gray-100 dark:bg-neutral-950 flex items-center justify-center">
    <div className="w-10 h-10 border-4 border-dakora-green/20 border-t-dakora-green rounded-full animate-spin" />
  </div>
);

const AdminLayout = () => {
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/admin/login" />;

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-neutral-950 transition-colors duration-300">
      <AdminSidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      <div className="flex-1 flex flex-col min-w-0">
        <AdminNavbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 p-6 md:p-8 bg-gray-100 dark:bg-neutral-950 transition-colors duration-300">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
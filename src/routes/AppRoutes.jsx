import { lazy, Suspense, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ClientLayout from '../components/layout/ClientLayout';
import AdminLayout from '../components/layout/AdminLayout';

// Wrapper pour intercepter les ChunkLoadError et forcer le rechargement de la page
const lazyWithRetry = (componentImport) => {
  return lazy(async () => {
    try {
      return await componentImport();
    } catch (error) {
      console.error("Erreur de chargement du chunk dynamique:", error);
      const isChunkError = 
        error.name === 'ChunkLoadError' || 
        error.message?.includes('Failed to fetch dynamically imported module') ||
        error.message?.includes('Failed to fetch dynamic');
        
      if (isChunkError) {
        const retryKey = 'chunk-load-retry-count';
        const retryCount = parseInt(sessionStorage.getItem(retryKey) || '0', 10);
        if (retryCount < 2) {
          sessionStorage.setItem(retryKey, (retryCount + 1).toString());
          window.location.reload();
          return new Promise(() => {}); // Évite de crasher en attendant le reload
        }
      }
      throw error;
    }
  });
};

// Pages Client — lazy loading (chargées uniquement quand visitées)
import Home from '../pages/client/Home'; // Home reste eager (page d'accueil)
const Shop         = lazyWithRetry(() => import('../pages/client/Shop'));
const ProductDetails = lazyWithRetry(() => import('../pages/client/ProductDetails'));
const CartPage     = lazyWithRetry(() => import('../pages/client/CartPage'));

// Pages Admin — lazy loading
import Login from '../pages/admin/Login';
const Dashboard      = lazyWithRetry(() => import('../pages/admin/Dashboard'));
const Inventory      = lazyWithRetry(() => import('../pages/admin/Inventory'));
const Orders         = lazyWithRetry(() => import('../pages/admin/Orders'));
const ProfileSettings = lazyWithRetry(() => import('../pages/admin/ProfileSettings'));
const Categories     = lazyWithRetry(() => import('../pages/admin/Categories'));
const Products       = lazyWithRetry(() => import('../pages/admin/Products'));
const Stories        = lazyWithRetry(() => import('../pages/admin/Stories'));
const AdminUsers     = lazyWithRetry(() => import('../pages/admin/AdminUsers'));

// Skeleton générique pendant le chargement d'une page
const PageLoader = () => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <div className="w-10 h-10 border-4 border-dakora-green/20 border-t-dakora-green rounded-full animate-spin" />
    </div>
  </div>
);

const AppRoutes = () => {
  useEffect(() => {
    sessionStorage.removeItem('chunk-load-retry-count');
  }, []);

  return (
    <Routes>
      {/* 1. MONDE CLIENT */}
      <Route element={<ClientLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/boutique" element={
          <Suspense fallback={<PageLoader />}><Shop /></Suspense>
        } />
        <Route path="/produit/:id" element={
          <Suspense fallback={<PageLoader />}><ProductDetails /></Suspense>
        } />
        <Route path="/panier" element={
          <Suspense fallback={<PageLoader />}><CartPage /></Suspense>
        } />
        <Route path="/commande" element={<Navigate to="/panier" replace />} />
      </Route>

      {/* 2. AUTHENTIFICATION */}
      <Route path="/admin/login" element={<Login />} />

      {/* 3. MONDE ADMIN */}
      <Route element={<AdminLayout />}>
        <Route path="/admin/dashboard" element={
          <Suspense fallback={<PageLoader />}><Dashboard /></Suspense>
        } />
        <Route path="/admin/inventaire" element={
          <Suspense fallback={<PageLoader />}><Inventory /></Suspense>
        } />
        <Route path="/admin/commandes" element={
          <Suspense fallback={<PageLoader />}><Orders /></Suspense>
        } />
        <Route path="/admin/profil" element={
          <Suspense fallback={<PageLoader />}><ProfileSettings /></Suspense>
        } />
        <Route path="/admin/categories" element={
          <Suspense fallback={<PageLoader />}><Categories /></Suspense>
        } />
        <Route path="/admin/produits" element={
          <Suspense fallback={<PageLoader />}><Products /></Suspense>
        } />
        <Route path="/admin/stories" element={
          <Suspense fallback={<PageLoader />}><Stories /></Suspense>
        } />
        <Route path="/admin/utilisateurs" element={
          <Suspense fallback={<PageLoader />}><AdminUsers /></Suspense>
        } />
      </Route>

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

export default AppRoutes;
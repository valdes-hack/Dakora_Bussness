import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ClientLayout from '../components/layout/ClientLayout';
import AdminLayout from '../components/layout/AdminLayout';

// Pages Client — lazy loading (chargées uniquement quand visitées)
import Home from '../pages/client/Home'; // Home reste eager (page d'accueil)
const Shop         = lazy(() => import('../pages/client/Shop'));
const ProductDetails = lazy(() => import('../pages/client/ProductDetails'));
const CartPage     = lazy(() => import('../pages/client/CartPage'));
const Checkout     = lazy(() => import('../pages/client/Checkout'));

// Pages Admin — lazy loading
import Login from '../pages/admin/Login';
const Dashboard      = lazy(() => import('../pages/admin/Dashboard'));
const Inventory      = lazy(() => import('../pages/admin/Inventory'));
const Orders         = lazy(() => import('../pages/admin/Orders'));
const ProfileSettings = lazy(() => import('../pages/admin/ProfileSettings'));
const Categories     = lazy(() => import('../pages/admin/Categories'));
const Products       = lazy(() => import('../pages/admin/Products'));

// Skeleton générique pendant le chargement d'une page
const PageLoader = () => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <div className="w-10 h-10 border-4 border-dakora-green/20 border-t-dakora-green rounded-full animate-spin" />
    </div>
  </div>
);

const AppRoutes = () => {
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
        <Route path="/commande" element={
          <Suspense fallback={<PageLoader />}><Checkout /></Suspense>
        } />
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
      </Route>

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

export default AppRoutes;
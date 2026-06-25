import { Routes, Route, Navigate } from 'react-router-dom';
import ClientLayout from '../components/layout/ClientLayout';
import AdminLayout from '../components/layout/AdminLayout';

// Pages Client
import Home from '../pages/client/Home';
import Shop from '../pages/client/Shop';
import ProductDetails from '../pages/client/ProductDetails';
import CartPage from '../pages/client/CartPage';
import Checkout from '../pages/client/Checkout';

// Pages Admin
import Login from '../pages/admin/Login';
import Dashboard from '../pages/admin/Dashboard';
import Inventory from '../pages/admin/Inventory';
import Orders from '../pages/admin/Orders';
import ProfileSettings from '../pages/admin/ProfileSettings';
import Categories from '../pages/admin/Categories';
import Products from '../pages/admin/Products';

const AppRoutes = () => {
  return (
    <Routes>
      
      {/* 1. MONDE CLIENT (Par défaut) 
          Design public avec Header et Footer Apple Style. */}
      <Route element={<ClientLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/boutique" element={<Shop />} />
        <Route path="/produit/:id" element={<ProductDetails />} />
        <Route path="/panier" element={<CartPage />} />
        <Route path="/commande" element={<Checkout />} />
      </Route>

      {/* 2. AUTHENTIFICATION 
          Page isolée pour la sécurité. */}
      <Route path="/admin/login" element={<Login />} />

      {/* 3. MONDE ADMIN (Privé)
          Interface de gestion avec Sidebar et AdminNavbar. */}
      <Route element={<AdminLayout />}>
        <Route path="/admin/dashboard" element={<Dashboard />} />
        <Route path="/admin/inventaire" element={<Inventory />} />
        <Route path="/admin/commandes" element={<Orders />} />
        <Route path="/admin/profil" element={<ProfileSettings />} />
        <Route path="/admin/categories" element={<Categories />} />
        <Route path="/admin/produits" element={<Products />} />
      </Route>

      {/* Sécurité : Retour à l'accueil si le chemin est inconnu */}
      <Route path="*" element={<Navigate to="/" />} />
      
    </Routes>
  );
};

export default AppRoutes;
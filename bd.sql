;-- 1. Table des Catégories
CREATE TABLE categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name_fr TEXT NOT NULL,
  name_en TEXT,
  slug TEXT UNIQUE NOT NULL, -- ex: 'motoculteurs'
  icon_url TEXT, -- pour mettre un petit emoji ou icône
  order_index INTEGER DEFAULT 0
);

-- 2. Table des Produits (mise à jour avec category_id)
CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  name_fr TEXT NOT NULL,
  name_en TEXT,
  description_fr TEXT,
  description_en TEXT,
  badge TEXT, -- ex: 'Promo', 'Top'
  is_active BOOLEAN DEFAULT true,
  order_index INTEGER DEFAULT 0
);

-- 3. Table de la Galerie d'Images
CREATE TABLE product_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  is_main BOOLEAN DEFAULT false, -- pour savoir laquelle est la photo principale
  order_index INTEGER DEFAULT 0
);

-- 4. Table des Variantes
CREATE TABLE variants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  label_fr TEXT NOT NULL, -- ex: '7 CV Diesel'
  label_en TEXT,
  price NUMERIC NOT NULL,
  old_price NUMERIC,
  stock_quantity INTEGER DEFAULT 0
);

-- 5. Table des Profils (Utilisateurs)
-- Elle se lie à la table auth.users de Supabase
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'admin',
  updated_at TIMESTAMPTZ
);

-- 6. Table des Commandes
CREATE TABLE orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  customer_first_name TEXT NOT NULL,
  customer_last_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  delivery_mode TEXT,
  address TEXT,
  city TEXT,
  payment_mode TEXT,
  payment_ref TEXT,
  total_amount NUMERIC,
  status TEXT DEFAULT 'En attente',
  cancellation_reason TEXT
);

-- 7. Détails des commandes
CREATE TABLE order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES variants(id),
  quantity INTEGER NOT NULL,
  unit_price NUMERIC NOT NULL
);

-- 8. Stories & Avis & Coupons (On les garde comme avant)
CREATE TABLE stories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title_fr TEXT, title_en TEXT, media_url TEXT, redirect_link TEXT, expires_at TIMESTAMPTZ, is_active BOOLEAN DEFAULT true
);

CREATE TABLE reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  customer_name TEXT, rating INTEGER CHECK (rating >= 1 AND rating <= 5), comment TEXT, is_approved BOOLEAN DEFAULT false, created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE coupons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL, discount_type TEXT, value NUMERIC, min_purchase NUMERIC DEFAULT 0, expires_at TIMESTAMPTZ, is_active BOOLEAN DEFAULT true
);

-- 9. Paramètres & Notifications
CREATE TABLE settings (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, key TEXT UNIQUE NOT NULL, value TEXT);
CREATE TABLE notifications (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, order_id UUID REFERENCES orders(id) ON DELETE CASCADE, message TEXT, is_read BOOLEAN DEFAULT false, created_at TIMESTAMPTZ DEFAULT NOW());

90d5bd65-b05a-4418-bab2-9c8bb0640349
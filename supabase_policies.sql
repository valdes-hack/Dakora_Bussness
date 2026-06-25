-- Script SQL pour configurer la sécurité (RLS) sur Supabase
-- Copie et colle ce script dans l'onglet SQL Editor de ton tableau de bord Supabase, puis clique sur RUN.

-- 1. Table: categories
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Lecture publique des categories" ON categories;
DROP POLICY IF EXISTS "Ecriture admin des categories" ON categories;
CREATE POLICY "Lecture publique des categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Ecriture admin des categories" ON categories FOR ALL TO authenticated USING (true);

-- 2. Table: products
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Lecture publique des produits" ON products;
DROP POLICY IF EXISTS "Ecriture admin des produits" ON products;
CREATE POLICY "Lecture publique des produits" ON products FOR SELECT USING (true);
CREATE POLICY "Ecriture admin des produits" ON products FOR ALL TO authenticated USING (true);

-- 3. Table: product_images
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Lecture publique des images" ON product_images;
DROP POLICY IF EXISTS "Ecriture admin des images" ON product_images;
CREATE POLICY "Lecture publique des images" ON product_images FOR SELECT USING (true);
CREATE POLICY "Ecriture admin des images" ON product_images FOR ALL TO authenticated USING (true);

-- 4. Table: variants
ALTER TABLE variants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Lecture publique des variantes" ON variants;
DROP POLICY IF EXISTS "Ecriture admin des variantes" ON variants;
CREATE POLICY "Lecture publique des variantes" ON variants FOR SELECT USING (true);
CREATE POLICY "Ecriture admin des variantes" ON variants FOR ALL TO authenticated USING (true);

-- 5. Table: stories
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Lecture publique des stories" ON stories;
DROP POLICY IF EXISTS "Ecriture admin des stories" ON stories;
CREATE POLICY "Lecture publique des stories" ON stories FOR SELECT USING (true);
CREATE POLICY "Ecriture admin des stories" ON stories FOR ALL TO authenticated USING (true);

-- 6. Table: settings
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Lecture publique des parametres" ON settings;
DROP POLICY IF EXISTS "Ecriture admin des parametres" ON settings;
CREATE POLICY "Lecture publique des parametres" ON settings FOR SELECT USING (true);
CREATE POLICY "Ecriture admin des parametres" ON settings FOR ALL TO authenticated USING (true);

-- 7. Table: profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Lecture publique des profils" ON profiles;
DROP POLICY IF EXISTS "Modification du profil propre" ON profiles;
CREATE POLICY "Lecture publique des profils" ON profiles FOR SELECT USING (true);
CREATE POLICY "Modification du profil propre" ON profiles FOR ALL USING (auth.uid() = id);

-- 8. Table: orders
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Creation publique des commandes" ON orders;
DROP POLICY IF EXISTS "Lecture et modif admin des commandes" ON orders;
CREATE POLICY "Creation publique des commandes" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Lecture et modif admin des commandes" ON orders FOR ALL TO authenticated USING (true);

-- 9. Table: order_items
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Creation publique des items de commande" ON order_items;
DROP POLICY IF EXISTS "Lecture et modif admin des items de commande" ON order_items;
CREATE POLICY "Creation publique des items de commande" ON order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Lecture et modif admin des items de commande" ON order_items FOR ALL TO authenticated USING (true);

-- 10. Table: notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Creation publique des notifications" ON notifications;
DROP POLICY IF EXISTS "Lecture et modif admin des notifications" ON notifications;
CREATE POLICY "Creation publique des notifications" ON notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Lecture et modif admin des notifications" ON notifications FOR ALL TO authenticated USING (true);

-- Politiques RLS pour le bucket Storage "products"
-- Exécutez ce script dans le SQL Editor de Supabase

-- 1. Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "Lecture publique des images" ON storage.objects;
DROP POLICY IF EXISTS "Ecriture admin des images" ON storage.objects;
DROP POLICY IF EXISTS "Modification admin des images" ON storage.objects;

-- 2. Créer la politique de lecture publique
CREATE POLICY "Lecture publique des images" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'products');

-- 3. Créer la politique d'écriture pour les utilisateurs authentifiés
CREATE POLICY "Ecriture admin des images" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'products');

-- 4. Créer la politique de modification pour les utilisateurs authentifiés
CREATE POLICY "Modification admin des images" 
ON storage.objects FOR UPDATE 
TO authenticated 
USING (bucket_id = 'products');

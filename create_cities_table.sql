-- Table des villes de livraison
CREATE TABLE IF NOT EXISTS delivery_cities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name_fr TEXT NOT NULL,
  name_en TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Activer RLS
ALTER TABLE delivery_cities ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "delivery_cities_select_public" ON delivery_cities;
DROP POLICY IF EXISTS "delivery_cities_admin_all" ON delivery_cities;

-- Politique RLS : lecture publique (pour les clients)
CREATE POLICY "delivery_cities_select_public" ON delivery_cities
  FOR SELECT USING (true);

-- Politique RLS : insertion/suppression/mise à jour pour les admins uniquement
CREATE POLICY "delivery_cities_admin_all" ON delivery_cities
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_delivery_cities_updated_at ON delivery_cities;
CREATE TRIGGER update_delivery_cities_updated_at BEFORE UPDATE ON delivery_cities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insérer des villes par défaut (uniquement si elles n'existent pas déjà)
INSERT INTO delivery_cities (name_fr, name_en)
SELECT name_fr, name_en FROM (VALUES
  ('Douala', 'Douala'),
  ('Yaoundé', 'Yaoundé'),
  ('Bafoussam', 'Bafoussam'),
  ('Bamenda', 'Bamenda'),
  ('Garoua', 'Garoua'),
  ('Maroua', 'Maroua'),
  ('Ngaoundéré', 'Ngaoundéré'),
  ('Bertoua', 'Bertoua'),
  ('Kumba', 'Kumba'),
  ('Limbe', 'Limbe')
) AS v(name_fr, name_en)
WHERE NOT EXISTS (
  SELECT 1 FROM delivery_cities WHERE delivery_cities.name_fr = v.name_fr
);

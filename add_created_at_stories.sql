-- Migration pour ajouter la colonne created_at à la table stories
-- Exécutez ce script dans le SQL Editor de Supabase

ALTER TABLE stories 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Mettre à jour les lignes existantes avec une date
UPDATE stories 
SET created_at = NOW() 
WHERE created_at IS NULL;

// Script pour lister TOUS les buckets Storage
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vwchjlmbtgscjjdxonzb.supabase.co';
const supabaseKey = 'sb_publishable_8IIf4sNThHWxzTAx4u4TiA_2z3ULtxk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function listAllBuckets() {
  console.log('=== TOUS LES BUCKETS STORAGE ===\n');

  const { data: buckets, error } = await supabase.storage.listBuckets();
  
  if (error) {
    console.log('❌ Erreur:', error.message);
  } else {
    console.log(`✅ ${buckets.length} bucket(s) trouvé(s):`);
    buckets.forEach(bucket => {
      console.log(`   - Nom: "${bucket.name}"`);
      console.log(`     Public: ${bucket.public}`);
      console.log(`     ID: ${bucket.id}`);
    });
  }
}

listAllBuckets().catch(console.error);

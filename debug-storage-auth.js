// Script avec clé service_role pour vérifier le bucket
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vwchjlmbtgscjjdxonzb.supabase.co';
// Utiliser la clé service_role (à remplacer par votre clé réelle)
const serviceRoleKey = 'YOUR_SERVICE_ROLE_KEY_HERE';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function checkWithServiceRole() {
  console.log('=== DIAGNOSTIC AVEC SERVICE ROLE ===\n');

  const { data: buckets, error } = await supabase.storage.listBuckets();
  
  if (error) {
    console.log('❌ Erreur:', error.message);
  } else {
    console.log(`✅ ${buckets.length} bucket(s) trouvé(s):`);
    buckets.forEach(bucket => {
      console.log(`   - Nom: "${bucket.name}"`);
      console.log(`     Public: ${bucket.public}`);
    });
  }
}

checkWithServiceRole().catch(console.error);

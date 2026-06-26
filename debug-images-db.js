// Script pour vérifier les données réelles dans product_images
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vwchjlmbtgscjjdxonzb.supabase.co';
const supabaseKey = 'sb_publishable_8IIf4sNThHWxzTAx4u4TiA_2z3ULtxk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkImagesInDB() {
  console.log('=== DONNÉES RÉELLES DANS product_images ===\n');

  const { data: images, error } = await supabase
    .from('product_images')
    .select('*');
  
  if (error) {
    console.log('❌ Erreur:', error.message);
    console.log('   Code:', error.code);
  } else {
    console.log(`✅ ${images.length} image(s) trouvée(s) dans la base`);
    if (images.length === 0) {
      console.log('\n   ⚠️ AUCUNE IMAGE dans la base de données !');
      console.log('   → Vous devez ré-uploader les images dans l\'admin');
    } else {
      images.forEach(img => {
        console.log(`\n   ID: ${img.id}`);
        console.log(`   Product ID: ${img.product_id}`);
        console.log(`   URL: ${img.url}`);
        console.log(`   Is Main: ${img.is_main}`);
        console.log(`   Order: ${img.order_index}`);
      });
    }
  }

  // Vérifier les produits avec leurs images
  console.log('\n=== PRODUITS AVEC IMAGES ===\n');
  const { data: products, error: prodError } = await supabase
    .from('products')
    .select('id, name_fr, product_images(*)')
    .eq('is_active', true);
  
  if (prodError) {
    console.log('❌ Erreur produits:', prodError.message);
  } else {
    console.log(`✅ ${products.length} produits actifs`);
    products.forEach(prod => {
      const hasImages = prod.product_images && prod.product_images.length > 0;
      console.log(`   - ${prod.name_fr}: ${hasImages ? `${prod.product_images.length} image(s)` : '❌ PAS D\'IMAGE'}`);
      if (hasImages) {
        prod.product_images.forEach(img => {
          console.log(`     URL: ${img.url}`);
        });
      }
    });
  }
}

checkImagesInDB().catch(console.error);

// Script de diagnostic pour vérifier les RLS côté public vs admin
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vwchjlmbtgscjjdxonzb.supabase.co';
const supabaseKey = 'sb_publishable_8IIf4sNThHWxzTAx4u4TiA_2z3ULtxk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRLS() {
  console.log('=== DIAGNOSTIC RLS PUBLIC VS ADMIN ===\n');

  // 1. Test lecture product_images (public)
  console.log('1. Test lecture product_images (public/anon)...');
  const { data: images, error: imagesError } = await supabase
    .from('product_images')
    .select('*')
    .limit(5);
  
  if (imagesError) {
    console.log('❌ Erreur RLS:', imagesError.message);
    console.log('   Code:', imagesError.code);
  } else {
    console.log('✅ Lecture publique OK');
    console.log(`   ${images.length} images trouvées`);
    images.forEach(img => {
      console.log(`   - ID: ${img.id}, URL: ${img.url?.substring(0, 60)}...`);
    });
  }

  // 2. Test lecture produits avec images (public)
  console.log('\n2. Test lecture produits avec images (public)...');
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('id, name_fr, product_images(url)')
    .eq('is_active', true)
    .limit(5);
  
  if (productsError) {
    console.log('❌ Erreur RLS:', productsError.message);
    console.log('   Code:', productsError.code);
  } else {
    console.log('✅ Lecture produits OK');
    console.log(`   ${products.length} produits actifs trouvés`);
    products.forEach(prod => {
      const hasImages = prod.product_images && prod.product_images.length > 0;
      console.log(`   - ${prod.name_fr}: ${hasImages ? `${prod.product_images.length} image(s)` : '❌ PAS D\'IMAGE'}`);
      if (hasImages) {
        prod.product_images.forEach(img => {
          console.log(`     URL: ${img.url?.substring(0, 60)}...`);
        });
      }
    });
  }

  // 3. Test bucket Storage (public)
  console.log('\n3. Test accès bucket Storage (public)...');
  const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
  
  if (bucketsError) {
    console.log('❌ Erreur Storage:', bucketsError.message);
  } else {
    console.log('✅ Buckets disponibles:', buckets.map(b => b.name));
    const productsBucket = buckets.find(b => b.name === 'products');
    if (!productsBucket) {
      console.log('❌ Le bucket "products" n\'existe pas');
    } else {
      console.log('✅ Le bucket "products" existe');
      
      // Test lecture fichiers
      const { data: files, error: filesError } = await supabase.storage.from('products').list('', { limit: 5 });
      if (filesError) {
        console.log('❌ Erreur lecture fichiers:', filesError.message);
      } else {
        console.log(`✅ ${files.length} fichiers dans le bucket`);
      }
    }
  }
}

checkRLS().catch(console.error);

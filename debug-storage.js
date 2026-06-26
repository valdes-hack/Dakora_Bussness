// Script de diagnostic pour le bucket Storage Supabase
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vwchjlmbtgscjjdxonzb.supabase.co';
const supabaseKey = 'sb_publishable_8IIf4sNThHWxzTAx4u4TiA_2z3ULtxk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkStorage() {
  console.log('=== DIAGNOSTIC STORAGE SUPABASE ===\n');

  // 1. Vérifier les buckets disponibles
  console.log('1. Vérification des buckets Storage...');
  const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
  
  if (bucketsError) {
    console.log('❌ Erreur:', bucketsError.message);
  } else {
    console.log('✅ Buckets disponibles:', buckets.map(b => b.name));
    
    const productsBucket = buckets.find(b => b.name === 'products');
    if (!productsBucket) {
      console.log('❌ Le bucket "products" n\'existe pas !');
      console.log('   → Créez-le dans le dashboard Supabase: Storage → New bucket');
    } else {
      console.log('✅ Le bucket "products" existe');
      
      // 2. Lister les fichiers dans le bucket
      console.log('\n2. Liste des fichiers dans le bucket "products"...');
      const { data: files, error: filesError } = await supabase.storage.from('products').list('', { limit: 100 });
      
      if (filesError) {
        console.log('❌ Erreur:', filesError.message);
      } else {
        console.log(`✅ ${files.length} fichiers trouvés`);
        files.forEach(file => {
          console.log(`   - ${file.name} (${file.metadata?.size || 0} bytes)`);
        });
      }
    }
  }

  // 3. Vérifier les images dans la base de données
  console.log('\n3. Vérification des images dans la table product_images...');
  const { data: images, error: imagesError } = await supabase
    .from('product_images')
    .select('id, url, is_main')
    .limit(10);
  
  if (imagesError) {
    console.log('❌ Erreur:', imagesError.message);
  } else {
    console.log(`✅ ${images.length} images trouvées dans la base`);
    images.forEach(img => {
      console.log(`   - ID: ${img.id}, URL: ${img.url?.substring(0, 60)}...`);
    });
  }

  // 4. Vérifier les produits avec leurs images
  console.log('\n4. Vérification des produits avec images...');
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('id, name_fr, product_images(url)')
    .limit(5);
  
  if (productsError) {
    console.log('❌ Erreur:', productsError.message);
  } else {
    console.log(`✅ ${products.length} produits trouvés`);
    products.forEach(prod => {
      const hasImages = prod.product_images && prod.product_images.length > 0;
      console.log(`   - ${prod.name_fr}: ${hasImages ? `${prod.product_images.length} image(s)` : '❌ PAS D\'IMAGE'}`);
    });
  }
}

checkStorage().catch(console.error);

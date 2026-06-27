import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variáveis de ambiente do Supabase não configuradas');
  console.error('   Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ============================================
// FUNÇÃO DE AUDITORIA COMPLETA DO SUPABASE
// ============================================
export async function auditSupabaseConfig() {
  console.log('\n========================================');
  console.log('🔍 AUDITORIA COMPLETA DO SUPABASE');
  console.log('========================================\n');

  // ETAPA 1: Verificar configuração
  console.log('📋 ETAPA 1: CONFIGURAÇÃO');
  console.log('────────────────────────────────────────');
  console.log('URL:', supabaseUrl);
  
  const urlMatch = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/);
  const projectRef = urlMatch ? urlMatch[1] : 'NÃO ENCONTRADO';
  console.log('Project Ref (da URL):', projectRef);
  console.log('Anon Key Length:', supabaseAnonKey.length);
  
  try {
    const jwtParts = supabaseAnonKey.split('.');
    if (jwtParts.length === 3) {
      const jwtPayload = JSON.parse(atob(jwtParts[1]));
      console.log('JWT Ref:', jwtPayload.ref);
      console.log('JWT Issuer:', jwtPayload.iss);
      console.log('JWT Subject:', jwtPayload.sub);
      
      const refMatch = jwtPayload.ref === projectRef;
      console.log('\n✅ Refs coincidem:', refMatch);
      if (!refMatch) {
        console.log('❌ ERRO: Project Ref da URL NÃO coincide com JWT Ref!');
        console.log('   URL Ref:', projectRef);
        console.log('   JWT Ref:', jwtPayload.ref);
      }
    } else {
      console.log('❌ Anon key não é um JWT válido');
    }
  } catch (error) {
    console.error('❌ Erro ao decodificar JWT:', error);
  }

  // ETAPA 2: Testar listBuckets
  console.log('\n📋 ETAPA 2: LISTAR BUCKETS');
  console.log('────────────────────────────────────────');
  try {
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('❌ ERRO ao listar buckets:');
      console.error('   Mensagem:', bucketsError.message);
      console.error('   Completo:', bucketsError);
    } else {
      console.log('✅ Buckets encontrados:', buckets?.length || 0);
      console.log('   Lista:', buckets?.map(b => ({ name: b.name, public: b.public, created: b.created_at })));
    }
  } catch (error) {
    console.error('❌ EXCEÇÃO em listBuckets:', error);
  }

  // ETAPA 3: Testar getBucket
  console.log('\n📋 ETAPA 3: ACESSAR BUCKET "market-images"');
  console.log('────────────────────────────────────────');
  try {
    const { data: bucket, error: bucketError } = await supabase.storage.getBucket('market-images');
    
    if (bucketError) {
      console.error('❌ ERRO ao acessar bucket:');
      console.error('   Mensagem:', bucketError.message);
      console.error('   Completo:', bucketError);
    } else {
      console.log('✅ Bucket encontrado:');
      console.log('   Nome:', bucket?.name);
      console.log('   Public:', bucket?.public);
      console.log('   Created:', bucket?.created_at);
    }
  } catch (error) {
    console.error('❌ EXCEÇÃO ao acessar bucket:', error);
  }

  // ETAPA 4: Testar list arquivos
  console.log('\n📋 ETAPA 4: LISTAR ARQUIVOS NO BUCKET');
  console.log('────────────────────────────────────────');
  try {
    const { data: files, error: listError } = await supabase.storage
      .from('market-images')
      .list();
    
    if (listError) {
      console.error('❌ ERRO ao listar arquivos:');
      console.error('   Mensagem:', listError.message);
      console.error('   Completo:', listError);
    } else {
      console.log('✅ Arquivos encontrados:', files?.length || 0);
      if (files && files.length > 0) {
        console.log('   Arquivos:', files.map(f => f.name));
      }
    }
  } catch (error) {
    console.error('❌ EXCEÇÃO ao listar arquivos:', error);
  }

  // ETAPA 5: Teste de upload real
  console.log('\n📋 ETAPA 5: TESTE DE UPLOAD (SIMULADO)');
  console.log('────────────────────────────────────────');
  console.log('⚠️  Este teste NÃO fará upload real');
  console.log('   Apenas mostrará o path que seria usado:');
  console.log('   Bucket: market-images');
  console.log('   Path: [marketId]-[timestamp].[ext]');
  console.log('   Exemplo: 123-1234567890.jpg');

  // ETAPA 6: Chamada REST manual
  console.log('\n📋 ETAPA 6: CHAMADA REST MANUAL');
  console.log('────────────────────────────────────────');
  try {
    const restUrl = `https://${projectRef}.supabase.co/storage/v1/bucket`;
    console.log('URL:', restUrl);
    console.log('Fazendo GET com anon key...');
    
    const response = await fetch(restUrl, {
      headers: {
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'apikey': supabaseAnonKey,
      },
    });
    
    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    console.log('Headers:', Object.fromEntries(response.headers.entries()));
    
    const body = await response.text();
    console.log('Body:', body.substring(0, 500));
  } catch (error) {
    console.error('❌ Erro na chamada REST:', error);
  }

  // RESUMO FINAL
  console.log('\n========================================');
  console.log('📊 RESUMO DA AUDITORIA');
  console.log('========================================');
  console.log('URL:', supabaseUrl);
  console.log('Project Ref:', projectRef);
  console.log('Anon Key Length:', supabaseAnonKey.length);
  console.log('\nSe houver erros acima, verifique:');
  console.log('1. VITE_SUPABASE_URL está correta?');
  console.log('2. VITE_SUPABASE_ANON_KEY está correta?');
  console.log('3. Bucket "market-images" existe?');
  console.log('4. Policies do bucket permitem upload com anon key?');
  console.log('========================================\n');
}

// ============================================
// UPLOAD CORRIGIDO (SEM PATH DUPLICADO)
// ============================================
export async function uploadMarketImage(file: File, marketId: string): Promise<string> {
  console.log('\n========================================');
  console.log('UPLOAD DE IMAGEM');
  console.log('========================================');
  
  if (!file) {
    console.error('❌ Nenhum arquivo selecionado');
    throw new Error('Nenhum arquivo selecionado');
  }

  console.log('Arquivo:', file.name);
  console.log('Tipo:', file.type);
  console.log('Tamanho:', (file.size / 1024 / 1024).toFixed(2), 'MB');

  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    console.error('❌ Tipo não permitido:', file.type);
    throw new Error('Tipo de arquivo não permitido. Use JPG, PNG ou WEBP.');
  }

  if (file.size > 5 * 1024 * 1024) {
    console.error('❌ Arquivo muito grande:', file.size);
    throw new Error('Arquivo muito grande. Tamanho máximo: 5MB.');
  }

  const fileExt = file.name.split('.').pop() || 'jpg';
  const uniqueName = `${marketId}-${Date.now()}.${fileExt}`;
  
  console.log('Path do arquivo (SEM bucket):', uniqueName);
  console.log('Bucket:', 'market-images');
  console.log('Path completo esperado: market-images/' + uniqueName);

  console.log('Iniciando upload...');
  const { data, error } = await supabase.storage
    .from('market-images')
    .upload(uniqueName, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    console.error('❌ ERRO no upload:');
    console.error('   Tipo:', error.constructor.name);
    console.error('   Mensagem:', error.message);
    console.error('   Completo:', error);
    throw new Error(`Erro ao fazer upload: ${error.message}`);
  }

  console.log('✅ Upload concluído!');
  console.log('Path retornado:', data?.path);

  const { data: publicData } = supabase.storage
    .from('market-images')
    .getPublicUrl(uniqueName);

  console.log('✅ URL pública:', publicData.publicUrl);
  
  return publicData.publicUrl;
}

// Aliases para compatibilidade com diferentes contextos
export const uploadProductImage = uploadMarketImage;
export const deleteProductImage = deleteMarketImage;

export async function deleteMarketImage(imageUrl: string): Promise<void> {
  try {
    const url = new URL(imageUrl);
    const pathParts = url.pathname.split('/');
    const fileName = pathParts[pathParts.length - 1];

    if (fileName) {
      console.log('Deletando arquivo:', fileName);
      
      const { error } = await supabase.storage
        .from('market-images')
        .remove([fileName]);

      if (error) {
        console.error('Erro ao deletar imagem:', error);
      } else {
        console.log('✅ Imagem deletada com sucesso');
      }
    }
  } catch (error) {
    console.error('Erro ao processar URL da imagem:', error);
  }
}
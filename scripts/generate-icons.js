const sharp = require('sharp');
const fs = require('node:fs');
const path = require('node:path');

const sizes = [16, 32, 48, 64, 128, 192, 256, 512, 1024];
const inputIcon = path.join(__dirname, '../public/icons/icon.png');
const outputDir = path.join(__dirname, '../public/icons');

async function generateIcons() {
  console.log('🎨 Gerando ícones em múltiplos tamanhos...\n');

  // Verificar se o arquivo de entrada existe
  if (!fs.existsSync(inputIcon)) {
    console.error('❌ Erro: icon.png não encontrado em public/icons/');
    process.exit(1);
  }

  for (const size of sizes) {
    const outputPath = path.join(outputDir, `icon-${size}x${size}.png`);
    
    try {
      await sharp(inputIcon)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .png()
        .toFile(outputPath);
      
      console.log(`✅ Gerado: icon-${size}x${size}.png`);
    } catch (error) {
      console.error(`❌ Erro ao gerar icon-${size}x${size}.png:`, error.message);
    }
  }

  console.log('\n🎉 Todos os ícones foram gerados com sucesso!');
  console.log(`📁 Local: ${outputDir}\n`);
}

// ✅ Top-level await (usando IIFE)
(async () => {
  try {
    await generateIcons();
  } catch (error) {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  }
})();
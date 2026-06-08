/**
 * Gera os ícones do PWA a partir do logo da marca.
 *
 * Fonte:  src/assets/logo.png  (marca "A" Arcaika, fundo transparente)
 * Saída:  public/icons/*.png
 *
 * Uso:  node scripts/generate-pwa-icons.mjs
 *
 * Os ícones "any" são flatten sobre fundo branco (background_color do manifest).
 * Os ícones "maskable" recebem margem extra (safe zone de 80%) para não serem
 * cortados pelo recorte adaptativo do Android.
 */
import sharp from 'sharp'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { mkdir } from 'node:fs/promises'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const SRC = resolve(root, 'src/assets/logo.png')
const OUT = resolve(root, 'public/icons')

const WHITE = { r: 255, g: 255, b: 255, alpha: 1 }

/**
 * Ícone quadrado com fundo branco.
 * O logo de origem tem padding transparente embutido; usamos `.trim()` para
 * remover esse padding e controlar a margem de forma consistente via contentRatio.
 */
async function makeIcon(size, file, contentRatio = 0.78) {
  const inner = Math.round(size * contentRatio)
  const logo = await sharp(SRC)
    .trim()
    .resize(inner, inner, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer()
  await sharp({
    create: { width: size, height: size, channels: 4, background: WHITE },
  })
    .composite([{ input: logo, gravity: 'center' }])
    .png()
    .toFile(resolve(OUT, file))
}

async function run() {
  await mkdir(OUT, { recursive: true })
  // Propósito "any"
  await makeIcon(192, 'pwa-192x192.png', 0.8)
  await makeIcon(512, 'pwa-512x512.png', 0.8)
  // Propósito "maskable" — conteúdo dentro da safe zone (~60%)
  await makeIcon(512, 'pwa-maskable-512x512.png', 0.6)
  // iOS (não aplica máscara; precisa de fundo opaco)
  await makeIcon(180, 'apple-touch-icon.png', 0.8)
  console.log('PWA icons gerados em public/icons/')
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})

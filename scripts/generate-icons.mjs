// Renders the SVG sources into the PNG icons the PWA manifest references.
// Run with: npm run generate-icons
import { readFile, mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import sharp from 'sharp'

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '..')
const iconsDir = resolve(root, 'public', 'icons')

const standardSvg = await readFile(resolve(root, 'public', 'favicon.svg'))
const maskableSvg = await readFile(resolve(here, 'icon-maskable.svg'))

await mkdir(iconsDir, { recursive: true })

const targets = [
  { svg: standardSvg, size: 192, file: 'meds-192.png' },
  { svg: standardSvg, size: 512, file: 'meds-512.png' },
  { svg: standardSvg, size: 180, file: 'meds-180.png' },
  { svg: maskableSvg, size: 512, file: 'meds-512-maskable.png' },
]

for (const { svg, size, file } of targets) {
  await sharp(svg, { density: 384 })
    .resize(size, size)
    .png()
    .toFile(resolve(iconsDir, file))
  console.log(`generated icons/${file} (${size}x${size})`)
}

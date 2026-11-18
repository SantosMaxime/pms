/* eslint-disable @typescript-eslint/explicit-function-return-type -- plain JS script, no type annotations */
/**
 * Records the README demo GIF (docs/demo.gif).
 *
 * Builds the real React renderer with Vite, replaces the Electron preload API
 * (window.api) with an in-memory mock holding fictional projects, then drives
 * the UI in headless Chromium and records it.
 *
 * Requirements (not project dependencies): Playwright with Chromium, and ffmpeg.
 *
 *   node scripts/demo/render-demo.mjs
 */

import { createRequire } from 'node:module'
import { execFileSync } from 'node:child_process'
import * as fs from 'node:fs'
import * as http from 'node:http'
import * as os from 'node:os'
import * as path from 'node:path'
import { build } from 'vite'
import react from '@vitejs/plugin-react'

const require = createRequire(import.meta.url)
const { chromium } = require('playwright')

const ROOT = path.resolve('.')
const OUT = path.join(ROOT, 'docs/demo.gif')
const PAGE_W = 1200
const PAGE_H = 780
const GIF_W = 900
const GIF_FPS = 10

// ── Fictional workspace ─────────────────────────────────────

const DAY = 86_400_000
const now = Date.now()
const PROJECTS = [
  {
    dir: 'C:\\Users\\dev\\Projects',
    name: 'pms',
    ago: 0.1,
    deps: ['react', 'electron', 'vite', 'typescript']
  },
  {
    dir: 'C:\\Users\\dev\\Projects',
    name: 'portfolio',
    ago: 1,
    deps: ['react', 'next', 'typescript']
  },
  { dir: 'D:\\Work', name: 'api-gateway', ago: 2, deps: ['express', 'typescript'] },
  {
    dir: 'C:\\Users\\dev\\Projects',
    name: 'habit-tracker',
    ago: 3,
    deps: ['vue', 'vite', 'typescript']
  },
  {
    dir: 'C:\\Users\\dev\\Projects',
    name: 'streamdeck-steam-achievements',
    ago: 4,
    deps: ['typescript']
  },
  { dir: 'D:\\Work', name: 'design-system', ago: 6, deps: ['svelte', 'vite'] },
  { dir: 'D:\\Work', name: 'chat-server', ago: 9, deps: ['fastify', 'typescript'] },
  { dir: 'C:\\Users\\dev\\Projects', name: 'weather-dashboard', ago: 12, deps: ['react', 'vite'] },
  { dir: 'C:\\Users\\dev\\Projects', name: 'landing-page', ago: 16, deps: ['astro'] },
  { dir: 'D:\\Work', name: 'admin-console', ago: 40, deps: ['@angular/core', 'typescript'] },
  {
    dir: 'C:\\Users\\dev\\Projects',
    name: 'react-playground',
    ago: 70,
    deps: ['react', 'webpack']
  },
  { dir: 'C:\\Users\\dev\\Projects', name: 'game-jam-2024', ago: 200, deps: [] }
].map((p) => ({ ...p, path: `${p.dir}\\${p.name}`, lastModified: now - p.ago * DAY }))

const SETTINGS = {
  searchPaths: [
    { id: 'p1', path: 'C:\\Users\\dev\\Projects', enabled: true },
    { id: 'p2', path: 'D:\\Work', enabled: true }
  ],
  editorPaths: {}
}

// Runs inside every frame before the app loads.
function installMock({ projects, settings }) {
  localStorage.setItem('pms-settings', JSON.stringify(settings))
  const ok = (v) => Promise.resolve(v)
  const env = { '%USERPROFILE%': 'C:\\Users\\dev', '%ProgramFiles%': 'C:\\Program Files' }
  window.electron = {
    process: { versions: { electron: '38.1.2', chrome: '140.0.7339.80', node: '22.19.0' } }
  }
  window.api = {
    fs: {
      scanDirectory: (dir) =>
        ok({
          success: true,
          projects: projects
            .filter((p) => p.dir === dir)
            .map(({ name, path, lastModified }) => ({ name, path, lastModified }))
        }),
      readPackageJson: (p) => {
        const proj = projects.find((x) => x.path === p)
        return ok({
          success: true,
          data: { dependencies: Object.fromEntries((proj?.deps ?? []).map((d) => [d, '*'])) }
        })
      },
      checkFileExists: (f) => ok(/Code\.exe$|Cursor\.exe$/.test(f) && !/Program Files/.test(f)),
      findWebStormInToolbox: () =>
        ok(
          'C:\\Users\\dev\\AppData\\Local\\JetBrains\\Toolbox\\apps\\WebStorm\\bin\\webstorm64.exe'
        ),
      expandPath: (p) => ok({ success: true, path: p.replace(/%\w+%/g, (m) => env[m] ?? m) })
    },
    dialog: { selectFolder: () => ok({ success: false, canceled: true }) },
    editor: { launch: () => ok({ success: true }) },
    tray: { updateMenu: () => ok({ success: true }) },
    app: {
      setLaunchAtStartup: () => ok({ success: true }),
      getLaunchAtStartup: () => ok({ success: true, enabled: true })
    }
  }
}

// ── Build the renderer ──────────────────────────────────────

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'pms-demo-'))
const dist = path.join(tmp, 'dist')
await build({
  root: path.join(ROOT, 'src/renderer'),
  base: './',
  logLevel: 'error',
  resolve: { alias: { '@renderer': path.join(ROOT, 'src/renderer/src') } },
  plugins: [react()],
  build: { outDir: dist, emptyOutDir: true }
})

const icon = fs.readFileSync(path.join(ROOT, 'resources/pms_512x_icon.png')).toString('base64')
fs.writeFileSync(
  path.join(dist, 'frame.html'),
  `<!doctype html><html><head><meta charset="utf-8"><style>
*{box-sizing:border-box;margin:0}
body{width:${PAGE_W}px;height:${PAGE_H}px;overflow:hidden;font-family:Inter,'Segoe UI',sans-serif;
  background:#0b0b0d;background-image:radial-gradient(ellipse 80% 70% at 50% 40%,#2a0f12 0%,#0b0b0d 70%)}
#win{position:absolute;left:40px;top:22px;width:1120px;height:666px;border-radius:10px;overflow:hidden;
  border:1px solid #2b2b30;box-shadow:0 30px 70px rgba(0,0,0,.6)}
#bar{height:32px;background:#1f1f1f;display:flex;align-items:center;color:#ddd;font-size:12px;padding-left:10px;gap:8px}
#bar img{width:16px;height:16px}
#bar .ctl{margin-left:auto;display:flex}
#bar .ctl span{width:46px;text-align:center;color:#bbb;font-size:13px}
iframe{display:block;width:1120px;height:634px;border:0}
#cap{position:absolute;left:0;right:0;top:706px;text-align:center}
#cap div{position:absolute;left:0;right:0;transition:opacity .35s,transform .35s}
#cap b{display:block;color:#fff;font:700 22px Inter,sans-serif;letter-spacing:-.01em}
#cap span{display:block;color:#a1a1aa;font:400 14px Inter,sans-serif;margin-top:6px}
#cur{position:absolute;left:0;top:0;width:22px;height:22px;z-index:10;pointer-events:none;transition:transform .08s}
#ring{position:absolute;width:34px;height:34px;margin:-17px 0 0 -17px;border-radius:50%;border:2px solid rgba(255,255,255,.8);
  opacity:0;z-index:9;pointer-events:none}
</style></head><body>
<div id="win"><div id="bar"><img src="data:image/png;base64,${icon}">Project Manager S
<div class="ctl"><span>&#8212;</span><span>&#9744;</span><span>&#10005;</span></div></div>
<iframe src="index.html"></iframe></div>
<div id="cap"></div><div id="ring"></div>
<svg id="cur" viewBox="0 0 24 24"><path d="M4 2l15 11-6.5 1.2L16 21l-3 1.4-3.4-6.9L4 20z" fill="#fff" stroke="#000" stroke-width="1.4" stroke-linejoin="round"/></svg>
<script>
window.setCaption=(t,s)=>{const c=document.getElementById('cap');[...c.children].forEach(d=>{d.style.opacity=0;d.style.transform='translateY(-6px)';setTimeout(()=>d.remove(),400)});
 if(!t)return;const d=document.createElement('div');d.style.opacity=0;d.style.transform='translateY(8px)';d.innerHTML='<b>'+t+'</b><span>'+s+'</span>';c.appendChild(d);
 requestAnimationFrame(()=>requestAnimationFrame(()=>{d.style.opacity=1;d.style.transform='none'}))};
window.setCursor=(x,y,down)=>{document.getElementById('cur').style.transform='translate('+x+'px,'+y+'px) scale('+(down?.85:1)+')'};
window.clickRing=(x,y)=>{const r=document.getElementById('ring');r.animate([{left:x+'px',top:y+'px',opacity:.9,transform:'scale(.4)'},{left:x+'px',top:y+'px',opacity:0,transform:'scale(1.3)'}],{duration:450,easing:'ease-out'})};
</script></body></html>`
)

const types = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.png': 'image/png',
  '.svg': 'image/svg+xml'
}
const server = http
  .createServer((req, res) => {
    const f = path.join(dist, decodeURIComponent(new URL(req.url, 'http://x').pathname))
    if (!f.startsWith(dist) || !fs.existsSync(f) || fs.statSync(f).isDirectory())
      return res.writeHead(404).end()
    res.writeHead(200, { 'content-type': types[path.extname(f)] ?? 'application/octet-stream' })
    fs.createReadStream(f).pipe(res)
  })
  .listen(0)
const port = server.address().port

// ── Record ──────────────────────────────────────────────────

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: PAGE_W, height: PAGE_H } })
await page.addInitScript(installMock, { projects: PROJECTS, settings: SETTINGS })

const frames = []
const cdp = await page.context().newCDPSession(page)
cdp.on('Page.screencastFrame', async ({ data, metadata, sessionId }) => {
  frames.push({ data, t: metadata.timestamp })
  await cdp.send('Page.screencastFrameAck', { sessionId }).catch(() => {})
})

await page.goto(`http://localhost:${port}/frame.html`)
const app = page.frameLocator('iframe')
await app.locator('.recent-project').first().waitFor()
await page.evaluate(() => document.fonts.ready)
// Freeze the animated background so the GIF stays small, and let the
// startup version badge slide away before recording.
await page
  .frames()[1]
  .addStyleTag({ content: 'body::before,body::after{animation:none!important}' })
await app.locator('.versions').waitFor({ state: 'detached', timeout: 8000 })

let cx = 980,
  cy = 560
await page.evaluate(([x, y]) => window.setCursor(x, y), [cx, cy])
await cdp.send('Page.startScreencast', {
  format: 'png',
  everyNthFrame: 1,
  maxWidth: PAGE_W,
  maxHeight: PAGE_H
})

const wait = (ms) => page.waitForTimeout(ms)
const caption = (t, s) => page.evaluate(([t, s]) => window.setCaption(t, s), [t, s])
async function moveTo(locator, dx = 0.5, dy = 0.5, ms = 600) {
  const b =
    typeof locator.boundingBox === 'function'
      ? await locator.boundingBox()
      : { x: locator.x, y: locator.y, width: 0, height: 0 }
  const tx = b.x + b.width * dx,
    ty = b.y + b.height * dy
  const steps = Math.round(ms / 45)
  for (let i = 1; i <= steps; i++) {
    const k = i / steps,
      e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2
    const x = cx + (tx - cx) * e,
      y = cy + (ty - cy) * e
    await page.mouse.move(x, y)
    await page.evaluate(([x, y]) => window.setCursor(x, y), [x, y])
  }
  cx = tx
  cy = ty
}
async function click(locator, dx, dy) {
  await moveTo(locator, dx, dy)
  await wait(120)
  await page.evaluate(
    ([x, y]) => {
      window.setCursor(x, y, true)
      window.clickRing(x, y)
    },
    [cx, cy]
  )
  await page.mouse.down()
  await wait(90)
  await page.mouse.up()
  await page.evaluate(([x, y]) => window.setCursor(x, y), [cx, cy])
}

// 1. Overview
await caption(
  'Every project you touched lately, in one place',
  'PMS scans your folders and lists projects modified in the last 3 weeks.'
)
await wait(2500)

// 2. Search
await caption(
  'Find anything as you type',
  'Search by name, path or framework, across all your projects.'
)
await click(app.locator('.searchbar-input'), 0.3)
await page.keyboard.type('react', { delay: 110 })
await wait(1500)
await click(app.locator('button[aria-label="Clear search"]'))
await click(app.locator('.searchbar-input'), 0.3)
await page.keyboard.type('vue', { delay: 110 })
await wait(1300)
await click(app.locator('button[aria-label="Clear search"]'))
await wait(700)

// 3. Open in an editor
await caption(
  'Open it in VS Code, Cursor or WebStorm',
  'Installed editors are detected automatically. One click and you are in.'
)
const card = app.locator('.recent-project').first()
await moveTo(card, 0.3)
await wait(400)
await click(card.locator('button[aria-label="Open project"]'))
await wait(500)
await click(card.locator('.recent-app-menu button', { hasText: 'Cursor' }))
await wait(900)

// 4. Per-project default
await caption(
  'A default editor for each project',
  'Clicking a card opens it straight in the editor you picked for it.'
)
const card2 = app.locator('.recent-project').nth(1)
await click(card2.locator('button[aria-label="Project settings"]'))
await wait(900)
await click(app.locator('.project-settings-app', { hasText: 'WebStorm' }))
await wait(900)

// 5. Settings
await caption(
  'Set it up once',
  'Add your project folders, check detected editors, launch at startup.'
)
await click(app.locator('.settings-toggle'))
await wait(1200)
await click(app.locator('.settings-panel button', { hasText: 'Show' }))
await wait(2200)
await click({ x: 150, y: 420 }) // backdrop closes the panel
await wait(900)
await caption(
  'PMS · Project Manager S',
  'Free and open source · Windows · Electron + React + TypeScript'
)
await wait(2400)

await cdp.send('Page.stopScreencast')
await browser.close()
server.close()

// ── Encode ──────────────────────────────────────────────────

const fdir = path.join(tmp, 'frames')
fs.mkdirSync(fdir)
let list = ''
frames.forEach((f, i) => {
  const name = path.join(fdir, `f${String(i).padStart(5, '0')}.png`)
  fs.writeFileSync(name, Buffer.from(f.data, 'base64'))
  const next = frames[i + 1]?.t ?? f.t + 1.5
  list += `file '${name}'\nduration ${Math.max(0.001, next - f.t).toFixed(4)}\n`
})
list += `file '${path.join(fdir, `f${String(frames.length - 1).padStart(5, '0')}.png`)}'\n`
fs.writeFileSync(path.join(tmp, 'list.txt'), list)

fs.mkdirSync(path.dirname(OUT), { recursive: true })
execFileSync('ffmpeg', [
  '-y',
  '-loglevel',
  'error',
  '-f',
  'concat',
  '-safe',
  '0',
  '-i',
  path.join(tmp, 'list.txt'),
  '-vf',
  `fps=${GIF_FPS},scale=${GIF_W}:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=200:stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle`,
  '-loop',
  '0',
  OUT
])
if (process.env.KEEP_FRAMES) console.log(`frames kept in ${tmp}`)
else fs.rmSync(tmp, { recursive: true, force: true })
console.log(
  `wrote ${OUT} (${(fs.statSync(OUT).size / 1024 / 1024).toFixed(2)} MB, ${frames.length} captured frames)`
)

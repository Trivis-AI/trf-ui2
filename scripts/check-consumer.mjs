#!/usr/bin/env node
/**
 * trf-ui2-check — verify a consuming app is wired to the design system correctly.
 *
 * Run from a consumer repo root:
 *   node node_modules/@trf/ui2/scripts/check-consumer.mjs
 *   npx trf-ui2-check                     (once the package has been reinstalled)
 *
 * Two severities, on purpose:
 *
 *   ERRORS   the app's Tailwind/token wiring is broken, so parts of the design
 *            system silently do not render. Always exit 1. Safe to gate CI on
 *            from day one: no app should ever be in this state.
 *
 *   WARNINGS authoring drift (hardcoded colours, off-scale type, primitives
 *            re-implemented locally). Reported but exit 0, so the check can land
 *            in CI before the existing backlog is cleared. Add --strict to fail
 *            on these too, once a repo is clean.
 *
 * Why this exists: docs 13 and 17 are instructions to a reader, and a reader has
 * to be pointed at them. Nothing in `tsc && vite build` notices a missing dark
 * variant or a dead @source path. frontsupport shipped 11 green builds with
 * both. This is the part a machine should check.
 *
 * Calibration, learned the hard way while writing this. Of three suspected
 * stylesheet defects in that repo, exactly one rendered wrong:
 *
 *   REAL     missing @custom-variant dark. Confirmed three ways: the compiled
 *            selector, the production bundle, and a browser A/B under emulated
 *            OS dark, where a banner rendered in bright amber-400 on a
 *            near-white ground.
 *   LATENT   @source pointing at a directory that does not exist. The line does
 *            nothing, but @tailwindcss/vite also scans Vite's module graph, so
 *            imported components' classes were generated anyway. A first
 *            measurement through bare postcss (no module graph) claimed 64% of
 *            the CSS was missing; an A/B through the real build put the two
 *            stylesheets 1.2KB apart, the other way.
 *   NOT REAL fonts "never applied". Tailwind preflight applies the theme font
 *            to <html>, so getComputedStyle reported Geist either way.
 *
 * Two of three suspicions were wrong, and both were wrong because they were
 * measured in a simplified harness instead of the pipeline the app builds with.
 * Severities below reflect the corrected picture, not the first impression.
 */

import fs from 'node:fs'
import path from 'node:path'

const args = process.argv.slice(2)
const strict = args.includes('--strict')
const root = path.resolve(args.find((a) => !a.startsWith('--')) ?? process.cwd())

const errors = []
const warnings = []

const err = (file, line, msg, fix) => errors.push({ file, line, msg, fix })
const warn = (file, line, msg, fix) => warnings.push({ file, line, msg, fix })

const rel = (p) => path.relative(root, p) || path.basename(p)
const read = (p) => {
  try {
    return fs.readFileSync(p, 'utf8')
  } catch {
    return null
  }
}
const lineOf = (text, index) => text.slice(0, index).split('\n').length

// ---------------------------------------------------------------------------
// 1. package.json: the dependency must be pinned to a release tag.
// ---------------------------------------------------------------------------

const pkgPath = path.join(root, 'package.json')
const pkgRaw = read(pkgPath)
if (!pkgRaw) {
  console.error(`trf-ui2-check: no package.json in ${root}`)
  process.exit(2)
}
const pkg = JSON.parse(pkgRaw)
const deps = { ...pkg.dependencies, ...pkg.devDependencies }
const uiSpec = deps['@trf/ui2']

if (!uiSpec) {
  console.log('trf-ui2-check: @trf/ui2 is not a dependency here, nothing to check.')
  process.exit(0)
}
if (/#main\b|#master\b/.test(uiSpec)) {
  err(
    'package.json',
    lineOf(pkgRaw, pkgRaw.indexOf('@trf/ui2')),
    `@trf/ui2 tracks a branch (${uiSpec}). main moves, so builds are not reproducible.`,
    'Pin a release tag: "github:Trivis-AI/trf-ui2#vX.Y.Z".',
  )
} else if (uiSpec.startsWith('github:') && !/#v\d+\.\d+\.\d+$/.test(uiSpec)) {
  warn(
    'package.json',
    lineOf(pkgRaw, pkgRaw.indexOf('@trf/ui2')),
    `@trf/ui2 is not pinned to a vX.Y.Z tag (${uiSpec}).`,
    'Use the /ui2-bump skill to move to a tagged release.',
  )
}

// ---------------------------------------------------------------------------
// 2. The entry stylesheet: imports, @source paths, dark variant.
//
// This is the section that catches a silently half-generated stylesheet.
// ---------------------------------------------------------------------------

const cssCandidates = [
  path.join(root, 'src/index.css'),
  path.join(root, 'src/main.css'),
  path.join(root, 'src/styles/index.css'),
  path.join(root, 'app/globals.css'),
]
const cssPath = cssCandidates.find((p) => {
  const t = read(p)
  return t && /@import\s+['"]tailwindcss['"]/.test(t)
})

// A library package (app-shell, ui2 itself) has no entry stylesheet: the app
// that installs it owns the wiring. Only require one from something that is
// actually an app.
const isApp = fs.existsSync(path.join(root, 'index.html'))

if (!cssPath && !isApp) {
  console.log('Library package (no index.html), so stylesheet wiring is the consuming app\'s job.')
} else if (!cssPath) {
  err(
    'src/index.css',
    1,
    'No entry stylesheet importing tailwindcss was found.',
    'Create src/index.css per docs/for-consuming-apps.md §2.',
  )
} else {
  const css = read(cssPath)
  const cssDir = path.dirname(cssPath)
  const cssRel = rel(cssPath)

  if (!/@import\s+['"]@trf\/ui2\/styles\/tokens\.css['"]/.test(css)) {
    err(
      cssRel,
      1,
      'tokens.css is not imported, so every colour, radius and font token is undefined.',
      `Add:  @import "@trf/ui2/styles/tokens.css";`,
    )
  }

  // Every @source path must actually resolve. Tailwind ignores a glob that
  // matches nothing without any warning, which is exactly how a whole library
  // stops being scanned while the build still passes.
  // Without an install there is nothing on disk to resolve against, so the
  // path checks below would report every node_modules glob as missing. Fall
  // back to matching the text of the glob in that case, and say so.
  const installed = fs.existsSync(path.join(root, 'node_modules/@trf/ui2'))
  if (!installed) {
    console.log(
      'Note: node_modules/@trf/ui2 is not installed here, so @source paths are matched textually rather than resolved. Run npm install for the full check.',
    )
  }

  const sources = [...css.matchAll(/@source\s+(['"])([^'"]+)\1/g)]
  for (const m of sources) {
    const spec = m[2]
    const globAt = spec.search(/[*?[]/)
    const base = globAt === -1 ? spec : spec.slice(0, globAt)
    const resolved = path.resolve(cssDir, base)
    const skipPathCheck = !installed && spec.includes('node_modules')
    if (!skipPathCheck && !fs.existsSync(resolved)) {
      err(
        cssRel,
        lineOf(css, m.index),
        `@source '${spec}' does not exist (resolved to ${rel(resolved)}). Tailwind skips a glob that matches nothing in silence, so this line does nothing at all.`,
        'Point it at a real directory, or delete the line. Under @tailwindcss/vite the module graph usually covers the gap, so this is often latent rather than visible: it bites when CSS is built outside Vite, or when a class is only referenced somewhere the graph does not reach.',
      )
    }
  }

  // The library's own source must be scanned, or its component classes are
  // only generated by accident when the app happens to use the same utility.
  const scansUi2 = sources.some((m) => {
    const spec = m[2]
    if (!/@trf\/ui2/.test(spec)) return false
    const globAt = spec.search(/[*?[]/)
    const base = globAt === -1 ? spec : spec.slice(0, globAt)
    if (!installed) return /@trf\/ui2\/src\b/.test(spec)
    return fs.existsSync(path.resolve(cssDir, base))
  })
  // Warning, not an error, and the wording matters. Under @tailwindcss/vite the
  // module graph already yields the classes of any component the app imports, so
  // this is defense in depth rather than a live breakage. It earns its place
  // because the guarantee is narrow: it covers what the graph reaches at build
  // time, in this bundler, today.
  if (!scansUi2) {
    warn(
      cssRel,
      1,
      "@trf/ui2's own source is not declared as a Tailwind source. Under @tailwindcss/vite the module graph covers imported components, so this may generate correctly today, but the coverage is incidental rather than declared.",
      `Add:  @source "../node_modules/@trf/ui2/src/**/*.{ts,tsx}";`,
    )
  }

  // Same again for the other two shared libraries, when installed.
  for (const [dep, glob] of [
    ['@trf/app-shell', '../node_modules/@trf/app-shell/src/**/*.{ts,tsx}'],
    ['@trf/ui', '../node_modules/@trf/ui/src/**/*.{js,ts,jsx,tsx}'],
  ]) {
    if (!deps[dep]) continue
    if (!sources.some((m) => m[2].includes(dep))) {
      warn(
        cssRel,
        1,
        `${dep} is installed but its source is not scanned, so its classes may not be generated.`,
        `Add:  @source "${glob}";`,
      )
    }
  }

  // tokens.css only redefines values under `.dark`. Without this line Tailwind
  // v4 compiles `dark:` to a prefers-color-scheme media query instead, so an
  // OS-dark machine gets light tokens plus dark-mode utility colours.
  if (!/@custom-variant\s+dark\s*\(&:where\(\.dark,\s*\.dark\s*\*\)\)/.test(css)) {
    err(
      cssRel,
      1,
      'The dark variant is not wired to the .dark class. tokens.css switches on .dark, but `dark:` utilities will compile to a prefers-color-scheme media query, so the two disagree on an OS-dark machine.',
      'Add:  @custom-variant dark (&:where(.dark, .dark *));',
    )
  }
}

// ---------------------------------------------------------------------------
// 3. Authoring drift in src/. Warnings: real, but not build-breaking.
// ---------------------------------------------------------------------------

const PALETTE =
  'slate|gray|grey|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose'

const RULES = [
  {
    id: 'raw-palette',
    re: new RegExp(
      `\\b(?:bg|text|border|ring|outline|fill|stroke|from|via|to|divide|decoration|caret|shadow)-(?:${PALETTE})-(?:50|\\d{3})\\b`,
    ),
    msg: 'Raw Tailwind palette colour. Use a semantic token.',
    fix: 'Status colours: --warning / --success / --destructive, or the Badge warning|success variant, or StatusBadge tones. See docs/03-design-tokens.md.',
  },
  {
    id: 'arbitrary-type',
    re: /\btext-\[[^\]]+\]/,
    msg: 'Off-scale font size.',
    fix: 'Use the type scale (text-xs … text-2xl). Badge is already text-xs, so the override is usually redundant.',
  },
  {
    id: 'arbitrary-radius',
    re: /\brounded-\[[^\]]+\]/,
    msg: 'Off-scale border radius.',
    fix: 'Use rounded-sm|md|lg|full, all derived from --radius.',
  },
  {
    id: 'native-dialog',
    re: /\bwindow\.(?:confirm|alert|prompt)\s*\(/,
    msg: 'Native browser dialog. It blocks the page and is off-system.',
    fix: 'Use ConfirmDialog or the useConfirm hook from @trf/ui2.',
  },
  // The next three need file scope: in JSX the opening tag and its attributes
  // sit on separate lines, so a per-line regex never sees them together.
  {
    id: 'raw-select',
    re: /<select\b/,
    scope: 'file',
    msg: 'Raw <select>.',
    fix: 'Use SimpleSelect (or Select / Combobox) from @trf/ui2.',
  },
  {
    id: 'raw-checkbox',
    // [^<] rather than [^>], because an arrow function in an earlier prop
    // (onChange={(e) => ...}) contains a > that would end the match early.
    re: /<input\b[^<]*?type=["']checkbox["']/,
    scope: 'file',
    msg: 'Raw checkbox input.',
    fix: 'Use Checkbox or Switch from @trf/ui2.',
  },
  {
    id: 'raw-styled-button',
    re: /<button\b[^<]*?className=/,
    scope: 'file',
    msg: 'Raw <button> carrying its own classes, which re-implements Button.',
    fix: 'Use Button from @trf/ui2 (variant primary|secondary|ghost|link|destructive).',
  },
  {
    id: 'important',
    re: /!important/,
    msg: '!important.',
    fix: 'Express it with tokens or Tailwind ordering instead.',
  },
  {
    id: 'hardcoded-colour',
    re: /(?:bg|text|border|fill|stroke)-\[(?:#|rgb|hsl|oklch)/,
    msg: 'Hardcoded colour value in a class.',
    fix: 'Use a semantic token.',
  },
  {
    id: 'non-lucide-icons',
    re: /from\s+['"](?:react-icons|@heroicons|@radix-ui\/react-icons|feather-icons)/,
    msg: 'Non-Lucide icon import.',
    fix: 'Lucide only. See docs/05-iconography.md.',
  },
  {
    id: 'cursor-pointer',
    re: /\bcursor-pointer\b/,
    msg: 'cursor-pointer added by hand.',
    fix: 'tokens.css already gives every interactive element a pointer cursor. Drop it (draggable handles use cursor-grab).',
  },
  {
    id: 'glyph-icon',
    re: /[←→↑↓✕✖▼▲]/,
    msg: 'Arrow or symbol glyph baked into markup.',
    fix: 'Use a Lucide component (ArrowUp, ChevronDown, X …). See docs/17-app-layout-conventions.md §6.',
    skipComments: true,
  },
  {
    id: 'inline-style',
    re: /style=\{\{/,
    msg: 'Inline style.',
    fix: 'Fine for a genuinely dynamic value; otherwise express it in Tailwind or a token.',
  },
]

const SRC = path.join(root, 'src')
const walk = (dir, out = []) => {
  let entries
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true })
  } catch {
    return out
  }
  for (const e of entries) {
    if (e.name === 'node_modules' || e.name.startsWith('.')) continue
    const p = path.join(dir, e.name)
    if (e.isDirectory()) walk(p, out)
    else if (/\.(tsx?|jsx?)$/.test(e.name)) out.push(p)
  }
  return out
}

const isComment = (line) => /^\s*(?:\/\/|\/\*|\*)/.test(line)

for (const file of walk(SRC)) {
  const text = read(file)
  if (!text) continue

  text.split('\n').forEach((line, i) => {
    for (const rule of RULES) {
      if (rule.scope === 'file') continue
      if (rule.skipComments && isComment(line)) continue
      if (rule.re.test(line)) warn(rel(file), i + 1, `[${rule.id}] ${rule.msg}`, rule.fix)
    }
  })

  for (const rule of RULES) {
    if (rule.scope !== 'file') continue
    const global = new RegExp(rule.re.source, rule.re.flags.replace('g', '') + 'g')
    for (const m of text.matchAll(global)) {
      warn(rel(file), lineOf(text, m.index), `[${rule.id}] ${rule.msg}`, rule.fix)
    }
  }
}

// ---------------------------------------------------------------------------
// There is deliberately NO font check here.
//
// A first draft warned when an app installed @fontsource packages without
// declaring `font-family` anywhere, on the theory that tokens.css names Geist
// but styles nothing itself. Measuring the rendered page killed it: Tailwind v4
// preflight applies the theme's font to <html>, and tokens.css registers
// --font-sans through `@theme inline`, so the font is applied whether or not the
// app repeats it. getComputedStyle reported "Geist Variable" with and without an
// explicit body rule. The rule would have been a false positive by design.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// 4. The pointer that makes the docs reachable at all.
// ---------------------------------------------------------------------------

const hasAgentDoc = ['AGENTS.md', 'CLAUDE.md'].some((f) => {
  const t = read(path.join(root, f))
  return t && /@trf\/ui2/.test(t)
})
if (!hasAgentDoc) {
  err(
    'AGENTS.md',
    1,
    'No AGENTS.md or CLAUDE.md naming @trf/ui2. Nothing points a contributor (or an agent) at the design system, which is how every other violation in this list gets written in the first place.',
    'Add the pointer from docs/for-consuming-apps.md §4.',
  )
}

// ---------------------------------------------------------------------------
// Report.
// ---------------------------------------------------------------------------

// Group identical findings so the report stays short. NUL cannot appear in a
// message, so it is a safe join separator.
const SEP = '\u0000'

const report = (label, items) => {
  if (!items.length) return
  console.log(`\n${label} (${items.length})\n`)
  const byMsg = new Map()
  for (const it of items) {
    const key = [it.msg, it.fix].join(SEP)
    if (!byMsg.has(key)) byMsg.set(key, [])
    byMsg.get(key).push(it)
  }
  for (const [key, group] of byMsg) {
    const [msg, fix] = key.split(SEP)
    console.log(`  ${msg}`)
    const shown = group.slice(0, 8)
    for (const g of shown) console.log(`      ${g.file}:${g.line}`)
    if (group.length > shown.length) console.log(`      … and ${group.length - shown.length} more`)
    console.log(`      fix: ${fix}\n`)
  }
}

console.log(`trf-ui2-check  ${pkg.name ?? rel(root)}  (@trf/ui2 ${uiSpec})`)

report('WIRING ERRORS', errors)
report('DRIFT WARNINGS', warnings)

if (!errors.length && !warnings.length) {
  console.log('\nClean: wiring correct, no drift found.\n')
  process.exit(0)
}

console.log(
  `Summary: ${errors.length} error(s), ${warnings.length} warning(s).` +
    (warnings.length && !strict ? ' Warnings do not fail the build (use --strict).' : ''),
)

process.exit(errors.length || (strict && warnings.length) ? 1 : 0)

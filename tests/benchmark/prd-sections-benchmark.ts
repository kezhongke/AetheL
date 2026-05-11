/**
 * PRD Sections 串行 vs 并行 对比测试
 *
 * 使用项目真实气泡数据，测试 /generate-prd-sections（串行）
 * 和 /generate-prd-sections-parallel（并行）的性能与质量差异。
 *
 * 运行方式: npx tsx tests/benchmark/prd-sections-benchmark.ts
 */

import * as fs from 'node:fs'
import * as path from 'node:path'
import * as http from 'node:http'

const API_BASE = 'http://localhost:3000/api/ai'
const BUBBLES_DIR = path.resolve('data/bubbles')

// ─── 加载真实气泡数据 ───────────────────────────────────────
interface Bubble {
  id: string
  content: string
  tag: string
  categoryId: string
  extensions: string[]
  interactionWeight: number
}

interface Category {
  id: string
  name: string
  description: string
  color: string
}

function loadBubbles(): Bubble[] {
  const files = fs.readdirSync(BUBBLES_DIR).filter(f => f.endsWith('.md'))
  return files.map(file => {
    const raw = fs.readFileSync(path.join(BUBBLES_DIR, file), 'utf-8')
    // 从 Markdown 中提取 JSON payload
    const match = raw.match(/```json aethel-bubble\n([\s\S]*?)\n```/)
    if (!match) return null
    try {
      const payload = JSON.parse(match[1])
      const b = payload.bubble
      return {
        id: b.id,
        content: b.content,
        tag: b.tag || '',
        categoryId: b.categoryId || '',
        extensions: payload.extensions || [],
        interactionWeight: b.interactionWeight || 0,
      }
    } catch {
      return null
    }
  }).filter(Boolean) as Bubble[]
}

function loadCategories(): Category[] {
  const raw = fs.readFileSync('data/workspace.json', 'utf-8')
  const data = JSON.parse(raw)
  return data.categories || []
}

function groupBubblesByCategory(bubbles: Bubble[], categories: Category[]) {
  const groups: Record<string, { id: string; title: string; tag: string; bubbles: Bubble[] }> = {}
  for (const cat of categories) {
    groups[cat.id] = {
      id: cat.id,
      title: cat.name,
      tag: cat.name,
      bubbles: [],
    }
  }
  for (const bubble of bubbles) {
    if (bubble.categoryId && groups[bubble.categoryId]) {
      groups[bubble.categoryId].bubbles.push(bubble)
    }
  }
  // 只保留有气泡的分组
  return Object.values(groups).filter(g => g.bubbles.length > 0)
}

// ─── API 调用 ───────────────────────────────────────────────
function apiPost(endpoint: string, payload: unknown): Promise<{ data: unknown; took: number }> {
  return new Promise((resolve, reject) => {
    const base = 'http://localhost:3000/api/ai/'
    const pathSegment = endpoint.replace(/^\//, '')
    const url = new URL(pathSegment, base)
    console.log(`  → POST ${url.toString()}`)
    const body = JSON.stringify(payload)
    const opts: http.RequestOptions = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
    }
    const req = http.request(opts, res => {
      const chunks: Buffer[] = []
      res.on('data', (c: Buffer) => chunks.push(c))
      res.on('end', () => {
        const raw = Buffer.concat(chunks).toString()
        console.log(`  ← HTTP ${res.statusCode} | body: ${raw.slice(0, 120)}`)
        try {
          const data = JSON.parse(raw)
          resolve({ data, took: 0 })
        } catch {
          reject(new Error(`JSON parse failed (HTTP ${res.statusCode}): ${raw.slice(0, 200)}`))
        }
      })
    })
    req.on('error', e => console.log(`  ✗ Network error: ${e.message}`))
    req.write(body)
    req.end()
  })
}

// ─── 对比测试 ──────────────────────────────────────────────
async function main() {
  console.log('📊 PRD Sections 串行 vs 并行 对比测试\n')
  console.log('=' .repeat(60))

  // 加载数据
  const bubbles = loadBubbles()
  const categories = loadCategories()
  const groups = groupBubblesByCategory(bubbles, categories)

  console.log(`\n✅ 数据加载完成：${bubbles.length} 个气泡，${groups.length} 个分组\n`)

  for (const g of groups) {
    console.log(`  [${g.title}] ${g.bubbles.length} 个气泡`)
  }

  console.log('\n' + '='.repeat(60))

  // ── 测试 1：串行（LEGACY）──
  console.log('\n🔄 测试 1：串行 /generate-prd-sections-serial (LEGACY)')
  console.log('-'.repeat(40))

  const serialStart = Date.now()
  let serialError = ''
  let serialResult: unknown = null
  try {
    const { data } = await apiPost('/generate-prd-sections-serial', { groups, template: 'standard' })
    serialResult = data
  } catch (e: unknown) {
    serialError = (e as Error).message
  }
  const serialTook = Date.now() - serialStart

  if (serialError) {
    console.log(`  ❌ 失败: ${serialError}`)
  } else {
    const r = serialResult as { success: boolean; sections?: unknown[]; error?: string }
    if (r.success) {
      console.log(`  ✅ 成功，耗时: ${serialTook}ms，返回 ${(r.sections || []).length} 个 sections`)
    } else {
      console.log(`  ❌ 失败: ${r.error}`)
    }
  }

  // ── 测试 2：并行（v2.0，默认）──
  console.log('\n⚡ 测试 2：并行 /generate-prd-sections (v2.0，默认)')
  console.log('-'.repeat(40))

  const parallelStart = Date.now()
  let parallelError = ''
  let parallelResult: unknown = null
  try {
    const { data } = await apiPost('/generate-prd-sections', { groups, template: 'standard' })
    parallelResult = data
  } catch (e: unknown) {
    parallelError = (e as Error).message
  }
  const parallelTook = Date.now() - parallelStart

  if (parallelError) {
    console.log(`  ❌ 失败: ${parallelError}`)
  } else {
    const r = parallelResult as { success: boolean; sections?: unknown[]; error?: string }
    if (r.success) {
      console.log(`  ✅ 成功，耗时: ${parallelTook}ms，返回 ${(r.sections || []).length} 个 sections`)
    } else {
      console.log(`  ❌ 失败: ${r.error}`)
    }
  }

  // ── 结果汇总 ──
  console.log('\n' + '='.repeat(60))
  console.log('\n📋 测试结果汇总\n')

  if (!serialError && !parallelError) {
    const s = serialResult as { sections?: unknown[] }
    const p = parallelResult as { sections?: unknown[] }
    const speedup = (serialTook / parallelTook).toFixed(2)
    const speedupLabel = serialTook > parallelTook ? `⚡ 加速 ${speedup}x` : `🐢 慢于串行 ${(parallelTook / serialTook).toFixed(2)}x`

    console.log(`  分组数量:        ${groups.length}`)
    console.log(`  串行耗时:        ${serialTook}ms`)
    console.log(`  并行耗时:        ${parallelTook}ms`)
    console.log(`  理论最优:        ~单分组耗时 × ${groups.length}路并发`)
    console.log(`  加速比:          ${speedupLabel}`)
    console.log(`  串行 sections:   ${(s.sections || []).length}`)
    console.log(`  并行 sections:   ${(p.sections || []).length}`)
    console.log(`  sections 数量差: ${Math.abs((s.sections || []).length - (p.sections || []).length)}`)

    // 内容质量对比（长度）
    const sContents = (s.sections || []).map((sec: unknown) => (sec as { content?: string }).content || '')
    const pContents = (p.sections || []).map((sec: unknown) => (sec as { content?: string }).content || '')
    const sTotalLen = sContents.reduce((a: number, b: string) => a + b.length, 0)
    const pTotalLen = pContents.reduce((a: number, b: string) => a + b.length, 0)
    console.log(`\n  内容总字符数（串行）: ${sTotalLen}`)
    console.log(`  内容总字符数（并行）: ${pTotalLen}`)
    console.log(`  差值: ${Math.abs(sTotalLen - pTotalLen)}`)

    // 各分组内容预览
    console.log('\n  ── 各分组内容对比（并行） ──')
    for (const sec of pContents) {
      const preview = (sec as string).slice(0, 80).replace(/\n/g, ' ')
      console.log(`    · ${preview}...`)
    }

    console.log('\n  ── 各分组内容对比（串行） ──')
    for (const sec of sContents) {
      const preview = (sec as string).slice(0, 80).replace(/\n/g, ' ')
      console.log(`    · ${preview}...`)
    }
  } else {
    if (serialError) console.log(`  串行错误: ${serialError}`)
    if (parallelError) console.log(`  并行错误: ${parallelError}`)
  }
}

main().catch(console.error)

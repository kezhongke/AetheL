/**
 * PRD Sections 质量对比测试
 * 同时调用串行端点和并行端点，保存完整输出用于质量对比
 */

import * as fs from 'node:fs'
import * as path from 'node:path'
import * as http from 'node:http'

const API_BASE = 'http://localhost:3000'
const BUBBLES_DIR = path.resolve('data/bubbles')

// ─── 数据加载（复用 benchmark 逻辑）───────────────────────────
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
  return (data.categories || []) as Category[]
}

// ─── HTTP POST 封装 ──────────────────────────────────────────
function httpPost(endpoint: string, payload: unknown): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, API_BASE)
    const postData = JSON.stringify(payload)
    const req = http.request({
      hostname: url.hostname,
      port: url.port,
      path: '/api/ai' + endpoint,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
    }, (res) => {
      let body = ''
      res.on('data', chunk => body += chunk)
      res.on('end', () => resolve({ status: res.statusCode || 0, body }))
    })
    req.on('error', reject)
    req.write(postData)
    req.end()
  })
}

// ─── 主测试流程 ──────────────────────────────────────────────
async function main() {
  console.log('📊 PRD 质量对比测试\n')

  // 加载数据
  const bubbles = loadBubbles()
  const categories = loadCategories()
  console.log(`✅ 加载 ${bubbles.length} 个气泡，${categories.length} 个分组\n`)

  // 按分组聚合气泡
  const groups = categories.map(cat => ({
    id: cat.id,
    title: cat.name,
    tag: cat.description || cat.name,
    bubbles: bubbles
      .filter(b => b.categoryId === cat.id || b.tag === cat.description || b.tag === cat.name)
      .map(b => ({
        id: b.id,
        content: b.content,
        tag: b.tag,
        extensions: b.extensions,
      })),
  })).filter(g => g.bubbles.length > 0)

  console.log('📦 分组数据：')
  groups.forEach(g => console.log(`  [${g.title}] ${g.bubbles.length} 个气泡`))
  console.log()

  // 调用串行端点
  console.log('🔄 串行端点 /generate-prd-sections...')
  const serialStart = Date.now()
  const serialRes = await httpPost('/generate-prd-sections', { groups })
  const serialTime = Date.now() - serialStart
  const serialData = JSON.parse(serialRes.body)
  console.log(`  → HTTP ${serialRes.status} | ${serialTime}ms`)
  console.log(`  → ${serialData.sections?.length || 0} sections`)

  // 调用并行端点
  console.log('\n⚡ 并行端点 /generate-prd-sections-parallel...')
  const parallelStart = Date.now()
  const parallelRes = await httpPost('/generate-prd-sections-parallel', { groups })
  const parallelTime = Date.now() - parallelStart
  const parallelData = JSON.parse(parallelRes.body)
  console.log(`  → HTTP ${parallelRes.status} | ${parallelTime}ms`)
  console.log(`  → ${parallelData.sections?.length || 0} sections`)

  // 保存完整结果
  const output = {
    testTime: new Date().toISOString(),
    config: {
      bubblesCount: bubbles.length,
      groupsCount: groups.length,
    },
    serial: {
      time: serialTime,
      sections: serialData.sections || [],
    },
    parallel: {
      time: parallelTime,
      sections: parallelData.sections || [],
    },
  }

  const outPath = 'data/prd-quality-comparison.json'
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2))
  console.log(`\n💾 结果已保存: ${outPath}`)

  // 打印质量对比
  console.log('\n' + '='.repeat(60))
  console.log('📋 质量对比')
  console.log('='.repeat(60))

  const maxGroups = Math.max(
    serialData.sections?.length || 0,
    parallelData.sections?.length || 0
  )

  for (let i = 0; i < maxGroups; i++) {
    const s = serialData.sections?.[i]
    const p = parallelData.sections?.[i]
    console.log(`\n── 分组 ${i + 1}: ${s?.title || p?.title || '未知'} ──`)

    if (s?.content) {
      const sLen = s.content.length
      console.log(`【串行】${sLen} 字`)
      console.log(s.content.slice(0, 300) + (sLen > 300 ? '...' : ''))
    } else {
      console.log('【串行】无内容')
    }

    console.log()
    if (p?.content) {
      const pLen = p.content.length
      console.log(`【并行】${pLen} 字`)
      console.log(p.content.slice(0, 300) + (pLen > 300 ? '...' : ''))
    } else {
      console.log('【并行】无内容')
    }
  }

  // 汇总
  const sTotal = (serialData.sections || []).reduce((sum: number, s: { content?: string }) => sum + (s.content?.length || 0), 0)
  const pTotal = (parallelData.sections || []).reduce((sum: number, s: { content?: string }) => sum + (s.content?.length || 0), 0)
  console.log('\n' + '='.repeat(60))
  console.log('📊 汇总')
  console.log('='.repeat(60))
  console.log(`串行耗时: ${serialTime}ms | 内容总量: ${sTotal} 字`)
  console.log(`并行耗时: ${parallelTime}ms | 内容总量: ${pTotal} 字`)
  console.log(`加速比: ${(serialTime / parallelTime).toFixed(2)}x`)
  console.log(`内容增量: ${pTotal - sTotal > 0 ? '+' : ''}${pTotal - sTotal} 字 (${(((pTotal - sTotal) / sTotal) * 100).toFixed(1)}%)`)
}

main().catch(console.error)

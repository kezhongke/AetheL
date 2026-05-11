/**
 * AetheL 并行优化测试套件
 * 测试 /categorize 和 /snapshot 端点的并行化效果
 *
 * 运行方式: npx tsx tests/performance/parallel-optimization.test.ts
 */

import http from 'node:http'
import { mkdtemp, rm } from 'node:fs/promises'
import path from 'node:path'
import { tmpdir } from 'node:os'

// ─── 模拟 AI 延迟（毫秒） ─────────────────────────
const SIMULATED_AI_DELAY_MS = 300

// ─── 测试辅助 ─────────────────────────────────────
type TestCase = { name: string; run: () => Promise<void> }
const tests: TestCase[] = []
function test(name: string, run: () => Promise<void>) {
  tests.push({ name, run })
}

async function listen(app: http.RequestListener) {
  const server = http.createServer(app)
  await new Promise<void>((resolve) => server.listen(0, resolve))
  const address = server.address()
  if (!address || typeof address === 'string') throw new Error('Failed to start server')
  return { server, baseUrl: `http://127.0.0.1:${address.port}` }
}

async function request(baseUrl: string, pathname: string, body?: unknown) {
  const response = await fetch(`${baseUrl}${pathname}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
  const payload = await response.json()
  return { response, payload }
}

// ─── Mock AI 响应生成器 ────────────────────────────
function createMockAIResponse() {
  return {
    choices: [{
      message: {
        content: JSON.stringify({
          categories: [{ name: '测试分类', description: '测试描述', bubbleIds: ['b1'], suggestedTag: '测试', confidence: 0.9 }],
          suggestedTags: [{ name: '测试标签', color: '#00F0FF', reason: '测试原因' }],
          relations: [],
        }),
      },
    }],
  }
}

function createMockSnapshotResponse() {
  return {
    choices: [{
      message: {
        content: JSON.stringify({
          statusSnapshot: '测试快照：核心议题',
          logicFlow: '测试逻辑流程描述',
          cognitiveGaps: ['测试空白1', '测试空白2'],
          semanticAnchors: [{ label: '测试锚点', reason: '测试原因', bubbleIds: ['b1'] }],
          wakeTrigger: '测试唤醒触发器',
          level2: [{ anchor: '测试锚点', summary: '测试摘要', bubbleIds: ['b1'] }],
          level3: [{ bubbleId: 'b1', source: '测试来源', deepLogic: '测试深层逻辑' }],
        }),
      },
    }],
  }
}

// ─── 测试主体 ─────────────────────────────────────
async function main() {
  const dataDir = await mkdtemp(path.join(tmpdir(), 'aethel-parallel-'))
  process.env.NODE_ENV = 'test'
  process.env.AETHEL_DATA_DIR = dataDir

  const aiRoutes = await import('../../api/routes/ai.js')
  const { default: app } = await import('../../api/app.js')

  // 清除缓存（确保每次测试都是冷启动）
  aiRoutes.clearResponseCacheForTests()

  let aiCallCount = 0

  aiRoutes.setAICompletionOverrideForTests(async (payload) => {
    aiCallCount++
    const systemPrompt = payload.messages[0]?.content || ''

    // 模拟 AI 延迟
    await new Promise((resolve) => setTimeout(resolve, SIMULATED_AI_DELAY_MS))

    if (systemPrompt.includes('碎片化的灵感进行归类整理')) {
      return createMockAIResponse()
    }

    if (systemPrompt.includes('认知负荷优化专家')) {
      if (systemPrompt.includes('气泡分析结果')) {
        // 最终组装阶段
        return createMockSnapshotResponse()
      }
      // 分析阶段
      return {
        choices: [{
          message: {
            content: JSON.stringify({
              semanticAnchors: [{ label: '锚点', reason: '原因', bubbleIds: ['b1'] }],
              level2: [{ anchor: '锚点', summary: '摘要', bubbleIds: ['b1'] }],
              level3: [{ bubbleId: 'b1', source: '来源', deepLogic: '深层逻辑' }],
            }),
          },
        }],
      }
    }

    return { choices: [{ message: { content: '{}' } }] }
  })

  const { server, baseUrl } = await listen(app)

  console.log('\n🧪 AetheL 并行优化测试开始\n')
  console.log(`模拟 AI 延迟: ${SIMULATED_AI_DELAY_MS}ms / 次\n`)
  console.log('─'.repeat(60))

  // ════════════════════════════════════════════════
  // Test 1: /categorize 串行模式（气泡 < 5）
  // ════════════════════════════════════════════════
  console.log('\n📦 Test 1: /categorize 串行模式（气泡 < 5）\n')

  {
    aiCallCount = 0
    const bubbles = [
      { id: 'b1', content: '气泡内容1', tag: '标签1' },
      { id: 'b2', content: '气泡内容2', tag: '标签2' },
      { id: 'b3', content: '气泡内容3', tag: '标签3' },
    ]

    const start = Date.now()
    const res = await request(baseUrl, '/api/ai/categorize', { bubbles, existingTags: [] })
    const duration = Date.now() - start

    const expectedCalls = 1 // 串行模式，3个气泡只调用1次
    const passed = res.response.ok && aiCallCount === expectedCalls

    console.log(`  气泡数量: ${bubbles.length} (< 5，应走串行)`)
    console.log(`  AI 调用次数: ${aiCallCount} (预期: ${expectedCalls}) ${passed ? '✅' : '❌'}`)
    console.log(`  耗时: ${duration}ms (预期: ~${SIMULATED_AI_DELAY_MS}ms)`)
    console.log(`  响应成功: ${res.response.ok ? '✅' : '❌'}`)

    test('categorize 串行模式：气泡 < 5 走串行', async () => {
      if (!passed) throw new Error(`AI调用次数不符: ${aiCallCount} !== ${expectedCalls}`)
    })
  }

  // ════════════════════════════════════════════════
  // Test 2: /categorize 并行模式（气泡 ≥ 5）
  // ════════════════════════════════════════════════
  console.log('\n\n⚡ Test 2: /categorize 并行模式（气泡 ≥ 5）\n')

  {
    aiCallCount = 0
    const bubbles = [
      { id: 'b1', content: '气泡内容1', tag: '标签1' },
      { id: 'b2', content: '气泡内容2', tag: '标签2' },
      { id: 'b3', content: '气泡内容3', tag: '标签3' },
      { id: 'b4', content: '气泡内容4', tag: '标签4' },
      { id: 'b5', content: '气泡内容5', tag: '标签5' },
      { id: 'b6', content: '气泡内容6', tag: '标签6' },
      { id: 'b7', content: '气泡内容7', tag: '标签7' },
    ]

    const start = Date.now()
    const res = await request(baseUrl, '/api/ai/categorize', { bubbles, existingTags: [] })
    const duration = Date.now() - start

    // 并行模式：7个气泡分成5组（每组2-5个），最多5组
    // groupBubblesForParallel(7, 5, 5) → 5组
    // 但实际代码中 groupSize = Math.min(5, 10) = 5, actualGroupSize = 5
    // 7个气泡: [b1-b5], [b6-b7] = 2组
    const expectedCalls = 2 // 7个气泡分2组并行

    const passed = res.response.ok && aiCallCount === expectedCalls

    console.log(`  气泡数量: ${bubbles.length} (≥ 5，应走并行)`)
    console.log(`  预期分组数: ${expectedCalls}`)
    console.log(`  AI 调用次数: ${aiCallCount} (预期: ${expectedCalls}) ${passed ? '✅' : '❌'}`)
    console.log(`  耗时: ${duration}ms (预期: ~${SIMULATED_AI_DELAY_MS}ms，并行加速)`)
    console.log(`  响应成功: ${res.response.ok ? '✅' : '❌'}`)
    console.log(`  并行加速比: ~${Math.round(1200 / duration * 10) / 10}x (vs 串行 ~${expectedCalls * SIMULATED_AI_DELAY_MS}ms)`)

    test('categorize 并行模式：气泡 ≥ 5 分组并行', async () => {
      if (!passed) throw new Error(`AI调用次数不符: ${aiCallCount} !== ${expectedCalls}`)
    })
  }

  // ════════════════════════════════════════════════
  // Test 3: /categorize 并行模式（大气泡数）
  // ════════════════════════════════════════════════
  console.log('\n\n⚡ Test 3: /categorize 并行模式（大气泡数：25个）\n')

  {
    aiCallCount = 0
    // 清除缓存，确保冷启动
    aiRoutes.clearResponseCacheForTests()

    // 25个气泡，每个内容不同以产生不同cache key
    const bubbles = Array.from({ length: 25 }, (_, i) => ({
      id: `b${i + 1}`,
      content: `独特气泡内容${i + 1} #${Date.now()}`,
      tag: `标签${i + 1}`,
    }))

    const start = Date.now()
    const res = await request(baseUrl, '/api/ai/categorize', { bubbles, existingTags: [] })
    const duration = Date.now() - start

    // 25个气泡，每组5个，分5组
    const expectedCalls = 5

    const passed = res.response.ok && aiCallCount === expectedCalls

    console.log(`  气泡数量: ${bubbles.length} (≥ 5，应走并行)`)
    console.log(`  预期分组数: ${expectedCalls}`)
    console.log(`  AI 调用次数: ${aiCallCount} (预期: ${expectedCalls}) ${passed ? '✅' : '❌'}`)
    console.log(`  耗时: ${duration}ms (预期: ~${SIMULATED_AI_DELAY_MS}ms，并行加速)`)
    console.log(`  串行耗时估算: ${expectedCalls * SIMULATED_AI_DELAY_MS}ms`)
    console.log(`  理论加速比: ~${expectedCalls}x`)

    test('categorize 并行模式：25个气泡分5组并行', async () => {
      if (!passed) throw new Error(`AI调用次数不符: ${aiCallCount} !== ${expectedCalls}`)
    })
  }

  // ════════════════════════════════════════════════
  // Test 4: /snapshot 串行模式（气泡 < 5）
  // ════════════════════════════════════════════════
  console.log('\n\n📦 Test 4: /snapshot 串行模式（气泡 < 5）\n')

  {
    aiCallCount = 0
    const bubbles = [
      { id: 's1', content: '快照气泡1', tag: '标签1' },
      { id: 's2', content: '快照气泡2', tag: '标签2' },
      { id: 's3', content: '快照气泡3', tag: '标签3' },
    ]
    const categories = [{ name: '测试分类', description: '测试描述' }]

    const start = Date.now()
    const res = await request(baseUrl, '/api/ai/snapshot', { bubbles, categories })
    const duration = Date.now() - start

    // 串行模式：只有1次AI调用
    const expectedCalls = 1
    const passed = res.response.ok && aiCallCount === expectedCalls

    console.log(`  气泡数量: ${bubbles.length} (< 5，应走串行)`)
    console.log(`  AI 调用次数: ${aiCallCount} (预期: ${expectedCalls}) ${passed ? '✅' : '❌'}`)
    console.log(`  耗时: ${duration}ms (预期: ~${SIMULATED_AI_DELAY_MS}ms)`)
    console.log(`  响应成功: ${res.response.ok ? '✅' : '❌'}`)

    test('snapshot 串行模式：气泡 < 5 走串行', async () => {
      if (!passed) throw new Error(`AI调用次数不符: ${aiCallCount} !== ${expectedCalls}`)
    })
  }

  // ════════════════════════════════════════════════
  // Test 5: /snapshot 并行模式（气泡 ≥ 5）
  // ════════════════════════════════════════════════
  console.log('\n\n⚡ Test 5: /snapshot 并行模式（气泡 ≥ 5）\n')

  {
    aiCallCount = 0
    const bubbles = [
      { id: 's1', content: '快照气泡1', tag: '标签1' },
      { id: 's2', content: '快照气泡2', tag: '标签2' },
      { id: 's3', content: '快照气泡3', tag: '标签3' },
      { id: 's4', content: '快照气泡4', tag: '标签4' },
      { id: 's5', content: '快照气泡5', tag: '标签5' },
      { id: 's6', content: '快照气泡6', tag: '标签6' },
    ]
    const categories = [{ name: '测试分类', description: '测试描述' }]

    const start = Date.now()
    const res = await request(baseUrl, '/api/ai/snapshot', { bubbles, categories })
    const duration = Date.now() - start

    // 并行模式：6个气泡分2组并行分析 + 1次最终组装 = 3次
    // 实际代码: groupSize = Math.ceil(6/5) = 2
    // groups: [s1-s2], [s3-s4], [s5-s6] = 3组
    // 分析调用: 3次, 组装调用: 1次 = 4次
    const expectedAnalysisCalls = 3
    const totalExpected = expectedAnalysisCalls + 1 // +1 for assembly

    const passed = res.response.ok && aiCallCount === totalExpected

    console.log(`  气泡数量: ${bubbles.length} (≥ 5，应走并行)`)
    console.log(`  分组分析调用: ${expectedAnalysisCalls} 次`)
    console.log(`  最终组装调用: 1 次`)
    console.log(`  AI 调用次数: ${aiCallCount} (预期: ${totalExpected}) ${passed ? '✅' : '❌'}`)
    console.log(`  耗时: ${duration}ms (预期: ~${SIMULATED_AI_DELAY_MS}ms，并行分析+组装)`)
    console.log(`  串行耗时估算: ${totalExpected * SIMULATED_AI_DELAY_MS}ms`)

    test('snapshot 并行模式：6个气泡分3组并行分析 + 组装', async () => {
      if (!passed) throw new Error(`AI调用次数不符: ${aiCallCount} !== ${totalExpected}`)
    })
  }

  // ════════════════════════════════════════════════
  // Test 6: /snapshot 并行模式（大气泡数）
  // ════════════════════════════════════════════════
  console.log('\n\n⚡ Test 6: /snapshot 并行模式（15个气泡）\n')

  {
    aiCallCount = 0
    const bubbles = Array.from({ length: 15 }, (_, i) => ({
      id: `s${i + 1}`,
      content: `快照气泡${i + 1}`,
      tag: `标签${i + 1}`,
    }))
    const categories = [{ name: '测试分类', description: '测试描述' }]

    const start = Date.now()
    const res = await request(baseUrl, '/api/ai/snapshot', { bubbles, categories })
    const duration = Date.now() - start

    // 15个气泡，groupSize = Math.ceil(15/5) = 3
    // groups: [s1-s3], [s4-s6], [s7-s9], [s10-s12], [s13-s15] = 5组
    const expectedAnalysisCalls = 5
    const totalExpected = expectedAnalysisCalls + 1 // +1 for assembly

    const passed = res.response.ok && aiCallCount === totalExpected

    console.log(`  气泡数量: ${bubbles.length} (≥ 5，应走并行)`)
    console.log(`  分组数: ${expectedAnalysisCalls} 组`)
    console.log(`  AI 调用次数: ${aiCallCount} (预期: ${totalExpected}) ${passed ? '✅' : '❌'}`)
    console.log(`  耗时: ${duration}ms (预期: ~${SIMULATED_AI_DELAY_MS}ms)`)
    console.log(`  串行耗时估算: ${totalExpected * SIMULATED_AI_DELAY_MS}ms`)
    console.log(`  理论加速比: ~${totalExpected}x（分组并行 + 最终组装）`)

    test('snapshot 并行模式：15个气泡分5组并行 + 组装', async () => {
      if (!passed) throw new Error(`AI调用次数不符: ${aiCallCount} !== ${totalExpected}`)
    })
  }

  // ════════════════════════════════════════════════
  // Test 7: 并行结果合并验证
  // ════════════════════════════════════════════════
  console.log('\n\n🔗 Test 7: /categorize 并行结果合并去重\n')

  {
    // 这个测试验证并行结果合并时去重是否正确
    // 由于mock返回固定的bubbleIds，我们验证返回结构完整性
    const bubbles = Array.from({ length: 7 }, (_, i) => ({
      id: `b${i + 1}`,
      content: `气泡内容${i + 1}`,
      tag: `标签${i + 1}`,
    }))

    const res = await request(baseUrl, '/api/ai/categorize', { bubbles, existingTags: [] })

    const passed = res.response.ok &&
      Array.isArray(res.payload.categories) &&
      Array.isArray(res.payload.suggestedTags) &&
      Array.isArray(res.payload.relations)

    console.log(`  categories 类型正确: ${Array.isArray(res.payload.categories) ? '✅' : '❌'}`)
    console.log(`  suggestedTags 类型正确: ${Array.isArray(res.payload.suggestedTags) ? '✅' : '❌'}`)
    console.log(`  relations 类型正确: ${Array.isArray(res.payload.relations) ? '✅' : '❌'}`)
    console.log(`  并行结果合并成功: ${passed ? '✅' : '❌'}`)

    test('categorize 并行结果合并结构完整', async () => {
      if (!passed) throw new Error('并行结果合并结构不完整')
    })
  }

  // ════════════════════════════════════════════════
  // Test 8: 并发安全测试
  // ════════════════════════════════════════════════
  console.log('\n\n🔒 Test 8: 并发请求安全性\n')

  {
    aiCallCount = 0
    const bubbles = [
      { id: 'p1', content: '并发测试1', tag: '标签1' },
      { id: 'p2', content: '并发测试2', tag: '标签2' },
      { id: 'p3', content: '并发测试3', tag: '标签3' },
      { id: 'p4', content: '并发测试4', tag: '标签4' },
      { id: 'p5', content: '并发测试5', tag: '标签5' },
    ]

    const concurrentCount = 3
    const start = Date.now()

    const promises = Array.from({ length: concurrentCount }, () =>
      request(baseUrl, '/api/ai/categorize', { bubbles, existingTags: [] })
    )

    const results = await Promise.all(promises)
    const totalDuration = Date.now() - start

    const successCount = results.filter(r => r.response.ok).length
    const expectedCalls = 2 * concurrentCount // 每请求分2组

    console.log(`  并发请求数: ${concurrentCount}`)
    console.log(`  成功响应: ${successCount}/${concurrentCount}`)
    console.log(`  AI 调用次数: ${aiCallCount} (预期: ${expectedCalls})`)
    console.log(`  总耗时: ${totalDuration}ms (预期: ~${SIMULATED_AI_DELAY_MS}ms，无串联)`)
    console.log(`  并发安全: ${totalDuration < SIMULATED_AI_DELAY_MS * 3 ? '✅' : '❌'}`)

    test('并发请求安全：多个并行请求同时处理', async () => {
      if (successCount !== concurrentCount) throw new Error(`成功率不符: ${successCount}/${concurrentCount}`)
    })
  }

  // ════════════════════════════════════════════════
  // 执行所有测试
  // ════════════════════════════════════════════════
  console.log('\n' + '─'.repeat(60))
  console.log('\n📊 测试结果汇总\n')

  let passedCount = 0
  let failedCount = 0

  try {
    for (const item of tests) {
      try {
        await item.run()
        console.log(`  ✅ ${item.name}`)
        passedCount++
      } catch (err) {
        console.log(`  ❌ ${item.name}: ${err instanceof Error ? err.message : err}`)
        failedCount++
      }
    }
  } finally {
    aiRoutes.setAICompletionOverrideForTests(null)
    await new Promise<void>((resolve) => server.close(() => resolve()))
    await rm(dataDir, { recursive: true, force: true })
  }

  console.log(`\n  通过: ${passedCount} | 失败: ${failedCount}`)
  console.log(`\n✅ 并行优化测试全部完成\n`)

  if (failedCount > 0) {
    process.exitCode = 1
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})

import { strict as assert } from 'node:assert'
import { existsSync } from 'node:fs'
import { mkdtemp, rm } from 'node:fs/promises'
import http from 'node:http'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { apiFetch } from '../../src/lib/apiClient.js'

type TestCase = {
  name: string
  run: () => Promise<void>
}

const tests: TestCase[] = []

function test(name: string, run: () => Promise<void>) {
  tests.push({ name, run })
}

async function listen(app: http.RequestListener) {
  const server = http.createServer(app)
  await new Promise<void>((resolve) => server.listen(0, resolve))
  const address = server.address()
  if (!address || typeof address === 'string') {
    throw new Error('Failed to start integration test server')
  }
  return {
    server,
    baseUrl: `http://127.0.0.1:${address.port}`,
  }
}

async function request(baseUrl: string, method: string, pathname: string, body?: unknown) {
  const response = await fetch(`${baseUrl}${pathname}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
  const contentType = response.headers.get('content-type') || ''
  const payload = contentType.includes('application/json') ? await response.json() : await response.text()
  return { response, payload }
}

async function main() {
  const dataDir = await mkdtemp(path.join(tmpdir(), 'aethel-p0-'))
  process.env.NODE_ENV = 'test'
  process.env.AETHEL_DATA_DIR = dataDir

  const aiRoutes = await import('../../api/routes/ai.js')
  const { default: app } = await import('../../api/app.js')
  const aiCalls: Array<{ messages: Array<{ role: string; content: string }> }> = []

  aiRoutes.setAICompletionOverrideForTests(async (payload) => {
    aiCalls.push(payload as { messages: Array<{ role: string; content: string }> })
    const systemPrompt = payload.messages[0]?.content || ''

    if (systemPrompt.includes('AI skill 运行器')) {
      return {
        choices: [{
          message: {
            content: JSON.stringify({
              analysisSummary: '识别到一个需要拆解的产品想法。',
              needsConfirmation: false,
              confidence: 0.86,
              confirmationPrompt: '可以先生成基础模块气泡。',
              clarificationQuestions: [],
              candidateBubbles: [{
                title: 'AI 推断模块',
                content: '根据设想推断出的模块气泡',
                tag: '产品模块',
                rationale: '来自 mock AI',
              }],
              suggestedNextActions: ['生成气泡'],
            }),
          },
        }],
      }
    }

    if (systemPrompt.includes('PRD 分章节草稿')) {
      return {
        choices: [{
          message: {
            content: JSON.stringify({
              sections: [{
                groupId: 'core',
                title: '核心体验',
                content: '## 目标\n形成可验证的核心体验。',
              }],
            }),
          },
        }],
      }
    }

    if (systemPrompt.includes('认知负荷优化专家')) {
      return {
        choices: [{
          message: {
            content: JSON.stringify({
              statusSnapshot: '围绕核心用户假设形成初步判断。',
              logicFlow: '从用户场景出发，先确认价值，再收敛模块。',
              cognitiveGaps: ['验证标准仍需明确'],
              semanticAnchors: [{ label: '用户假设', reason: '决定后续模块优先级', bubbleIds: ['b1'] }],
              wakeTrigger: '继续验证用户假设与模块优先级。',
              level2: [{ anchor: '用户假设', summary: '需要继续确认目标用户。', bubbleIds: ['b1'] }],
              level3: [{ bubbleId: 'b1', source: '气泡原文', deepLogic: '假设来自用户输入。' }],
            }),
          },
        }],
      }
    }

    return { choices: [{ message: { content: '{}' } }] }
  })

  const { server, baseUrl } = await listen(app)

  test('workspace APIs write runtime data into the configured temp data dir', async () => {
    const { response, payload } = await request(baseUrl, 'POST', '/api/bubbles', {
      id: 'b1',
      content: '为年轻产品经理提供结构化 PRD 生成体验',
      tag: '用户假设',
      color: '#ad2c0d',
      x: 12,
      y: 24,
    })

    assert.equal(response.status, 201)
    assert.equal(payload.success, true)
    assert.equal(payload.bubble.id, 'b1')
    assert.equal(existsSync(path.join(dataDir, 'bubbles', 'b1.md')), true)
    assert.equal(existsSync(path.join(dataDir, 'workspace.json')), true)
  })

  test('workshop skill keeps the original idea as the first generated bubble', async () => {
    const originalIdea = '做一个把模糊想法拆成 PRD 的 AI 工作区'
    const { response, payload } = await request(baseUrl, 'POST', '/api/ai/workshop-skill', {
      skillId: 'idea-to-bubbles',
      input: originalIdea,
    })

    assert.equal(response.status, 200)
    assert.equal(payload.success, true)
    assert.equal(payload.candidateBubbles[0].title, '初始设想')
    assert.equal(payload.candidateBubbles[0].content, originalIdea)
    assert.equal(payload.candidateBubbles.length, 2)
  })

  test('PRD section generation returns grouped editable sections', async () => {
    const { response, payload } = await request(baseUrl, 'POST', '/api/ai/generate-prd-sections', {
      groups: [{
        id: 'core',
        title: '核心体验',
        tag: '产品模块',
        bubbles: [{ id: 'b1', content: '生成结构化 PRD section', tag: '产品模块' }],
      }],
    })

    assert.equal(response.status, 200)
    assert.equal(payload.success, true)
    assert.equal(payload.sections[0].groupId, 'core')
    assert.equal(payload.sections[0].title, '核心体验')
  })

  test('snapshot generation returns progressive cognition layers', async () => {
    const { response, payload } = await request(baseUrl, 'POST', '/api/ai/snapshot', {
      bubbles: [{
        id: 'b1',
        content: '为年轻产品经理提供结构化 PRD 生成体验',
        tag: '用户假设',
        interactionWeight: 3,
      }],
      categories: [{ name: '用户假设', description: '目标用户与需求判断' }],
    })

    assert.equal(response.status, 200)
    assert.equal(payload.success, true)
    assert.equal(payload.statusSnapshot, '围绕核心用户假设形成初步判断。')
    assert.equal(payload.semanticAnchors[0].label, '用户假设')
    assert.equal(Array.isArray(payload.level3), true)
  })

  test('apiFetch falls back to the local API when same-origin returns HTML', async () => {
    const originalFetch = globalThis.fetch
    const originalWindow = (globalThis as typeof globalThis & { window?: unknown }).window
    const calledUrls: string[] = []

    ;(globalThis as typeof globalThis & { window?: unknown }).window = { location: { hostname: 'localhost' } }
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const url = String(input)
      calledUrls.push(url)
      if (url === '/api/health') {
        return new Response('<html></html>', {
          status: 200,
          headers: { 'content-type': 'text/html' },
        })
      }
      if (url === 'http://localhost:3000/api/health') {
        return Response.json({ success: true, source: 'fallback' })
      }
      throw new Error(`Unexpected URL: ${url}`)
    }) as typeof fetch

    try {
      const response = await apiFetch('/api/health')
      const payload = await response.json()
      assert.equal(payload.source, 'fallback')
      assert.deepEqual(calledUrls, ['/api/health', 'http://localhost:3000/api/health'])
    } finally {
      globalThis.fetch = originalFetch
      ;(globalThis as typeof globalThis & { window?: unknown }).window = originalWindow
    }
  })

  try {
    for (const item of tests) {
      await item.run()
      console.log(`✓ ${item.name}`)
    }
  } finally {
    aiRoutes.setAICompletionOverrideForTests(null)
    await new Promise<void>((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve())
    })
    await rm(dataDir, { recursive: true, force: true })
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})

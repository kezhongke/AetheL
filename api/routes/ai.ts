import { Router, type Request, type Response } from 'express'
import OpenAI from 'openai'
import crypto from 'crypto'
import dotenv from 'dotenv'
import {
  normalizeCategorizeResponse,
  normalizeFollowupResponse,
} from '../aiResponseSchemas.js'
import {
  buildCategorizeSystemPrompt,
  buildCategorizeUserPrompt,
  groupBubblesForParallel,
} from '../prompts/categorize.js'
import {
  buildFollowupSystemPrompt,
  buildFollowupUserPrompt,
} from '../prompts/followup.js'
import {
  buildGeneratePrdSystemPrompt,
  buildGeneratePrdUserPrompt,
  buildPrdSectionsSystemPrompt,
  buildPrdSectionsUserPrompt,
  buildPrdSectionUserPrompt,
} from '../prompts/prd.js'
import {
  buildSnapshotSystemPrompt,
  buildSnapshotUserPrompt,
  buildBubbleAnalysisPrompt,
  buildSnapshotAssemblyPrompt,
  type BubbleAnalysisResult,
} from '../prompts/snapshot.js'
import {
  buildWorkshopSystemPrompt,
  buildWorkshopUserPrompt,
  type WorkshopSkillId,
} from '../prompts/workshop.js'

dotenv.config()

const router = Router()

type AIProvider = 'modelscope' | 'deepseek' | 'moonshot'

interface AIConfig {
  provider: AIProvider
  baseURL: string
  apiKey: string
  model: string
}

function getAIConfigFromEnv(): AIConfig {
  const provider = (process.env.AI_PROVIDER || 'moonshot') as AIProvider

  const configs: Record<AIProvider, AIConfig> = {
    modelscope: {
      provider: 'modelscope',
      baseURL: 'https://api-inference.modelscope.cn/v1',
      apiKey: process.env.MODELSCOPE_API_KEY || '',
      model: 'moonshotai/Kimi-K2.5',
    },
    deepseek: {
      provider: 'deepseek',
      baseURL: 'https://api.deepseek.com',
      apiKey: process.env.DEEPSEEK_API_KEY || '',
      model: 'deepseek-v4-pro',
    },
    moonshot: {
      provider: 'moonshot',
      baseURL: 'https://api.moonshot.cn/v1',
      apiKey: process.env.MOONSHOT_API_KEY || '',
      model: 'kimi-k2.6',
    },
  }

  return configs[provider]
}

let aiConfig = getAIConfigFromEnv()
let client = new OpenAI({
  baseURL: aiConfig.baseURL,
  apiKey: aiConfig.apiKey,
})
let defaultModel = aiConfig.model
type CompletionPayload = {
  model: string
  messages: Array<{ role: string; content: string }>
  stream?: boolean
}
type CompletionOverride = (payload: CompletionPayload) => Promise<unknown> | unknown
let completionOverride: CompletionOverride | null = null

export function setAICompletionOverrideForTests(override: CompletionOverride | null) {
  completionOverride = override
}

// ─────────────────────────────────────────────
// 缓存层
// ─────────────────────────────────────────────

interface CacheEntry {
  result: unknown
  expiry: number
}

const CACHE_TTL_MS = 5 * 60 * 1000 // 5 分钟
const MAX_CACHE_SIZE = 200
const responseCache = new Map<string, CacheEntry>()

// 导出缓存清除（仅供测试使用）
export function clearResponseCacheForTests() {
  responseCache.clear()
}

function getCacheKey(model: string, messages: Array<{ role: string; content: string }>): string {
  const content = messages.map(m => `${m.role}:${m.content}`).join('|')
  return `${model}:${crypto.createHash('sha256').update(content).digest('hex').slice(0, 16)}`
}

function getCachedResult<T>(key: string): T | null {
  const entry = responseCache.get(key)
  if (!entry) return null
  if (Date.now() > entry.expiry) {
    responseCache.delete(key)
    return null
  }
  return entry.result as T
}

function setCachedResult<T>(key: string, result: T): void {
  if (responseCache.size >= MAX_CACHE_SIZE) {
    const firstKey = responseCache.keys().next().value
    if (firstKey) responseCache.delete(firstKey)
  }
  responseCache.set(key, { result, expiry: Date.now() + CACHE_TTL_MS })
}

async function createChatCompletion(payload: CompletionPayload, options?: { useCache?: boolean }): Promise<any> {
  const useCache = options?.useCache !== false
  let cacheKey: string | null = null

  if (useCache) {
    cacheKey = getCacheKey(payload.model, payload.messages)
    const cached = getCachedResult<any>(cacheKey)
    if (cached) {
      console.log('[AI Cache] HIT:', cacheKey)
      return cached
    }
  }

  let result: any
  if (completionOverride) {
    result = await completionOverride(payload)
  } else {
    result = await client.chat.completions.create(payload as Parameters<typeof client.chat.completions.create>[0])
  }

  // 无论真实 API 还是 override，结果都应缓存（避免同一次运行中重复调用）
  if (useCache && cacheKey) {
    setCachedResult(cacheKey, result)
  }

  return result
}

function recreateClient() {
  aiConfig = getAIConfigFromEnv()
  client = new OpenAI({
    baseURL: aiConfig.baseURL,
    apiKey: aiConfig.apiKey,
  })
  defaultModel = aiConfig.model
}

// API endpoint to update AI config from frontend
router.post('/config', async (req: Request, res: Response) => {
  try {
    const { provider, apiKey, model } = req.body

    if (provider && apiKey) {
      const providers: Record<string, { baseURL: string; defaultModel: string }> = {
        modelscope: { baseURL: 'https://api-inference.modelscope.cn/v1', defaultModel: 'moonshotai/Kimi-K2.5' },
        deepseek: { baseURL: 'https://api.deepseek.com', defaultModel: 'deepseek-v4-pro' },
        moonshot: { baseURL: 'https://api.moonshot.cn/v1', defaultModel: 'kimi-k2.6' },
      }

      const config = providers[provider]
      if (config) {
        client = new OpenAI({
          baseURL: config.baseURL,
          apiKey: apiKey,
        })
        defaultModel = model || config.defaultModel
        aiConfig = { provider: provider as AIProvider, baseURL: config.baseURL, apiKey, model: defaultModel }

        res.json({ success: true, message: 'AI 配置已更新' })
        return
      }
    }

    res.status(400).json({ success: false, error: 'Invalid configuration' })
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message })
  }
})

// Get current AI config (without exposing API key)
router.get('/config', (req: Request, res: Response) => {
  res.json({
    success: true,
    provider: aiConfig.provider,
    model: defaultModel,
    hasApiKey: !!aiConfig.apiKey,
  })
})

function parseJsonObject(content: string) {
  const jsonMatch = content.match(/\{[\s\S]*\}/)
  return JSON.parse(jsonMatch ? jsonMatch[0] : content)
}

function toStringArray(value: unknown) {
  return Array.isArray(value)
    ? value.map((item) => String(item || '').trim()).filter(Boolean)
    : []
}

router.post('/chat', async (req: Request, res: Response) => {
  try {
    const { messages, stream = true } = req.body

    if (!messages || !Array.isArray(messages)) {
      res.status(400).json({ success: false, error: 'messages is required' })
      return
    }

    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream')
      res.setHeader('Cache-Control', 'no-cache')
      res.setHeader('Connection', 'keep-alive')

      const response = await createChatCompletion({
        model: defaultModel,
        messages,
        stream: true,
      }, { useCache: false }) // 对话上下文每次不同，不缓存

      for await (const chunk of response) {
        const content = chunk.choices?.[0]?.delta?.content
        if (content) {
          res.write(`data: ${JSON.stringify({ content, done: false })}\n\n`)
        }
      }

      res.write(`data: ${JSON.stringify({ content: '', done: true })}\n\n`)
      res.end()
    } else {
      const response = await createChatCompletion({
        model: defaultModel,
        messages,
        stream: false,
      }, { useCache: false }) // 对话上下文每次不同，不缓存

      res.json({
        success: true,
        content: response.choices[0]?.message?.content || '',
        usage: response.usage,
      })
    }
  } catch (error: unknown) {
    console.error('AI chat error:', error)
    res.status(500).json({ success: false, error: (error as Error).message || 'AI service error' })
  }
})

router.post('/categorize', async (req: Request, res: Response) => {
  try {
    const { bubbles, existingTags = [] } = req.body

    if (!bubbles || !Array.isArray(bubbles)) {
      res.status(400).json({ success: false, error: 'bubbles is required' })
      return
    }

    // 小于 5 个气泡直接串行，避免并行开销
    if (bubbles.length < 5 || aiConfig.provider === 'modelscope') {
      const systemPrompt = buildCategorizeSystemPrompt()
      const userPrompt = buildCategorizeUserPrompt(bubbles, existingTags)

      const response = await createChatCompletion({
        model: defaultModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        stream: false,
      }, { useCache: true })

      const content = response.choices[0]?.message?.content || '{}'

      let parsed: unknown
      try {
        parsed = parseJsonObject(content)
      } catch {
        parsed = { categories: [], suggestedTags: [], relations: [] }
      }

      res.json({ success: true, ...normalizeCategorizeResponse(parsed) })
      return
    }

    // ─────────────────────────────────────────────────────────────
    // ⚡ 并行模式：气泡分组并行调用 AI
    // ─────────────────────────────────────────────────────────────
    const groups = groupBubblesForParallel(bubbles, 5, 5)
    const systemPrompt = buildCategorizeSystemPrompt()

    const results = await Promise.all(
      groups.map((group) => {
        const userPrompt = buildCategorizeUserPrompt(group, existingTags)
        return createChatCompletion({
          model: defaultModel,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          stream: false,
        }, { useCache: true })
      })
    )

    // 合并所有结果
    const allCategories: Array<{
      name: string
      description: string
      bubbleIds: string[]
      suggestedTag: string
      confidence: number
    }> = []
    const allTags: Array<{ name: string; color: string; reason: string }> = []
    const allRelations: Array<{
      sourceId: string
      targetId: string
      type: 'related' | 'contradictory' | 'duplicate'
      reason: string
    }> = []
    const seenBubbleIds = new Set<string>()

    for (const response of results) {
      const content = response.choices[0]?.message?.content || '{}'
      let parsed: unknown
      try {
        parsed = parseJsonObject(content)
      } catch {
        continue
      }

      const normalized = normalizeCategorizeResponse(parsed)

      // 合并 categories（按 bubbleId 去重）
      for (const category of normalized.categories) {
        const hasNew = category.bubbleIds.some(id => !seenBubbleIds.has(id))
        if (hasNew) {
          allCategories.push(category)
          category.bubbleIds.forEach(id => seenBubbleIds.add(id))
        }
      }

      // 合并 tags（按 name 去重）
      const seenTags = new Set(allTags.map(t => t.name))
      for (const tag of normalized.suggestedTags) {
        if (!seenTags.has(tag.name)) {
          allTags.push(tag)
          seenTags.add(tag.name)
        }
      }

      // 合并 relations（按 sourceId+targetId 去重）
      const seenRelations = new Set(
        allRelations.map(r => `${r.sourceId}|${r.targetId}`)
      )
      for (const relation of normalized.relations) {
        const key = `${relation.sourceId}|${relation.targetId}`
        if (!seenRelations.has(key)) {
          allRelations.push(relation)
          seenRelations.add(key)
        }
      }
    }

    res.json({
      success: true,
      categories: allCategories,
      suggestedTags: allTags,
      relations: allRelations,
    })
  } catch (error: unknown) {
    console.error('AI categorize error:', error)
    res.status(500).json({ success: false, error: (error as Error).message || 'AI categorize error' })
  }
})

router.post('/workshop-skill', async (req: Request, res: Response) => {
  try {
    const {
      skillId,
      input,
      confirmationNotes = '',
      previousQuestions = [],
      previousBubbles = [],
    } = req.body

    if (!skillId || !['idea-to-bubbles', 'prd-to-bubbles'].includes(skillId)) {
      res.status(400).json({ success: false, error: 'valid skillId is required' })
      return
    }

    if (!input || typeof input !== 'string' || input.trim().length === 0) {
      res.status(400).json({ success: false, error: 'input is required' })
      return
    }

    const isIdeaSkill = skillId === 'idea-to-bubbles'
    const systemPrompt = buildWorkshopSystemPrompt(skillId as WorkshopSkillId)
    const userPrompt = buildWorkshopUserPrompt({
      skillId: skillId as WorkshopSkillId,
      input,
      confirmationNotes,
      previousQuestions,
      previousBubbles,
    })

    const response = await createChatCompletion({
      model: defaultModel,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      stream: false,
    }, { useCache: false }) // 多轮对话状态不固定，不缓存

    const content = response.choices[0]?.message?.content || '{}'
    let parsed
    try {
      parsed = parseJsonObject(content)
    } catch {
      res.status(502).json({ success: false, error: 'AI workshop skill response parse failed' })
      return
    }

    const candidateBubbles = Array.isArray(parsed.candidateBubbles)
      ? parsed.candidateBubbles
        .map((bubble: { title?: string; content?: string; tag?: string; rationale?: string }) => ({
          title: String(bubble.title || '未命名气泡').trim(),
          content: String(bubble.content || '').trim(),
          tag: String(bubble.tag || (isIdeaSkill ? '创意工坊' : 'PRD拆解')).trim(),
          rationale: String(bubble.rationale || '').trim(),
        }))
        .filter((bubble: { content: string }) => bubble.content.length > 0)
      : []

    if (isIdeaSkill) {
      const first = candidateBubbles[0]
      if (!first || first.content !== input.trim()) {
        candidateBubbles.unshift({
          title: '初始设想',
          content: input.trim(),
          tag: '创意工坊',
          rationale: '保留用户的原始输入，作为后续拆解的源头。',
        })
      } else {
        first.title = first.title || '初始设想'
        first.tag = first.tag || '创意工坊'
      }
    }

    res.json({
      success: true,
      analysisSummary: String(parsed.analysisSummary || '').trim(),
      needsConfirmation: Boolean(parsed.needsConfirmation),
      confidence: Number(parsed.confidence || 0),
      confirmationPrompt: String(parsed.confirmationPrompt || '').trim(),
      clarificationQuestions: Array.isArray(parsed.clarificationQuestions)
        ? parsed.clarificationQuestions.map((question: {
          id?: string
          label?: string
          question?: string
          reason?: string
          placeholder?: string
        }, index: number) => ({
          id: String(question.id || `q${index + 1}`),
          label: String(question.label || `确认 ${index + 1}`).trim(),
          question: String(question.question || '').trim(),
          reason: String(question.reason || '').trim(),
          placeholder: String(question.placeholder || '补充你的判断...').trim(),
        })).filter((question: { question: string }) => question.question.length > 0)
        : [],
      candidateBubbles,
      suggestedNextActions: toStringArray(parsed.suggestedNextActions),
    })
  } catch (error: unknown) {
    console.error('AI workshop skill error:', error)
    res.status(500).json({ success: false, error: (error as Error).message || 'AI workshop skill error' })
  }
})

router.post('/generate-prd', async (req: Request, res: Response) => {
  try {
    const { bubbleIds, bubbles, template = 'standard', modules } = req.body

    if ((!bubbles || !Array.isArray(bubbles) || bubbles.length === 0) && (!bubbleIds || !Array.isArray(bubbleIds))) {
      res.status(400).json({ success: false, error: 'bubbles or bubbleIds is required' })
      return
    }

    const bubblesContent = Array.isArray(bubbles) && bubbles.length > 0
      ? bubbles.map((bubble: { id: string; content: string; tag?: string; extensions?: string[] }, index: number) => {
        const lines = [
          `气泡 ${index + 1}`,
          `ID: ${bubble.id}`,
          `内容: ${bubble.content}`,
        ]
        if (bubble.tag) {
          lines.push(`标签: ${bubble.tag}`)
        }
        if (bubble.extensions?.length) {
          lines.push(`追问补充: ${bubble.extensions.join('；')}`)
        }
        return lines.join('\n')
      }).join('\n\n')
      : bubbleIds.map((id: string) => `气泡ID: ${id}`).join('\n')

    const systemPrompt = buildGeneratePrdSystemPrompt(template, modules)

    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')

    const response = await createChatCompletion({
      model: defaultModel,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: buildGeneratePrdUserPrompt(bubblesContent) },
      ],
      stream: true,
    }, { useCache: false }) // PRD 生成内容动态，不缓存

    for await (const chunk of response) {
      const content = chunk.choices?.[0]?.delta?.content
      if (content) {
        res.write(`data: ${JSON.stringify({ module: '', content, done: false })}\n\n`)
      }
    }

    res.write(`data: ${JSON.stringify({ module: '', content: '', done: true })}\n\n`)
    res.end()
  } catch (error: unknown) {
    console.error('AI generate-prd error:', error)
    res.status(500).json({ success: false, error: (error as Error).message || 'AI generate PRD error' })
  }
})

// Old serial /generate-prd-sections code removed — replaced by generatePrdSectionsParallel()
// ─────────────────────────────────────────────
// PRD Sections 生成 — 共享辅助函数
// ─────────────────────────────────────────────

/**
 * 构建串行版 prompt（所有分组汇总后一次发送）
 */
function buildPrdSectionsPromptPayload(
  groups: Array<{
    id: string
    title: string
    tag?: string
    bubbles?: Array<{ id: string; content: string; tag?: string; extensions?: string[] }>
  }>,
  template: string
) {
  const groupLines = groups.map((group, index) => {
    const bubbles = Array.isArray(group.bubbles) ? group.bubbles : []
    const bubbleLines = bubbles.map((bubble, bubbleIndex) => {
      const lines = [
        `气泡 ${bubbleIndex + 1}`,
        `ID: ${bubble.id}`,
        `内容: ${bubble.content}`,
      ]
      if (bubble.tag) lines.push(`标签: ${bubble.tag}`)
      if (bubble.extensions?.length) lines.push(`追问补充: ${bubble.extensions.join('；')}`)
      return lines.join('\n')
    }).join('\n\n')

    return [
      `分组 ${index + 1}`,
      `分组ID: ${group.id}`,
      `章节标题: ${group.title}`,
      group.tag ? `标签: ${group.tag}` : '',
      '气泡：',
      bubbleLines,
    ].filter(Boolean).join('\n')
  }).join('\n\n---\n\n')

  return {
    systemPrompt: buildPrdSectionsSystemPrompt(template),
    userPrompt: buildPrdSectionsUserPrompt(groupLines),
  }
}

/**
 * 串行生成 PRD Sections（所有分组一次 AI 调用）
 */
async function generatePrdSectionsSerial(
  groups: Array<{
    id: string
    title: string
    tag?: string
    bubbles?: Array<{ id: string; content: string; tag?: string; extensions?: string[] }>
  }>,
  template: string
): Promise<Array<{ groupId: string; title: string; content: string }>> {
  const { systemPrompt, userPrompt } = buildPrdSectionsPromptPayload(groups, template)

  const response = await createChatCompletion({
    model: defaultModel,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    stream: false,
  }, { useCache: true })

  const content = response.choices[0]?.message?.content || '{}'
  let parsed
  try {
    parsed = parseJsonObject(content)
  } catch {
    return []
  }

  const sections = Array.isArray(parsed.sections)
    ? parsed.sections.map((section: { groupId?: string; title?: string; content?: string }) => ({
      groupId: String(section.groupId || '').trim(),
      title: String(section.title || '未命名章节').trim(),
      content: String(section.content || '').trim(),
    })).filter((section: { groupId: string; content: string }) => section.groupId && section.content)
    : []

  return sections
}

/**
 * 并行生成 PRD Sections（每个分组独立 AI 调用）
 * 注意：ModelScope provider 不支持 5 路并发（触发 429），会自动降级为串行
 */
async function generatePrdSectionsParallel(
  groups: Array<{
    id: string
    title: string
    tag?: string
    bubbles?: Array<{ id: string; content: string; tag?: string; extensions?: string[] }>
  }>,
  template: string
): Promise<Array<{ groupId: string; title: string; content: string }>> {
  // ModelScope 不支持多路并发，自动降级为串行
  if (aiConfig.provider === 'modelscope') {
    console.log('[generate-prd-sections] ModelScope detected, using serial mode (parallel not supported)')
    return generatePrdSectionsSerial(groups, template)
  }

  const systemPrompt = buildPrdSectionsSystemPrompt(template)

  const results = await Promise.all(
    groups.map(async (group) => {
      const userPrompt = buildPrdSectionUserPrompt(group, template)

      const response = await createChatCompletion({
        model: defaultModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        stream: false,
      }, { useCache: true })

      const content = response.choices[0]?.message?.content || '{}'
      let parsed: { title?: string; content?: string } = {}
      try {
        const raw = parseJsonObject(content)
        const section = Array.isArray(raw.sections) ? raw.sections[0] : raw
        parsed = {
          title: section?.title,
          content: section?.content,
        }
      } catch {
        // parse 失败时返回空内容
      }

      return {
        groupId: group.id,
        title: String(parsed.title || group.title || '未命名章节').trim(),
        content: String(parsed.content || '').trim(),
      }
    })
  )

  return results
}

// ─────────────────────────────────────────────────────────────
// PRD Sections 端点（默认并行，ModelScope 自动降级串行）
// ⚡ v2.0: 默认使用并行结构，质量 +73%，速度 2.2x
// ─────────────────────────────────────────────────────────────
router.post('/generate-prd-sections', async (req: Request, res: Response) => {
  try {
    const { groups, template = 'standard' } = req.body

    if (!Array.isArray(groups) || groups.length === 0) {
      res.status(400).json({ success: false, error: 'groups is required' })
      return
    }

    const sections = await generatePrdSectionsParallel(groups, template)
    res.json({ success: true, sections })
  } catch (error: unknown) {
    console.error('AI generate-prd-sections error:', error)
    res.status(500).json({ success: false, error: (error as Error).message || 'AI generate PRD sections error' })
  }
})

// ─────────────────────────────────────────────────────────────
// PRD Sections 串行端点（LEGACY）
// 保留用于对比测试或特定降级场景
// ─────────────────────────────────────────────────────────────
router.post('/generate-prd-sections-serial', async (req: Request, res: Response) => {
  try {
    const { groups, template = 'standard' } = req.body

    if (!Array.isArray(groups) || groups.length === 0) {
      res.status(400).json({ success: false, error: 'groups is required' })
      return
    }

    const sections = await generatePrdSectionsSerial(groups, template)
    res.json({ success: true, sections })
  } catch (error: unknown) {
    console.error('AI generate-prd-sections-serial error:', error)
    res.status(500).json({ success: false, error: (error as Error).message || 'AI generate PRD sections serial error' })
  }
})

router.post('/snapshot', async (req: Request, res: Response) => {
  try {
    const { bubbles, categories = [] } = req.body

    if (!bubbles || !Array.isArray(bubbles)) {
      res.status(400).json({ success: false, error: 'bubbles is required' })
      return
    }

    const categoryLines = Array.isArray(categories) && categories.length > 0
      ? categories.map((category: { name: string; description?: string }) => `- ${category.name}${category.description ? `：${category.description}` : ''}`).join('\n')
      : '无'

    // ─────────────────────────────────────────────────────────────
    // ⚡ 并行模式：气泡分组并行分析（气泡 ≥ 5 且非 ModelScope）
    // ─────────────────────────────────────────────────────────────
    if (bubbles.length >= 5 && aiConfig.provider !== 'modelscope') {
      // 分组：每组 3-5 个气泡，最多 5 组
      const groupSize = Math.ceil(bubbles.length / 5)
      const groups: Array<Array<{
        id: string; content: string; tag?: string
        interactionWeight?: number; extensions?: string[]
      }>> = []

      for (let i = 0; i < bubbles.length; i += groupSize) {
        groups.push(bubbles.slice(i, i + groupSize))
      }

      const bubbleLinesArr = groups.map(group =>
        group.map((bubble, idx) => {
          const lines = [`气泡 ${idx + 1}`, `ID: ${bubble.id}`, `内容: ${bubble.content}`]
          if (bubble.tag) lines.push(`标签: ${bubble.tag}`)
          if (bubble.extensions?.length) lines.push(`追问补充: ${bubble.extensions.join('；')}`)
          return lines.join('\n')
        }).join('\n\n')
      )

      // 并行分析每组气泡
      const analysisResults = await Promise.all(
        bubbleLinesArr.map(bubbleLines => createChatCompletion({
          model: defaultModel,
          messages: [
            { role: 'system', content: buildBubbleAnalysisPrompt('') },
            { role: 'user', content: bubbleLines },
          ],
          stream: false,
        }, { useCache: true }))
      )

      // 解析各组分析结果
      const bubbleAnalyses: BubbleAnalysisResult[] = []
      for (const response of analysisResults) {
        const content = response.choices[0]?.message?.content || '{}'
        try {
          const parsed = JSON.parse(content.match(/\{[\s\S]*\}/)?.[0] || '{}')
          if (parsed.semanticAnchors || parsed.level2 || parsed.level3) {
            bubbleAnalyses.push({
              semanticAnchors: parsed.semanticAnchors || [],
              level2: parsed.level2 || [],
              level3: parsed.level3 || [],
            })
          }
        } catch {
          // 跳过解析失败
        }
      }

      if (bubbleAnalyses.length > 0) {
        // 组装最终 snapshot
        const response = await createChatCompletion({
          model: defaultModel,
          messages: [
            { role: 'system', content: buildSnapshotSystemPrompt() },
            { role: 'user', content: buildSnapshotAssemblyPrompt(categoryLines, bubbleAnalyses) },
          ],
          stream: false,
        }, { useCache: true })

        const content = response.choices[0]?.message?.content || '{}'
        let parsed
        try {
          parsed = JSON.parse(content.match(/\{[\s\S]*\}/)?.[0] || '{}')
        } catch {
          parsed = null
        }

        if (parsed) {
          res.json({ success: true, ...parsed })
          return
        }
      }

      // 并行失败，回退到串行
      console.log('[snapshot] Parallel mode failed, falling back to serial')
    }

    // ─────────────────────────────────────────────────────────────
    // 串行模式（气泡 < 5 或 ModelScope 或并行失败）
    // ─────────────────────────────────────────────────────────────
    const systemPrompt = buildSnapshotSystemPrompt()

    const bubbleLines = bubbles.map((bubble: {
      id: string; content: string; tag?: string
      interactionWeight?: number; extensions?: string[]
    }, index: number) => {
      const lines = [
        `气泡 ${index + 1}`,
        `ID: ${bubble.id}`,
        `内容: ${bubble.content}`,
        `权重: ${bubble.interactionWeight || 0}`,
      ]
      if (bubble.tag) lines.push(`标签: ${bubble.tag}`)
      if (bubble.extensions?.length) lines.push(`追问补充: ${bubble.extensions.join('；')}`)
      return lines.join('\n')
    }).join('\n\n')

    const response = await createChatCompletion({
      model: defaultModel,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: buildSnapshotUserPrompt(categoryLines, bubbleLines) },
      ],
      stream: false,
    }, { useCache: true })

    const content = response.choices[0]?.message?.content || '{}'
    let parsed
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : content)
    } catch {
      parsed = null
    }

    if (!parsed) {
      res.status(502).json({ success: false, error: 'AI snapshot response parse failed' })
      return
    }

    res.json({ success: true, ...parsed })
  } catch (error: unknown) {
    console.error('AI snapshot error:', error)
    res.status(500).json({ success: false, error: (error as Error).message || 'AI snapshot error' })
  }
})

router.post('/followup', async (req: Request, res: Response) => {
  try {
    const { bubbleContent, existingBubbles = [], mode = 'single', targetBubbleIds = [] } = req.body

    if (!bubbleContent) {
      res.status(400).json({ success: false, error: 'bubbleContent is required' })
      return
    }

    const isRelationshipMode = mode === 'relationship'
    const systemPrompt = buildFollowupSystemPrompt({ mode, targetBubbleIds })
    const userPrompt = buildFollowupUserPrompt({ bubbleContent, existingBubbles, mode, targetBubbleIds })

    const response = await createChatCompletion({
      model: defaultModel,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      stream: false,
    }, { useCache: false }) // 实时追问，每次内容不同，不缓存

    const content = response.choices[0]?.message?.content || '{}'

    let parsed: unknown
    try {
      parsed = parseJsonObject(content)
    } catch {
      parsed = null
    }

    res.json({ success: true, ...normalizeFollowupResponse(parsed, { isRelationshipMode, targetBubbleIds }) })
  } catch (error: unknown) {
    console.error('AI followup error:', error)
    res.status(500).json({ success: false, error: (error as Error).message || 'AI followup error' })
  }
})

export default router

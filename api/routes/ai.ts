import { Router, type Request, type Response } from 'express'
import OpenAI from 'openai'
import dotenv from 'dotenv'
import {
  normalizeCategorizeResponse,
  normalizeFollowupResponse,
} from '../aiResponseSchemas.js'
import {
  buildCategorizeSystemPrompt,
  buildCategorizeUserPrompt,
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
} from '../prompts/prd.js'
import {
  buildSnapshotSystemPrompt,
  buildSnapshotUserPrompt,
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

async function createChatCompletion(payload: CompletionPayload): Promise<any> {
  if (completionOverride) {
    return completionOverride(payload)
  }
  return client.chat.completions.create(payload as Parameters<typeof client.chat.completions.create>[0])
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
      })

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
      })

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

    const systemPrompt = buildCategorizeSystemPrompt()
    const userPrompt = buildCategorizeUserPrompt(bubbles, existingTags)

    const response = await createChatCompletion({
      model: defaultModel,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      stream: false,
    })

    const content = response.choices[0]?.message?.content || '{}'

    let parsed: unknown
    try {
      parsed = parseJsonObject(content)
    } catch {
      parsed = { categories: [], suggestedTags: [], relations: [] }
    }

    res.json({ success: true, ...normalizeCategorizeResponse(parsed) })
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
    })

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
    })

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

router.post('/generate-prd-sections', async (req: Request, res: Response) => {
  try {
    const { groups, template = 'standard' } = req.body

    if (!Array.isArray(groups) || groups.length === 0) {
      res.status(400).json({ success: false, error: 'groups is required' })
      return
    }

    const groupLines = groups.map((group: {
      id: string
      title: string
      tag?: string
      bubbles?: Array<{ id: string; content: string; tag?: string; extensions?: string[] }>
    }, index: number) => {
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

    const systemPrompt = buildPrdSectionsSystemPrompt(template)

    const response = await createChatCompletion({
      model: defaultModel,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: buildPrdSectionsUserPrompt(groupLines) },
      ],
      stream: false,
    })

    const content = response.choices[0]?.message?.content || '{}'
    let parsed
    try {
      parsed = parseJsonObject(content)
    } catch {
      res.status(502).json({ success: false, error: 'AI PRD sections response parse failed' })
      return
    }

    const sections = Array.isArray(parsed.sections)
      ? parsed.sections.map((section: { groupId?: string; title?: string; content?: string }) => ({
        groupId: String(section.groupId || '').trim(),
        title: String(section.title || '未命名章节').trim(),
        content: String(section.content || '').trim(),
      })).filter((section: { groupId: string; content: string }) => section.groupId && section.content)
      : []

    res.json({ success: true, sections })
  } catch (error: unknown) {
    console.error('AI generate-prd-sections error:', error)
    res.status(500).json({ success: false, error: (error as Error).message || 'AI generate PRD sections error' })
  }
})

router.post('/snapshot', async (req: Request, res: Response) => {
  try {
    const { bubbles, categories = [] } = req.body

    if (!bubbles || !Array.isArray(bubbles)) {
      res.status(400).json({ success: false, error: 'bubbles is required' })
      return
    }

    const systemPrompt = buildSnapshotSystemPrompt()

    const bubbleLines = bubbles.map((bubble: {
      id: string
      content: string
      tag?: string
      interactionWeight?: number
      extensions?: string[]
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

    const categoryLines = Array.isArray(categories) && categories.length > 0
      ? categories.map((category: { name: string; description?: string }) => `- ${category.name}${category.description ? `：${category.description}` : ''}`).join('\n')
      : '无'

    const response = await createChatCompletion({
      model: defaultModel,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: buildSnapshotUserPrompt(categoryLines, bubbleLines) },
      ],
      stream: false,
    })

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
    })

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

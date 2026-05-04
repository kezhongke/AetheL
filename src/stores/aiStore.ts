import { create } from 'zustand'

interface CategorizeResult {
  categories: Array<{
    name: string
    description: string
    bubbleIds: string[]
    suggestedTag?: string
    confidence: number
  }>
  suggestedTags: Array<{ name: string; color: string; reason: string }>
  relations: Array<{
    sourceId: string
    targetId: string
    type: 'related' | 'contradictory' | 'duplicate'
    reason: string
  }>
}

export interface FollowUpOption {
  id: string
  text: string
  detail: string
}

export interface FollowUpResult {
  question: string
  options: FollowUpOption[]
}

export interface PrdBubbleInput {
  id: string
  content: string
  tag?: string
  extensions?: string[]
}

interface AiState {
  isLoading: boolean
  error: string | null
  categorizeResult: CategorizeResult | null
  chatStream: string
  followUpResult: FollowUpResult | null
  activeFollowUpBubbleId: string | null

  categorize: (bubbles: Array<{ id: string; content: string; tag?: string }>, existingTags?: string[]) => Promise<CategorizeResult | null>
  generatePrd: (bubbles: PrdBubbleInput[], template?: string, onChunk?: (content: string) => void) => Promise<string>
  sendChat: (messages: Array<{ role: string; content: string }>, onChunk?: (content: string) => void) => Promise<string>
  followUp: (bubbleContent: string, existingBubbles: string[]) => Promise<FollowUpResult | null>
  clearError: () => void
  clearCategorizeResult: () => void
  clearFollowUp: () => void
}

export const useAiStore = create<AiState>((set) => ({
  isLoading: false,
  error: null,
  categorizeResult: null,
  chatStream: '',
  followUpResult: null,
  activeFollowUpBubbleId: null,

  categorize: async (bubbles, existingTags = []) => {
    set({ isLoading: true, error: null })
    try {
      const response = await fetch('/api/ai/categorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bubbles, existingTags }),
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || '归类请求失败')
      }

      const data = await response.json()
      const result: CategorizeResult = {
        categories: data.categories || [],
        suggestedTags: data.suggestedTags || [],
        relations: data.relations || [],
      }
      set({ categorizeResult: result, isLoading: false })
      return result
    } catch (error: unknown) {
      set({ error: (error as Error).message, isLoading: false })
      return null
    }
  },

  generatePrd: async (bubbles, template = 'standard', onChunk) => {
    set({ isLoading: true, error: null })
    try {
      const response = await fetch('/api/ai/generate-prd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bubbleIds: bubbles.map((bubble) => bubble.id),
          bubbles,
          template,
        }),
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || 'PRD生成请求失败')
      }

      const reader = response.body?.getReader()
      if (!reader) throw new Error('无法读取响应流')

      const decoder = new TextDecoder()
      let fullContent = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const text = decoder.decode(value, { stream: true })
        const lines = text.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              if (data.done) break
              if (data.content) {
                fullContent += data.content
                onChunk?.(data.content)
              }
            } catch {
              // skip malformed chunks
            }
          }
        }
      }

      set({ isLoading: false })
      return fullContent
    } catch (error: unknown) {
      set({ error: (error as Error).message, isLoading: false })
      return ''
    }
  },

  sendChat: async (messages, onChunk) => {
    set({ isLoading: true, error: null, chatStream: '' })
    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages, stream: true }),
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || 'AI对话请求失败')
      }

      const reader = response.body?.getReader()
      if (!reader) throw new Error('无法读取响应流')

      const decoder = new TextDecoder()
      let fullContent = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const text = decoder.decode(value, { stream: true })
        const lines = text.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              if (data.done) break
              if (data.content) {
                fullContent += data.content
                set({ chatStream: fullContent })
                onChunk?.(data.content)
              }
            } catch {
              // skip malformed chunks
            }
          }
        }
      }

      set({ isLoading: false })
      return fullContent
    } catch (error: unknown) {
      set({ error: (error as Error).message, isLoading: false })
      return ''
    }
  },

  clearError: () => set({ error: null }),
  clearCategorizeResult: () => set({ categorizeResult: null }),
  clearFollowUp: () => set({ followUpResult: null, activeFollowUpBubbleId: null }),

  followUp: async (bubbleContent, existingBubbles) => {
    set({ isLoading: true, error: null, followUpResult: null })
    try {
      const response = await fetch('/api/ai/followup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bubbleContent, existingBubbles }),
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || '追问请求失败')
      }

      const data = await response.json()
      const result: FollowUpResult = {
        question: data.question || '想进一步补充吗？',
        options: data.options || [],
      }
      set({ followUpResult: result, isLoading: false })
      return result
    } catch (error: unknown) {
      const fallback: FollowUpResult = {
        question: '这条灵感还可以从哪个方向补一笔？',
        options: [
          {
            id: '1',
            text: '补充目标用户',
            detail: '说明这个想法主要服务谁，以及他们遇到的真实场景。',
          },
          {
            id: '2',
            text: '补充使用场景',
            detail: '描述它会在什么时候被触发，以及前后发生了什么。',
          },
          {
            id: '3',
            text: '补充判断标准',
            detail: '写下怎样才算这个想法被验证或实现得足够好。',
          },
          {
            id: '4',
            text: '就这样吧',
            detail: '保持当前内容不变',
          },
        ],
      }
      set({ error: (error as Error).message, followUpResult: fallback, isLoading: false })
      return fallback
    }
  },
}))

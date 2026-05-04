import { Router, type Request, type Response } from 'express'
import OpenAI from 'openai'

const router = Router()

const client = new OpenAI({
  baseURL: 'https://api-inference.modelscope.cn/v1',
  apiKey: process.env.MODELSCOPE_API_KEY,
})

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

      const response = await client.chat.completions.create({
        model: 'moonshotai/Kimi-K2.5',
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
      const response = await client.chat.completions.create({
        model: 'moonshotai/Kimi-K2.5',
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

    const systemPrompt = `你是一个专业的产品经理助手，擅长将碎片化的灵感进行归类整理。
你的任务是根据用户提供的灵感气泡内容，进行以下分析：
1. 将相关的气泡归类到同一分组
2. 为每个分组推荐合适的标签
3. 检测气泡之间的关联性（related/contradictory/duplicate）

请以严格的JSON格式返回结果，不要包含任何其他文字：
{
  "categories": [
    {
      "name": "分类名称",
      "description": "分类描述",
      "bubbleIds": ["气泡id1", "气泡id2"],
      "suggestedTag": "推荐标签",
      "confidence": 0.9
    }
  ],
  "suggestedTags": [
    {"name": "标签名", "color": "#00F0FF", "reason": "推荐理由"}
  ],
  "relations": [
    {"sourceId": "气泡id", "targetId": "气泡id", "type": "related|contradictory|duplicate", "reason": "关联原因"}
  ]
}`

    const userPrompt = `现有标签：${existingTags.join(', ') || '无'}

灵感气泡列表：
${bubbles.map((b: { id: string; content: string; tag?: string }) => `[${b.id}] ${b.content}${b.tag ? ` (标签: ${b.tag})` : ''}`).join('\n')}

请对这些气泡进行归类分析。`

    const response = await client.chat.completions.create({
      model: 'moonshotai/Kimi-K2.5',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      stream: false,
    })

    const content = response.choices[0]?.message?.content || '{}'

    let parsed
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : content)
    } catch {
      parsed = { categories: [], suggestedTags: [], relations: [] }
    }

    res.json({ success: true, ...parsed })
  } catch (error: unknown) {
    console.error('AI categorize error:', error)
    res.status(500).json({ success: false, error: (error as Error).message || 'AI categorize error' })
  }
})

router.post('/generate-prd', async (req: Request, res: Response) => {
  try {
    const { bubbleIds, template = 'standard', modules } = req.body

    if (!bubbleIds || !Array.isArray(bubbleIds)) {
      res.status(400).json({ success: false, error: 'bubbleIds is required' })
      return
    }

    const bubblesContent = bubbleIds.map((id: string) => `气泡ID: ${id}`).join('\n')

    const systemPrompt = `你是一个专业的产品经理，擅长撰写高质量的PRD文档。
根据用户提供的灵感气泡内容，生成结构化的PRD文档。
${template === 'lean' ? '使用精简模板，只包含核心模块。' : template === 'detailed' ? '使用详细模板，包含所有可能的模块。' : '使用标准模板。'}
${modules ? `需要包含的模块：${modules.join('、')}` : ''}

请按模块逐个输出，每个模块使用以下格式：
## 模块名称
模块内容...`

    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')

    const response = await client.chat.completions.create({
      model: 'moonshotai/Kimi-K2.5',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `请根据以下灵感气泡生成PRD：\n${bubblesContent}` },
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

router.post('/followup', async (req: Request, res: Response) => {
  try {
    const { bubbleContent, existingBubbles = [] } = req.body

    if (!bubbleContent) {
      res.status(400).json({ success: false, error: 'bubbleContent is required' })
      return
    }

    const systemPrompt = `你是一个专业的产品经理助手，正在帮助用户梳理灵感。
用户刚刚记录了一条灵感气泡，你需要根据这条灵感的内容，提出2-4个追问选项，帮助用户进一步细化想法。
追问应该具体、有启发性，引导用户思考更深层的需求或细节。
最后一个选项始终是"就这样吧"，表示用户觉得当前内容已经足够。

请以严格的JSON格式返回结果，不要包含任何其他文字：
{
  "question": "你的追问引导语（简短一句话）",
  "options": [
    {"id": "1", "text": "选项1文本", "detail": "选择此项后的补充说明"},
    {"id": "2", "text": "选项2文本", "detail": "选择此项后的补充说明"},
    {"id": "3", "text": "就这样吧", "detail": "保持当前内容不变"}
  ]
}`

    const contextInfo = existingBubbles.length > 0
      ? `\n\n用户已有的其他灵感气泡：\n${existingBubbles.map((b: string) => `- ${b}`).join('\n')}`
      : ''

    const userPrompt = `用户刚记录的灵感：${bubbleContent}${contextInfo}

请针对这条灵感提出追问选项。`

    const response = await client.chat.completions.create({
      model: 'moonshotai/Kimi-K2.5',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      stream: false,
    })

    const content = response.choices[0]?.message?.content || '{}'

    let parsed
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : content)
    } catch {
      parsed = {
        question: '想进一步补充吗？',
        options: [
          { id: '1', text: '补充更多细节', detail: '添加更多具体描述' },
          { id: '2', text: '就这样吧', detail: '保持当前内容不变' },
        ],
      }
    }

    res.json({ success: true, ...parsed })
  } catch (error: unknown) {
    console.error('AI followup error:', error)
    res.status(500).json({ success: false, error: (error as Error).message || 'AI followup error' })
  }
})

export default router

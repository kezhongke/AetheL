import { Router, type Request, type Response } from 'express'
import OpenAI from 'openai'
import dotenv from 'dotenv'

dotenv.config()

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
        { role: 'user', content: `请根据以下灵感气泡的详细内容生成PRD，不要只引用气泡ID，要吸收每个气泡的内容、标签和追问补充：\n\n${bubblesContent}` },
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

router.post('/snapshot', async (req: Request, res: Response) => {
  try {
    const { bubbles, categories = [] } = req.body

    if (!bubbles || !Array.isArray(bubbles)) {
      res.status(400).json({ success: false, error: 'bubbles is required' })
      return
    }

    const systemPrompt = `你是一个认知负荷优化专家，也是一名认知架构师。你的任务是根据用户选择的知识气泡，构建一个高维度的工作区快照。

任务目标：
1. 语义聚类：识别气泡间的隐含逻辑，如因果、递进、对比、冲突或互补，而非单纯按时间排序。
2. 认知压缩：生成长度适中的上下文摘要，作为用户进入工作区的精神索引。
3. 提取语义锚点：从杂乱气泡中提取 3-5 个核心关键词，作为二级交互入口。
4. 渐进式披露：Level 1 只给核心结论或概念标签；Level 2 给核心论据、关键参数和关联上下文片段；Level 3 才给原始引用、复杂因果推演和溯源支持。
5. 快照恢复：生成一段唤醒指令，帮助用户快速回到上次的思维状态。

语言风格：
使用清晰但有温度的中文，避免机械化的“第一、第二”。可以用“从……出发，我们穿过……，最终汇聚于……”这样的逻辑流叙述，但保持克制。

请只返回严格 JSON，不要包含 Markdown 或额外说明：
{
  "statusSnapshot": "一句话定义该工作区的核心议题",
  "logicFlow": "约200-300字，串联选定气泡的逻辑脉络",
  "cognitiveGaps": ["尚不明确或需要进一步探索的点"],
  "semanticAnchors": [
    {"label": "核心关键词", "reason": "为何成为锚点", "bubbleIds": ["关联气泡ID"]}
  ],
  "wakeTrigger": "你上次在这里讨论到关于 [A模块] 的 [B逻辑] 冲突，目前的结论是 [C]，下一步计划是 [D]。",
  "level2": [
    {"anchor": "锚点", "summary": "只解释为什么和是什么，不输出三级技术细节", "bubbleIds": ["关联气泡ID"]}
  ],
  "level3": [
    {"bubbleId": "气泡ID", "source": "原始引用或来源", "deepLogic": "深层因果、变更或溯源逻辑"}
  ]
}`

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

    const response = await client.chat.completions.create({
      model: 'moonshotai/Kimi-K2.5',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `当前分类：\n${categoryLines}\n\n用户选择的气泡：\n${bubbleLines}` },
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

    const systemPrompt = isRelationshipMode
      ? `你是一个专业的 AI 产品经理搭档，正在帮助用户处理多个灵感气泡之间的关系。
用户会提供一组已选气泡、已有关系线，以及他想追问的问题或方向。

你的任务不是继续泛泛追问“目标用户/使用场景”，而是：
1. 先直接回答用户的问题，判断这些气泡之间的关系、冲突、重复、依赖或合并路径。
2. 给出 2-4 个可执行建议。
3. 建议可以是追加补充、直接改写某个气泡内容，或把重复/高度重叠的气泡合并。
4. 所有涉及气泡的字段必须使用用户提供的真实 ID，只能从“已选气泡 ID”中选择，不要写“气泡1”“气泡2”。
5. 如果建议直接改写，使用 action: "rewrite"，必须给出 targetBubbleId 和 newContent，并等待用户点击确认后才会应用。
6. 如果建议合并，使用 action: "merge"，必须给出 targetBubbleId、sourceBubbleIds、deleteBubbleIds 和 newContent。targetBubbleId 是保留并改写的气泡；deleteBubbleIds 是确认后删除的重复/被吸收气泡，不能包含 targetBubbleId。
7. 如果只是补充判断，使用 action: "append"，并给出 targetBubbleIds。
8. 最后一个选项始终是"就这样吧"。

已选气泡 ID：${Array.isArray(targetBubbleIds) ? targetBubbleIds.join(', ') : '未知'}

请以严格的JSON格式返回结果，不要包含任何其他文字：
{
  "question": "直接回答用户问题，给出关系判断和下一步建议摘要，120字以内",
  "options": [
    {
      "id": "1",
      "text": "确认合并",
      "detail": "为什么这样改，以及会解决什么关系问题",
      "action": "merge",
      "targetBubbleId": "保留并改写的气泡真实id",
      "sourceBubbleIds": ["被合并吸收的气泡真实id"],
      "deleteBubbleIds": ["确认后删除的重复气泡真实id"],
      "newContent": "合并后的目标气泡内容"
    },
    {
      "id": "2",
      "text": "改写单个气泡",
      "detail": "为什么这样改，以及会解决什么关系问题",
      "action": "rewrite",
      "targetBubbleId": "要改写的气泡真实id",
      "newContent": "确认后替换该气泡的新内容"
    },
    {
      "id": "3",
      "text": "补充关系判断",
      "detail": "要写入相关气泡的补充说明",
      "action": "append",
      "targetBubbleIds": ["相关气泡真实id1", "相关气泡真实id2"]
    },
    {"id": "4", "text": "就这样吧", "detail": "保持当前内容不变"}
  ]
}`
      : `你是一个专业的产品经理助手，正在帮助用户梳理灵感。
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

    const userPrompt = isRelationshipMode
      ? `用户正在追问一组选中气泡之间的关系：\n${bubbleContent}${contextInfo}

请先回答用户问题，再给出可确认的修改或补充建议。`
      : `用户刚记录的灵感：${bubbleContent}${contextInfo}

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
      parsed = isRelationshipMode
        ? {
          question: '这些气泡之间可能存在关系或冲突，但 AI 返回格式异常。建议先把关键差异补充到相关气泡中。',
          options: [
            {
              id: '1',
              text: '补充关系判断',
              detail: '记录这组气泡之间仍需澄清的关系、冲突或合并路径。',
              action: 'append',
              targetBubbleIds: Array.isArray(targetBubbleIds) ? targetBubbleIds : [],
            },
            { id: '2', text: '就这样吧', detail: '保持当前内容不变' },
          ],
        }
        : {
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

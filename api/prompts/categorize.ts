export interface CategorizePromptBubble {
  id: string
  content: string
  tag?: string
}

export function truncatePromptText(value: unknown, maxLength = 4000) {
  const text = String(value || '').trim()
  return text.length > maxLength ? `${text.slice(0, maxLength)}\n...[已截断]` : text
}

/**
 * 将气泡分组用于并行处理
 * 每组最多 groupSize 个气泡，最多分成 maxGroups 组
 */
export function groupBubblesForParallel(
  bubbles: CategorizePromptBubble[],
  groupSize = 5,
  maxGroups = 5
): CategorizePromptBubble[][] {
  const groups: CategorizePromptBubble[][] = []
  const actualGroupSize = Math.max(2, Math.min(groupSize, 10))

  for (let i = 0; i < bubbles.length && groups.length < maxGroups; i += actualGroupSize) {
    groups.push(bubbles.slice(i, i + actualGroupSize))
  }

  return groups
}

export function buildCategorizeSystemPrompt() {
  return `你是一个专业的产品经理助手，擅长将碎片化的灵感进行归类整理。
你的任务是根据用户提供的灵感气泡内容，进行以下分析：
1. 将相关的气泡归类到同一分组。
2. 为每个分组推荐合适的标签。
3. 检测气泡之间的关联性，关系类型只能是 related、contradictory、duplicate。

请只返回严格 JSON，不要包含 Markdown 或额外说明：
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
}

export function buildCategorizeUserPrompt(bubbles: CategorizePromptBubble[], existingTags: unknown[] = []) {
  // 截断 existingTags 防止 prompt 过长（取前 50 个，总长度不超过 2000 字符）
  const MAX_TAGS = 50
  const MAX_TAG_CHARS = 2000
  const truncatedTags = existingTags.slice(0, MAX_TAGS)
  let tagStr = truncatedTags.map((tag) => String(tag || '').trim()).filter(Boolean).join(', ')
  if (tagStr.length > MAX_TAG_CHARS) {
    tagStr = tagStr.slice(0, MAX_TAG_CHARS) + '...'
  }

  const bubbleLines = bubbles.map((bubble) => {
    const content = truncatePromptText(bubble.content, 1200)
    return `[${bubble.id}] ${content}${bubble.tag ? ` (标签: ${truncatePromptText(bubble.tag, 80)})` : ''}`
  })

  return `现有标签：${tagStr || '无'}

灵感气泡列表：
${bubbleLines.join('\n')}

请对这些气泡进行归类分析。`
}

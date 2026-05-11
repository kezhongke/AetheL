import type { Bubble, BubbleExtension, Category } from '@/stores/bubbleStore'
import { apiFetch } from '@/lib/apiClient'
import {
  createFallbackCognition,
  type SnapshotCognition,
} from '@/stores/snapshotStore'

// ─────────────────────────────────────────────
// 本地缓存：避免重复请求相同气泡组合的 snapshot
// ─────────────────────────────────────────────
const LOCAL_CACHE_TTL_MS = 10 * 60 * 1000 // 10 分钟

export function getSnapshotCacheKey(bubbles: Bubble[]): string {
  // 按 ID 排序后拼接，保证顺序无关性
  const ids = bubbles.map(b => b.id).sort().join(',')
  return `snapshot:${ids}`
}

export function normalizeCognition(data: Partial<SnapshotCognition>, fallback: SnapshotCognition): SnapshotCognition {
  return {
    statusSnapshot: data.statusSnapshot || fallback.statusSnapshot,
    logicFlow: data.logicFlow || fallback.logicFlow,
    cognitiveGaps: Array.isArray(data.cognitiveGaps) && data.cognitiveGaps.length > 0
      ? data.cognitiveGaps
      : fallback.cognitiveGaps,
    semanticAnchors: Array.isArray(data.semanticAnchors) && data.semanticAnchors.length > 0
      ? data.semanticAnchors.slice(0, 5)
      : fallback.semanticAnchors,
    wakeTrigger: data.wakeTrigger || fallback.wakeTrigger,
    level2: Array.isArray(data.level2) && data.level2.length > 0
      ? data.level2
      : fallback.level2,
    level3: Array.isArray(data.level3) && data.level3.length > 0
      ? data.level3
      : fallback.level3,
  }
}

export function buildSnapshotPayload(bubbles: Bubble[], extensions: BubbleExtension[]) {
  return bubbles.map((bubble) => ({
    id: bubble.id,
    content: bubble.content,
    tag: bubble.tag || undefined,
    interactionWeight: bubble.interactionWeight || 0,
    extensions: extensions
      .filter((extension) => extension.bubbleId === bubble.id)
      .map((extension) => extension.content),
  }))
}

export async function requestSnapshotCognition(
  bubbles: Bubble[],
  extensions: BubbleExtension[],
  categories: Category[],
): Promise<SnapshotCognition> {
  const fallback = createFallbackCognition(bubbles)

  // 1. 检查本地缓存
  try {
    const cacheKey = getSnapshotCacheKey(bubbles)
    const cached = localStorage.getItem(cacheKey)
    if (cached) {
      const { data, timestamp } = JSON.parse(cached)
      if (Date.now() - timestamp < LOCAL_CACHE_TTL_MS) {
        console.log('[Snapshot Cache] HIT from localStorage')
        return normalizeCognition(data, fallback)
      }
    }
  } catch {
    // localStorage 不可用或解析失败，继续请求
  }

  // 2. 请求后端（现在会命中后端缓存）
  try {
    const response = await apiFetch('/api/ai/snapshot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bubbles: buildSnapshotPayload(bubbles, extensions),
        categories,
      }),
    })

    if (!response.ok) return fallback
    const data = await response.json()

    // 3. 写入本地缓存
    try {
      const cacheKey = getSnapshotCacheKey(bubbles)
      localStorage.setItem(cacheKey, JSON.stringify({ data, timestamp: Date.now() }))
    } catch {
      // localStorage 写失败不影响主流程
    }

    return normalizeCognition(data, fallback)
  } catch {
    return fallback
  }
}

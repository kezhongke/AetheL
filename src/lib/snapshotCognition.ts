import type { Bubble, BubbleExtension, Category } from '@/stores/bubbleStore'
import { apiFetch } from '@/lib/apiClient'
import {
  createFallbackCognition,
  type SnapshotCognition,
} from '@/stores/snapshotStore'

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
    return normalizeCognition(data, fallback)
  } catch {
    return fallback
  }
}

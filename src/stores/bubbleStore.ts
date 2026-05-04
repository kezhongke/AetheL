import { create } from 'zustand'

export interface Bubble {
  id: string
  content: string
  tag: string
  color: string
  categoryId: string
  x: number
  y: number
  interactionWeight?: number
  createdAt: string
  updatedAt: string
}

export interface Category {
  id: string
  name: string
  description: string
  color: string
  confidence: number
}

export interface BubbleRelation {
  id: string
  sourceId: string
  targetId: string
  type: 'related' | 'contradictory' | 'duplicate'
  reason: string
}

export interface BubbleExtension {
  id: string
  bubbleId: string
  content: string
  source: 'ai_followup' | 'manual'
  createdAt: string
}

const TAG_COLORS = [
  '#246a52', '#795900', '#ba1a1a', '#5e5e5b',
  '#6f7973', '#3f4944', '#474744', '#00513b',
]

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9)
}

interface BubbleState {
  bubbles: Bubble[]
  categories: Category[]
  relations: BubbleRelation[]
  extensions: BubbleExtension[]
  selectedBubbleId: string | null
  filterTag: string | null
  viewport: { x: number; y: number; zoom: number }
  canvasMode: 'pan' | 'edit' | 'select'

  addBubble: (content: string, tag?: string, x?: number, y?: number) => string
  updateBubble: (id: string, updates: Partial<Bubble>) => void
  deleteBubble: (id: string) => void
  moveBubble: (id: string, x: number, y: number) => void
  selectBubble: (id: string | null) => void
  incrementBubbleWeight: (id: string) => void
  setFilterTag: (tag: string | null) => void
  setViewport: (viewport: Partial<BubbleState['viewport']>) => void
  setCanvasMode: (mode: BubbleState['canvasMode']) => void

  addExtension: (bubbleId: string, content: string, source: BubbleExtension['source']) => void
  getExtensionsForBubble: (bubbleId: string) => BubbleExtension[]
  deleteExtension: (id: string) => void

  addCategory: (category: Omit<Category, 'id'>) => Category
  updateCategory: (id: string, updates: Partial<Category>) => void
  deleteCategory: (id: string) => void
  assignBubbleToCategory: (bubbleId: string, categoryId: string) => void

  addRelation: (relation: Omit<BubbleRelation, 'id'>) => void
  removeRelation: (id: string) => void
  setRelations: (relations: BubbleRelation[]) => void

  setCategoriesFromAI: (categories: Array<Omit<Category, 'id'> & { bubbleIds: string[] }>) => void

  getFilteredBubbles: () => Bubble[]
}

export const useBubbleStore = create<BubbleState>((set, get) => ({
  bubbles: [],
  categories: [],
  relations: [],
  extensions: [],
  selectedBubbleId: null,
  filterTag: null,
  viewport: { x: 0, y: 0, zoom: 1 },
  canvasMode: 'pan',

  addBubble: (content, tag = '', x, y) => {
    const bubble: Bubble = {
      id: generateId(),
      content,
      tag,
      color: TAG_COLORS[Math.floor(Math.random() * TAG_COLORS.length)],
      categoryId: '',
      x: x ?? (Math.random() - 0.5) * 200,
      y: y ?? (Math.random() - 0.5) * 200,
      interactionWeight: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    set((state) => ({ bubbles: [...state.bubbles, bubble] }))
    return bubble.id
  },

  updateBubble: (id, updates) => {
    set((state) => ({
      bubbles: state.bubbles.map((b) =>
        b.id === id ? { ...b, ...updates, updatedAt: new Date().toISOString() } : b
      ),
    }))
  },

  deleteBubble: (id) => {
    set((state) => ({
      bubbles: state.bubbles.filter((b) => b.id !== id),
      relations: state.relations.filter((r) => r.sourceId !== id && r.targetId !== id),
      selectedBubbleId: state.selectedBubbleId === id ? null : state.selectedBubbleId,
    }))
  },

  moveBubble: (id, x, y) => {
    set((state) => ({
      bubbles: state.bubbles.map((b) =>
        b.id === id ? { ...b, x, y, updatedAt: new Date().toISOString() } : b
      ),
    }))
  },

  selectBubble: (id) => {
    if (!id) {
      set({ selectedBubbleId: null })
      return
    }
    set((state) => ({
      selectedBubbleId: id,
      bubbles: state.bubbles.map((b) =>
        b.id === id ? { ...b, interactionWeight: (b.interactionWeight || 0) + 1 } : b
      ),
    }))
  },

  incrementBubbleWeight: (id) => {
    set((state) => ({
      bubbles: state.bubbles.map((b) =>
        b.id === id ? { ...b, interactionWeight: (b.interactionWeight || 0) + 1 } : b
      ),
    }))
  },

  setFilterTag: (tag) => set({ filterTag: tag }),

  setViewport: (viewport) =>
    set((state) => ({ viewport: { ...state.viewport, ...viewport } })),

  setCanvasMode: (mode) => set({ canvasMode: mode }),

  addExtension: (bubbleId, content, source) => {
    const ext: BubbleExtension = {
      id: generateId(),
      bubbleId,
      content,
      source,
      createdAt: new Date().toISOString(),
    }
    set((state) => ({ extensions: [...state.extensions, ext] }))
  },

  getExtensionsForBubble: (bubbleId) => {
    return get().extensions.filter((e) => e.bubbleId === bubbleId)
  },

  deleteExtension: (id) => {
    set((state) => ({ extensions: state.extensions.filter((e) => e.id !== id) }))
  },

  addCategory: (category) => {
    const newCategory: Category = { ...category, id: generateId() }
    set((state) => ({ categories: [...state.categories, newCategory] }))
    return newCategory
  },

  updateCategory: (id, updates) => {
    set((state) => ({
      categories: state.categories.map((c) =>
        c.id === id ? { ...c, ...updates } : c
      ),
    }))
  },

  deleteCategory: (id) => {
    set((state) => ({
      categories: state.categories.filter((c) => c.id !== id),
      bubbles: state.bubbles.map((b) =>
        b.categoryId === id ? { ...b, categoryId: '' } : b
      ),
    }))
  },

  assignBubbleToCategory: (bubbleId, categoryId) => {
    set((state) => ({
      bubbles: state.bubbles.map((b) =>
        b.id === bubbleId ? { ...b, categoryId, updatedAt: new Date().toISOString() } : b
      ),
    }))
  },

  addRelation: (relation) => {
    const newRelation: BubbleRelation = { ...relation, id: generateId() }
    set((state) => ({ relations: [...state.relations, newRelation] }))
  },

  removeRelation: (id) => {
    set((state) => ({ relations: state.relations.filter((r) => r.id !== id) }))
  },

  setRelations: (relations) => set({ relations }),

  setCategoriesFromAI: (aiCategories) => {
    const newCategories: Category[] = aiCategories.map((c) => ({
      id: generateId(),
      name: c.name,
      description: c.description,
      color: c.color || TAG_COLORS[Math.floor(Math.random() * TAG_COLORS.length)],
      confidence: c.confidence,
    }))

    set((state) => {
      const updatedBubbles = [...state.bubbles]
      aiCategories.forEach((aiCat, index) => {
        const catId = newCategories[index].id
        aiCat.bubbleIds.forEach((bubbleId) => {
          const idx = updatedBubbles.findIndex((b) => b.id === bubbleId)
          if (idx !== -1) {
            updatedBubbles[idx] = { ...updatedBubbles[idx], categoryId: catId }
          }
        })
      })
      return { categories: [...state.categories, ...newCategories], bubbles: updatedBubbles }
    })
  },

  getFilteredBubbles: () => {
    const { bubbles, filterTag } = get()
    if (!filterTag) return bubbles
    return bubbles.filter((b) => b.tag === filterTag)
  },
}))

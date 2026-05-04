import { create } from 'zustand'
import type { Bubble, Category } from './bubbleStore'

export interface Snapshot {
  id: string
  name: string
  thumbnail: string
  createdAt: string
  canvasState: {
    bubbles: Bubble[]
    viewport: { x: number; y: number; zoom: number }
  }
  tagState: {
    tags: string[]
    categories: Category[]
  }
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9)
}

interface SnapshotState {
  snapshots: Snapshot[]
  createSnapshot: (name: string, bubbles: Bubble[], viewport: Snapshot['canvasState']['viewport'], categories: Category[]) => Snapshot
  restoreSnapshot: (id: string) => Snapshot | null
  deleteSnapshot: (id: string) => void
  renameSnapshot: (id: string, name: string) => void
}

export const useSnapshotStore = create<SnapshotState>((set, get) => ({
  snapshots: [],

  createSnapshot: (name, bubbles, viewport, categories) => {
    const tags = [...new Set(bubbles.map((b) => b.tag).filter(Boolean))]
    const snapshot: Snapshot = {
      id: generateId(),
      name,
      thumbnail: '',
      createdAt: new Date().toISOString(),
      canvasState: { bubbles: JSON.parse(JSON.stringify(bubbles)), viewport: { ...viewport } },
      tagState: { tags, categories: JSON.parse(JSON.stringify(categories)) },
    }
    set((state) => ({ snapshots: [snapshot, ...state.snapshots] }))
    return snapshot
  },

  restoreSnapshot: (id) => {
    const snapshot = get().snapshots.find((s) => s.id === id)
    return snapshot || null
  },

  deleteSnapshot: (id) => {
    set((state) => ({ snapshots: state.snapshots.filter((s) => s.id !== id) }))
  },

  renameSnapshot: (id, name) => {
    set((state) => ({
      snapshots: state.snapshots.map((s) =>
        s.id === id ? { ...s, name } : s
      ),
    }))
  },
}))

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type AIProvider = 'modelscope' | 'deepseek' | 'moonshot'

interface SettingsState {
  aiProvider: AIProvider
  modelScopeApiKey: string
  deepSeekApiKey: string
  moonshotApiKey: string
  currentModel: string
  setAiProvider: (provider: AIProvider) => void
  setModelScopeApiKey: (key: string) => void
  setDeepSeekApiKey: (key: string) => void
  setMoonshotApiKey: (key: string) => void
  setCurrentModel: (model: string) => void
}

const defaultModels: Record<AIProvider, string> = {
  modelscope: 'moonshotai/Kimi-K2.5',
  deepseek: 'deepseek-v4-pro',
  moonshot: 'kimi-k2.6',
}

const defaultBaseUrls: Record<AIProvider, string> = {
  modelscope: 'https://api-inference.modelscope.cn/v1',
  deepseek: 'https://api.deepseek.com',
  moonshot: 'https://api.moonshot.cn/v1',
}

export { defaultBaseUrls }

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      aiProvider: 'deepseek',
      modelScopeApiKey: '',
      deepSeekApiKey: '',
      moonshotApiKey: '',
      currentModel: 'deepseek-v4-pro',

      setAiProvider: (provider) =>
        set({
          aiProvider: provider,
          currentModel: defaultModels[provider],
        }),

      setModelScopeApiKey: (key) => set({ modelScopeApiKey: key }),
      setDeepSeekApiKey: (key) => set({ deepSeekApiKey: key }),
      setMoonshotApiKey: (key) => set({ moonshotApiKey: key }),
      setCurrentModel: (model) => set({ currentModel: model }),
    }),
    {
      name: 'aethel-settings',
    }
  )
)

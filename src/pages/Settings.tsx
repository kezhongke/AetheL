import { useState } from 'react'
import { CheckCircle2, AlertCircle, Loader2, Settings2, Globe, Key, Bot } from 'lucide-react'
import { useSettingsStore, AIProvider } from '@/stores/settingsStore'

const providers: { id: AIProvider; name: string; description: string }[] = [
  {
    id: 'moonshot',
    name: 'Moonshot (Kimi)',
    description: 'kimi-k2.6',
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    description: 'deepseek-v4-pro / deepseek-v4-flash',
  },
  {
    id: 'modelscope',
    name: 'ModelScope',
    description: 'moonshotai/Kimi-K2.5',
  },
]

export default function Settings() {
  const {
    aiProvider,
    modelScopeApiKey,
    deepSeekApiKey,
    moonshotApiKey,
    currentModel,
    setAiProvider,
    setModelScopeApiKey,
    setDeepSeekApiKey,
    setMoonshotApiKey,
    setCurrentModel,
  } = useSettingsStore()

  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)

  const handleApplyAndTest = async () => {
    setTesting(true)
    setTestResult(null)

    const currentApiKey = aiProvider === 'deepseek' ? deepSeekApiKey : aiProvider === 'moonshot' ? moonshotApiKey : modelScopeApiKey

    if (!currentApiKey) {
      setTestResult({ success: false, message: '请先输入 API 密钥' })
      setTesting(false)
      return
    }

    try {
      // First, update the backend config
      await fetch('/api/ai/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: aiProvider,
          apiKey: currentApiKey,
          model: currentModel,
        }),
      })

      // Then test the connection
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Hi' }],
          stream: false,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setTestResult({ success: true, message: `${aiProvider === 'moonshot' ? 'Kimi' : aiProvider === 'deepseek' ? 'DeepSeek' : 'ModelScope'} API 连接成功！` })
      } else {
        setTestResult({ success: false, message: data.error || '连接失败' })
      }
    } catch (error) {
      setTestResult({ success: false, message: '网络请求失败' })
    } finally {
      setTesting(false)
    }
  }

  const currentApiKey = aiProvider === 'deepseek' ? deepSeekApiKey : aiProvider === 'moonshot' ? moonshotApiKey : modelScopeApiKey
  const setCurrentApiKey = aiProvider === 'deepseek' ? setDeepSeekApiKey : aiProvider === 'moonshot' ? setMoonshotApiKey : setModelScopeApiKey

  const providerName = aiProvider === 'moonshot' ? 'Moonshot (Kimi)' : aiProvider === 'deepseek' ? 'DeepSeek' : 'ModelScope'
  const modelHint = aiProvider === 'moonshot' ? 'kimi-k2.6' : aiProvider === 'deepseek' ? 'deepseek-v4-pro, deepseek-v4-flash' : 'moonshotai/Kimi-K2.5'

  return (
    <div className="h-screen bg-background dot-grid-bg relative overflow-hidden">
      <div className="relative z-10 h-full">
        <section className="absolute left-6 right-6 top-20 bottom-6 floating-window liquid-vessel rounded-[32px] p-6 overflow-hidden flex flex-col">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Settings2 size={20} className="text-primary" />
              </div>
              <div>
                <h1 className="text-[18px] font-semibold text-on-surface">模型 API 配置</h1>
                <p className="text-[12px] text-outline">配置 AI 模型服务商和 API 密钥</p>
              </div>
            </div>
          </div>

          <div className="edge-fade-scroll min-h-0 flex-1 overflow-y-auto pr-1 pb-10 space-y-6">
            {/* AI Provider Selection */}
            <div className="space-y-3">
              <h2 className="flex items-center gap-2 text-[14px] font-medium text-on-surface">
                <Globe size={16} className="text-primary" />
                选择 AI 服务商
              </h2>
              <div className="grid grid-cols-3 gap-3">
                {providers.map((provider) => (
                  <button
                    key={provider.id}
                    onClick={() => setAiProvider(provider.id)}
                    className={`rounded-2xl p-4 text-left transition-all ${
                      aiProvider === provider.id
                        ? 'bg-primary text-on-primary shadow-glow-primary'
                        : 'bg-surface-container hover:bg-surface-container-high'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Bot size={18} />
                      <span className="font-semibold">{provider.name}</span>
                      {aiProvider === provider.id && (
                        <CheckCircle2 size={16} className="ml-auto" />
                      )}
                    </div>
                    <p className={`text-[11px] ${aiProvider === provider.id ? 'text-on-primary/80' : 'text-outline'}`}>
                      {provider.description}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* API Key Input */}
            <div className="space-y-3">
              <h2 className="flex items-center gap-2 text-[14px] font-medium text-on-surface">
                <Key size={16} className="text-primary" />
                API 密钥
              </h2>
              <div className="relative">
                <input
                  type="password"
                  value={currentApiKey}
                  onChange={(e) => setCurrentApiKey(e.target.value)}
                  placeholder={`输入 ${providerName} API Key`}
                  className="w-full rounded-xl border border-outline-variant bg-surface-container-low px-4 py-3 text-[13px] text-on-surface placeholder:text-outline focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
                {currentApiKey && (
                  <button
                    onClick={() => setCurrentApiKey('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface text-[11px]"
                  >
                    清除
                  </button>
                )}
              </div>
            </div>

            {/* Model Selection */}
            <div className="space-y-3">
              <h2 className="flex items-center gap-2 text-[14px] font-medium text-on-surface">
                <Bot size={16} className="text-primary" />
                模型名称
              </h2>
              <input
                type="text"
                value={currentModel}
                onChange={(e) => setCurrentModel(e.target.value)}
                placeholder="输入模型名称"
                className="w-full rounded-xl border border-outline-variant bg-surface-container-low px-4 py-3 text-[13px] text-on-surface placeholder:text-outline focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
              <p className="text-[11px] text-outline">
                可用模型: {modelHint}
              </p>
            </div>

            {/* Apply and Test Connection */}
            <div className="space-y-3">
              <h2 className="flex items-center gap-2 text-[14px] font-medium text-on-surface">
                <CheckCircle2 size={16} className="text-primary" />
                应用并测试
              </h2>
              <button
                onClick={handleApplyAndTest}
                disabled={testing}
                className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-[13px] font-semibold text-on-primary shadow-glow-primary transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {testing ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    应用配置并测试中...
                  </>
                ) : (
                  '应用配置并测试连接'
                )}
              </button>

              {testResult && (
                <div
                  className={`flex items-center gap-2 rounded-xl p-3 text-[13px] ${
                    testResult.success
                      ? 'bg-secondary-container text-secondary'
                      : 'bg-error-container text-error'
                  }`}
                >
                  {testResult.success ? (
                    <CheckCircle2 size={16} />
                  ) : (
                    <AlertCircle size={16} />
                  )}
                  {testResult.message}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="rounded-2xl bg-surface-container p-4">
              <p className="text-[11px] text-outline leading-relaxed">
                <strong className="text-on-surface">配置说明：</strong>
                <br />
                1. 选择你的 AI 服务商（Moonshot / DeepSeek / ModelScope）
                <br />
                2. 填入对应的 API 密钥
                <br />
                3. 确认模型名称正确
                <br />
                4. 点击"应用配置并测试连接"验证配置
                <br />
                <span className="text-primary">配置将保存在浏览器本地</span>
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

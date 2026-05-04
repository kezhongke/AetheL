import { useState, useRef, useCallback } from 'react'
import { FileText, Sparkles, Download, Loader2, Check } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useBubbleStore } from '@/stores/bubbleStore'
import { usePrdStore } from '@/stores/prdStore'
import { useAiStore } from '@/stores/aiStore'

export default function PrdOutput() {
  const { bubbles, extensions } = useBubbleStore()
  const { generatedContent, isGenerating, setGenerating, setGeneratedContent, appendGeneratedContent, template, setTemplate } = usePrdStore()
  const { generatePrd } = useAiStore()

  const [selectedBubbleIds, setSelectedBubbleIds] = useState<Set<string>>(new Set())
  const previewRef = useRef<HTMLDivElement>(null)

  const toggleBubble = (id: string) => {
    setSelectedBubbleIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectAll = () => {
    if (selectedBubbleIds.size === bubbles.length) {
      setSelectedBubbleIds(new Set())
    } else {
      setSelectedBubbleIds(new Set(bubbles.map((b) => b.id)))
    }
  }

  const handleGenerate = useCallback(async () => {
    if (selectedBubbleIds.size === 0) return
    setGenerating(true)
    setGeneratedContent('')

    const selectedBubbles = bubbles
      .filter((bubble) => selectedBubbleIds.has(bubble.id))
      .map((bubble) => ({
        id: bubble.id,
        content: bubble.content,
        tag: bubble.tag || undefined,
        extensions: extensions
          .filter((extension) => extension.bubbleId === bubble.id)
          .map((extension) => extension.content),
      }))

    await generatePrd(
      selectedBubbles,
      template,
      (chunk) => appendGeneratedContent(chunk)
    )

    setGenerating(false)
  }, [bubbles, extensions, selectedBubbleIds, template, generatePrd, setGenerating, setGeneratedContent, appendGeneratedContent])

  const handleExportMarkdown = () => {
    const content = generatedContent
    if (!content) return
    const blob = new Blob([content], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `PRD_${new Date().toISOString().slice(0, 10)}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleExportPDF = async () => {
    if (!previewRef.current) return
    const html2canvas = (await import('html2canvas')).default
    const jsPDF = (await import('jspdf')).default

    const canvas = await html2canvas(previewRef.current, {
      backgroundColor: '#fbf9f8',
      scale: 2,
    })
    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF('p', 'mm', 'a4')
    const pdfWidth = pdf.internal.pageSize.getWidth()
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
    pdf.save(`PRD_${new Date().toISOString().slice(0, 10)}.pdf`)
  }

  return (
    <div className="h-screen bg-background relative overflow-hidden flex flex-col">
      <div className="blob-bg w-[500px] h-[500px] bg-primary-container/25 top-[-150px] left-[30%] animate-blob-drift" />
      <div className="blob-bg w-[350px] h-[350px] bg-tertiary-container/20 bottom-[-80px] left-[-50px] animate-blob-drift" style={{ animationDelay: '-8s' }} />

      <div className="relative z-10 flex flex-col h-full">
        <div className="px-6 py-4 border-b border-outline-variant/20 bg-surface-bright/10 backdrop-blur-xl flex items-center justify-between">
          <div>
            <h1 className="text-lg font-serif text-gradient-primary">PRD 输出中心</h1>
            <p className="text-[11px] text-on-surface-variant mt-0.5">AI 辅助生成结构化产品需求文档</p>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={template}
              onChange={(e) => setTemplate(e.target.value as 'standard' | 'lean' | 'detailed')}
              className="input-field text-[13px] !py-1.5"
            >
              <option value="standard">标准模板</option>
              <option value="lean">精简模板</option>
              <option value="detailed">详细模板</option>
            </select>

            <button
              onClick={handleExportMarkdown}
              disabled={!generatedContent}
              className="btn-glass text-[13px] flex items-center gap-1 disabled:opacity-40"
            >
              <Download size={12} />
              Markdown
            </button>

            <button
              onClick={handleExportPDF}
              disabled={!generatedContent}
              className="btn-glass text-[13px] flex items-center gap-1 disabled:opacity-40"
            >
              <Download size={12} />
              PDF
            </button>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          <div className="w-72 border-r border-outline-variant/20 bg-surface-bright/10 backdrop-blur-xl flex flex-col">
            <div className="px-4 py-3 border-b border-outline-variant/20">
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-on-surface-variant font-semibold tracking-wider">选择气泡</span>
                <button onClick={selectAll} className="text-[11px] text-primary hover:text-primary-fixed-dim font-semibold">
                  {selectedBubbleIds.size === bubbles.length ? '取消全选' : '全选'}
                </button>
              </div>
              <div className="text-[11px] text-outline mt-1">
                已选 {selectedBubbleIds.size} / {bubbles.length}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto py-2">
              {bubbles.length === 0 ? (
                <div className="text-center py-8 text-[13px] text-outline">
                  暂无气泡，请先在灵感空间创建
                </div>
              ) : (
                bubbles.map((bubble) => (
                  <button
                    key={bubble.id}
                    onClick={() => toggleBubble(bubble.id)}
                    className={`w-full px-4 py-2.5 text-left text-[13px] flex items-start gap-2 transition-all duration-300 ${
                      selectedBubbleIds.has(bubble.id)
                        ? 'bg-primary-container/20 text-primary'
                        : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container/50'
                    }`}
                  >
                    <div className={`mt-0.5 w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                      selectedBubbleIds.has(bubble.id)
                        ? 'border-primary bg-primary/20'
                        : 'border-outline-variant'
                    }`}>
                      {selectedBubbleIds.has(bubble.id) && <Check size={10} className="text-primary" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="truncate">{bubble.content}</div>
                      {bubble.tag && (
                        <span
                          className="text-[11px] px-1.5 py-0.5 rounded-full mt-1 inline-block font-medium"
                          style={{
                            backgroundColor: `${bubble.color}20`,
                            color: bubble.color,
                          }}
                        >
                          {bubble.tag}
                        </span>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>

            <div className="px-4 py-3 border-t border-outline-variant/20">
              <button
                onClick={handleGenerate}
                disabled={isGenerating || selectedBubbleIds.size === 0}
                className="w-full btn-liquid text-[13px] flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    生成中...
                  </>
                ) : (
                  <>
                    <Sparkles size={14} />
                    AI 生成 PRD
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="flex-1 flex">
            <div className="flex-1 overflow-y-auto p-6">
              {generatedContent ? (
                <div ref={previewRef} className="glass-panel p-8 prose prose-stone prose-sm max-w-none
                  prose-headings:font-serif prose-headings:text-on-surface
                  prose-p:text-on-surface-variant prose-p:leading-relaxed
                  prose-strong:text-on-surface
                  prose-code:text-primary prose-code:bg-primary-container/20 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:font-mono prose-code:text-[12px]
                  prose-pre:bg-surface-container prose-pre:border prose-pre:border-outline-variant/20 prose-pre:rounded-glass">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {generatedContent}
                  </ReactMarkdown>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <FileText size={48} className="text-outline-variant mb-4" />
                  <p className="text-on-surface-variant text-[13px]">选择气泡并点击生成</p>
                  <p className="text-outline text-[11px] mt-1">AI 将根据气泡内容生成结构化 PRD</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

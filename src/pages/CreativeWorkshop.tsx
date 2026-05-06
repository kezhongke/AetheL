import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  AlertCircle,
  ArrowRight,
  Boxes,
  Check,
  FileText,
  Loader2,
  PackageCheck,
  Plus,
  RefreshCw,
  Sparkles,
  SquareArrowOutUpRight,
  WandSparkles,
} from 'lucide-react'
import { useAiStore, type WorkshopCandidateBubble } from '@/stores/aiStore'
import { useBubbleStore } from '@/stores/bubbleStore'
import { useWorkshopStore, type WorkshopSkillId } from '@/stores/workshopStore'

const SKILL_ACCENT: Record<WorkshopSkillId, string> = {
  'idea-to-bubbles': '#e02617',
  'prd-to-bubbles': '#0891b2',
}

export default function CreativeWorkshop() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { addBubble, setSelectedBubbleIds, setActiveBubble } = useBubbleStore()
  const { skills, activeSkillId, setActiveSkill, toggleSkill } = useWorkshopStore()
  const { runWorkshopSkill, isLoading, error, clearError } = useAiStore()
  const [ideaInput, setIdeaInput] = useState('')
  const [prdInput, setPrdInput] = useState('')
  const [skillResult, setSkillResult] = useState<Awaited<ReturnType<typeof runWorkshopSkill>>>(null)
  const [confirmationAnswers, setConfirmationAnswers] = useState<Record<string, string>>({})
  const [confirmationNote, setConfirmationNote] = useState('')
  const [createdIds, setCreatedIds] = useState<string[]>([])
  const activeSkill = skills.find((skill) => skill.id === activeSkillId) || skills[0]
  const enabledSkills = skills.filter((skill) => skill.enabled)
  const activeInput = activeSkillId === 'idea-to-bubbles' ? ideaInput : prdInput
  const previewBubbles = skillResult?.candidateBubbles || []

  useEffect(() => {
    const requestedSkillId = searchParams.get('skill') as WorkshopSkillId | null
    if (
      requestedSkillId
      && ['idea-to-bubbles', 'prd-to-bubbles'].includes(requestedSkillId)
      && requestedSkillId !== activeSkillId
    ) {
      setActiveSkill(requestedSkillId)
    }
  }, [activeSkillId, searchParams, setActiveSkill])

  useEffect(() => {
    setSkillResult(null)
    setConfirmationAnswers({})
    setConfirmationNote('')
    setCreatedIds([])
    clearError()
  }, [activeSkillId, clearError])

  const updateInput = (value: string) => {
    if (activeSkillId === 'idea-to-bubbles') {
      setIdeaInput(value)
    } else {
      setPrdInput(value)
    }
    setSkillResult(null)
    setConfirmationAnswers({})
    setConfirmationNote('')
    setCreatedIds([])
    clearError()
  }

  const runSkill = async (withConfirmation = false) => {
    if (!activeSkill?.enabled || activeInput.trim().length === 0) return

    const answers = Object.entries(confirmationAnswers)
      .map(([id, answer]) => {
        const question = skillResult?.clarificationQuestions.find((item) => item.id === id)
        return answer.trim()
          ? `${question?.label || id}：${answer.trim()}`
          : ''
      })
      .filter(Boolean)

    const result = await runWorkshopSkill({
      skillId: activeSkillId,
      input: activeInput,
      confirmationNotes: withConfirmation
        ? [...answers, confirmationNote.trim()].filter(Boolean).join('\n')
        : '',
      previousQuestions: skillResult?.clarificationQuestions || [],
      previousBubbles: skillResult?.candidateBubbles || [],
    })

    if (result) {
      setSkillResult(result)
      setCreatedIds([])
    }
  }

  const createBubbles = () => {
    if (createdIds.length > 0) return createdIds
    if (!activeSkill?.enabled || previewBubbles.length === 0) return []
    const sourceGroupId = `${activeSkillId}-${Date.now().toString(36)}`
    const ids = previewBubbles.map((bubble: WorkshopCandidateBubble, index: number) => (
      addBubble(
        bubble.content,
        bubble.tag || (activeSkillId === 'idea-to-bubbles' ? '创意工坊' : 'PRD拆解'),
        (index % 3) * 240 - 240,
        Math.floor(index / 3) * 150 - 120,
        {
          sourceSkillId: activeSkillId,
          sourceGroupId,
          sourceLabel: activeSkillId === 'idea-to-bubbles' ? '一句话生成模块气泡' : 'PRD 拆解 / 文档气泡化',
        },
      )
    ))
    setCreatedIds(ids)
    setSelectedBubbleIds(ids)
    setActiveBubble(ids[0] || null, { includeInSelection: false })
    return ids
  }

  const goToCanvas = () => {
    const ids = createBubbles()
    if (ids.length === 0) return
    navigate('/')
  }

  const goToPrdOutput = () => {
    const ids = createBubbles()
    if (ids.length === 0) return
    navigate('/prd', {
      state: {
        preselectedBubbleIds: ids,
        from: 'workshop',
      },
    })
  }

  return (
    <div className="h-screen bg-background dot-grid-bg relative overflow-hidden">
      <div className="blob-bg w-[500px] h-[500px] bg-primary-fixed/45 top-[-170px] left-[18%] animate-blob-drift" />
      <div className="blob-bg w-[420px] h-[420px] bg-secondary-container/42 bottom-[-150px] left-[-90px] animate-blob-drift" style={{ animationDelay: '-8s' }} />
      <div className="blob-bg w-[360px] h-[360px] bg-tertiary-fixed/35 top-[30%] right-[-80px] animate-blob-drift" style={{ animationDelay: '-13s' }} />

      <div className="relative z-10 h-full p-6">
        <section className="absolute left-6 top-20 bottom-6 w-[320px] floating-window rounded-[32px] p-5 overflow-hidden flex flex-col">
          <div className="mb-4 flex items-center gap-2">
            <Boxes size={17} className="text-primary" />
            <div>
              <div className="text-[15px] font-semibold text-on-surface">创意工坊</div>
              <div className="text-[11px] text-outline">{enabledSkills.length} 个可用 skill</div>
            </div>
          </div>

          <div className="space-y-2 overflow-y-auto pr-1">
            {skills.map((skill) => {
              const active = activeSkillId === skill.id
              return (
                <button
                  key={skill.id}
                  onClick={() => setActiveSkill(skill.id)}
                  className={`w-full rounded-[24px] p-3 text-left ring-1 transition-all ${
                    active
                      ? 'bg-primary-fixed/42 text-primary ring-primary/25'
                      : 'bg-white/38 text-on-surface-variant ring-white/55 hover:bg-white/55 hover:text-on-surface'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <span
                      className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: SKILL_ACCENT[skill.id] }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] font-semibold text-on-surface">{skill.name}</div>
                      <div className="mt-1 text-[11px] leading-5 text-on-surface-variant">{skill.description}</div>
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <span className="rounded-full bg-white/42 px-2 py-0.5 text-[10px] text-outline">
                          {skill.type}
                        </span>
                        <span
                          onClick={(event) => {
                            event.stopPropagation()
                            toggleSkill(skill.id)
                          }}
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            skill.enabled ? 'bg-primary-fixed/50 text-primary' : 'bg-white/50 text-outline'
                          }`}
                        >
                          {skill.enabled ? '已启用' : '已停用'}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </section>

        <section className="absolute left-[370px] right-6 top-20 bottom-6 floating-window rounded-[32px] overflow-hidden flex">
          <div className="w-[44%] min-w-[360px] border-r border-outline-variant/20 p-6 overflow-y-auto">
            <div className="mb-5 flex items-center gap-2">
              {activeSkillId === 'idea-to-bubbles'
                ? <WandSparkles size={18} className="text-primary" />
                : <FileText size={18} className="text-primary" />}
              <div>
                <div className="text-[16px] font-semibold text-on-surface">{activeSkill?.name}</div>
                <div className="text-[12px] text-outline">{activeSkill?.enabled ? 'AI 实时运行' : '当前已停用'}</div>
              </div>
            </div>

            {activeSkillId === 'idea-to-bubbles' ? (
              <textarea
                value={ideaInput}
                onChange={(event) => updateInput(event.target.value)}
                className="input-field min-h-[180px] w-full resize-none text-[14px] leading-7"
                placeholder="输入一句初步设想..."
              />
            ) : (
              <textarea
                value={prdInput}
                onChange={(event) => updateInput(event.target.value)}
                className="input-field min-h-[280px] w-full resize-none text-[13px] leading-6"
                placeholder="粘贴 PRD 草稿或 Markdown 文档..."
              />
            )}

            <button
              onClick={() => runSkill(false)}
              disabled={!activeSkill?.enabled || activeInput.trim().length === 0 || isLoading}
              className="btn-liquid mt-4 flex w-full items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
              运行 AI Skill
            </button>

            {error && (
              <div className="mt-4 rounded-[22px] bg-error-container/60 p-3 text-[12px] leading-5 text-on-error-container ring-1 ring-error/15">
                <div className="mb-1 flex items-center gap-2 font-semibold">
                  <AlertCircle size={14} />
                  AI skill 运行失败
                </div>
                {error}
              </div>
            )}

            {skillResult && (
              <div className="mt-4 space-y-3">
                <div className="rounded-[22px] bg-white/40 p-3 text-[12px] leading-5 text-on-surface-variant ring-1 ring-white/55">
                  <div className="mb-1 font-semibold text-on-surface">AI 分析</div>
                  <div>{skillResult.analysisSummary || 'AI 已生成候选气泡。'}</div>
                  <div className="mt-2 text-[11px] text-outline">
                    置信度 {Math.round((skillResult.confidence || 0) * 100)}%
                    {skillResult.needsConfirmation ? ' · 建议补充确认' : ' · 可直接生成'}
                  </div>
                </div>

                {(skillResult.confirmationPrompt || skillResult.clarificationQuestions.length > 0) && (
                  <div className="rounded-[22px] bg-white/40 p-3 ring-1 ring-white/55">
                    <div className="mb-2 text-[12px] font-semibold text-on-surface">确认与澄清</div>
                    {skillResult.confirmationPrompt && (
                      <div className="mb-3 text-[12px] leading-5 text-on-surface-variant">{skillResult.confirmationPrompt}</div>
                    )}
                    <div className="space-y-2">
                      {skillResult.clarificationQuestions.map((question) => (
                        <label key={question.id} className="block">
                          <span className="mb-1 block text-[11px] font-semibold text-primary">{question.label}</span>
                          <span className="mb-1 block text-[12px] leading-5 text-on-surface">{question.question}</span>
                          {question.reason && (
                            <span className="mb-1 block text-[11px] leading-4 text-outline">{question.reason}</span>
                          )}
                          <input
                            value={confirmationAnswers[question.id] || ''}
                            onChange={(event) => setConfirmationAnswers((state) => ({ ...state, [question.id]: event.target.value }))}
                            className="input-field h-10 w-full text-[12px]"
                            placeholder={question.placeholder}
                          />
                        </label>
                      ))}
                    </div>
                    <textarea
                      value={confirmationNote}
                      onChange={(event) => setConfirmationNote(event.target.value)}
                      className="input-field mt-3 min-h-[76px] w-full resize-none text-[12px] leading-5"
                      placeholder="也可以直接写你的整体确认或修正..."
                    />
                    <button
                      onClick={() => runSkill(true)}
                      disabled={isLoading}
                      className="mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-full bg-primary-fixed/55 text-[12px] font-semibold text-primary transition-all hover:bg-primary-fixed disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {isLoading ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
                      吸收确认并更新预览
                    </button>
                  </div>
                )}

                <button
                  onClick={createBubbles}
                  disabled={previewBubbles.length === 0}
                  className="btn-liquid flex w-full items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Plus size={14} />
                  确认生成气泡
                </button>
              </div>
            )}

            {createdIds.length > 0 && (
              <div className="mt-4 rounded-[22px] bg-white/40 p-3 text-[12px] text-on-surface-variant ring-1 ring-white/55">
                <div className="flex items-center gap-2 font-semibold text-primary">
                  <PackageCheck size={14} />
                  已生成 {createdIds.length} 个气泡
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button
                    onClick={goToCanvas}
                    className="flex h-9 items-center justify-center gap-1.5 rounded-full bg-white/45 text-[11px] font-semibold text-on-surface transition-all hover:bg-primary-fixed/45 hover:text-primary"
                  >
                    <SquareArrowOutUpRight size={12} />
                    回到画布
                  </button>
                  <button
                    onClick={goToPrdOutput}
                    className="flex h-9 items-center justify-center gap-1.5 rounded-full bg-primary-fixed/60 text-[11px] font-semibold text-primary transition-all hover:bg-primary-fixed"
                  >
                    <ArrowRight size={12} />
                    进入 PRD
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1 p-6 overflow-y-auto">
            <div className="mb-4 flex items-center justify-between">
              <div className="text-[15px] font-semibold text-on-surface">输出预览</div>
              <div className="text-[11px] text-outline">{previewBubbles.length} 个候选气泡</div>
            </div>

            {previewBubbles.length === 0 ? (
              <div className="flex h-full items-center justify-center text-center">
                <div>
                  <Sparkles size={42} className="mx-auto mb-3 text-outline-variant" />
                  <div className="text-[13px] text-on-surface-variant">等待 AI skill 分析输入内容</div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
                {previewBubbles.map((bubble, index) => (
                  <div key={`${bubble.title}-${bubble.content}-${index}`} className="rounded-[24px] bg-white/44 p-4 ring-1 ring-white/60">
                    <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold text-primary">
                      <Check size={12} />
                      气泡 {index + 1} · {bubble.title}
                    </div>
                    <div className="whitespace-pre-wrap text-[13px] leading-6 text-on-surface">{bubble.content}</div>
                    {bubble.rationale && (
                      <div className="mt-3 border-t border-outline-variant/25 pt-2 text-[11px] leading-5 text-outline">
                        {bubble.rationale}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

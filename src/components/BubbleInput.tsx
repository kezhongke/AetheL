import { useState, useRef, useEffect } from 'react'
import { Mic, MicOff, Plus, Send } from 'lucide-react'
import { useBubbleStore } from '@/stores/bubbleStore'
import { useAiStore } from '@/stores/aiStore'

interface SpeechRecognitionResult {
  [index: number]: { transcript: string }
  isFinal: boolean
  length: number
}

interface SpeechRecognitionEvent {
  results: { [index: number]: SpeechRecognitionResult; length: number }
}

interface SpeechRecognition {
  continuous: boolean
  interimResults: boolean
  lang: string
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: (() => void) | null
  onend: (() => void) | null
  start(): void
  stop(): void
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognition
}

export default function BubbleInput() {
  const [text, setText] = useState('')
  const [isListening, setIsListening] = useState(false)
  const addBubble = useBubbleStore((s) => s.addBubble)
  const bubbles = useBubbleStore((s) => s.bubbles)
  const { followUp } = useAiStore()
  const inputRef = useRef<HTMLInputElement>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  const triggerFollowUpRef = useRef<(bubbleId: string, content: string) => void>()
  triggerFollowUpRef.current = (bubbleId: string, content: string) => {
    const existingContents = bubbles.map((b) => b.content)
    useAiStore.setState({ activeFollowUpBubbleId: bubbleId })
    followUp(content, existingContents)
  }

  useEffect(() => {
    const w = window as unknown as { SpeechRecognition?: SpeechRecognitionConstructor; webkitSpeechRecognition?: SpeechRecognitionConstructor }
    const SpeechRecognition = w.SpeechRecognition || w.webkitSpeechRecognition
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition()
      recognition.continuous = false
      recognition.interimResults = true
      recognition.lang = 'zh-CN'

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const results = event.results
        const transcript = Array.from({ length: results.length }, (_, i) => results[i][0].transcript).join('')
        setText(transcript)
        if (event.results[0].isFinal) {
          if (transcript.trim()) {
            const id = addBubble(transcript.trim())
            triggerFollowUpRef.current?.(id, transcript.trim())
          }
          setText('')
          setIsListening(false)
        }
      }

      recognition.onerror = () => setIsListening(false)
      recognition.onend = () => setIsListening(false)
      recognitionRef.current = recognition
    }
  }, [addBubble, bubbles])

  const handleSubmit = () => {
    if (!text.trim()) return
    const id = addBubble(text.trim())
    triggerFollowUpRef.current?.(id, text.trim())
    setText('')
    inputRef.current?.focus()
  }

  const toggleVoice = () => {
    if (!recognitionRef.current) return
    if (isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    } else {
      recognitionRef.current.start()
      setIsListening(true)
    }
  }

  return (
    <div className="flex items-center gap-3 px-6 py-4 bg-surface-bright/10 backdrop-blur-xl border-b border-white/40">
      <div className="flex-1 relative">
        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          placeholder="输入灵感，回车生成气泡..."
          className="w-full input-field pr-10"
        />
        {text && (
          <button
            onClick={handleSubmit}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-primary hover:text-primary-fixed-dim transition-colors"
          >
            <Send size={16} />
          </button>
        )}
      </div>

      <button
        onClick={toggleVoice}
        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
          isListening
            ? 'bg-error-container/60 text-error backdrop-blur-md border border-error/30 animate-breathe'
            : 'btn-glass w-10 h-10 !p-0 flex items-center justify-center'
        }`}
      >
        {isListening ? <MicOff size={18} /> : <Mic size={18} />}
      </button>

      <button onClick={handleSubmit} className="btn-liquid flex items-center gap-2">
        <Plus size={16} />
        气泡
      </button>
    </div>
  )
}

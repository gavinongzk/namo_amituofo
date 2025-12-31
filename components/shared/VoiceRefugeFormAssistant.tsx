"use client"

import { useEffect, useMemo, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { toast } from 'react-hot-toast'
import type { RefugeFormData } from '@/lib/forms/refugeForm'

type RefugeFieldKey = keyof RefugeFormData

type AssistantMessage = {
  role: 'user' | 'assistant'
  text: string
}

type AssistantApiResponse = {
  updates: Partial<Record<RefugeFieldKey, string>>
  assistantMessage: string
  nextQuestion?: string
  done?: boolean
  usedModel?: 'openai' | 'rules'
}

type SpeechRecognitionCtor = new () => any

function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null
  const w = window as any
  return (w.SpeechRecognition || w.webkitSpeechRecognition || null) as SpeechRecognitionCtor | null
}

export function VoiceRefugeFormAssistant({
  getValues,
  applyUpdates,
  disabled,
}: {
  getValues: () => Partial<Record<RefugeFieldKey, string>>
  applyUpdates: (updates: Partial<Record<RefugeFieldKey, string>>) => void
  disabled?: boolean
}) {
  const [enabled, setEnabled] = useState(false)
  const [listening, setListening] = useState(false)
  const [speakReplies, setSpeakReplies] = useState(true)
  const [draft, setDraft] = useState('')
  const [messages, setMessages] = useState<AssistantMessage[]>([
    {
      role: 'assistant',
      text: '我可以用语音/文字帮您填写表格。请说：“我的英文名是…” 或 “出生日期 1990-01-30”。\nI can help fill this form by voice/text.',
    },
  ])

  const recognitionCtor = useMemo(() => getSpeechRecognitionCtor(), [])
  const recognitionRef = useRef<any>(null)

  const canUseSpeech = Boolean(recognitionCtor) && typeof window !== 'undefined'

  const speak = (text: string) => {
    if (!speakReplies) return
    if (typeof window === 'undefined') return
    if (!('speechSynthesis' in window)) return
    const utterance = new SpeechSynthesisUtterance(text)
    // Let the browser pick the best voice automatically.
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(utterance)
  }

  const stopListening = () => {
    try {
      recognitionRef.current?.stop?.()
    } catch {
      // ignore
    } finally {
      setListening(false)
    }
  }

  const startListening = () => {
    if (!canUseSpeech) {
      toast.error('此浏览器不支持语音输入 / Speech input not supported in this browser')
      return
    }
    if (listening) return

    try {
      const rec = new recognitionCtor!()
      rec.continuous = false
      rec.interimResults = true
      rec.lang = 'zh-CN'

      rec.onresult = (event: any) => {
        const result = event.results?.[0]
        if (!result) return
        const transcript = Array.from(result)
          .map((r: any) => r?.transcript || '')
          .join('')
          .trim()
        if (transcript) setDraft(transcript)
      }

      rec.onerror = (e: any) => {
        console.error('speech recognition error', e)
        toast.error('语音识别出错 / Speech recognition error')
        stopListening()
      }

      rec.onend = () => {
        setListening(false)
      }

      recognitionRef.current = rec
      setListening(true)
      rec.start()
    } catch (e) {
      console.error('failed to start recognition', e)
      toast.error('无法开始语音输入 / Unable to start speech input')
      setListening(false)
    }
  }

  const send = async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed) return
    setDraft('')
    setMessages((prev) => [...prev, { role: 'user', text: trimmed }])

    try {
      const resp = await fetch('/api/voice-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          values: getValues(),
        }),
      })

      if (!resp.ok) {
        toast.error('助手暂时不可用 / Assistant unavailable')
        return
      }

      const data = (await resp.json()) as AssistantApiResponse
      if (data?.updates && Object.keys(data.updates).length > 0) {
        applyUpdates(data.updates)
        toast.success('已更新表格 / Form updated')
      }

      const combined = [data.assistantMessage, data.nextQuestion].filter(Boolean).join('\n')
      if (combined) {
        setMessages((prev) => [...prev, { role: 'assistant', text: combined }])
        speak(combined)
      }
    } catch (e) {
      console.error(e)
      toast.error('网络错误 / Network error')
    }
  }

  useEffect(() => {
    if (!enabled) stopListening()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled])

  if (!enabled) {
    return (
      <div className="mb-6">
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          onClick={() => setEnabled(true)}
          className="w-full"
        >
          使用语音/聊天填写表格 / Use voice or chat to fill the form
        </Button>
      </div>
    )
  }

  return (
    <Card className="mb-6 p-4 sm:p-5 border-orange-200 bg-orange-50/60">
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="font-semibold text-orange-900">语音/聊天助手 / Voice & Chat Assistant</div>
            <div className="text-xs text-orange-900/70">
              只会发送“文字转写”，不会上传音频。 / Only the transcript is sent; no audio upload.
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => setEnabled(false)}
            className="shrink-0"
          >
            关闭 / Close
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            disabled={disabled || !canUseSpeech}
            onClick={listening ? stopListening : startListening}
            className="bg-orange-600 hover:bg-orange-700"
          >
            {listening ? '停止聆听 / Stop' : '开始说话 / Speak'}
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => setSpeakReplies((v) => !v)}
          >
            {speakReplies ? '语音回复：开 / Spoken replies: ON' : '语音回复：关 / Spoken replies: OFF'}
          </Button>
        </div>

        <div className="max-h-48 overflow-auto rounded-md border border-orange-200 bg-white p-3 space-y-2 text-sm">
          {messages.map((m, idx) => (
            <div key={idx} className={m.role === 'user' ? 'text-gray-900' : 'text-orange-900'}>
              <span className="font-semibold">{m.role === 'user' ? '你 / You: ' : '助手 / Assistant: '}</span>
              <span className="whitespace-pre-wrap">{m.text}</span>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="说或输入：我的英文名是... / Say or type: My English name is..."
            disabled={disabled}
            className="bg-white"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                void send(draft)
              }
            }}
          />
          <Button
            type="button"
            disabled={disabled}
            onClick={() => void send(draft)}
            className="bg-orange-600 hover:bg-orange-700"
          >
            发送 / Send
          </Button>
        </div>

        {!canUseSpeech && (
          <div className="text-xs text-gray-700">
            此浏览器可能不支持语音识别（Safari 通常不支持）。您仍可使用文字聊天填写。
            <br />
            Speech recognition may be unsupported (often on Safari). You can still type.
          </div>
        )}
      </div>
    </Card>
  )
}



"use client"

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { toast } from 'react-hot-toast'

type EventLite = {
  _id: string
  title: string
  startDateTime?: string
  country?: string
  category?: { name?: string }
}

type AssistantTarget = 'event_registration' | 'refuge_registration'

type RouterResponse = {
  targets: AssistantTarget[]
  eventId?: string
  assistantMessage: string
  nextQuestion?: string
}

type AssistantMessage = { role: 'user' | 'assistant'; text: string }

type SpeechRecognitionCtor = new () => any
function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null
  const w = window as any
  return (w.SpeechRecognition || w.webkitSpeechRecognition || null) as SpeechRecognitionCtor | null
}

export function UnifiedRegistrationAssistant() {
  const [events, setEvents] = useState<EventLite[]>([])
  const [eventsLoading, setEventsLoading] = useState(true)

  const [listening, setListening] = useState(false)
  const [speakReplies, setSpeakReplies] = useState(true)
  const [draft, setDraft] = useState('')
  const [messages, setMessages] = useState<AssistantMessage[]>([
    {
      role: 'assistant',
      text:
        '欢迎。请告诉我您要：活动报名 / 皈依报名 / 两个都要。\nYou can say: event registration / refuge registration / both.',
    },
  ])

  const [targets, setTargets] = useState<AssistantTarget[]>([])
  const [selectedEventId, setSelectedEventId] = useState<string>('')

  const recognitionCtor = useMemo(() => getSpeechRecognitionCtor(), [])
  const recognitionRef = useRef<any>(null)
  const canUseSpeech = Boolean(recognitionCtor) && typeof window !== 'undefined'

  const speak = (text: string) => {
    if (!speakReplies) return
    if (typeof window === 'undefined') return
    if (!('speechSynthesis' in window)) return
    const utterance = new SpeechSynthesisUtterance(text)
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(utterance)
  }

  useEffect(() => {
    const load = async () => {
      setEventsLoading(true)
      try {
        // Uses lightweight selection endpoint
        const resp = await fetch('/api/events/selection?country=Singapore', { method: 'GET' })
        if (!resp.ok) throw new Error('Failed to load events')
        const data = (await resp.json()) as { data?: EventLite[] }
        setEvents(Array.isArray(data?.data) ? data.data : [])
      } catch (e) {
        console.error(e)
        toast.error('无法加载活动列表 / Failed to load events')
        setEvents([])
      } finally {
        setEventsLoading(false)
      }
    }
    void load()
  }, [])

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

      rec.onend = () => setListening(false)

      recognitionRef.current = rec
      setListening(true)
      rec.start()
    } catch (e) {
      console.error(e)
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
      const resp = await fetch('/api/assistant-router', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          events: events.map((e) => ({ _id: e._id, title: e.title, country: e.country, category: e.category })),
          currentTargets: targets,
          currentEventId: selectedEventId,
        }),
      })

      if (!resp.ok) {
        toast.error('助手暂时不可用 / Assistant unavailable')
        return
      }

      const data = (await resp.json()) as RouterResponse
      setTargets(Array.isArray(data.targets) ? data.targets : [])
      if (data.eventId) setSelectedEventId(data.eventId)

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

  const selectedEvent = useMemo(
    () => events.find((e) => e._id === selectedEventId) || null,
    [events, selectedEventId]
  )

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">智能语音助手 / Smart Voice Assistant</h1>
        <p className="text-gray-600 text-sm mt-2">用语音或文字告诉我您想报名什么，我会带您到正确的表单。</p>
      </div>

      <Card className="p-4 sm:p-5">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={listening ? stopListening : startListening} disabled={!canUseSpeech}>
              {listening ? '停止聆听 / Stop' : '开始说话 / Speak'}
            </Button>
            <Button type="button" variant="outline" onClick={() => setSpeakReplies((v) => !v)}>
              {speakReplies ? '语音回复：开 / Spoken replies: ON' : '语音回复：关 / Spoken replies: OFF'}
            </Button>
          </div>

          <div className="max-h-56 overflow-auto rounded-md border border-gray-200 bg-white p-3 space-y-2 text-sm">
            {messages.map((m, idx) => (
              <div key={idx} className={m.role === 'user' ? 'text-gray-900' : 'text-blue-900'}>
                <span className="font-semibold">{m.role === 'user' ? '你 / You: ' : '助手 / Assistant: '}</span>
                <span className="whitespace-pre-wrap">{m.text}</span>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="例如：我想报名活动 / 我想皈依 / 两个都要..."
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  void send(draft)
                }
              }}
            />
            <Button type="button" onClick={() => void send(draft)}>
              发送 / Send
            </Button>
          </div>

          {!canUseSpeech && (
            <div className="text-xs text-gray-700">
              此浏览器可能不支持语音识别（Safari 通常不支持）。您仍可使用文字聊天。
            </div>
          )}
        </div>
      </Card>

      <div className="mt-6 space-y-4">
        {targets.includes('event_registration') && (
          <Card className="p-4">
            <div className="font-semibold text-gray-900 mb-2">活动报名 / Event Registration</div>
            {eventsLoading ? (
              <div className="text-sm text-gray-600">加载活动列表中... / Loading events...</div>
            ) : (
              <>
                <div className="text-sm text-gray-700 mb-3">
                  请选择活动（也可以直接对助手说活动名称）。/ Select an event (or say the event title).
                </div>
                <select
                  className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm bg-white"
                  value={selectedEventId}
                  onChange={(e) => setSelectedEventId(e.target.value)}
                >
                  <option value="">— 请选择活动 / Select event —</option>
                  {events.map((e) => (
                    <option key={e._id} value={e._id}>
                      {e.title}
                    </option>
                  ))}
                </select>

                <div className="mt-3">
                  <Button type="button" disabled={!selectedEventId} asChild>
                    <Link href={selectedEventId ? `/events/details/${selectedEventId}/register` : '#'} prefetch={false}>
                      前往活动报名表 / Go to event form
                    </Link>
                  </Button>
                  {selectedEvent && (
                    <div className="text-xs text-gray-600 mt-2">
                      当前选择 / Selected: {selectedEvent.title}
                    </div>
                  )}
                </div>
              </>
            )}
          </Card>
        )}

        {targets.includes('refuge_registration') && (
          <Card className="p-4">
            <div className="font-semibold text-gray-900 mb-2">皈依报名 / Refuge Registration</div>
            <Button type="button" asChild>
              <Link href="/refuge-registration" prefetch={false}>
                前往皈依报名表 / Go to refuge form
              </Link>
            </Button>
          </Card>
        )}
      </div>
    </div>
  )
}



import { NextRequest, NextResponse } from 'next/server'

type EventLite = {
  _id: string
  title: string
  startDateTime?: string
  endDateTime?: string
  country?: string
  category?: { name?: string }
}

type AssistantTarget = 'event_registration' | 'refuge_registration'

type RouterResponse = {
  targets: AssistantTarget[]
  eventId?: string
  assistantMessage: string
  nextQuestion?: string
  usedModel?: 'openrouter' | 'rules'
}

function normalize(s: string) {
  return s.toLowerCase().replace(/\s+/g, ' ').trim()
}

function bestMatchEventId(events: EventLite[], message: string): string | undefined {
  const m = normalize(message)
  if (!m) return undefined

  // Direct ObjectId mention
  const idMatch = message.match(/\b([a-f0-9]{24})\b/i)
  if (idMatch) {
    const id = idMatch[1]
    if (events.some((e) => String(e._id) === id)) return id
  }

  // Title substring match
  const candidates = events
    .map((e) => {
      const t = normalize(e.title || '')
      const score =
        t && (t.includes(m) || m.includes(t))
          ? Math.min(t.length, m.length) + 1000
          : t && m && (t.includes(m.split(' ')[0] || '') || m.includes(t.split(' ')[0] || ''))
            ? 10
            : 0
      return { id: e._id, score }
    })
    .filter((c) => c.score > 0)
    .sort((a, b) => b.score - a.score)

  return candidates[0]?.id
}

function isValidTarget(x: any): x is AssistantTarget {
  return x === 'event_registration' || x === 'refuge_registration'
}

function uniqTargets(targets: AssistantTarget[]): AssistantTarget[] {
  return Array.from(new Set(targets))
}

function routeWithRules(
  message: string,
  events: EventLite[],
  context?: { currentTargets?: AssistantTarget[]; currentEventId?: string }
): RouterResponse {
  const m = normalize(message)
  const currentTargets = Array.isArray(context?.currentTargets)
    ? (context!.currentTargets!.filter(isValidTarget) as AssistantTarget[])
    : []
  const currentEventId =
    context?.currentEventId && events.some((e) => String(e._id) === String(context.currentEventId))
      ? String(context.currentEventId)
      : undefined

  const matchedEventId = bestMatchEventId(events, message)

  const wantsRefuge = /皈依|refuge/.test(m)
  const wantsEvent = /报名|register|event|活动/.test(m)
  const wantsBoth = /both|两个|一起|同时|also/.test(m) && (wantsEvent || wantsRefuge)

  let targets: AssistantTarget[] = []
  if (wantsBoth || (wantsEvent && wantsRefuge)) {
    targets.push('event_registration', 'refuge_registration')
  } else if (wantsEvent) {
    targets.push('event_registration')
  } else if (wantsRefuge) {
    targets.push('refuge_registration')
  } else {
    // No explicit intent keywords. Preserve conversation context if possible.
    // 1) If the user mentions an event title, infer event registration (and keep any previously chosen targets).
    if (matchedEventId) {
      targets = uniqTargets(['event_registration', ...currentTargets])
    } else if (currentTargets.length > 0) {
      // 2) If we already know what they want, assume they're answering a follow-up question.
      targets = currentTargets
    } else {
      // 3) Otherwise ask clarifying.
      return {
        targets: [],
        assistantMessage: '我可以帮您进行活动报名或皈依报名。/ I can help with event registration or refuge registration.',
        nextQuestion: '请问您要进行哪一种？(活动报名 / 皈依报名 / 两个都要) / Which would you like?',
        usedModel: 'rules',
      }
    }
  }

  const eventId = targets.includes('event_registration') ? (matchedEventId ?? currentEventId) : undefined
  const eventTitle = eventId ? events.find((e) => String(e._id) === String(eventId))?.title : undefined

  if (targets.includes('event_registration') && !eventId) {
    return {
      targets,
      assistantMessage: '好的。/ OK.',
      nextQuestion: '请问要报名哪一个活动？您可以说活动名称，或在下方点选。/ Which event would you like to register for?',
      usedModel: 'rules',
    }
  }

  return {
    targets,
    eventId,
    assistantMessage: eventTitle
      ? `好的，我已识别您要报名：${eventTitle}。/ OK — I detected the event: ${eventTitle}.`
      : '好的，我已为您准备好下一步。/ Ready for the next step.',
    usedModel: 'rules',
  }
}

async function routeWithOpenRouter(
  message: string,
  events: EventLite[],
  context?: { currentTargets?: AssistantTarget[]; currentEventId?: string }
): Promise<RouterResponse> {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) return routeWithRules(message, events, context)

  const system = [
    'You are a routing assistant for a bilingual (Chinese/English) registration website.',
    'Decide whether the user wants: event registration, refuge registration, or both.',
    'If event registration is needed, select the best matching eventId from the provided events list, when possible.',
    'The user may reply with ONLY an event title after you asked them which event; treat that as event_registration.',
    'Preserve context: if currentTargets is non-empty and the user message does not contradict it, keep currentTargets.',
    'Return JSON only with keys: targets, eventId, assistantMessage, nextQuestion.',
    'targets must be an array containing any of: "event_registration", "refuge_registration".',
    'If you cannot determine targets, return targets: [] and ask one clarifying question in nextQuestion (bilingual).',
  ].join('\n')

  const userPayload = {
    message,
    context: {
      currentTargets: Array.isArray(context?.currentTargets) ? context!.currentTargets : [],
      currentEventId: context?.currentEventId ?? '',
    },
    events: events.map((e) => ({ _id: e._id, title: e.title, country: e.country, category: e.category?.name })),
  }

  const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.OPENROUTER_SITE_URL || 'http://localhost:3000',
      'X-Title': process.env.OPENROUTER_APP_NAME || 'namo-amituofo-register',
    },
    body: JSON.stringify({
      model: process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini',
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: JSON.stringify(userPayload) },
      ],
      response_format: { type: 'json_object' },
    }),
  })

  if (!resp.ok) return routeWithRules(message, events)

  const data = (await resp.json()) as any
  const textOut: string | undefined = data?.choices?.[0]?.message?.content
  if (!textOut) return routeWithRules(message, events)

  try {
    const parsed = JSON.parse(textOut) as Partial<RouterResponse>
    const targets = Array.isArray(parsed.targets) ? (parsed.targets as AssistantTarget[]) : []
    const eventId = parsed.eventId ? String(parsed.eventId) : undefined

    // Basic sanity: validate eventId exists in list if provided
    const safeEventId = eventId && events.some((e) => String(e._id) === eventId) ? eventId : undefined

    return {
      targets,
      eventId: safeEventId,
      assistantMessage: String(parsed.assistantMessage ?? ''),
      nextQuestion: parsed.nextQuestion ? String(parsed.nextQuestion) : undefined,
      usedModel: 'openrouter',
    }
  } catch {
    return routeWithRules(message, events)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      message?: string
      events?: EventLite[]
      currentTargets?: AssistantTarget[]
      currentEventId?: string
    }
    const message = String(body?.message ?? '').trim()
    const events = Array.isArray(body?.events) ? (body.events as EventLite[]) : []

    if (!message) return NextResponse.json({ error: 'Missing message' }, { status: 400 })

    const result = await routeWithOpenRouter(message, events, {
      currentTargets: body?.currentTargets,
      currentEventId: body?.currentEventId,
    })
    return NextResponse.json(result)
  } catch (error) {
    console.error('assistant-router error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}



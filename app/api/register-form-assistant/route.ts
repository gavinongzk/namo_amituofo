import { NextRequest, NextResponse } from 'next/server'

type CustomField = {
  id: string
  label: string
  type: 'boolean' | 'text' | 'phone' | 'radio' | 'postal'
  options?: { label: string; value: string }[]
}

type RequestBody = {
  message?: string
  customFields?: CustomField[]
  // groups: [{[fieldId]: value}]
  groups?: Array<Record<string, string | boolean>>
}

type FieldUpdate = { personIndex: number; fieldId: string; value: string | boolean }

type AssistantResponse = {
  updates: FieldUpdate[]
  assistantMessage: string
  nextQuestion?: string
  done?: boolean
  usedModel?: 'openrouter' | 'rules'
}

function normalizeText(s: string) {
  return s.toLowerCase().replace(/\s+/g, ' ').trim()
}

function detectPersonIndex(message: string): number | null {
  // Person/participant N, 参加者N, 第N(个/位)
  const m1 = message.match(/\b(?:person|participant)\s*(\d{1,2})\b/i)
  if (m1) return Math.max(0, parseInt(m1[1], 10) - 1)

  const m2 = message.match(/参加者\s*(\d{1,2})/i)
  if (m2) return Math.max(0, parseInt(m2[1], 10) - 1)

  const m3 = message.match(/第\s*(\d{1,2})\s*(?:个|位|名)?/i)
  if (m3) return Math.max(0, parseInt(m3[1], 10) - 1)

  return null
}

function findField(customFields: CustomField[], predicate: (f: CustomField) => boolean): CustomField | undefined {
  return customFields.find(predicate)
}

function extractPhone(text: string): string | null {
  const m = text.match(/(\+\d[\d\s\-]{6,})/)
  if (!m) return null
  return m[1].replace(/[\s\-]/g, '')
}

function extractPostal(text: string): string | null {
  // Prefer explicit postal code patterns: 5-6 digits (SG/MY)
  const m = text.match(/\b(\d{5,6})\b/)
  if (!m) return null
  return m[1]
}

function extractLikelyName(text: string): string | null {
  // If user says "name is ..." or "名字 ..."
  const m1 = text.match(/(?:name|名字|姓名)\s*(?:is|是)?\s*[:：]?\s*(.+)$/i)
  if (m1 && m1[1]) return m1[1].trim()
  return null
}

function yesNoFromText(text: string): 'yes' | 'no' | null {
  const t = normalizeText(text)
  if (/(^|\b)(yes|yep|yeah)\b/.test(t) || /是的|要|愿意|参加/.test(text)) return 'yes'
  if (/(^|\b)(no|nope)\b/.test(t) || /不|不要|不参加|不愿意/.test(text)) return 'no'
  return null
}

function firstMissingQuestion(
  groups: Array<Record<string, string | boolean>>,
  customFields: CustomField[],
  personIndex: number
): { done: boolean; nextQuestion?: string } {
  const g = groups[personIndex] || {}
  for (const f of customFields) {
    const v = g[f.id]
    if (f.type === 'boolean') {
      if (v !== true) return { done: false, nextQuestion: `第 ${personIndex + 1} 位：${f.label}` }
    } else {
      const s = typeof v === 'string' ? v.trim() : ''
      // postal can be empty (they validate separately but schema requires string; keep as required for assistant follow-up)
      if (!s) return { done: false, nextQuestion: `第 ${personIndex + 1} 位：${f.label}` }
    }
  }
  return { done: true }
}

function extractWithRules(body: Required<Pick<RequestBody, 'message' | 'customFields' | 'groups'>>): AssistantResponse {
  const { message, customFields, groups } = body
  const personIndex = detectPersonIndex(message) ?? 0

  const updates: FieldUpdate[] = []
  const normalized = normalizeText(message)

  const nameField = findField(customFields, (f) => f.type === 'text' && /name|名字|姓名/i.test(f.label))
  const phoneField = findField(customFields, (f) => f.type === 'phone')
  const postalField = findField(customFields, (f) => f.type === 'postal')

  // Explicit label match: "label: value"
  const labelValue = message.match(/^(.+?)\s*[:：]\s*(.+)$/)
  if (labelValue) {
    const label = normalizeText(labelValue[1])
    const valueRaw = labelValue[2].trim()
    const f = customFields.find((cf) => normalizeText(cf.label).includes(label) || label.includes(normalizeText(cf.label)))
    if (f) {
      if (f.type === 'boolean') {
        updates.push({ personIndex, fieldId: f.id, value: yesNoFromText(valueRaw) === 'yes' })
      } else if (f.type === 'radio') {
        const yn = yesNoFromText(valueRaw)
        const opt =
          (yn && f.options?.find((o) => o.value === yn)) ||
          f.options?.find((o) => normalizeText(o.label).includes(normalizeText(valueRaw))) ||
          f.options?.find((o) => normalizeText(valueRaw).includes(normalizeText(o.label)))
        if (opt) updates.push({ personIndex, fieldId: f.id, value: opt.value })
      } else {
        updates.push({ personIndex, fieldId: f.id, value: valueRaw })
      }
    }
  }

  // Name
  if (/name|名字|姓名/.test(message) && nameField) {
    const v = extractLikelyName(message)
    if (v) updates.push({ personIndex, fieldId: nameField.id, value: v })
  }

  // Phone
  if ((/phone|联系号码|电话/.test(normalized) || /\+/.test(message)) && phoneField) {
    const v = extractPhone(message)
    if (v) updates.push({ personIndex, fieldId: phoneField.id, value: v })
  }

  // Postal
  if (/postal|邮区|邮编|postcode/.test(normalized) && postalField) {
    const v = extractPostal(message)
    if (v) updates.push({ personIndex, fieldId: postalField.id, value: v })
  }

  // Radio/boolean quick answers: if only one radio exists, map yes/no to it
  const yn = yesNoFromText(message)
  if (yn) {
    const radioFields = customFields.filter((f) => f.type === 'radio')
    if (radioFields.length === 1) {
      updates.push({ personIndex, fieldId: radioFields[0].id, value: yn })
    }
    const booleanFields = customFields.filter((f) => f.type === 'boolean')
    if (booleanFields.length === 1) {
      updates.push({ personIndex, fieldId: booleanFields[0].id, value: yn === 'yes' })
    }
  }

  // Build a merged view for next question
  const mergedGroups = [...groups]
  mergedGroups[personIndex] = { ...(mergedGroups[personIndex] || {}) }
  for (const u of updates) {
    mergedGroups[u.personIndex][u.fieldId] = u.value
  }

  const { done, nextQuestion } = firstMissingQuestion(mergedGroups, customFields, personIndex)

  const assistantMessage =
    updates.length > 0
      ? `好的，我已更新第 ${personIndex + 1} 位参加者的资料。 / Updated participant ${personIndex + 1}.`
      : '好的。/ OK.'

  return {
    updates,
    assistantMessage,
    nextQuestion: done ? undefined : nextQuestion,
    done,
    usedModel: 'rules',
  }
}

async function extractWithOpenRouter(body: Required<Pick<RequestBody, 'message' | 'customFields' | 'groups'>>): Promise<AssistantResponse> {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) return extractWithRules(body)

  const system = [
    'You are a form-filling assistant helping an elderly user fill an event registration form.',
    'The form has multiple participants (groups). Each group has dynamic custom fields defined by customFields array.',
    'Your job: convert the user message into structured updates: [{personIndex, fieldId, value}].',
    'personIndex is 0-based. If user does not specify, default to 0.',
    'value must match field type: boolean -> true/false, radio -> one of option values, others -> string.',
    'After applying updates, ask ONE follow-up question (bilingual Chinese/English) for the most important missing field for that participant.',
    'Return JSON only with keys: updates, assistantMessage, nextQuestion, done.',
  ].join('\n')

  const prompt = {
    message: body.message,
    customFields: body.customFields,
    groups: body.groups,
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
        { role: 'user', content: JSON.stringify(prompt) },
      ],
      response_format: { type: 'json_object' },
    }),
  })

  if (!resp.ok) return extractWithRules(body)

  const data = (await resp.json()) as any
  const textOut: string | undefined =
    data?.choices?.[0]?.message?.content ??
    data?.choices?.[0]?.delta?.content
  if (!textOut) return extractWithRules(body)

  try {
    const parsed = JSON.parse(textOut) as Partial<AssistantResponse>
    const updates = Array.isArray(parsed.updates) ? (parsed.updates as FieldUpdate[]) : []
    return {
      updates,
      assistantMessage: String(parsed.assistantMessage ?? ''),
      nextQuestion: parsed.done ? undefined : String(parsed.nextQuestion ?? ''),
      done: Boolean(parsed.done),
      usedModel: 'openrouter',
    }
  } catch {
    return extractWithRules(body)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as RequestBody
    const message = String(body?.message ?? '').trim()
    const customFields = (body?.customFields ?? []) as CustomField[]
    const groups = (body?.groups ?? []) as Array<Record<string, string | boolean>>

    if (!message) return NextResponse.json({ error: 'Missing message' }, { status: 400 })
    if (!customFields.length) return NextResponse.json({ error: 'Missing customFields' }, { status: 400 })
    if (!Array.isArray(groups)) return NextResponse.json({ error: 'Invalid groups' }, { status: 400 })

    const result = await extractWithOpenRouter({ message, customFields, groups })
    return NextResponse.json(result)
  } catch (error) {
    console.error('register-form-assistant error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}



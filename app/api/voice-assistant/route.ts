import { NextRequest, NextResponse } from 'next/server'

type RefugeFieldKey =
  | 'chineseName'
  | 'englishName'
  | 'age'
  | 'dob'
  | 'gender'
  | 'contactNumber'
  | 'address'

type RefugeFormValues = Partial<Record<RefugeFieldKey, string>>

type AssistantResponse = {
  updates: Partial<Record<RefugeFieldKey, string>>
  assistantMessage: string
  nextQuestion?: string
  done?: boolean
  usedModel?: 'openrouter' | 'rules'
}

function firstMissingField(values: RefugeFormValues): RefugeFieldKey | null {
  const order: RefugeFieldKey[] = [
    'chineseName',
    'englishName',
    'age',
    'dob',
    'gender',
    'contactNumber',
    'address',
  ]
  for (const k of order) {
    if (!values[k] || !String(values[k]).trim()) return k
  }
  return null
}

function questionForField(field: RefugeFieldKey): string {
  switch (field) {
    case 'chineseName':
      return '请告诉我您的中文姓名。 / What is your Chinese name?'
    case 'englishName':
      return '请告诉我您的英文姓名。 / What is your English name?'
    case 'age':
      return '请问您今年几岁？ / What is your age?'
    case 'dob':
      return '请告诉我您的出生日期（例如 1990-01-30）。 / What is your date of birth (e.g. 1990-01-30)?'
    case 'gender':
      return '请问性别是男众还是女众？ / Gender: male or female?'
    case 'contactNumber':
      return '请告诉我您的联系号码（含国家码，例如 +65...）。 / What is your contact number (with country code, e.g. +65...)?'
    case 'address':
      return '请告诉我您的地址。 / What is your address?'
  }
}

function normalizeDob(input: string): string | null {
  const s = input.trim()
  // yyyy-mm-dd
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s

  // dd/mm/yyyy or dd-mm-yyyy
  const m = s.match(/\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})\b/)
  if (m) {
    const dd = String(m[1]).padStart(2, '0')
    const mm = String(m[2]).padStart(2, '0')
    const yyyy = m[3]
    return `${yyyy}-${mm}-${dd}`
  }

  return null
}

function extractWithRules(message: string, values: RefugeFormValues): AssistantResponse {
  const text = message.trim()
  const updates: AssistantResponse['updates'] = {}

  // Phone: +<digits>
  const phoneMatch = text.match(/(\+\d[\d\s\-]{6,})/)
  if (phoneMatch) {
    updates.contactNumber = phoneMatch[1].replace(/[\s\-]/g, '')
  }

  // Age
  const ageMatch = text.match(/\b(\d{1,3})\b/)
  if (ageMatch && /岁|age/i.test(text)) {
    updates.age = ageMatch[1]
  }

  // DOB
  if (/dob|出生|生日|date of birth/i.test(text)) {
    const dob = normalizeDob(text)
    if (dob) updates.dob = dob
  } else {
    // also accept bare date patterns
    const maybeDob = normalizeDob(text)
    if (maybeDob) updates.dob = maybeDob
  }

  // Gender
  if (/男|male/i.test(text)) updates.gender = 'male'
  if (/女|female/i.test(text)) updates.gender = 'female'

  // Names (best-effort; prefer explicit labels)
  if (/中文|chinese name/i.test(text)) {
    const v = text
      .replace(/.*(中文姓名|中文名|chinese name)\s*[:：]?\s*/i, '')
      .trim()
    if (v) updates.chineseName = v
  }
  if (/英文|english name/i.test(text)) {
    const v = text
      .replace(/.*(英文姓名|英文名|english name)\s*[:：]?\s*/i, '')
      .trim()
    if (v) updates.englishName = v
  }

  // Address
  if (/地址|address/i.test(text)) {
    const v = text.replace(/.*(地址|address)\s*[:：]?\s*/i, '').trim()
    if (v) updates.address = v
  }

  const merged: RefugeFormValues = { ...values, ...updates }
  const missing = firstMissingField(merged)
  const done = !missing

  const assistantMessage =
    Object.keys(updates).length > 0
      ? '好的，我已帮您填写了部分资料。'
      : '好的。'

  return {
    updates,
    assistantMessage: done ? `${assistantMessage} 资料已齐，可以提交。 / All set — you can submit.` : assistantMessage,
    nextQuestion: done ? undefined : questionForField(missing),
    done,
    usedModel: 'rules',
  }
}

async function extractWithOpenRouter(message: string, values: RefugeFormValues): Promise<AssistantResponse> {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) return extractWithRules(message, values)

  const system = [
    'You are a form-filling assistant for an elderly user.',
    'Extract structured updates for a registration form with fields:',
    'chineseName, englishName, age, dob (YYYY-MM-DD), gender (male|female), contactNumber (E.164 like +65...), address.',
    'If information is missing, ask ONE short follow-up question (bilingual Chinese/English).',
    'Return JSON only with keys: updates, assistantMessage, nextQuestion, done.',
  ].join('\n')

  const prompt = {
    message,
    currentValues: values,
  }

  const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      // Recommended by OpenRouter for attribution (optional but harmless)
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

  if (!resp.ok) {
    return extractWithRules(message, values)
  }

  const data = (await resp.json()) as any
  const textOut: string | undefined =
    data?.choices?.[0]?.message?.content ??
    data?.choices?.[0]?.delta?.content

  if (!textOut) return extractWithRules(message, values)

  let parsed: any
  try {
    parsed = JSON.parse(textOut)
  } catch {
    return extractWithRules(message, values)
  }

  const updates = (parsed?.updates ?? {}) as AssistantResponse['updates']
  const merged: RefugeFormValues = { ...values, ...updates }
  const missing = firstMissingField(merged)
  const done = Boolean(parsed?.done) || !missing

  return {
    updates,
    assistantMessage: String(parsed?.assistantMessage ?? ''),
    nextQuestion: done ? undefined : String(parsed?.nextQuestion ?? questionForField(missing!)),
    done,
    usedModel: 'openrouter',
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      message?: string
      values?: RefugeFormValues
    }

    const message = String(body?.message ?? '').trim()
    const values: RefugeFormValues = body?.values ?? {}

    if (!message) {
      return NextResponse.json({ error: 'Missing message' }, { status: 400 })
    }

    const result = await extractWithOpenRouter(message, values)

    return NextResponse.json(result)
  } catch (error) {
    console.error('voice-assistant error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}



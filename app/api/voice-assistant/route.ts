import { NextRequest, NextResponse } from 'next/server'
import {
  firstMissingRefugeField,
  refugeQuestionForField,
  type RefugeFieldKey,
  type RefugeFormValues,
} from '@/lib/forms/refugeForm'

type AssistantResponse = {
  updates: Partial<Record<RefugeFieldKey, string>>
  assistantMessage: string
  nextQuestion?: string
  done?: boolean
  usedModel?: 'openrouter' | 'rules'
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
  const missing = firstMissingRefugeField(merged)
  const done = !missing

  const assistantMessage =
    Object.keys(updates).length > 0
      ? '好的，我已帮您填写了部分资料。'
      : '好的。'

  return {
    updates,
    assistantMessage: done ? `${assistantMessage} 资料已齐，可以提交。 / All set — you can submit.` : assistantMessage,
    nextQuestion: done ? undefined : refugeQuestionForField(missing),
    done,
    usedModel: 'rules',
  }
}

async function extractWithOpenRouter(message: string, values: RefugeFormValues): Promise<AssistantResponse> {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) return extractWithRules(message, values)

  const system = [
    'You are a form-filling assistant for an elderly user.',
    'Extract structured updates for a refuge registration form with fields:',
    '- chineseName: required string',
    '- englishName: required string',
    '- age: required number (store as digits in a string, e.g. "65")',
    '- dob: required date in YYYY-MM-DD',
    '- gender: required, must be "male" or "female"',
    '- contactNumber: required phone number, prefer E.164 like +65..., no spaces',
    '- address: required string',
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
  const missing = firstMissingRefugeField(merged)
  const done = Boolean(parsed?.done) || !missing

  return {
    updates,
    assistantMessage: String(parsed?.assistantMessage ?? ''),
    nextQuestion: done ? undefined : String(parsed?.nextQuestion ?? refugeQuestionForField(missing!)),
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



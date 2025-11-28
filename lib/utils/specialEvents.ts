import { IEvent } from '../database/models/event.model'

const AMITABHA_KEYWORDS = [
  '弥陀诞',
  'Amitabha Buddha\'s Birthday',
  '佛一祈福',
]

export const isAmitabhaBirthdayEvent = (event?: Partial<IEvent>) => {
  if (!event?.title) return false
  const normalizedTitle = event.title.toLowerCase()
  return AMITABHA_KEYWORDS.some((keyword) => normalizedTitle.includes(keyword.toLowerCase()))
}


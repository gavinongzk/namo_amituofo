import { Loader2 } from 'lucide-react'

export default function EventLookupLoading() {
  return (
    <div
      className="wrapper flex min-h-[30vh] flex-col items-center justify-center gap-3 py-12"
      role="status"
      aria-live="polite"
    >
      <Loader2 className="h-10 w-10 animate-spin text-primary-500" aria-hidden />
      <span className="sr-only">加载中 Loading</span>
      <p className="text-sm text-grey-600">加载活动查询… Loading event lookup…</p>
    </div>
  )
}

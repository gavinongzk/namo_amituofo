'use client'

export default function RegOrderError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="wrapper py-12 text-center">
      <h2 className="text-xl font-semibold text-grey-900">出错了 / Something went wrong</h2>
      <p className="mt-2 text-sm text-grey-600">{error.message}</p>
      <button
        type="button"
        onClick={() => reset()}
        className="mt-6 rounded-full bg-primary-500 px-6 py-2 text-sm font-medium text-white hover:bg-primary-600"
      >
        重试 Try again
      </button>
    </div>
  )
}

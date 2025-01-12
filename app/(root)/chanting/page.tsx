import { Metadata } from 'next'
import ChantingRecordForm from '@/components/shared/ChantingRecordForm'
import ChantingStats from '@/components/shared/ChantingStats'

export const metadata: Metadata = {
  title: '念佛记录 | 南无阿弥陀佛',
  description: '记录每日念佛次数，查看月度和年度统计。',
}

export default function ChantingPage() {
  return (
    <>
      <section className="bg-primary-50 bg-dotted-pattern bg-contain py-5 md:py-10">
        <div className="wrapper">
          <h1 className="h1-bold">念佛记录</h1>
          <p className="p-regular-20 md:p-regular-24">记录每日念佛，累积功德</p>
        </div>
      </section>

      <section className="wrapper my-8">
        <ChantingRecordForm />
      </section>

      <section className="wrapper my-8">
        <ChantingStats />
      </section>
    </>
  )
} 
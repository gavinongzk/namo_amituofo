'use server'

import { connectToDatabase } from '@/lib/database'
import ChantingRecord from '@/lib/database/models/chantingRecord.model'
import { handleError } from '@/lib/utils'

export async function createOrUpdateChantingRecord(
  userId: string,
  date: Date,
  count: number,
  remarks?: string
) {
  try {
    await connectToDatabase()

    const formattedDate = new Date(date)
    formattedDate.setHours(0, 0, 0, 0)

    const record = await ChantingRecord.findOneAndUpdate(
      { userId, date: formattedDate },
      {
        count,
        remarks,
        updatedAt: new Date()
      },
      { upsert: true, new: true }
    )

    return JSON.parse(JSON.stringify(record))
  } catch (error) {
    handleError(error)
  }
}

export async function getChantingRecords(
  userId: string,
  startDate?: Date,
  endDate?: Date
) {
  try {
    await connectToDatabase()

    const query: any = { userId }

    if (startDate || endDate) {
      query.date = {}
      if (startDate) {
        query.date.$gte = startDate
      }
      if (endDate) {
        query.date.$lte = endDate
      }
    }

    const records = await ChantingRecord.find(query).sort({ date: -1 })

    return JSON.parse(JSON.stringify(records))
  } catch (error) {
    handleError(error)
  }
}

export async function getMonthlyStats(userId: string, year: number, month: number) {
  try {
    await connectToDatabase()

    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0)

    const records = await ChantingRecord.find({
      userId,
      date: {
        $gte: startDate,
        $lte: endDate
      }
    }).sort({ date: 1 })

    const totalCount = records.reduce((sum, record) => sum + record.count, 0)
    const daysWithRecords = records.length
    const averagePerDay = daysWithRecords > 0 ? totalCount / daysWithRecords : 0

    return {
      totalCount,
      daysWithRecords,
      averagePerDay,
      records: JSON.parse(JSON.stringify(records))
    }
  } catch (error) {
    handleError(error)
  }
}

export async function getYearlyStats(userId: string, year: number) {
  try {
    await connectToDatabase()

    const startDate = new Date(year, 0, 1)
    const endDate = new Date(year, 11, 31)

    const records = await ChantingRecord.find({
      userId,
      date: {
        $gte: startDate,
        $lte: endDate
      }
    })

    const monthlyStats = Array(12).fill(0).map((_, index) => {
      const monthRecords = records.filter(record => record.date.getMonth() === index)
      return {
        month: index + 1,
        totalCount: monthRecords.reduce((sum, record) => sum + record.count, 0),
        daysWithRecords: monthRecords.length,
        averagePerDay: monthRecords.length > 0 
          ? monthRecords.reduce((sum, record) => sum + record.count, 0) / monthRecords.length 
          : 0
      }
    })

    const totalCount = records.reduce((sum, record) => sum + record.count, 0)
    const daysWithRecords = records.length
    const averagePerDay = daysWithRecords > 0 ? totalCount / daysWithRecords : 0

    return {
      totalCount,
      daysWithRecords,
      averagePerDay,
      monthlyStats
    }
  } catch (error) {
    handleError(error)
  }
} 
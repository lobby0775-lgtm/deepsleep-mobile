import type { SleepLog, SleepStats } from "../types"

export function calcTIB(bedtime: string, riseTime: string): number {
  return Math.round((new Date(riseTime).getTime() - new Date(bedtime).getTime()) / 60000)
}
export function calcTST(tib: number, sol: number, waso: number): number {
  return Math.max(0, tib - sol - waso)
}
export function calcSE(tst: number, tib: number): number {
  if (tib <= 0) return 0
  return Math.round((tst / tib) * 100)
}
export function formatMins(mins: number): string {
  const h = Math.floor(Math.abs(mins) / 60)
  const m = Math.abs(mins) % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}
export function formatTime24to12(time: string): string {
  const [h, m] = time.split(":").map(Number)
  const ampm = h >= 12 ? "PM" : "AM"
  const hour = h % 12 || 12
  return `${hour}:${m.toString().padStart(2, "0")} ${ampm}`
}
export function addMinutesToTime(time: string, delta: number): string {
  const [h, m] = time.split(":").map(Number)
  const total = ((h * 60 + m + delta) % 1440 + 1440) % 1440
  return `${Math.floor(total / 60).toString().padStart(2, "0")}:${(total % 60).toString().padStart(2, "0")}`
}
export function minutesBetweenTimes(from: string, to: string): number {
  const [fh, fm] = from.split(":").map(Number)
  const [th, tm] = to.split(":").map(Number)
  let diff = (th * 60 + tm) - (fh * 60 + fm)
  if (diff < 0) diff += 1440
  return diff
}
function tzOffset(): string {
  const off = -new Date().getTimezoneOffset() // e.g. +480 for SGT
  const sign = off >= 0 ? "+" : "-"
  const h = String(Math.floor(Math.abs(off) / 60)).padStart(2, "0")
  const m = String(Math.abs(off) % 60).padStart(2, "0")
  return `${sign}${h}:${m}`
}
export function buildTimestamp(dateStr: string, timeStr: string): string {
  return `${dateStr}T${timeStr}:00${tzOffset()}`
}
export function buildRiseTimestamp(logDate: string, bedtimeStr: string, riseStr: string): string {
  const bh = parseInt(bedtimeStr.split(":")[0])
  const rh = parseInt(riseStr.split(":")[0])
  const riseDate = rh < bh
    ? new Date(new Date(logDate + "T12:00:00").getTime() + 86400000).toISOString().slice(0, 10)
    : logDate
  return `${riseDate}T${riseStr}:00${tzOffset()}`
}
export function getSELabel(se: number): { label: string; color: string } {
  if (se >= 90) return { label: "Excellent", color: "text-green-400" }
  if (se >= 85) return { label: "Good", color: "text-blue-400" }
  if (se >= 75) return { label: "Fair", color: "text-yellow-400" }
  return { label: "Needs work", color: "text-red-400" }
}
export function getISILabel(score: number): { label: string; color: string } {
  if (score <= 7) return { label: "No insomnia", color: "text-green-400" }
  if (score <= 14) return { label: "Sub-threshold", color: "text-yellow-400" }
  if (score <= 21) return { label: "Moderate insomnia", color: "text-orange-400" }
  return { label: "Severe insomnia", color: "text-red-400" }
}
export function computeWeekStats(logs: SleepLog[]): SleepStats {
  if (!logs.length) return { avgTST: 0, avgTIB: 0, avgSE: 0, avgSOL: 0, avgWASO: 0, logsCount: 0 }
  const n = logs.length
  const t = logs.reduce((a, l) => ({
    tst: a.tst + l.tst_minutes, tib: a.tib + l.tib_minutes,
    sol: a.sol + l.sol_minutes, waso: a.waso + l.waso_minutes,
  }), { tst: 0, tib: 0, sol: 0, waso: 0 })
  const avgTST = Math.round(t.tst / n)
  const avgTIB = Math.round(t.tib / n)
  return { avgTST, avgTIB, avgSE: calcSE(avgTST, avgTIB),
    avgSOL: Math.round(t.sol / n), avgWASO: Math.round(t.waso / n), logsCount: n }
}
export function todayDate(): string { return new Date().toISOString().slice(0, 10) }
export function yesterdayDate(): string {
  return new Date(Date.now() - 86400000).toISOString().slice(0, 10)
}
export function computeStreak(logs: SleepLog[]): number {
  if (!logs.length) return 0
  const today = todayDate()
  const yesterday = yesterdayDate()
  const mostRecent = logs[0]?.log_date
  if (mostRecent !== today && mostRecent !== yesterday) return 0
  let streak = 0
  let expected = mostRecent
  for (const log of logs) {
    if (log.log_date === expected) {
      streak++
      const d = new Date(expected + "T12:00:00")
      d.setDate(d.getDate() - 1)
      expected = d.toISOString().slice(0, 10)
    } else break
  }
  return streak
}
export const LESSON_UNLOCK_DAYS = [0, 3, 5, 8, 12, 16, 21]
import { useState, useEffect } from "react"
import { supabase } from "../lib/supabase"
import type { SleepLog } from "../types"

export function useSleepLogs(userId: string | undefined, limitDays = 30) {
  const [logs, setLogs] = useState<SleepLog[]>([])
  const [loading, setLoading] = useState(true)
  const fetchLogs = async () => {
    if (!userId) return
    const from = new Date(Date.now() - limitDays * 86400000).toISOString().slice(0, 10)
    const { data } = await supabase.from("sleep_logs").select("*")
      .eq("user_id", userId).gte("log_date", from).order("log_date", { ascending: false })
    setLogs(data ?? [])
    setLoading(false)
  }
  useEffect(() => { fetchLogs() }, [userId])
  return { logs, loading, refetch: fetchLogs }
}
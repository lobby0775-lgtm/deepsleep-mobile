export interface Profile {
  id: string; created_at: string; updated_at: string
  display_name: string | null; timezone: string
  onboarding_completed: boolean; onboarding_step: number
  insomnia_duration_weeks: number | null; prior_treatments: string[] | null
  shift_worker: boolean; medical_conditions: string | null
  baseline_complete: boolean; baseline_start_date: string | null
  country: string | null
  preferred_rise_time: string | null  // HH:MM anchor for sleep window
  baseline_avg_tst_minutes: number | null
}
export interface SleepLog {
  id: string; user_id: string; created_at: string; updated_at: string
  log_date: string; bedtime: string; rise_time: string
  sol_minutes: number; waso_minutes: number; awakenings: number | null
  tib_minutes: number; tst_minutes: number
  nap_minutes: number | null; nap_before_3pm: boolean | null
  sleep_quality: number | null; feeling_rested: number | null
  caffeine_after_2pm: boolean | null
  medications_taken: string | null; notes: string | null
}
export interface SleepWindow {
  id: string; user_id: string; created_at: string
  effective_date: string; bedtime: string; rise_time: string
  prescribed_tst_minutes: number
  source: "auto" | "clinician_override"; clinician_note: string | null
}
export interface ISIAssessment {
  id?: string; user_id: string; created_at?: string
  q1: number; q2: number; q3: number; q4: number
  q5: number; q6: number; q7: number; total_score: number
}
export interface PHQ9Assessment {
  id?: string; user_id: string; created_at?: string
  q1: number; q2: number; q3: number; q4: number; q5: number
  q6: number; q7: number; q8: number; q9: number; total_score: number
}
export interface GAD7Assessment {
  id?: string; user_id: string; created_at?: string
  q1: number; q2: number; q3: number; q4: number
  q5: number; q6: number; q7: number; total_score: number
}
export interface Medication {
  id?: string; user_id: string; name: string
  dose: string | null; frequency: string | null
  duration_weeks: number | null; category: string; is_active: boolean
}
export interface SleepStats {
  avgTST: number; avgTIB: number; avgSE: number
  avgSOL: number; avgWASO: number; logsCount: number
}
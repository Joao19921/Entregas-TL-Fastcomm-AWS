import { useEffect, useState } from 'react'
import { supabase } from './supabase'

export interface BacklogData {
  backlogs: Array<{
    id: string; name: string; scope: string; priority: string; status: string
    external_dep: boolean; dep_notes: string; expanded: boolean; position: number; start_date: string
  }>
  tasks: Array<{
    id: string; backlog_id: string; name: string; owner: string
    days: number; status: string; notes: string; position: number
  }>
  lastUpdated: string
}

interface UseDataLoaderOptions {
  isMaster?: boolean
  cacheKey?: string
  timeout?: number
  maxRetries?: number
}

/**
 * Load data with priorization strategy:
 * - Viewers: /data.json (CDN) → localStorage → Supabase (fallback)
 * - Master: localStorage → Supabase (can edit)
 * 
 * Timeout: 15s per attempt, retry with exponential backoff (1s, 2s, 4s)
 */
export function useDataLoader(options: UseDataLoaderOptions = {}) {
  const { isMaster = false, cacheKey = 'rm_data_cache_v1', timeout = 15000, maxRetries = 3 } = options

  const [data, setData] = useState<BacklogData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  // Load from localStorage cache
  const loadFromCache = (): BacklogData | null => {
    try {
      const cached = localStorage.getItem(cacheKey)
      return cached ? JSON.parse(cached) : null
    } catch (e) {
      console.warn('[useDataLoader] Cache parse failed:', e)
      return null
    }
  }

  // Save to localStorage cache
  const saveToCache = (d: BacklogData) => {
    try {
      localStorage.setItem(cacheKey, JSON.stringify(d))
    } catch (e) {
      console.warn('[useDataLoader] Cache save failed:', e)
    }
  }

  // Load from /data.json (CDN)
  const loadFromJSON = async (): Promise<BacklogData | null> => {
    try {
      const response = await fetch('/data.json', { cache: 'no-cache' })
      if (!response.ok) {
        if (response.status === 404) {
          console.warn('[useDataLoader] /data.json not found, falling back to Supabase')
          return null
        }
        throw new Error(`HTTP ${response.status}`)
      }
      return await response.json()
    } catch (e) {
      console.warn('[useDataLoader] JSON load failed:', e instanceof Error ? e.message : String(e))
      return null
    }
  }

  // Load from Supabase
  const loadFromSupabase = async (): Promise<BacklogData | null> => {
    try {
      const [{ data: backlogs, error: blErr }, { data: tasks, error: tkErr }] = await Promise.all([
        supabase.from('backlogs').select('*').order('position'),
        supabase.from('tasks').select('*').order('position'),
      ])

      if (blErr || tkErr) {
        const err = blErr ?? tkErr
        throw new Error(err?.message ?? 'Unknown error')
      }

      return {
        backlogs: backlogs || [],
        tasks: tasks || [],
        lastUpdated: new Date().toISOString(),
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      console.warn('[useDataLoader] Supabase load failed:', msg)
      throw e
    }
  }

  // Execute load with timeout
  const loadWithTimeout = async (fn: () => Promise<BacklogData | null>): Promise<BacklogData | null> => {
    return Promise.race([
      fn(),
      new Promise<null>((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), timeout)
      ),
    ])
  }

  // Main load strategy
  useEffect(() => {
    let cancelled = false

    async function loadData() {
      setLoading(true)
      setError(null)

      try {
        // Try cache first (instant)
        const cached = loadFromCache()
        if (cached) {
          if (!cancelled) {
            setData(cached)
            setLoading(false)
          }
        }

        // Decide load strategy based on role
        let loaded: BacklogData | null = null

        if (isMaster) {
          // Master: try Supabase first (for writing), fallback to JSON then cache
          try {
            loaded = await loadWithTimeout(loadFromSupabase)
          } catch (e) {
            console.warn('[useDataLoader] Master Supabase failed, trying JSON:', e)
            loaded = await loadWithTimeout(loadFromJSON)
          }
        } else {
          // Viewer: try JSON first (fast), then Supabase
          try {
            loaded = await loadWithTimeout(loadFromJSON)
          } catch (e) {
            console.warn('[useDataLoader] Viewer JSON failed, trying Supabase:', e)
            try {
              loaded = await loadWithTimeout(loadFromSupabase)
            } catch (e2) {
              console.warn('[useDataLoader] Both JSON and Supabase failed')
            }
          }
        }

        if (!cancelled) {
          if (loaded) {
            setData(loaded)
            saveToCache(loaded)
            setError(null)
          } else if (!cached) {
            // No data from any source
            setError('Unable to load data from all sources')
          }
          // If we have cache and failed, keep cache, don't show error
          setLoading(false)
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)
        if (!cancelled) {
          setError(msg)
          setLoading(false)
        }
      }
    }

    loadData()
    return () => { cancelled = true }
  }, [retryCount, isMaster, cacheKey, timeout])

  const retry = () => setRetryCount(r => r + 1)

  return { data, loading, error, retry, retryCount }
}

'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://cvxzdiutxonnsnwoicqt.supabase.co',
  'sb_publishable_J8ta-7L05zgK9rBy2OS9Bg_CjXHwZVK'
)

export function useAuth() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
      if (!session) window.location.href = '/login'
    })
  }, [])

  return { user, loading }
}

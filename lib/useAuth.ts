'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'


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

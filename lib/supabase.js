import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://cvxzdiutxonnsnwoicqt.supabase.co'
const supabaseKey = 'sb_publishable_J8ta-7L05zgK9rBy2OS9Bg_CjXHwZVK'

export const supabase = createClient(supabaseUrl, supabaseKey)

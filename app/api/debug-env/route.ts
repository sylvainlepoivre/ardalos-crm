// app/api/debug-env/route.ts
// DEBUG TEMPORAIRE — a supprimer apres usage
// GET /api/debug-env
// Verifie la presence et la longueur des variables d'env sans les exposer

import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  const cck = process.env.CLOUDCONVERT_API_KEY
  const gmail = process.env.GMAIL_USER
  const gmailPwd = process.env.GMAIL_APP_PASSWORD

  return NextResponse.json({
    cloudconvert: {
      present: !!cck,
      length: cck ? cck.length : 0,
      first20: cck ? cck.substring(0, 20) : '',
      last20: cck ? cck.substring(cck.length - 20) : '',
    },
    gmail_user: {
      present: !!gmail,
      length: gmail ? gmail.length : 0,
      value_if_short: gmail || '',
    },
    gmail_password: {
      present: !!gmailPwd,
      length: gmailPwd ? gmailPwd.length : 0,
    },
    node_env: process.env.NODE_ENV || '(none)',
    vercel_env: process.env.VERCEL_ENV || '(none)',
  })
}

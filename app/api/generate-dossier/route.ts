// app/api/generate-dossier/route.ts  —  DEBUG VERSION

import { NextRequest, NextResponse } from 'next/server'
import { generateDossier } from '@/lib/generateDossier'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const inscriptionId = searchParams.get('inscriptionId')

    if (!inscriptionId) {
      return NextResponse.json({ error: 'inscriptionId requis' }, { status: 400 })
    }

    // DEBUG : Afficher les cookies recus
    const cookieHeader = req.headers.get('cookie') || ''
    console.log('=== DEBUG COOKIES ===')
    console.log('Cookie header present:', !!cookieHeader)
    console.log('Cookie length:', cookieHeader.length)
    // Lister les noms de cookies
    const cookieNames = cookieHeader.split(';').map(c => c.trim().split('=')[0])
    console.log('Cookie names:', cookieNames)
    // Cookies contenant "auth" ou "sb"
    const authCookies = cookieNames.filter(n => n.includes('auth') || n.startsWith('sb'))
    console.log('Auth/sb cookies:', authCookies)

    const authToken = extractSupabaseToken(cookieHeader)
    console.log('Token extrait:', authToken ? `OUI (${authToken.substring(0, 20)}...)` : 'NON')
    console.log('=====================')

    const { buffer, filename } = await generateDossier(inscriptionId, authToken)

    return new NextResponse(buffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': String(buffer.length),
      },
    })
  } catch (e: any) {
    console.error('Erreur generation dossier :', e)
    return NextResponse.json({ error: e?.message || 'Erreur inconnue' }, { status: 500 })
  }
}

function extractSupabaseToken(cookieHeader: string): string | null {
  const match = cookieHeader.match(/sb-[a-z0-9]+-auth-token=([^;]+)/)
  if (!match) return null
  try {
    const raw = decodeURIComponent(match[1])
    // Peut etre une chaine JSON ou un tableau encode en base64 ou direct
    if (raw.startsWith('[')) {
      const parsed = JSON.parse(raw)
      return parsed[0] || null
    }
    if (raw.startsWith('{')) {
      const parsed = JSON.parse(raw)
      return parsed?.access_token || null
    }
    if (raw.startsWith('base64-')) {
      const decoded = Buffer.from(raw.substring(7), 'base64').toString('utf-8')
      const parsed = JSON.parse(decoded)
      return parsed?.access_token || parsed?.[0] || null
    }
    return raw
  } catch (e) {
    console.error('[extractSupabaseToken] Erreur parse:', e)
    return null
  }
}

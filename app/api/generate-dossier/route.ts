// app/api/generate-dossier/route.ts
// GET /api/generate-dossier?inscriptionId=XXX[&templates=...][&format=zip|pdf]
// Si 'format' est absent : zip par defaut.

import { NextRequest, NextResponse } from 'next/server'
import { generateDossier } from '@/lib/generateDossier'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
// Timeout long car la conversion CloudConvert peut prendre jusqu'a 2 min
export const maxDuration = 180

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const inscriptionId = searchParams.get('inscriptionId')
    const templatesParam = searchParams.get('templates')
    const formatParam = searchParams.get('format')

    if (!inscriptionId) {
      return NextResponse.json({ error: 'inscriptionId requis' }, { status: 400 })
    }

    const selectedTemplates = templatesParam
      ? templatesParam.split(',').map(s => s.trim()).filter(Boolean)
      : undefined

    const format: 'zip' | 'pdf' = formatParam === 'pdf' ? 'pdf' : 'zip'

    const cookieHeader = req.headers.get('cookie') || ''
    const authToken = extractSupabaseToken(cookieHeader)

    const { buffer, filename, contentType } = await generateDossier(
      inscriptionId, authToken, selectedTemplates, format,
    )

    return new NextResponse(buffer as any, {
      status: 200,
      headers: {
        'Content-Type': contentType,
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
    if (raw.startsWith('[')) return JSON.parse(raw)[0] || null
    if (raw.startsWith('{')) return JSON.parse(raw)?.access_token || null
    if (raw.startsWith('base64-')) {
      const decoded = Buffer.from(raw.substring(7), 'base64').toString('utf-8')
      const parsed = JSON.parse(decoded)
      return parsed?.access_token || parsed?.[0] || null
    }
    return raw
  } catch {
    return null
  }
}

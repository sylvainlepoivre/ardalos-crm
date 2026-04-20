// app/api/send-dossier-email/route.ts
// POST /api/send-dossier-email
// Body: { inscriptionId, templates: string[], to: string, subject: string, message: string }
// Genere le ZIP + envoie par email via Gmail SMTP avec CC aux associes Ardalos

import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { generateDossier } from '@/lib/generateDossier'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// CC obligatoires : les 3 associes Ardalos sur TOUS les envois
const CC_ASSOCIES = [
  'dacandelier@gmail.com',
  'julienmeliadvice@gmail.com',
  'sylvain.lepoivre@gmail.com',
]

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { inscriptionId, templates, to, subject, message } = body

    // Validation
    if (!inscriptionId) return NextResponse.json({ error: 'inscriptionId requis' }, { status: 400 })
    if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
      return NextResponse.json({ error: 'Email destinataire invalide' }, { status: 400 })
    }
    if (!subject || !subject.trim()) return NextResponse.json({ error: 'Objet requis' }, { status: 400 })
    if (!message || !message.trim()) return NextResponse.json({ error: 'Message requis' }, { status: 400 })

    // Variables d'environnement Gmail
    const gmailUser = process.env.GMAIL_USER
    const gmailPwd = process.env.GMAIL_APP_PASSWORD
    if (!gmailUser || !gmailPwd) {
      console.error('[send-dossier-email] Variables Gmail manquantes')
      return NextResponse.json({ error: 'Configuration email manquante cote serveur' }, { status: 500 })
    }

    // Auth Supabase (pour respecter la RLS si elle est reactivee plus tard)
    const cookieHeader = req.headers.get('cookie') || ''
    const authToken = extractSupabaseToken(cookieHeader)

    // 1. Generer le ZIP
    const selectedTemplates = Array.isArray(templates) && templates.length > 0 ? templates : undefined
    const { buffer, filename } = await generateDossier(inscriptionId, authToken, selectedTemplates)

    // 2. Preparer le transporteur SMTP Gmail
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: gmailUser,
        pass: gmailPwd,
      },
    })

    // 3. Envoyer l'email avec le ZIP en piece jointe
    const info = await transporter.sendMail({
      from: `"Ardalos Formation" <${gmailUser}>`,
      to: to,
      cc: CC_ASSOCIES.join(', '),
      subject: subject,
      text: message,
      attachments: [
        {
          filename: filename,
          content: buffer,
          contentType: 'application/zip',
        },
      ],
    })

    console.log('[send-dossier-email] Email envoye:', info.messageId, 'to:', to)

    return NextResponse.json({
      success: true,
      messageId: info.messageId,
      to: to,
      cc: CC_ASSOCIES,
      filename: filename,
    })
  } catch (e: any) {
    console.error('[send-dossier-email] Erreur:', e)
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

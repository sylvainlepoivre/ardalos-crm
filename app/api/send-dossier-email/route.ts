// app/api/send-dossier-email/route.ts
// POST /api/send-dossier-email
// Body: { inscriptionId, templates?, to, subject, message, format?: 'pdf' | 'zip' }
// - Genere le dossier (ZIP ou PDF fusionne via CloudConvert)
// - Envoie par email via Gmail SMTP avec CC aux 3 associes Ardalos

import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { generateDossier } from '@/lib/generateDossier'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
// Timeout long car la conversion PDF peut prendre jusqu'a 2 min
export const maxDuration = 180

const CC_ASSOCIES = [
  'dacandelier@gmail.com',
  'julienmeliadvice@gmail.com',
  'sylvain.lepoivre@gmail.com',
]

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { inscriptionId, templates, to, subject, message, format } = body

    if (!inscriptionId) return NextResponse.json({ error: 'inscriptionId requis' }, { status: 400 })
    if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
      return NextResponse.json({ error: 'Email destinataire invalide' }, { status: 400 })
    }
    if (!subject || !subject.trim()) return NextResponse.json({ error: 'Objet requis' }, { status: 400 })
    if (!message || !message.trim()) return NextResponse.json({ error: 'Message requis' }, { status: 400 })

    const gmailUser = process.env.GMAIL_USER
    const gmailPwd = process.env.GMAIL_APP_PASSWORD
    if (!gmailUser || !gmailPwd) {
      console.error('[send-dossier-email] Variables Gmail manquantes')
      return NextResponse.json({ error: 'Configuration email manquante cote serveur' }, { status: 500 })
    }

    const cookieHeader = req.headers.get('cookie') || ''
    const authToken = extractSupabaseToken(cookieHeader)

    // Format : PDF par defaut (plus pro), ZIP si explicitement demande
    const outputFormat: 'zip' | 'pdf' = format === 'zip' ? 'zip' : 'pdf'

    // 1. Generer le dossier (ZIP ou PDF selon format)
    const selectedTemplates = Array.isArray(templates) && templates.length > 0 ? templates : undefined
    const { buffer, filename, contentType } = await generateDossier(
      inscriptionId, authToken, selectedTemplates, outputFormat,
    )

    // 2. Preparer le transporteur SMTP Gmail
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: gmailUser, pass: gmailPwd },
    })

    // 3. Envoyer l'email avec la piece jointe
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
          contentType: contentType,
        },
      ],
    })

    console.log('[send-dossier-email] Email envoye:', info.messageId, 'to:', to, 'format:', outputFormat)

    return NextResponse.json({
      success: true,
      messageId: info.messageId,
      to: to,
      cc: CC_ASSOCIES,
      filename: filename,
      format: outputFormat,
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

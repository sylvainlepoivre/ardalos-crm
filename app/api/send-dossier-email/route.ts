// app/api/send-dossier-email/route.ts
// POST /api/send-dossier-email
// - Genere le dossier (ZIP ou PDF fusionne via CloudConvert)
// - Envoie par email via Gmail SMTP avec CC aux 3 associes
// - Log l'envoi dans la table email_logs pour historique

import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { generateDossier } from '@/lib/generateDossier'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 180

const CC_ASSOCIES = [
  'dacandelier@gmail.com',
  'julienmeliadvice@gmail.com',
  'sylvain.lepoivre@gmail.com',
]

const supabaseUrl = 'https://cvxzdiutxonnsnwoicqt.supabase.co'
const supabaseKey = 'sb_publishable_J8ta-7L05zgK9rBy2OS9Bg_CjXHwZVK'

async function logEmail(data: {
  inscriptionId: string
  destinataire: string
  cc: string[]
  sujet: string
  message: string
  filename: string
  format: 'pdf' | 'zip'
  nbTemplates: number
  templatesList: string[]
  success: boolean
  errorMessage?: string
  messageId?: string
  envoyePar?: string
}) {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey)
    await supabase.from('email_logs').insert({
      inscription_id: data.inscriptionId,
      destinataire: data.destinataire,
      cc: data.cc,
      sujet: data.sujet,
      message: data.message,
      filename: data.filename,
      format: data.format,
      nb_templates: data.nbTemplates,
      templates_list: data.templatesList,
      success: data.success,
      error_message: data.errorMessage || null,
      message_id: data.messageId || null,
      envoye_par: data.envoyePar || null,
    })
  } catch (e) {
    console.warn('[logEmail] erreur:', e)
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const { inscriptionId, templates, to, subject, message, format, envoyePar } = body

  // Variables utilisees dans le catch pour logger meme en cas d'erreur
  const outputFormat: 'zip' | 'pdf' = format === 'zip' ? 'zip' : 'pdf'
  const selectedTemplates: string[] = Array.isArray(templates) && templates.length > 0 ? templates : []

  try {
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

    // 1. Generer le dossier (ZIP ou PDF selon format)
    const { buffer, filename, contentType } = await generateDossier(
      inscriptionId, authToken,
      selectedTemplates.length > 0 ? selectedTemplates : undefined,
      outputFormat,
    )

    // 2. Envoyer par email
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: gmailUser, pass: gmailPwd },
    })

    const info = await transporter.sendMail({
      from: `"Ardalos Formation" <${gmailUser}>`,
      to: to,
      cc: CC_ASSOCIES.join(', '),
      subject: subject,
      text: message,
      attachments: [{ filename, content: buffer, contentType }],
    })

    console.log('[send-dossier-email] Email envoye:', info.messageId, 'to:', to, 'format:', outputFormat)

    // 3. Logger l'envoi en succes
    await logEmail({
      inscriptionId, destinataire: to, cc: CC_ASSOCIES,
      sujet: subject, message, filename, format: outputFormat,
      nbTemplates: selectedTemplates.length, templatesList: selectedTemplates,
      success: true, messageId: info.messageId, envoyePar: envoyePar || null,
    })

    return NextResponse.json({
      success: true,
      messageId: info.messageId,
      to, cc: CC_ASSOCIES, filename, format: outputFormat,
    })
  } catch (e: any) {
    console.error('[send-dossier-email] Erreur:', e)
    const errMsg = e?.message || 'Erreur inconnue'

    // Logger l'echec aussi (si on a assez d'infos)
    if (inscriptionId && to) {
      await logEmail({
        inscriptionId, destinataire: to, cc: CC_ASSOCIES,
        sujet: subject || '', message: message || '',
        filename: '(non genere)', format: outputFormat,
        nbTemplates: selectedTemplates.length, templatesList: selectedTemplates,
        success: false, errorMessage: errMsg, envoyePar: envoyePar || null,
      })
    }

    return NextResponse.json({ error: errMsg }, { status: 500 })
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
  } catch { return null }
}

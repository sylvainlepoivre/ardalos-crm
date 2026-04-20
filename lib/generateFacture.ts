// lib/generateFacture.ts
// Genere un PDF de facture Ardalos via pdf-lib (rendu 100% fiable, pas d'API externe)

import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'

const BLEU_ARDALOS = rgb(0.102, 0.173, 0.420) // #1A2C6B
const DORE_ARDALOS = rgb(0.788, 0.659, 0.298) // #C9A84C
const GRIS_FONCE = rgb(0.2, 0.2, 0.2)
const GRIS_CLAIR = rgb(0.5, 0.5, 0.5)
const NOIR = rgb(0, 0, 0)
const BLANC = rgb(1, 1, 1)

export interface FactureData {
  numero: string // ex: "ARD-2026-0001"
  dateEmission: Date
  destinataireNom: string
  destinataireAdresse: string
  destinataireSiret?: string | null
  formationTitre: string
  formationDateDebut?: Date | null
  formationDateFin?: Date | null
  formationRef?: string | null
  stagiairePrenomNom?: string | null // pour preciser "pour le stagiaire X" si c'est une entreprise
  montantHT: number
}

function fmtEuro(n: number): string {
  // toLocaleString('fr-FR') utilise des espaces speciaux (U+202F narrow no-break space)
  // que pdf-lib WinAnsi ne peut pas encoder. On les remplace par des espaces normaux.
  const formatted = n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return formatted.replace(/[\u202f\u00a0]/g, ' ') + ' EUR'
}
function fmtDate(d: Date | null | undefined): string {
  if (!d) return ''
  const formatted = d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
  return formatted.replace(/[\u202f\u00a0]/g, ' ')
}

export async function generateFacturePdf(data: FactureData): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([595, 842]) // A4 portrait
  const { width, height } = page.getSize()

  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const fontItalic = await pdfDoc.embedFont(StandardFonts.HelveticaOblique)

  // ============================================================
  // HEADER BANDEAU BLEU
  // ============================================================
  page.drawRectangle({ x: 0, y: height - 100, width, height: 100, color: BLEU_ARDALOS })

  // Logo carré doré avec "A"
  page.drawRectangle({ x: 40, y: height - 80, width: 50, height: 50, color: DORE_ARDALOS })
  page.drawText('A', {
    x: 55, y: height - 70,
    size: 32, font: fontBold, color: BLEU_ARDALOS,
  })

  // Nom + tagline à droite du logo
  page.drawText('ARDALOS FORMATION', {
    x: 105, y: height - 50,
    size: 18, font: fontBold, color: DORE_ARDALOS,
  })
  page.drawText('Organisme de formation professionnelle', {
    x: 105, y: height - 65,
    size: 10, font: fontRegular, color: BLANC,
  })

  // Titre FACTURE à droite
  page.drawText('FACTURE', {
    x: width - 150, y: height - 50,
    size: 20, font: fontBold, color: DORE_ARDALOS,
  })
  page.drawText(data.numero, {
    x: width - 150, y: height - 70,
    size: 12, font: fontRegular, color: BLANC,
  })

  // ============================================================
  // INFOS EMETTEUR (gauche)
  // ============================================================
  let y = height - 130

  page.drawText('ÉMETTEUR', { x: 40, y, size: 9, font: fontBold, color: GRIS_CLAIR })
  y -= 14
  page.drawText('ARDALOS FORMATION SAS', { x: 40, y, size: 10, font: fontBold, color: BLEU_ARDALOS })
  y -= 13
  page.drawText('Martigues (13)', { x: 40, y, size: 9, font: fontRegular, color: GRIS_FONCE })
  y -= 11
  page.drawText('SIRET : 993 094 085 00017', { x: 40, y, size: 9, font: fontRegular, color: GRIS_FONCE })
  y -= 11
  page.drawText('NDA : 93132464513', { x: 40, y, size: 9, font: fontRegular, color: GRIS_FONCE })
  y -= 11
  page.drawText('ardalosformation@gmail.com', { x: 40, y, size: 9, font: fontRegular, color: GRIS_FONCE })

  // ============================================================
  // INFOS DESTINATAIRE (droite)
  // ============================================================
  let y2 = height - 130
  const xDest = width - 260

  page.drawText('FACTURÉ À', { x: xDest, y: y2, size: 9, font: fontBold, color: GRIS_CLAIR })
  y2 -= 14
  page.drawText(data.destinataireNom.substring(0, 40), { x: xDest, y: y2, size: 10, font: fontBold, color: BLEU_ARDALOS })
  y2 -= 13

  // Adresse sur plusieurs lignes si besoin
  if (data.destinataireAdresse) {
    const lignes = wrapText(data.destinataireAdresse, 40)
    for (const ligne of lignes.slice(0, 3)) {
      page.drawText(ligne, { x: xDest, y: y2, size: 9, font: fontRegular, color: GRIS_FONCE })
      y2 -= 11
    }
  }

  if (data.destinataireSiret) {
    page.drawText(`SIRET : ${data.destinataireSiret}`, { x: xDest, y: y2, size: 9, font: fontRegular, color: GRIS_FONCE })
    y2 -= 11
  }

  // Si entreprise ET stagiaire, preciser
  if (data.destinataireSiret && data.stagiairePrenomNom) {
    y2 -= 4
    page.drawText(`Pour le stagiaire : ${data.stagiairePrenomNom}`, { x: xDest, y: y2, size: 9, font: fontItalic, color: GRIS_CLAIR })
  }

  // ============================================================
  // INFOS FACTURE (date, ref)
  // ============================================================
  y = height - 240

  // Ligne de separation
  page.drawLine({
    start: { x: 40, y },
    end: { x: width - 40, y },
    thickness: 0.5, color: GRIS_CLAIR,
  })
  y -= 20

  page.drawText('Date d\'emission :', { x: 40, y, size: 10, font: fontBold, color: BLEU_ARDALOS })
  page.drawText(fmtDate(data.dateEmission), { x: 160, y, size: 10, font: fontRegular, color: GRIS_FONCE })

  page.drawText('Numero :', { x: width - 240, y, size: 10, font: fontBold, color: BLEU_ARDALOS })
  page.drawText(data.numero, { x: width - 180, y, size: 10, font: fontRegular, color: GRIS_FONCE })

  // ============================================================
  // TABLEAU PRESTATION
  // ============================================================
  y -= 35

  // Header du tableau (fond bleu)
  page.drawRectangle({ x: 40, y: y - 5, width: width - 80, height: 25, color: BLEU_ARDALOS })
  page.drawText('DESCRIPTION', { x: 50, y: y + 5, size: 10, font: fontBold, color: BLANC })
  page.drawText('QTE', { x: width - 220, y: y + 5, size: 10, font: fontBold, color: BLANC })
  page.drawText('MONTANT HT', { x: width - 140, y: y + 5, size: 10, font: fontBold, color: BLANC })
  y -= 35

  // Ligne prestation
  const description = `Formation professionnelle : ${data.formationTitre}`
  const lignesDescr = wrapText(description, 60)
  let yDescr = y
  for (const ligne of lignesDescr.slice(0, 2)) {
    page.drawText(ligne, { x: 50, y: yDescr, size: 10, font: fontRegular, color: GRIS_FONCE })
    yDescr -= 12
  }

  // Sous-ligne avec dates si dispo
  if (data.formationDateDebut && data.formationDateFin) {
    page.drawText(
      `Du ${fmtDate(data.formationDateDebut)} au ${fmtDate(data.formationDateFin)}`,
      { x: 50, y: yDescr - 2, size: 9, font: fontItalic, color: GRIS_CLAIR }
    )
    yDescr -= 12
  }

  if (data.formationRef) {
    page.drawText(`Reference : ${data.formationRef}`, { x: 50, y: yDescr - 2, size: 9, font: fontItalic, color: GRIS_CLAIR })
    yDescr -= 12
  }

  page.drawText('1', { x: width - 210, y, size: 10, font: fontRegular, color: GRIS_FONCE })
  page.drawText(fmtEuro(data.montantHT), { x: width - 140, y, size: 10, font: fontBold, color: BLEU_ARDALOS })

  y = yDescr - 15

  // Ligne de separation
  page.drawLine({ start: { x: 40, y }, end: { x: width - 40, y }, thickness: 0.5, color: GRIS_CLAIR })
  y -= 25

  // ============================================================
  // TOTAUX (aligne a droite)
  // ============================================================
  const xTotalLabel = width - 260
  const xTotalValue = width - 140

  page.drawText('Total HT', { x: xTotalLabel, y, size: 11, font: fontRegular, color: GRIS_FONCE })
  page.drawText(fmtEuro(data.montantHT), { x: xTotalValue, y, size: 11, font: fontBold, color: GRIS_FONCE })
  y -= 15

  page.drawText('TVA (0%)', { x: xTotalLabel, y, size: 11, font: fontRegular, color: GRIS_FONCE })
  page.drawText('0,00 EUR', { x: xTotalValue, y, size: 11, font: fontRegular, color: GRIS_FONCE })
  y -= 5

  page.drawLine({ start: { x: xTotalLabel, y: y - 3 }, end: { x: width - 40, y: y - 3 }, thickness: 0.5, color: GRIS_FONCE })
  y -= 20

  // Total TTC - grand et en bleu
  page.drawRectangle({ x: xTotalLabel - 10, y: y - 10, width: (width - 40) - (xTotalLabel - 10), height: 30, color: BLEU_ARDALOS })
  page.drawText('TOTAL TTC', { x: xTotalLabel, y, size: 12, font: fontBold, color: DORE_ARDALOS })
  page.drawText(fmtEuro(data.montantHT), { x: xTotalValue, y, size: 13, font: fontBold, color: BLANC })

  y -= 50

  // Mention TVA
  page.drawText('TVA non applicable - Article 293 B du Code general des impots', {
    x: 40, y, size: 9, font: fontItalic, color: GRIS_CLAIR,
  })

  y -= 40

  // ============================================================
  // CONDITIONS DE PAIEMENT
  // ============================================================
  page.drawText('CONDITIONS DE PAIEMENT', { x: 40, y, size: 10, font: fontBold, color: BLEU_ARDALOS })
  y -= 15
  page.drawText('Paiement a 30 jours fin de mois a reception de facture.', {
    x: 40, y, size: 9, font: fontRegular, color: GRIS_FONCE,
  })
  y -= 12
  page.drawText('Virement bancaire : coordonnees bancaires sur demande.', {
    x: 40, y, size: 9, font: fontRegular, color: GRIS_FONCE,
  })
  y -= 12
  page.drawText('En cas de retard : penalites de 3x le taux d interet legal + indemnite forfaitaire 40 EUR (art. L441-10 Code commerce).', {
    x: 40, y, size: 8, font: fontRegular, color: GRIS_CLAIR,
  })

  // ============================================================
  // FOOTER
  // ============================================================
  const yFooter = 50
  page.drawLine({
    start: { x: 40, y: yFooter + 20 },
    end: { x: width - 40, y: yFooter + 20 },
    thickness: 0.5, color: GRIS_CLAIR,
  })
  page.drawText(
    'ARDALOS FORMATION SAS - SIRET 993 094 085 00017 - NDA 93132464513 - Qualiopi en cours',
    { x: 40, y: yFooter + 5, size: 8, font: fontRegular, color: GRIS_CLAIR }
  )
  page.drawText(
    'Martigues (13) - ardalosformation@gmail.com',
    { x: 40, y: yFooter - 5, size: 8, font: fontRegular, color: GRIS_CLAIR }
  )

  return await pdfDoc.save()
}

// Coupe un texte long en plusieurs lignes de maxLen caracteres
function wrapText(text: string, maxLen: number): string[] {
  const words = text.split(' ')
  const lines: string[] = []
  let currentLine = ''
  for (const word of words) {
    if ((currentLine + ' ' + word).length > maxLen) {
      if (currentLine) lines.push(currentLine)
      currentLine = word
    } else {
      currentLine = currentLine ? currentLine + ' ' + word : word
    }
  }
  if (currentLine) lines.push(currentLine)
  return lines
}

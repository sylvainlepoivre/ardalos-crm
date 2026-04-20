// lib/generatePdfCloudmersive.ts
// Convertit plusieurs docx (Buffer) en un seul PDF fusionne via:
//  - Cloudmersive API pour docx -> PDF (individuel)
//  - pdf-lib pour fusionner les PDFs en un seul
// Remplace CloudConvert (qui demande un plan payant).
// Plan gratuit Cloudmersive: 600 appels/mois, 2.5 MB max par fichier.

import { PDFDocument } from 'pdf-lib'

const CLOUDMERSIVE_API = 'https://api.cloudmersive.com/convert/docx/to/pdf'

/**
 * Convertit un seul docx (Buffer) en PDF (Buffer) via Cloudmersive.
 */
async function convertDocxToPdf(docxBuffer: Buffer, apiKey: string, filename: string): Promise<Buffer> {
  // Cloudmersive attend multipart/form-data avec le fichier en champ "inputFile"
  const formData = new FormData()
  // Blob necessaire pour FormData cote Node
  const blob = new Blob([docxBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  })
  formData.append('inputFile', blob, filename)

  const res = await fetch(CLOUDMERSIVE_API, {
    method: 'POST',
    headers: { 'Apikey': apiKey },
    body: formData,
  })

  if (!res.ok) {
    const errTxt = await res.text().catch(() => '')
    throw new Error(`Cloudmersive conversion failed for ${filename}: ${res.status} ${errTxt.substring(0, 200)}`)
  }

  const arrayBuffer = await res.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

/**
 * Convertit plusieurs docx en un seul PDF fusionne.
 * Parametres:
 *  - docxs: liste de { filename, buffer }
 * Retourne: Buffer du PDF final
 */
export async function convertDocxsToSinglePdf(
  docxs: { filename: string; buffer: Buffer }[]
): Promise<Buffer> {
  const apiKey = process.env.CLOUDMERSIVE_API_KEY
  if (!apiKey) {
    throw new Error('CLOUDMERSIVE_API_KEY manquante dans les variables d environnement')
  }
  if (docxs.length === 0) {
    throw new Error('Aucun document a convertir')
  }

  // 1. Convertir chaque docx en PDF individuellement via Cloudmersive
  //    On fait les appels en serie pour respecter la limite "1 concurrent request" du plan gratuit
  const pdfs: Buffer[] = []
  for (let i = 0; i < docxs.length; i++) {
    const d = docxs[i]
    console.log(`[Cloudmersive] ${i + 1}/${docxs.length} converting: ${d.filename} (${d.buffer.length} octets)`)
    const pdfBuf = await convertDocxToPdf(d.buffer, apiKey, d.filename)
    pdfs.push(pdfBuf)
    console.log(`[Cloudmersive] ${i + 1}/${docxs.length} OK: ${pdfBuf.length} octets`)
  }

  // 2. Si un seul PDF, on le retourne direct (pas besoin de fusion)
  if (pdfs.length === 1) return pdfs[0]

  // 3. Fusionner tous les PDFs via pdf-lib
  console.log(`[Cloudmersive] Fusion de ${pdfs.length} PDFs...`)
  const mergedDoc = await PDFDocument.create()

  for (const pdfBuf of pdfs) {
    const pdfDoc = await PDFDocument.load(pdfBuf)
    const copiedPages = await mergedDoc.copyPages(pdfDoc, pdfDoc.getPageIndices())
    copiedPages.forEach(page => mergedDoc.addPage(page))
  }

  const mergedBytes = await mergedDoc.save()
  console.log(`[Cloudmersive] Fusion OK: ${mergedBytes.length} octets`)
  return Buffer.from(mergedBytes)
}

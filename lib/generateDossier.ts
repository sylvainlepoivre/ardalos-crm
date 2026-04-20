// lib/generateDossier.ts  —  V4 (support ZIP docx + PDF fusionne)
// ============================================================================
// Diff V3 -> V4 :
//   - generateDossier() accepte un 4e argument optionnel format: 'zip' | 'pdf'
//   - Si 'pdf' : convertit tous les docx remplis en un seul PDF via CloudConvert
//   - Si 'zip' (defaut) : comportement actuel inchange
// ============================================================================

import fs from 'fs'
import path from 'path'
import Docxtemplater from 'docxtemplater'
import PizZip from 'pizzip'
import JSZip from 'jszip'
import { createClient } from '@supabase/supabase-js'
import { ALL_TEMPLATE_FILENAMES } from './templatesList'
import { convertDocxsToSinglePdf } from './generatePdfCloudmersive'

const supabaseUrl = 'https://cvxzdiutxonnsnwoicqt.supabase.co'
const supabaseKey = 'sb_publishable_J8ta-7L05zgK9rBy2OS9Bg_CjXHwZVK'

const TEMPLATES_DIR = path.join(process.cwd(), 'templates')

function fmtDate(d: string | null | undefined): string {
  if (!d) return ''
  try {
    const date = new Date(d)
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
  } catch {
    return d || ''
  }
}

function fmtPrice(n: number | null | undefined | string): string {
  if (n === null || n === undefined || n === '') return ''
  const num = typeof n === 'string' ? parseFloat(n) : n
  if (isNaN(num)) return ''
  return num.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'
}

export async function fetchInscriptionData(inscriptionId: string, authToken?: string | null) {
  const supabase = createClient(supabaseUrl, supabaseKey, {
    global: authToken ? { headers: { Authorization: `Bearer ${authToken}` } } : {},
  })

  const { data: insRaw, error: errIns } = await supabase
    .from('formation_inscriptions')
    .select('*')
    .eq('id', inscriptionId)
    .maybeSingle()

  if (errIns) throw new Error(`Erreur requete inscription: ${errIns.message}`)
  if (!insRaw) throw new Error(`Inscription ${inscriptionId} introuvable`)

  let contact: any = null
  if (insRaw.contact_id) {
    const { data, error } = await supabase
      .from('contacts')
      .select('id, prenom, nom, email, telephone')
      .eq('id', insRaw.contact_id)
      .maybeSingle()
    if (error) console.warn('[generateDossier] Erreur contact:', error.message)
    contact = data
  }

  let session: any = null
  if (insRaw.session_id) {
    const { data, error } = await supabase
      .from('formation_sessions')
      .select('*')
      .eq('id', insRaw.session_id)
      .maybeSingle()
    if (error) console.warn('[generateDossier] Erreur session:', error.message)
    session = data
  }

  let formation: any = null
  if (session?.formation_id) {
    const { data, error } = await supabase
      .from('formations')
      .select('*')
      .eq('id', session.formation_id)
      .maybeSingle()
    if (error) console.warn('[generateDossier] Erreur formation:', error.message)
    formation = data
  }

  const { data: dirigeants } = await supabase
    .from('formateurs')
    .select('*')
    .eq('est_dirigeant', true)
    .eq('actif', true)

  const president = dirigeants?.find((d: any) => d.est_referent_qualite) || dirigeants?.[0] || null

  const { data: refHandicap } = await supabase
    .from('formateurs')
    .select('*')
    .eq('est_referent_handicap', true)
    .maybeSingle()

  const { data: financements } = await supabase
    .from('formation_financements')
    .select('*')
    .eq('inscription_id', inscriptionId)

  const formateurNom = session?.formateur_principal || ''
  const formateurPrincipal = formateurNom ? { prenom: '', nom: formateurNom } : null

  return {
    ins: insRaw, contact, session, formation,
    formateurPrincipal, dirigeants, president, refHandicap, financements,
  }
}

export function buildVariables(data: any): Record<string, string> {
  const { ins, contact, session, formation, formateurPrincipal, president, financements } = data

  const modesFinancement = (financements || []).map((f: any) => f.type_financement).filter(Boolean).join(', ')
  const today = new Date()
  const dateGeneration = today.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
  const duree = formation?.duree
  const dureeJours = duree ? Math.ceil(Number(duree) / 7) : ''

  return {
    NOM_STAGIAIRE: contact?.nom || '',
    PRENOM_STAGIAIRE: contact?.prenom || '',
    NOM_PRENOM_STAGIAIRE: `${contact?.prenom || ''} ${contact?.nom || ''}`.trim(),
    DATE_NAISSANCE_STAGIAIRE: fmtDate(ins?.date_naissance_stagiaire),
    LIEU_NAISSANCE_STAGIAIRE: ins?.lieu_naissance_stagiaire || '',
    NATIONALITE_STAGIAIRE: ins?.nationalite_stagiaire || 'française',
    ADRESSE_STAGIAIRE: [ins?.adresse_rue, ins?.adresse_cp, ins?.adresse_ville].filter(Boolean).join(', '),
    EMAIL_STAGIAIRE: contact?.email || '',
    TEL_STAGIAIRE: contact?.telephone || '',
    QUALITE_SIGNATAIRE: 'Bénéficiaire',
    RAISON_SOCIALE_CLIENT: ins?.raison_sociale_client || '',
    FORME_JURIDIQUE_CLIENT: ins?.forme_juridique_client || '',
    ADRESSE_CLIENT: ins?.adresse_client || '',
    SIRET_CLIENT: ins?.siret_client || '',
    REPRESENTANT_CLIENT: ins?.representant_client || '',
    FONCTION_REPRESENTANT: ins?.fonction_representant_client || '',
    TITRE_FORMATION: formation?.titre || '',
    REF_INTERNE: formation?.ref_interne || '',
    DUREE_HEURES: String(duree || ''),
    DUREE_JOURS: String(dureeJours),
    DUREE_SEMAINES: '',
    DUREE_PREVUE: String(duree || ''),
    DUREE_REALISEE: String(duree || ''),
    DATE_DEBUT: fmtDate(session?.date_debut),
    DATE_FIN: fmtDate(session?.date_fin),
    LIEU_FORMATION: session?.lieu || session?.adresse || 'À définir',
    MODALITE: 'Présentiel',
    NB_STAGIAIRES: '1',
    PRIX_HT: fmtPrice(ins?.montant_total_ht),
    PRIX_TTC: fmtPrice(ins?.montant_total_ht),
    VERSION: '1.0',
    DATE_MAJ: dateGeneration,
    DATE_MISE_A_JOUR_RI: dateGeneration,
    AUTRE_FINANCEMENT: modesFinancement,
    MATERIEL_REQUIS: '', MATERIEL_SPECIFIQUE: '',
    CAPACITE: '', ACCESSIBILITE: 'Locaux PMR accessibles',
    OBJECTIF_PROFESSIONNEL_FINALITE: formation?.objectifs || '',
    DESCRIPTION_PUBLIC_VISE: formation?.public_vise || '',
    DESCRIPTION_PREREQUIS: formation?.prerequis || '',
    MODALITE_POSITIONNEMENT: 'Entretien individuel + questionnaire de positionnement',
    DESCRIPTION_EVAL_DIAGNOSTIQUE: '', DESCRIPTION_EVAL_FORMATIVE: '',
    DESCRIPTION_EVAL_SOMMATIVE: '', DESCRIPTION_EPREUVE_FINALE: '',
    DESCRIPTION_SUIVI_POST_FORMATION: '', EPREUVE: '',
    LISTE_LIVRABLES: '', NB_HEURES_REALISEES: '', NB_HEURES_TOTALES: '',
    NB_PAGES: '3', NB_ANNEXES: '8',
    DUREE_J1: '', DUREE_J2: '', DUREE_J3: '', DUREE_JX: '',
    CONTENU_JOUR_1: '', CONTENU_JOUR_2: '', CONTENU_JOUR_3: '', CONTENU_JOUR_X: '',
    OBJECTIF_PEDAGOGIQUE_1: '', OBJECTIF_PEDAGOGIQUE_2: '', OBJECTIF_PEDAGOGIQUE_3: '',
    OBJECTIF_PEDAGOGIQUE_4: '', OBJECTIF_PEDAGOGIQUE_5: '',
    CRITERE_1: '', CRITERE_2: '', CRITERE_3: '', CRITERE_4: '',
    CRITERE_5: '', CRITERE_6: '', CRITERE_7: '', CRITERE_8: '',
    COMPETENCE_ACQUISE_1: '', COMPETENCE_ACQUISE_2: '',
    COMPETENCE_ACQUISE_3: '', COMPETENCE_ACQUISE_4: '',
    INTITULE_EXERCICE_1: '', INTITULE_EXERCICE_2: '', INTITULE_EXERCICE_3: '',
    INTITULE_EXERCICE_4: '', INTITULE_EXERCICE_5: '', INTITULE_EXERCICE_6: '',
    INTITULE_EXERCICE_7: '', INTITULE_EXERCICE_8: '',
    NOM_PRENOM_FORMATEUR: formateurPrincipal ? `${formateurPrincipal.prenom} ${formateurPrincipal.nom}`.trim() : 'À désigner',
    NOM_FORMATEUR_PRINCIPAL: formateurPrincipal ? `${formateurPrincipal.prenom} ${formateurPrincipal.nom}`.trim() : 'À désigner',
    NOM_FORMATEUR: formateurPrincipal ? `${formateurPrincipal.prenom} ${formateurPrincipal.nom}`.trim() : 'À désigner',
    AUTRES_FORMATEURS: '',
    NOM_PRENOM_DIRIGEANT: president ? `${president.prenom || ''} ${president.nom || ''}`.trim() : 'David CANDELIER',
    DATE_NAISSANCE_DIRIGEANT: fmtDate(president?.date_naissance),
    LIEU_NAISSANCE_DIRIGEANT: president?.lieu_naissance || '',
    NATIONALITE_DIRIGEANT: 'française',
    ADRESSE_DIRIGEANT: [president?.adresse_rue, president?.adresse_cp, president?.adresse_ville].filter(Boolean).join(', '),
    FONCTION_DIRIGEANT: 'Président',
    DIPLOMES_DIRIGEANT: president?.diplomes || '',
    EXPERIENCE_DIRIGEANT: president?.experience_synthetique || '',
    FORMATION_FORMATEUR: '', AUTRES_TITRES: '',
    DATE_SIGNATURE: dateGeneration,
    VILLE_SIGNATURE: 'Martigues',
    NOM_PRENOM_SIGNATAIRE_ARDALOS: president ? `${president.prenom || ''} ${president.nom || ''}`.trim() : 'David CANDELIER',
    FONCTION_SIGNATAIRE: 'Président',
    DATE_GENERATION: dateGeneration,
    DATE_SIGNATURE_FORMATEUR: dateGeneration,
  }
}

export function fillTemplate(templateName: string, vars: Record<string, string>): Buffer {
  const templatePath = path.join(TEMPLATES_DIR, templateName)
  const content = fs.readFileSync(templatePath, 'binary')

  const zip = new PizZip(content)
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    nullGetter: () => '',
  })

  doc.render(vars)

  return doc.getZip().generate({ type: 'nodebuffer', compression: 'DEFLATE' })
}

// ============================================================================
// Genere le dossier : renvoie un Buffer (ZIP ou PDF) + filename + contentType
// ============================================================================
export async function generateDossier(
  inscriptionId: string,
  authToken?: string | null,
  selectedTemplates?: string[],
  format: 'zip' | 'pdf' = 'zip',
): Promise<{ buffer: Buffer; filename: string; contentType: string }> {
  const data = await fetchInscriptionData(inscriptionId, authToken)
  const vars = buildVariables(data)

  const validTemplates = (selectedTemplates && selectedTemplates.length > 0)
    ? ALL_TEMPLATE_FILENAMES.filter(t => selectedTemplates.includes(t))
    : ALL_TEMPLATE_FILENAMES

  if (validTemplates.length === 0) {
    throw new Error('Aucun template valide selectionne')
  }

  const stagiaireName = (vars.NOM_STAGIAIRE || 'STAGIAIRE').toUpperCase().replace(/[^A-Z0-9]/g, '_')
  const refInterne = vars.REF_INTERNE || 'FORMATION'
  const rootFolder = `DOSSIER_${stagiaireName}_${refInterne}`

  // Remplit tous les templates en memoire (etape commune aux 2 formats)
  const filledDocxs: { filename: string; buffer: Buffer }[] = []
  const errors: string[] = []
  for (const tplName of validTemplates) {
    try {
      const filled = fillTemplate(tplName, vars)
      const outName = tplName.replace('.docx', `_${stagiaireName}.docx`)
      filledDocxs.push({ filename: outName, buffer: filled })
    } catch (e: any) {
      errors.push(`${tplName}: ${e.message}`)
      console.error('[generateDossier]', tplName, e.message)
    }
  }
  if (filledDocxs.length === 0) {
    throw new Error(`Aucun template n'a pu etre rempli. Erreurs: ${errors.join(' | ')}`)
  }

  // ==== Format ZIP : comportement actuel ====
  if (format === 'zip') {
    const zip = new JSZip()
    for (const d of filledDocxs) {
      zip.file(`${rootFolder}/${d.filename}`, d.buffer)
    }
    const buffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' })
    return {
      buffer,
      filename: `${rootFolder}.zip`,
      contentType: 'application/zip',
    }
  }

  // ==== Format PDF : conversion via CloudConvert + fusion ====
  const pdfFilename = `${rootFolder}.pdf`
  const pdfBuffer = await convertDocxsToSinglePdf(filledDocxs)
  return {
    buffer: pdfBuffer,
    filename: pdfFilename,
    contentType: 'application/pdf',
  }
}

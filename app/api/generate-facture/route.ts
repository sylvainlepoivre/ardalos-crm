// app/api/generate-facture/route.ts
// GET /api/generate-facture?inscriptionId=...
// - Cree (ou retrouve) une facture numerotee ARD-YYYY-NNNN
// - Retourne le PDF de la facture

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { generateFacturePdf, FactureData } from '@/lib/generateFacture'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const supabaseUrl = 'https://cvxzdiutxonnsnwoicqt.supabase.co'
const supabaseKey = 'sb_publishable_J8ta-7L05zgK9rBy2OS9Bg_CjXHwZVK'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const inscriptionId = searchParams.get('inscriptionId')
    const force = searchParams.get('force') === 'true' // regenerer meme si deja existe

    if (!inscriptionId) {
      return NextResponse.json({ error: 'inscriptionId requis' }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // 1. Recuperer l'inscription complete
    const { data: ins, error: errIns } = await supabase
      .from('formation_inscriptions')
      .select('*, contacts(*), formation_sessions(*, formations(titre, ref_interne))')
      .eq('id', inscriptionId)
      .single()

    if (errIns || !ins) {
      return NextResponse.json({ error: `Inscription ${inscriptionId} introuvable` }, { status: 404 })
    }

    if (!ins.montant_total_ht || Number(ins.montant_total_ht) <= 0) {
      return NextResponse.json({ error: 'Montant HT manquant ou nul sur l inscription' }, { status: 400 })
    }

    // 2. Verifier si une facture existe deja pour cette inscription
    let facture: any = null
    if (!force) {
      const { data: existante } = await supabase
        .from('factures')
        .select('*')
        .eq('inscription_id', inscriptionId)
        .maybeSingle()
      if (existante) facture = existante
    }

    // 3. Si pas de facture existante, en creer une
    if (!facture) {
      const annee = new Date().getFullYear()

      // Appeler la fonction SQL pour obtenir le prochain numero
      const { data: rpcData, error: rpcErr } = await supabase
        .rpc('next_facture_numero', { p_annee: annee })

      if (rpcErr) {
        console.error('[facture] RPC error:', rpcErr)
        return NextResponse.json({ error: `Erreur numerotation : ${rpcErr.message}` }, { status: 500 })
      }

      const numeroSeq = rpcData as number
      const numero = `ARD-${annee}-${String(numeroSeq).padStart(4, '0')}`

      // Destinataire : entreprise si raison_sociale, sinon stagiaire
      const isEntreprise = !!ins.raison_sociale_client
      const destinataireNom = isEntreprise
        ? `${ins.raison_sociale_client}${ins.forme_juridique_client ? ' ' + ins.forme_juridique_client : ''}`
        : `${ins.contacts?.prenom || ''} ${ins.contacts?.nom || ''}`.trim()
      const destinataireAdresse = isEntreprise
        ? (ins.adresse_client || '')
        : [ins.adresse_rue, `${ins.adresse_cp || ''} ${ins.adresse_ville || ''}`.trim()].filter(Boolean).join(', ')

      const { data: newFacture, error: errCreate } = await supabase
        .from('factures')
        .insert({
          numero,
          inscription_id: inscriptionId,
          annee,
          numero_sequentiel: numeroSeq,
          montant_ht: Number(ins.montant_total_ht),
          destinataire_nom: destinataireNom,
          destinataire_adresse: destinataireAdresse,
          destinataire_siret: isEntreprise ? ins.siret_client : null,
        })
        .select()
        .single()

      if (errCreate) {
        console.error('[facture] insert error:', errCreate)
        return NextResponse.json({ error: `Erreur creation : ${errCreate.message}` }, { status: 500 })
      }
      facture = newFacture
    }

    // 4. Generer le PDF
    const isEntreprise = !!ins.raison_sociale_client
    const stagiaireNom = `${ins.contacts?.prenom || ''} ${ins.contacts?.nom || ''}`.trim()

    const factureData: FactureData = {
      numero: facture.numero,
      dateEmission: new Date(facture.date_emission),
      destinataireNom: facture.destinataire_nom || 'Client',
      destinataireAdresse: facture.destinataire_adresse || '',
      destinataireSiret: facture.destinataire_siret,
      formationTitre: ins.formation_sessions?.formations?.titre || 'Formation',
      formationDateDebut: ins.formation_sessions?.date_debut ? new Date(ins.formation_sessions.date_debut) : null,
      formationDateFin: ins.formation_sessions?.date_fin ? new Date(ins.formation_sessions.date_fin) : null,
      formationRef: ins.formation_sessions?.formations?.ref_interne || null,
      stagiairePrenomNom: isEntreprise ? stagiaireNom : null,
      montantHT: Number(facture.montant_ht),
    }

    const pdfBytes = await generateFacturePdf(factureData)

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="FACTURE_${facture.numero}.pdf"`,
      },
    })
  } catch (e: any) {
    console.error('[generate-facture] erreur:', e)
    return NextResponse.json({ error: e?.message || 'Erreur inconnue' }, { status: 500 })
  }
}

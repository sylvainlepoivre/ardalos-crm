'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/useAuth'
import { supabase } from '@/lib/supabase'

const BLEU = '#1A2C6B'
const DORE = '#C9A84C'
const VERT = '#059669'
const ORANGE = '#f97316'

// ============================================================================
// HELPERS
// ============================================================================
function todayISO(): string { return new Date().toISOString().split('T')[0] }
function fmtEuro(n: number): string {
  return n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'
}
function fmtDateFR(d: string | null | undefined): string {
  if (!d) return ''
  try { return new Date(d).toLocaleDateString('fr-FR') } catch { return '' }
}
// CSV: échappe les virgules, guillemets, retours à la ligne
function csvCell(v: any): string {
  if (v === null || v === undefined) return ''
  const s = String(v)
  if (s.includes(';') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
    return '"' + s.replace(/"/g, '""') + '"'
  }
  return s
}
function csvLine(cells: any[]): string {
  return cells.map(csvCell).join(';')
}
// Format nombre pour Excel FR (virgule décimale, pas de symbole €)
function numExcel(n: number | null | undefined): string {
  if (n === null || n === undefined || isNaN(Number(n))) return ''
  return Number(n).toFixed(2).replace('.', ',')
}

// ============================================================================
// PERIODES PREDEFINIES
// ============================================================================
function getPeriode(key: string): { start: string; end: string; label: string } {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const pad = (n: number) => String(n).padStart(2, '0')
  const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

  switch (key) {
    case 'mois_en_cours': {
      return { start: iso(new Date(year, month, 1)), end: iso(new Date(year, month + 1, 0)), label: 'Mois en cours' }
    }
    case 'mois_dernier': {
      return { start: iso(new Date(year, month - 1, 1)), end: iso(new Date(year, month, 0)), label: 'Mois dernier' }
    }
    case 'trimestre': {
      const q = Math.floor(month / 3)
      return { start: iso(new Date(year, q * 3, 1)), end: iso(new Date(year, q * 3 + 3, 0)), label: 'Trimestre en cours' }
    }
    case 'annee': {
      return { start: `${year}-01-01`, end: `${year}-12-31`, label: 'Année en cours' }
    }
    case 'tout': {
      return { start: '2020-01-01', end: '2099-12-31', label: 'Toutes les inscriptions' }
    }
    default:
      return { start: iso(new Date(year, month, 1)), end: iso(new Date(year, month + 1, 0)), label: 'Mois en cours' }
  }
}

// ============================================================================
// PAGE
// ============================================================================
function ExportContent() {
  const [inscriptions, setInscriptions] = useState<any[]>([])
  const [financements, setFinancements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Filtres
  const [periodeKey, setPeriodeKey] = useState<string>('mois_en_cours')
  const initial = getPeriode('mois_en_cours')
  const [dateStart, setDateStart] = useState(initial.start)
  const [dateEnd, setDateEnd] = useState(initial.end)
  const [statutFilter, setStatutFilter] = useState<'all' | 'confirmes' | 'hors_prospect'>('all')

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const [ins, fin] = await Promise.all([
      supabase.from('formation_inscriptions').select('*, contacts(*), formation_sessions(*, formations(titre, ref_interne))').order('created_at', { ascending: false }),
      supabase.from('formation_financements').select('*'),
    ])
    setInscriptions(ins.data || [])
    setFinancements(fin.data || [])
    setLoading(false)
  }

  function selectPeriode(key: string) {
    setPeriodeKey(key)
    const p = getPeriode(key)
    setDateStart(p.start); setDateEnd(p.end)
  }

  // ==========================================================================
  // FILTRAGE
  // ==========================================================================
  const startDate = new Date(dateStart + 'T00:00:00')
  const endDate = new Date(dateEnd + 'T23:59:59')

  const filtered = inscriptions.filter(ins => {
    // Filtre par date (created_at)
    const d = ins.created_at ? new Date(ins.created_at) : null
    if (!d || d < startDate || d > endDate) return false

    // Filtre par statut
    if (statutFilter === 'confirmes' && !['confirme', 'present'].includes(ins.statut)) return false
    if (statutFilter === 'hors_prospect' && ins.statut === 'prospect') return false

    return true
  })

  // Totaux aperçu
  const totalHT = filtered.reduce((s, i) => s + (Number(i.montant_total_ht) || 0), 0)
  const totalFinance = filtered.reduce((s, ins) => {
    const fins = financements.filter(f => f.inscription_id === ins.id)
    return s + fins.reduce((a, f) => a + (Number(f.montant_ht) || 0), 0)
  }, 0)
  const totalReste = Math.max(0, totalHT - totalFinance)

  // ==========================================================================
  // GENERATION CSV
  // ==========================================================================
  function genererCSV(): string {
    // Header
    const header = [
      'Date inscription', 'Date confirmation', 'Statut',
      'Prénom stagiaire', 'Nom stagiaire', 'Email stagiaire', 'Téléphone stagiaire',
      'Formation', 'Référence interne',
      'Date début session', 'Date fin session',
      'Montant HT (€)',
      'Type client', 'Raison sociale', 'SIRET',
      'Financement AFDAS (€)', 'Financement CPF (€)', 'Autres financements (€)',
      'Total financé (€)', 'Reste à charge (€)',
      'Commercial',
      'Devis envoyé', 'Convention envoyée', 'Convention signée',
      'Demande financement envoyée', 'Date décision financement',
      'Statut prospection', 'Date dernier contact', 'Date rappel prévu',
      'Réf dossier AFDAS', 'Statut dossier AFDAS',
    ]

    const lines: string[] = [csvLine(header)]

    for (const ins of filtered) {
      const fins = financements.filter(f => f.inscription_id === ins.id)
      const afdas = fins.filter(f => f.type_financement === 'AFDAS')
      const afdasTotal = afdas.reduce((a, f) => a + (Number(f.montant_ht) || 0), 0)
      const cpfTotal = fins.filter(f => f.type_financement === 'CPF').reduce((a, f) => a + (Number(f.montant_ht) || 0), 0)
      const autresTotal = fins.filter(f => !['AFDAS', 'CPF'].includes(f.type_financement || '')).reduce((a, f) => a + (Number(f.montant_ht) || 0), 0)
      const totalFin = afdasTotal + cpfTotal + autresTotal
      const montant = Number(ins.montant_total_ht) || 0
      const reste = Math.max(0, montant - totalFin)

      // Ref et statut AFDAS (on prend le premier financement AFDAS s'il existe)
      const refAfdas = afdas.length > 0 ? afdas[0].reference_dossier || '' : ''
      const statutAfdas = afdas.length > 0 ? afdas[0].statut_dossier || '' : ''

      // Type client
      const typeClient = ins.raison_sociale_client ? 'Entreprise' : 'Stagiaire direct'

      const row = [
        fmtDateFR(ins.date_inscription || ins.created_at),
        fmtDateFR(ins.date_confirmation),
        ins.statut || '',
        ins.contacts?.prenom || '',
        ins.contacts?.nom || '',
        ins.contacts?.email || '',
        ins.contacts?.telephone || '',
        ins.formation_sessions?.formations?.titre || '',
        ins.formation_sessions?.formations?.ref_interne || '',
        fmtDateFR(ins.formation_sessions?.date_debut),
        fmtDateFR(ins.formation_sessions?.date_fin),
        numExcel(montant),
        typeClient,
        ins.raison_sociale_client || '',
        ins.siret_client || '',
        numExcel(afdasTotal),
        numExcel(cpfTotal),
        numExcel(autresTotal),
        numExcel(totalFin),
        numExcel(reste),
        ins.commercial_responsable || '',
        ins.devis_envoye_at ? 'OUI' : 'NON',
        ins.convention_envoyee_at ? 'OUI' : 'NON',
        ins.convention_signee_at ? 'OUI' : 'NON',
        ins.demande_financement_envoyee_at ? 'OUI' : 'NON',
        fmtDateFR(ins.date_decision_financement),
        ins.statut_prospection || '',
        fmtDateFR(ins.date_dernier_contact),
        fmtDateFR(ins.date_rappel_prevu),
        refAfdas,
        statutAfdas,
      ]
      lines.push(csvLine(row))
    }

    return lines.join('\n')
  }

  function downloadCSV() {
    if (filtered.length === 0) {
      alert("Aucune inscription à exporter avec les filtres actuels.")
      return
    }
    const csv = genererCSV()
    // BOM UTF-8 pour que Excel Windows lise les accents correctement
    const BOM = '\uFEFF'
    const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const periodeLabel = getPeriode(periodeKey).label.replace(/\s+/g, '_').replace(/[àéèêù]/gi, 'x')
    a.download = `export_ardalos_${dateStart}_${dateEnd}.csv`
    document.body.appendChild(a); a.click(); a.remove()
    URL.revokeObjectURL(url)
  }

  if (loading) return <div style={{ fontFamily: 'sans-serif', padding: '40px', color: '#9ca3af' }}>Chargement...</div>

  return (
    <div style={{ fontFamily: 'sans-serif', padding: '32px 40px', maxWidth: '1100px', margin: '0 auto' }}>
      <h1 style={{ color: BLEU, fontSize: '1.8rem', margin: 0 }}>📊 Export comptable</h1>
      <p style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '24px' }}>
        Export CSV pour Julien · compatible Excel · <a href="/" style={{ color: BLEU }}>← Accueil</a>
      </p>

      {/* PERIODE PREDEFINIE */}
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px', marginBottom: '16px' }}>
        <h3 style={{ color: BLEU, fontSize: '14px', marginTop: 0, marginBottom: '12px' }}>📅 Période à exporter</h3>

        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '16px' }}>
          {[
            { k: 'mois_en_cours', l: 'Ce mois' },
            { k: 'mois_dernier', l: 'Mois dernier' },
            { k: 'trimestre', l: 'Trimestre' },
            { k: 'annee', l: 'Année en cours' },
            { k: 'tout', l: 'Tout' },
          ].map(p => (
            <button key={p.k} onClick={() => selectPeriode(p.k)} style={{
              background: periodeKey === p.k ? BLEU : '#fff',
              color: periodeKey === p.k ? '#fff' : BLEU,
              border: `1px solid ${BLEU}`,
              padding: '8px 14px', borderRadius: '6px', fontSize: '13px', cursor: 'pointer',
              fontWeight: periodeKey === p.k ? 600 : 400,
            }}>{p.l}</button>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Du :</label>
            <input type="date" value={dateStart} onChange={e => { setDateStart(e.target.value); setPeriodeKey('custom') }} style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px' }} />
          </div>
          <div>
            <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Au :</label>
            <input type="date" value={dateEnd} onChange={e => { setDateEnd(e.target.value); setPeriodeKey('custom') }} style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px' }} />
          </div>
        </div>
      </div>

      {/* FILTRE STATUT */}
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px', marginBottom: '16px' }}>
        <h3 style={{ color: BLEU, fontSize: '14px', marginTop: 0, marginBottom: '12px' }}>🎯 Statut des inscriptions</h3>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {[
            { k: 'all', l: 'Toutes les inscriptions' },
            { k: 'hors_prospect', l: 'Hors prospects' },
            { k: 'confirmes', l: 'Confirmés + Présents uniquement' },
          ].map(f => (
            <button key={f.k} onClick={() => setStatutFilter(f.k as any)} style={{
              background: statutFilter === f.k ? BLEU : '#fff',
              color: statutFilter === f.k ? '#fff' : BLEU,
              border: `1px solid ${BLEU}`,
              padding: '8px 14px', borderRadius: '6px', fontSize: '13px', cursor: 'pointer',
              fontWeight: statutFilter === f.k ? 600 : 400,
            }}>{f.l}</button>
          ))}
        </div>
      </div>

      {/* APERCU */}
      <div style={{ background: 'linear-gradient(135deg, #1A2C6B 0%, #2d4491 100%)', borderRadius: '12px', padding: '24px', marginBottom: '16px', color: '#fff' }}>
        <h3 style={{ color: DORE, fontSize: '14px', marginTop: 0, marginBottom: '16px' }}>📋 Aperçu de l'export</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
          <div>
            <div style={{ fontSize: '11px', opacity: 0.75, marginBottom: '4px' }}>Inscriptions</div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: DORE }}>{filtered.length}</div>
          </div>
          <div>
            <div style={{ fontSize: '11px', opacity: 0.75, marginBottom: '4px' }}>Total HT</div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: DORE }}>{fmtEuro(totalHT)}</div>
          </div>
          <div>
            <div style={{ fontSize: '11px', opacity: 0.75, marginBottom: '4px' }}>Total financé</div>
            <div style={{ fontSize: '24px', fontWeight: 700 }}>{fmtEuro(totalFinance)}</div>
          </div>
          <div>
            <div style={{ fontSize: '11px', opacity: 0.75, marginBottom: '4px' }}>Reste à charge</div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: totalReste > 0 ? '#fbbf24' : '#86efac' }}>{fmtEuro(totalReste)}</div>
          </div>
        </div>
      </div>

      {/* BOUTON TELECHARGEMENT */}
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <button
          onClick={downloadCSV}
          disabled={filtered.length === 0}
          style={{
            background: filtered.length === 0 ? '#9ca3af' : DORE,
            color: '#fff', border: 'none', borderRadius: '10px',
            padding: '14px 32px', fontSize: '15px', fontWeight: 600,
            cursor: filtered.length === 0 ? 'not-allowed' : 'pointer',
            boxShadow: filtered.length === 0 ? 'none' : '0 4px 12px rgba(201,168,76,0.3)',
          }}>
          📥 Télécharger le CSV ({filtered.length} lignes)
        </button>
        <p style={{ color: '#9ca3af', fontSize: '11px', marginTop: '10px' }}>
          💡 Le CSV s'ouvre directement dans Excel · séparateur point-virgule · encodage UTF-8 avec BOM
        </p>
      </div>

      {/* APERCU DES LIGNES (top 10) */}
      {filtered.length > 0 && (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden', marginBottom: '16px' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}>
            <strong style={{ color: BLEU, fontSize: '13px' }}>📋 Aperçu (10 premières lignes)</strong>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead style={{ background: '#f9fafb' }}>
                <tr>
                  <th style={{ padding: '8px', textAlign: 'left', color: '#6b7280', fontSize: '11px' }}>Date</th>
                  <th style={{ padding: '8px', textAlign: 'left', color: '#6b7280', fontSize: '11px' }}>Stagiaire</th>
                  <th style={{ padding: '8px', textAlign: 'left', color: '#6b7280', fontSize: '11px' }}>Formation</th>
                  <th style={{ padding: '8px', textAlign: 'left', color: '#6b7280', fontSize: '11px' }}>Statut</th>
                  <th style={{ padding: '8px', textAlign: 'right', color: '#6b7280', fontSize: '11px' }}>Montant</th>
                  <th style={{ padding: '8px', textAlign: 'left', color: '#6b7280', fontSize: '11px' }}>Commercial</th>
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 10).map(ins => (
                  <tr key={ins.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '8px', color: '#6b7280' }}>{fmtDateFR(ins.created_at)}</td>
                    <td style={{ padding: '8px', color: BLEU, fontWeight: 500 }}>{ins.contacts?.prenom} {ins.contacts?.nom}</td>
                    <td style={{ padding: '8px' }}>{ins.formation_sessions?.formations?.titre?.substring(0, 40) || '—'}</td>
                    <td style={{ padding: '8px' }}><em>{ins.statut}</em></td>
                    <td style={{ padding: '8px', textAlign: 'right', color: DORE, fontWeight: 500 }}>{fmtEuro(Number(ins.montant_total_ht) || 0)}</td>
                    <td style={{ padding: '8px', color: '#6b7280' }}>{ins.commercial_responsable || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length > 10 && (
              <div style={{ padding: '10px', textAlign: 'center', color: '#9ca3af', fontSize: '11px', background: '#f9fafb' }}>
                ... et {filtered.length - 10} autres lignes incluses dans le CSV.
              </div>
            )}
          </div>
        </div>
      )}

      {/* AIDE POUR JULIEN */}
      <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '16px', fontSize: '12px', color: '#6b7280' }}>
        <strong style={{ color: BLEU }}>📬 Pour Julien :</strong> le fichier CSV contient 31 colonnes incluant les infos stagiaire,
        formation, financements détaillés (AFDAS / CPF / autres), reste à charge, statut des documents,
        références dossiers AFDAS et commercial responsable. Il s'ouvre directement dans Excel avec les accents
        correctement encodés. En cas de souci d'ouverture : Données → Depuis un texte/CSV → Origine du fichier UTF-8.
      </div>
    </div>
  )
}

export default function ExportComptaPage() {
  const { loading } = useAuth()
  if (loading) return <div style={{ fontFamily: 'sans-serif', padding: '40px', color: '#9ca3af' }}>Chargement...</div>
  return <ExportContent />
}

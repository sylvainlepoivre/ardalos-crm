'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/useAuth'
import { supabase } from '@/lib/supabase'

const BLEU = '#1A2C6B'
const DORE = '#C9A84C'
const VERT = '#059669'

function fmtEuro(n: number): string {
  return n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'
}
function fmtDate(d: string | null | undefined): string {
  if (!d) return ''
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function FacturesContent() {
  const [factures, setFactures] = useState<any[]>([])
  const [inscriptions, setInscriptions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [yearFilter, setYearFilter] = useState<number | 'all'>('all')
  const [search, setSearch] = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const [factResp, insResp] = await Promise.all([
      supabase.from('factures').select('*').order('created_at', { ascending: false }),
      supabase.from('formation_inscriptions').select('id, contacts(prenom, nom), formation_sessions(formations(titre))'),
    ])
    setFactures(factResp.data || [])
    setInscriptions(insResp.data || [])
    setLoading(false)
  }

  async function downloadFacture(facture: any) {
    try {
      const res = await fetch(`/api/generate-facture?inscriptionId=${facture.inscription_id}`)
      if (!res.ok) { alert('Erreur téléchargement facture'); return }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `FACTURE_${facture.numero}.pdf`
      document.body.appendChild(a); a.click(); a.remove()
      URL.revokeObjectURL(url)
    } catch (e: any) {
      alert('Erreur : ' + (e?.message || 'inconnue'))
    }
  }

  // Enrichir les factures avec l'inscription (stagiaire + formation)
  const enriched = factures.map(f => {
    const ins = inscriptions.find(i => i.id === f.inscription_id)
    return {
      ...f,
      stagiaire: ins?.contacts ? `${ins.contacts.prenom} ${ins.contacts.nom}` : null,
      formation: ins?.formation_sessions?.formations?.titre || null,
    }
  })

  // Années disponibles
  const annees = Array.from(new Set(enriched.map(f => f.annee))).sort((a, b) => b - a)

  // Filtres
  const filtered = enriched.filter(f => {
    if (yearFilter !== 'all' && f.annee !== yearFilter) return false
    if (search.trim()) {
      const q = search.toLowerCase().trim()
      const matches = [f.numero, f.destinataire_nom, f.stagiaire, f.formation]
        .filter(Boolean)
        .some(s => String(s).toLowerCase().includes(q))
      if (!matches) return false
    }
    return true
  })

  const totalHT = filtered.reduce((s, f) => s + (Number(f.montant_ht) || 0), 0)

  if (loading) return <div style={{ fontFamily: 'sans-serif', padding: '40px', color: '#9ca3af' }}>Chargement...</div>

  return (
    <div style={{ fontFamily: 'sans-serif', padding: '32px 40px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <h1 style={{ color: BLEU, fontSize: '1.8rem', margin: 0 }}>📄 Factures</h1>
        <a href="/inscriptions" style={{ background: '#fff', color: BLEU, border: `1px solid ${BLEU}`, borderRadius: '6px', padding: '6px 14px', textDecoration: 'none', fontSize: '12px' }}>← Inscriptions</a>
      </div>
      <p style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '20px' }}>
        {factures.length} facture{factures.length > 1 ? 's' : ''} générée{factures.length > 1 ? 's' : ''} · <a href="/" style={{ color: BLEU }}>← Accueil</a>
      </p>

      {/* BANNIERE CA TOTAL */}
      <div style={{
        background: 'linear-gradient(135deg, #1A2C6B 0%, #2d4491 100%)',
        borderRadius: '12px', padding: '20px 24px', marginBottom: '20px', color: '#fff',
      }}>
        <div style={{ fontSize: '11px', color: DORE, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '4px' }}>
          💰 CA facturé{yearFilter !== 'all' ? ` en ${yearFilter}` : ' (total)'}
        </div>
        <div style={{ fontSize: '28px', fontWeight: 700, color: DORE }}>{fmtEuro(totalHT)}</div>
        <div style={{ fontSize: '12px', opacity: 0.75, marginTop: '2px' }}>
          Sur {filtered.length} facture{filtered.length > 1 ? 's' : ''} affichée{filtered.length > 1 ? 's' : ''}
        </div>
      </div>

      {/* FILTRES */}
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '16px', marginBottom: '20px', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '12px', color: '#6b7280' }}>Année :</span>
        <button onClick={() => setYearFilter('all')}
          style={{
            background: yearFilter === 'all' ? BLEU : '#fff',
            color: yearFilter === 'all' ? '#fff' : BLEU,
            border: `1px solid ${BLEU}`,
            padding: '5px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer',
          }}>Toutes ({factures.length})</button>
        {annees.map(a => {
          const count = factures.filter(f => f.annee === a).length
          return (
            <button key={a} onClick={() => setYearFilter(a)}
              style={{
                background: yearFilter === a ? BLEU : '#fff',
                color: yearFilter === a ? '#fff' : BLEU,
                border: `1px solid ${BLEU}`,
                padding: '5px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer',
              }}>{a} ({count})</button>
          )
        })}
        <input
          type="text" placeholder="🔍 Rechercher (N°, stagiaire, destinataire...)"
          value={search} onChange={e => setSearch(e.target.value)}
          style={{
            marginLeft: 'auto', flex: '0 1 280px',
            padding: '6px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '12px',
          }}
        />
      </div>

      {/* LISTE */}
      {filtered.length === 0 ? (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '60px', textAlign: 'center', color: '#9ca3af' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>📄</div>
          <p style={{ fontWeight: 500 }}>{factures.length === 0 ? 'Aucune facture générée pour le moment' : 'Aucune facture ne correspond aux filtres'}</p>
          {factures.length === 0 && (
            <p style={{ fontSize: '12px', marginTop: '8px' }}>
              Les factures sont générées automatiquement depuis la page{' '}
              <a href="/inscriptions" style={{ color: BLEU }}>Inscriptions</a> via le bouton vert 📄 Facture.
            </p>
          )}
        </div>
      ) : (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                <th style={{ padding: '10px 12px', textAlign: 'left', color: '#6b7280', fontSize: '11px' }}>N° Facture</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', color: '#6b7280', fontSize: '11px' }}>Date</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', color: '#6b7280', fontSize: '11px' }}>Destinataire</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', color: '#6b7280', fontSize: '11px' }}>Stagiaire</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', color: '#6b7280', fontSize: '11px' }}>Formation</th>
                <th style={{ padding: '10px 12px', textAlign: 'right', color: '#6b7280', fontSize: '11px' }}>Montant HT</th>
                <th style={{ padding: '10px 12px', textAlign: 'center', color: '#6b7280', fontSize: '11px' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(f => (
                <tr key={f.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '10px 12px' }}>
                    <div style={{ fontWeight: 600, color: BLEU }}>{f.numero}</div>
                  </td>
                  <td style={{ padding: '10px 12px', color: '#6b7280' }}>{fmtDate(f.date_emission)}</td>
                  <td style={{ padding: '10px 12px' }}>
                    <div style={{ color: '#1f2937' }}>{f.destinataire_nom || '—'}</div>
                    {f.destinataire_siret && <div style={{ fontSize: '10px', color: '#9ca3af' }}>SIRET : {f.destinataire_siret}</div>}
                  </td>
                  <td style={{ padding: '10px 12px', fontSize: '12px', color: '#6b7280' }}>{f.stagiaire || '—'}</td>
                  <td style={{ padding: '10px 12px', fontSize: '12px', color: '#6b7280' }}>
                    {f.formation ? (f.formation.length > 35 ? f.formation.substring(0, 35) + '…' : f.formation) : '—'}
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', color: DORE, fontWeight: 600 }}>
                    {fmtEuro(Number(f.montant_ht) || 0)}
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                    <button onClick={() => downloadFacture(f)}
                      style={{
                        background: VERT, color: '#fff', border: 'none',
                        padding: '5px 12px', borderRadius: '4px', fontSize: '12px',
                        cursor: 'pointer', fontWeight: 500,
                      }}>
                      📥 PDF
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ background: '#f9fafb', borderTop: '2px solid #e5e7eb' }}>
                <td colSpan={5} style={{ padding: '12px', fontSize: '12px', color: '#6b7280', fontWeight: 600 }}>
                  Total ({filtered.length} facture{filtered.length > 1 ? 's' : ''})
                </td>
                <td style={{ padding: '12px', textAlign: 'right', color: BLEU, fontWeight: 700, fontSize: '14px' }}>
                  {fmtEuro(totalHT)}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* AIDE */}
      <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '16px', fontSize: '12px', color: '#6b7280', marginTop: '20px' }}>
        <strong style={{ color: BLEU }}>💡 Astuce :</strong> Les factures sont générées automatiquement avec la numérotation{' '}
        <code style={{ background: '#fff', padding: '2px 6px', borderRadius: '4px', fontSize: '11px' }}>ARD-ANNEE-NNNN</code>{' '}
        (ex: ARD-2026-0001). Une facture est créée pour chaque inscription ayant un montant HT renseigné, via le bouton vert{' '}
        <strong style={{ color: VERT }}>📄 Facture</strong> depuis la page Inscriptions. La numérotation redémarre chaque 1er janvier.
      </div>
    </div>
  )
}

export default function FacturesPage() {
  const { loading } = useAuth()
  if (loading) return <div style={{ fontFamily: 'sans-serif', padding: '40px', color: '#9ca3af' }}>Chargement...</div>
  return <FacturesContent />
}

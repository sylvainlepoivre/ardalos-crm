'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/useAuth'
import { supabase } from '@/lib/supabase'
import { PHASES_PIPELINE, getPhase, STATUTS_PROSPECTION, COMMERCIAUX } from '@/lib/pipelineConstants'

const BLEU = '#1A2C6B'
const DORE = '#C9A84C'

type Ins = any // alias simplifié

function fmtDate(d: string | null) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
}
function daysSince(d: string | null) {
  if (!d) return 0
  return Math.floor((Date.now() - new Date(d).getTime()) / (1000 * 60 * 60 * 24))
}

function PipelineContent() {
  const [inscriptions, setInscriptions] = useState<Ins[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'kanban' | 'list'>('kanban')
  const [filterCommercial, setFilterCommercial] = useState<string>('all')
  const [draggingId, setDraggingId] = useState<string | null>(null)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('formation_inscriptions')
      .select('*, contacts(prenom, nom, email, telephone), formation_sessions(date_debut, date_fin, formations(titre, ref_interne))')
      .order('created_at', { ascending: false })
    setInscriptions(data || [])
    setLoading(false)
  }

  // Déplacer une inscription vers une nouvelle phase
  async function moveToPhase(insId: string, targetPhase: string) {
    const ins = inscriptions.find(i => i.id === insId)
    if (!ins) return

    const currentPhase = getPhase(ins)
    if (currentPhase === targetPhase) return

    const now = new Date().toISOString()
    const patch: any = {}

    // Règles de progression selon la phase cible
    if (targetPhase === 'prospection') {
      // Retour en prospection : on enlève les dates envoi
      patch.devis_envoye_at = null
      patch.programme_envoye_at = null
      patch.convention_envoyee_at = null
      patch.demande_financement_envoyee_at = null
      if (ins.statut === 'confirme') patch.statut = 'inscrit'
    } else if (targetPhase === 'dossier') {
      // Vers dossier : on marque au moins le devis comme envoyé
      if (!ins.devis_envoye_at) patch.devis_envoye_at = now
      patch.demande_financement_envoyee_at = null
      if (ins.statut === 'confirme') patch.statut = 'inscrit'
    } else if (targetPhase === 'financement') {
      // Vers financement : on marque la demande comme envoyée
      if (!ins.demande_financement_envoyee_at) patch.demande_financement_envoyee_at = now
    } else if (targetPhase === 'cloture') {
      // Vers clôture : on passe en confirmé
      if (ins.statut !== 'confirme' && ins.statut !== 'present') patch.statut = 'confirme'
      if (!ins.date_confirmation) patch.date_confirmation = now
    }

    const { error } = await supabase.from('formation_inscriptions').update(patch).eq('id', insId)
    if (error) { alert('Erreur : ' + error.message); return }

    // Log
    await supabase.from('inscription_etapes_log').insert({
      inscription_id: insId,
      etape: 'phase_pipeline',
      ancien_statut: currentPhase,
      nouveau_statut: targetPhase,
      fait_par: ins.commercial_responsable || 'Système',
    })

    await load()
  }

  const filtered = filterCommercial === 'all'
    ? inscriptions
    : filterCommercial === 'unassigned'
      ? inscriptions.filter(i => !i.commercial_responsable)
      : inscriptions.filter(i => i.commercial_responsable === filterCommercial)

  // Groupées par phase
  const byPhase: Record<string, Ins[]> = { prospection: [], dossier: [], financement: [], cloture: [] }
  filtered.forEach(i => { byPhase[getPhase(i)].push(i) })

  if (loading) return <div style={{ fontFamily: 'sans-serif', padding: '40px', color: '#9ca3af' }}>Chargement du pipeline...</div>

  return (
    <div style={{ fontFamily: 'sans-serif', padding: '24px 32px', maxWidth: '1600px', margin: '0 auto' }}>
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <h1 style={{ color: BLEU, fontSize: '1.8rem', margin: 0 }}>🎯 Pipeline commercial</h1>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => setView('kanban')} style={{ background: view === 'kanban' ? BLEU : '#fff', color: view === 'kanban' ? '#fff' : BLEU, border: `1px solid ${BLEU}`, borderRadius: '6px', padding: '6px 14px', cursor: 'pointer', fontSize: '12px', fontWeight: 500 }}>📊 Kanban</button>
          <button onClick={() => setView('list')} style={{ background: view === 'list' ? BLEU : '#fff', color: view === 'list' ? '#fff' : BLEU, border: `1px solid ${BLEU}`, borderRadius: '6px', padding: '6px 14px', cursor: 'pointer', fontSize: '12px', fontWeight: 500 }}>📋 Liste</button>
          <a href="/inscriptions" style={{ background: '#fff', color: BLEU, border: `1px solid ${BLEU}`, borderRadius: '6px', padding: '6px 14px', textDecoration: 'none', fontSize: '12px' }}>← Inscriptions</a>
        </div>
      </div>
      <p style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '20px' }}>
        {filtered.length} dossier{filtered.length > 1 ? 's' : ''} · <a href="/" style={{ color: BLEU }}>← Accueil</a>
      </p>

      {/* FILTRE COMMERCIAL */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: '12px', color: '#6b7280', marginRight: '6px' }}>Commercial :</span>
        <button onClick={() => setFilterCommercial('all')} style={{ background: filterCommercial === 'all' ? BLEU : '#fff', color: filterCommercial === 'all' ? '#fff' : BLEU, border: `1px solid ${BLEU}`, padding: '4px 10px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer' }}>Tous ({inscriptions.length})</button>
        {COMMERCIAUX.map(c => {
          const count = inscriptions.filter(i => i.commercial_responsable === c).length
          return <button key={c} onClick={() => setFilterCommercial(c)} style={{ background: filterCommercial === c ? BLEU : '#fff', color: filterCommercial === c ? '#fff' : BLEU, border: `1px solid ${BLEU}`, padding: '4px 10px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer' }}>{c} ({count})</button>
        })}
        <button onClick={() => setFilterCommercial('unassigned')} style={{ background: filterCommercial === 'unassigned' ? '#f97316' : '#fff', color: filterCommercial === 'unassigned' ? '#fff' : '#f97316', border: `1px solid #f97316`, padding: '4px 10px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer' }}>
          ⚠️ Non attribués ({inscriptions.filter(i => !i.commercial_responsable).length})
        </button>
      </div>

      {/* VUE KANBAN */}
      {view === 'kanban' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
          {PHASES_PIPELINE.map(phase => (
            <div
              key={phase.key}
              onDragOver={(e) => { e.preventDefault() }}
              onDrop={(e) => {
                e.preventDefault()
                if (draggingId) {
                  moveToPhase(draggingId, phase.key)
                  setDraggingId(null)
                }
              }}
              style={{
                background: phase.bg, borderRadius: '12px', padding: '12px',
                minHeight: '500px', border: `2px dashed transparent`,
                transition: 'border 0.2s',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', padding: '0 4px' }}>
                <strong style={{ color: phase.color, fontSize: '14px' }}>{phase.label}</strong>
                <span style={{ background: phase.color, color: '#fff', borderRadius: '10px', padding: '2px 8px', fontSize: '11px', fontWeight: 600 }}>{byPhase[phase.key].length}</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {byPhase[phase.key].length === 0 && (
                  <div style={{ textAlign: 'center', color: '#9ca3af', fontSize: '11px', padding: '20px', fontStyle: 'italic' }}>
                    Aucun dossier
                  </div>
                )}
                {byPhase[phase.key].map(ins => (
                  <div
                    key={ins.id}
                    draggable
                    onDragStart={() => setDraggingId(ins.id)}
                    onDragEnd={() => setDraggingId(null)}
                    onClick={() => { window.location.href = `/inscriptions` }}
                    style={{
                      background: '#fff', borderRadius: '8px', padding: '10px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.05)', cursor: 'grab',
                      border: draggingId === ins.id ? `2px solid ${DORE}` : '1px solid #e5e7eb',
                      opacity: draggingId === ins.id ? 0.5 : 1,
                    }}
                  >
                    <div style={{ color: BLEU, fontWeight: 600, fontSize: '13px' }}>
                      {ins.contacts?.prenom} {ins.contacts?.nom}
                    </div>
                    <div style={{ color: '#6b7280', fontSize: '11px', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {ins.formation_sessions?.formations?.titre || '—'}
                    </div>
                    {ins.commercial_responsable && (
                      <div style={{ color: '#9ca3af', fontSize: '10px', marginTop: '4px' }}>
                        👤 {ins.commercial_responsable}
                      </div>
                    )}
                    {/* Indicateurs rapides */}
                    <div style={{ display: 'flex', gap: '4px', marginTop: '6px', flexWrap: 'wrap' }}>
                      {ins.devis_envoye_at && <span style={{ fontSize: '9px', padding: '1px 5px', background: '#dbeafe', color: '#1e40af', borderRadius: '4px' }}>Devis</span>}
                      {ins.programme_envoye_at && <span style={{ fontSize: '9px', padding: '1px 5px', background: '#dbeafe', color: '#1e40af', borderRadius: '4px' }}>Prog</span>}
                      {ins.convention_envoyee_at && <span style={{ fontSize: '9px', padding: '1px 5px', background: '#dbeafe', color: '#1e40af', borderRadius: '4px' }}>Conv</span>}
                      {ins.convention_signee_at && <span style={{ fontSize: '9px', padding: '1px 5px', background: '#d1fae5', color: '#065f46', borderRadius: '4px' }}>✓ Signée</span>}
                      {ins.demande_financement_envoyee_at && <span style={{ fontSize: '9px', padding: '1px 5px', background: '#fef3c7', color: '#92400e', borderRadius: '4px' }}>AFDAS</span>}
                    </div>
                    {ins.date_rappel_prevu && daysSince(ins.date_rappel_prevu) >= 0 && (
                      <div style={{ color: daysSince(ins.date_rappel_prevu) >= 0 ? '#ef4444' : '#9ca3af', fontSize: '10px', marginTop: '4px' }}>
                        🔔 Rappel : {fmtDate(ins.date_rappel_prevu)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* VUE LISTE */}
      {view === 'list' && (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                <th style={{ padding: '10px', textAlign: 'left', fontSize: '11px', color: '#6b7280' }}>Phase</th>
                <th style={{ padding: '10px', textAlign: 'left', fontSize: '11px', color: '#6b7280' }}>Stagiaire</th>
                <th style={{ padding: '10px', textAlign: 'left', fontSize: '11px', color: '#6b7280' }}>Formation</th>
                <th style={{ padding: '10px', textAlign: 'left', fontSize: '11px', color: '#6b7280' }}>Commercial</th>
                <th style={{ padding: '10px', textAlign: 'left', fontSize: '11px', color: '#6b7280' }}>Prospection</th>
                <th style={{ padding: '10px', textAlign: 'center', fontSize: '11px', color: '#6b7280' }}>Documents</th>
                <th style={{ padding: '10px', textAlign: 'left', fontSize: '11px', color: '#6b7280' }}>Rappel</th>
                <th style={{ padding: '10px', textAlign: 'center', fontSize: '11px', color: '#6b7280' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(ins => {
                const phase = PHASES_PIPELINE.find(p => p.key === getPhase(ins))!
                const prospStatut = STATUTS_PROSPECTION.find(p => p.value === ins.statut_prospection)
                return (
                  <tr key={ins.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '10px' }}>
                      <span style={{ background: phase.color, color: '#fff', padding: '2px 8px', borderRadius: '10px', fontSize: '10px', fontWeight: 500 }}>{phase.label}</span>
                    </td>
                    <td style={{ padding: '10px' }}>
                      <div style={{ color: BLEU, fontWeight: 500 }}>{ins.contacts?.prenom} {ins.contacts?.nom}</div>
                      {ins.contacts?.email && <div style={{ color: '#9ca3af', fontSize: '10px' }}>{ins.contacts.email}</div>}
                    </td>
                    <td style={{ padding: '10px', fontSize: '12px' }}>{ins.formation_sessions?.formations?.titre || '—'}</td>
                    <td style={{ padding: '10px', fontSize: '12px', color: ins.commercial_responsable ? BLEU : '#9ca3af' }}>
                      {ins.commercial_responsable || <em>—</em>}
                    </td>
                    <td style={{ padding: '10px', fontSize: '12px' }}>
                      {prospStatut ? <span style={{ color: prospStatut.color }}>{prospStatut.emoji} {prospStatut.label}</span> : '—'}
                    </td>
                    <td style={{ padding: '10px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '2px', justifyContent: 'center' }}>
                        <span title="Devis envoyé" style={{ fontSize: '14px', opacity: ins.devis_envoye_at ? 1 : 0.2 }}>📄</span>
                        <span title="Programme envoyé" style={{ fontSize: '14px', opacity: ins.programme_envoye_at ? 1 : 0.2 }}>📋</span>
                        <span title="Convention envoyée" style={{ fontSize: '14px', opacity: ins.convention_envoyee_at ? 1 : 0.2 }}>📃</span>
                        <span title="Convention signée" style={{ fontSize: '14px', opacity: ins.convention_signee_at ? 1 : 0.2 }}>✅</span>
                        <span title="AFDAS demandé" style={{ fontSize: '14px', opacity: ins.demande_financement_envoyee_at ? 1 : 0.2 }}>💰</span>
                      </div>
                    </td>
                    <td style={{ padding: '10px', fontSize: '11px', color: ins.date_rappel_prevu && daysSince(ins.date_rappel_prevu) >= 0 ? '#ef4444' : '#9ca3af' }}>
                      {ins.date_rappel_prevu ? fmtDate(ins.date_rappel_prevu) : '—'}
                    </td>
                    <td style={{ padding: '10px', textAlign: 'center' }}>
                      <a href="/inscriptions" style={{ color: BLEU, fontSize: '11px', textDecoration: 'none', border: `1px solid ${BLEU}`, padding: '3px 8px', borderRadius: '4px' }}>Modifier →</a>
                    </td>
                  </tr>
                )
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: '#9ca3af', fontSize: '13px' }}>Aucun dossier</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {view === 'kanban' && filtered.length > 0 && (
        <div style={{ textAlign: 'center', marginTop: '20px', color: '#9ca3af', fontSize: '11px' }}>
          💡 Glisse-dépose une carte d'une colonne à l'autre pour faire progresser le dossier
        </div>
      )}
    </div>
  )
}

export default function PipelinePage() {
  const { loading } = useAuth()
  if (loading) return <div style={{ fontFamily: 'sans-serif', padding: '40px', color: '#9ca3af' }}>Chargement...</div>
  return <PipelineContent />
}

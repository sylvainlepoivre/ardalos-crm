'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/useAuth'
import { supabase } from '@/lib/supabase'

const STATUTS = [
  { value: 'prospect',  label: 'Prospect',  color: '#9ca3af' },
  { value: 'inscrit',   label: 'Inscrit',   color: '#1A2C6B' },
  { value: 'confirme',  label: 'Confirmé',  color: '#059669' },
  { value: 'present',   label: 'Présent',   color: '#0891B2' },
  { value: 'absent',    label: 'Absent',    color: '#f97316' },
  { value: 'abandon',   label: 'Abandon',   color: '#ef4444' },
]

const TYPES_FINANCEMENT = ['AFDAS','CPF','OPCO_Atlas','OPCO_EP','Plan_formation','Financement_personnel','Autre']
const STATUTS_DOSSIER = ['brouillon','soumis','en_instruction','accorde','refuse','clos']

const STATUT_MAP: Record<string,{label:string,color:string}> = Object.fromEntries(
  STATUTS.map(s => [s.value, { label: s.label, color: s.color }])
)

type Inscription = {
  id: string
  session_id: string
  contact_id: string
  statut: string
  date_inscription: string | null
  date_confirmation: string | null
  date_abandon: string | null
  montant_total_ht: number | null
  notes: string | null
  contacts?: any
  formation_sessions?: any
}

type Financement = {
  id?: string
  inscription_id?: string
  type: string
  montant_ht: number
  statut_dossier: string
  reference_dossier: string
  notes: string
}

function fmtDate(d: string | null) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function InscriptionsContent() {
  const [inscriptions, setInscriptions] = useState<Inscription[]>([])
  const [contacts, setContacts] = useState<any[]>([])
  const [sessions, setSessions] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [selected, setSelected] = useState<Inscription | null>(null)
  const [statutFilter, setStatutFilter] = useState<string>('all')
  const [loading, setLoading] = useState(false)

  // Form fields
  const [sessionId, setSessionId] = useState('')
  const [contactId, setContactId] = useState('')
  const [statut, setStatut] = useState('prospect')
  const [montantTotal, setMontantTotal] = useState('')
  const [notes, setNotes] = useState('')
  const [financements, setFinancements] = useState<Financement[]>([])

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    const [insResp, contactsResp, sessionsResp] = await Promise.all([
      supabase.from('formation_inscriptions').select('*, contacts(*), formation_sessions(*, formations(titre, ref_interne))').order('created_at', { ascending: false }),
      supabase.from('contacts').select('*').order('nom'),
      supabase.from('v_sessions_with_places').select('*, formations(titre, ref_interne)').order('date_debut'),
    ])
    setInscriptions(insResp.data || [])
    setContacts(contactsResp.data || [])
    setSessions(sessionsResp.data || [])
  }

  function openNew() {
    setSelected(null)
    setSessionId('')
    setContactId('')
    setStatut('prospect')
    setMontantTotal('')
    setNotes('')
    setFinancements([])
    setShowForm(true)
  }

  async function openEdit(ins: Inscription) {
    setSelected(ins)
    setSessionId(ins.session_id)
    setContactId(ins.contact_id)
    setStatut(ins.statut)
    setMontantTotal(ins.montant_total_ht?.toString() || '')
    setNotes(ins.notes || '')
    const { data } = await supabase.from('formation_financements').select('*').eq('inscription_id', ins.id)
    setFinancements((data || []).map(f => ({
      id: f.id,
      inscription_id: f.inscription_id,
      type: f.type,
      montant_ht: f.montant_ht || 0,
      statut_dossier: f.statut_dossier,
      reference_dossier: f.reference_dossier || '',
      notes: f.notes || '',
    })))
    setShowForm(true)
  }

  function addFinancement() {
    setFinancements([...financements, { type: 'AFDAS', montant_ht: 0, statut_dossier: 'brouillon', reference_dossier: '', notes: '' }])
  }

  function updateFinancement(idx: number, patch: Partial<Financement>) {
    setFinancements(financements.map((f, i) => i === idx ? { ...f, ...patch } : f))
  }

  function removeFinancement(idx: number) {
    setFinancements(financements.filter((_, i) => i !== idx))
  }

  async function save() {
    if (!sessionId || !contactId) { alert('Session et contact obligatoires'); return }
    setLoading(true)

    const payload: any = {
      session_id: sessionId,
      contact_id: contactId,
      statut,
      montant_total_ht: montantTotal ? parseFloat(montantTotal) : null,
      notes: notes || null,
    }
    if (statut === 'confirme' && !selected?.date_confirmation) payload.date_confirmation = new Date().toISOString()
    if (statut === 'abandon' && !selected?.date_abandon) payload.date_abandon = new Date().toISOString()

    let inscriptionId: string
    if (selected) {
      const { error } = await supabase.from('formation_inscriptions').update(payload).eq('id', selected.id)
      if (error) { alert('Erreur : ' + error.message); setLoading(false); return }
      inscriptionId = selected.id
    } else {
      const { data, error } = await supabase.from('formation_inscriptions').insert(payload).select().single()
      if (error) { alert('Erreur : ' + error.message); setLoading(false); return }
      inscriptionId = data.id
    }

    // Gérer les financements : stratégie simple = tout supprimer puis réinsérer
    await supabase.from('formation_financements').delete().eq('inscription_id', inscriptionId)
    if (financements.length > 0) {
      const rows = financements.map(f => ({
        inscription_id: inscriptionId,
        type: f.type,
        montant_ht: f.montant_ht || 0,
        statut_dossier: f.statut_dossier,
        reference_dossier: f.reference_dossier || null,
        notes: f.notes || null,
      }))
      const { error } = await supabase.from('formation_financements').insert(rows)
      if (error) { alert('Inscription sauvée mais erreur financements : ' + error.message) }
    }

    setLoading(false)
    setShowForm(false)
    await loadAll()
  }

  async function del(ins: Inscription) {
    if (!confirm('Supprimer cette inscription (et ses financements) ?')) return
    const { error } = await supabase.from('formation_inscriptions').delete().eq('id', ins.id)
    if (error) { alert('Erreur : ' + error.message); return }
    await loadAll()
  }

  const filtered = statutFilter === 'all' ? inscriptions : inscriptions.filter(i => i.statut === statutFilter)
  const totalFinancement = financements.reduce((sum, f) => sum + (Number(f.montant_ht) || 0), 0)
  const montantNum = parseFloat(montantTotal) || 0
  const resteACharge = montantNum - totalFinancement

  return (
    <div style={{ fontFamily: 'sans-serif', padding: '40px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <h1 style={{ color: '#1A2C6B', fontSize: '1.8rem', margin: 0 }}>Inscriptions</h1>
        <button onClick={openNew} style={{ background: '#1A2C6B', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 18px', fontWeight: '500', cursor: 'pointer' }}>+ Nouvelle inscription</button>
      </div>
      <p style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '24px' }}>{inscriptions.length} inscription{inscriptions.length !== 1 ? 's' : ''} · <a href="/" style={{color:'#1A2C6B'}}>← Accueil</a></p>

      {/* Filtre statut */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <button onClick={() => setStatutFilter('all')} style={{ background: statutFilter==='all'?'#1A2C6B':'#fff', color: statutFilter==='all'?'#fff':'#1A2C6B', border: '1px solid #1A2C6B', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>Tous ({inscriptions.length})</button>
        {STATUTS.map(s => {
          const count = inscriptions.filter(i => i.statut === s.value).length
          return <button key={s.value} onClick={() => setStatutFilter(s.value)} style={{ background: statutFilter===s.value?s.color:'#fff', color: statutFilter===s.value?'#fff':s.color, border: `1px solid ${s.color}`, padding: '6px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>{s.label} ({count})</button>
        })}
      </div>

      {/* FORMULAIRE */}
      {showForm && (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
          <h2 style={{ color: '#1A2C6B', fontSize: '1.1rem', marginBottom: '16px' }}>{selected ? 'Modifier' : 'Nouvelle'} inscription</h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>Session *</label>
              <select value={sessionId} onChange={e => setSessionId(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', marginTop: '4px' }}>
                <option value="">-- Choisir --</option>
                {sessions.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.formations?.ref_interne ? `[${s.formations.ref_interne}] ` : ''}{s.formations?.titre || 'Formation'} · {fmtDate(s.date_debut)} → {fmtDate(s.date_fin)} · {s.nb_places_restantes_calc}/{s.nb_places_max} places
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>Stagiaire *</label>
              <select value={contactId} onChange={e => setContactId(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', marginTop: '4px' }}>
                <option value="">-- Choisir --</option>
                {contacts.map(c => <option key={c.id} value={c.id}>{c.prenom} {c.nom}{c.email ? ` (${c.email})` : ''}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>Statut</label>
              <select value={statut} onChange={e => setStatut(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', marginTop: '4px' }}>
                {STATUTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>Montant total HT (€)</label>
              <input type="number" step="0.01" value={montantTotal} onChange={e => setMontantTotal(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', marginTop: '4px' }} />
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', marginTop: '4px', fontFamily: 'inherit' }} />
          </div>

          {/* Financements */}
          <div style={{ background: '#f9fafb', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <strong style={{ color: '#1A2C6B', fontSize: '14px' }}>Financements ({financements.length})</strong>
              <button onClick={addFinancement} style={{ background: '#C9A84C', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>+ Ajouter</button>
            </div>
            {financements.map((f, idx) => (
              <div key={idx} style={{ background: '#fff', padding: '12px', borderRadius: '6px', marginBottom: '8px', border: '1px solid #e5e7eb' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '8px', marginBottom: '8px' }}>
                  <select value={f.type} onChange={e => updateFinancement(idx, { type: e.target.value })} style={{ padding: '6px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '12px' }}>
                    {TYPES_FINANCEMENT.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
                  </select>
                  <input type="number" step="0.01" placeholder="Montant HT" value={f.montant_ht || ''} onChange={e => updateFinancement(idx, { montant_ht: parseFloat(e.target.value) || 0 })} style={{ padding: '6px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '12px' }} />
                  <select value={f.statut_dossier} onChange={e => updateFinancement(idx, { statut_dossier: e.target.value })} style={{ padding: '6px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '12px' }}>
                    {STATUTS_DOSSIER.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <button onClick={() => removeFinancement(idx)} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: '4px', fontSize: '12px', cursor: 'pointer' }}>×</button>
                </div>
                <input type="text" placeholder="Référence dossier (N° AFDAS...)" value={f.reference_dossier} onChange={e => updateFinancement(idx, { reference_dossier: e.target.value })} style={{ width: '100%', padding: '6px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '12px' }} />
              </div>
            ))}
            {financements.length > 0 && (
              <div style={{ fontSize: '13px', color: '#1A2C6B', marginTop: '8px' }}>
                Total financements : <strong>{totalFinancement.toFixed(2)} €</strong>
                {montantNum > 0 && <> · Reste à charge : <strong style={{color: resteACharge > 0 ? '#f97316' : '#059669'}}>{resteACharge.toFixed(2)} €</strong></>}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={save} disabled={loading} style={{ background: '#1A2C6B', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 20px', fontWeight: '500', cursor: 'pointer' }}>{loading ? 'Enregistrement...' : (selected ? 'Modifier' : 'Créer')}</button>
            <button onClick={() => setShowForm(false)} style={{ background: '#fff', color: '#6b7280', border: '1px solid #d1d5db', borderRadius: '8px', padding: '10px 20px', cursor: 'pointer' }}>Annuler</button>
          </div>
        </div>
      )}

      {/* LISTE */}
      {filtered.length === 0 ? (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '60px', textAlign: 'center', color: '#9ca3af' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>👥</div>
          <p style={{ fontWeight: '500', marginBottom: '4px' }}>Aucune inscription{statutFilter !== 'all' ? ` "${STATUT_MAP[statutFilter]?.label || ''}"` : ''}</p>
          <p style={{ fontSize: '13px' }}>Clique sur "+ Nouvelle inscription" pour commencer</p>
        </div>
      ) : (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                <th style={{ padding: '12px', textAlign: 'left', color: '#6b7280', fontWeight: '500', fontSize: '12px' }}>Stagiaire</th>
                <th style={{ padding: '12px', textAlign: 'left', color: '#6b7280', fontWeight: '500', fontSize: '12px' }}>Formation · Session</th>
                <th style={{ padding: '12px', textAlign: 'left', color: '#6b7280', fontWeight: '500', fontSize: '12px' }}>Statut</th>
                <th style={{ padding: '12px', textAlign: 'right', color: '#6b7280', fontWeight: '500', fontSize: '12px' }}>Montant</th>
                <th style={{ padding: '12px', textAlign: 'left', color: '#6b7280', fontWeight: '500', fontSize: '12px' }}>Inscrit le</th>
                <th style={{ padding: '12px', textAlign: 'center', color: '#6b7280', fontWeight: '500', fontSize: '12px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(ins => {
                const st = STATUT_MAP[ins.statut] || { label: ins.statut, color: '#9ca3af' }
                return (
                  <tr key={ins.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '12px' }}>
                      <div style={{ fontWeight: '500', color: '#1A2C6B' }}>{ins.contacts?.prenom} {ins.contacts?.nom}</div>
                      {ins.contacts?.email && <div style={{ fontSize: '11px', color: '#9ca3af' }}>{ins.contacts.email}</div>}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ fontSize: '13px' }}>{ins.formation_sessions?.formations?.ref_interne && <span style={{color:'#9ca3af'}}>[{ins.formation_sessions.formations.ref_interne}] </span>}{ins.formation_sessions?.formations?.titre || '—'}</div>
                      <div style={{ fontSize: '11px', color: '#9ca3af' }}>{fmtDate(ins.formation_sessions?.date_debut)} → {fmtDate(ins.formation_sessions?.date_fin)}</div>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ background: st.color, color: '#fff', padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '500' }}>{st.label}</span>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right', color: '#C9A84C', fontWeight: '500' }}>{ins.montant_total_ht ? `${Number(ins.montant_total_ht).toLocaleString('fr-FR')} €` : '—'}</td>
                    <td style={{ padding: '12px', fontSize: '12px', color: '#6b7280' }}>{fmtDate(ins.date_inscription)}</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <button
                        onClick={() => {
                          const url = `/api/generate-dossier?inscriptionId=${ins.id}`
                          window.location.href = url
                        }}
                        title="Télécharger le dossier Qualiopi/AFDAS complet (10 documents)"
                        style={{ background: '#C9A84C', color: '#fff', border: 'none', padding: '4px 10px', borderRadius: '4px', fontSize: '12px', cursor: 'pointer', marginRight: '4px', fontWeight: 500 }}
                      >📥 Dossier</button>
                      <button onClick={() => openEdit(ins)} style={{ background: '#fff', color: '#1A2C6B', border: '1px solid #1A2C6B', padding: '4px 10px', borderRadius: '4px', fontSize: '12px', cursor: 'pointer', marginRight: '4px' }}>Modifier</button>
                      <button onClick={() => del(ins)} style={{ background: '#fff', color: '#ef4444', border: 'none', padding: '4px 10px', fontSize: '12px', cursor: 'pointer' }}>Supprimer</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default function InscriptionsPage() {
  const { loading } = useAuth()
  if (loading) return <div style={{ fontFamily: 'sans-serif', padding: '40px', color: '#9ca3af' }}>Chargement...</div>
  return <InscriptionsContent />
}

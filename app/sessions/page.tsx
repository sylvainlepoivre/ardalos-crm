'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/useAuth'
import { supabase } from '@/lib/supabase'

const STATUTS = ['planifiee', 'ouverte', 'complete', 'en_cours', 'terminee', 'annulee']
const STATUT_LABELS: Record<string, string> = {
  planifiee: 'Planifiée',
  ouverte: 'Ouverte aux inscriptions',
  complete: 'Complète',
  en_cours: 'En cours',
  terminee: 'Terminée',
  annulee: 'Annulée',
}
const STATUT_COLORS: Record<string, string> = {
  planifiee: '#6b7280',
  ouverte: '#059669',
  complete: '#C9A84C',
  en_cours: '#1A2C6B',
  terminee: '#9ca3af',
  annulee: '#ef4444',
}

function formatDate(d: string) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function SessionsContent() {
  const [sessions, setSessions] = useState<any[]>([])
  const [formations, setFormations] = useState<any[]>([])
  const [view, setView] = useState<'calendar' | 'byFormation'>('calendar')
  const [statutFilter, setStatutFilter] = useState<string>('all')
  const [showForm, setShowForm] = useState(false)
  const [selected, setSelected] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  // Form fields
  const [formationId, setFormationId] = useState('')
  const [dateDebut, setDateDebut] = useState('')
  const [dateFin, setDateFin] = useState('')
  const [lieu, setLieu] = useState('')
  const [adresse, setAdresse] = useState('')
  const [nbPlacesMax, setNbPlacesMax] = useState('12')
  const [formateur, setFormateur] = useState('')
  const [prixHt, setPrixHt] = useState('')
  const [statut, setStatut] = useState('planifiee')
  const [notes, setNotes] = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    const { data: sessionsData } = await supabase
      .from('formation_sessions')
      .select('*, formations(id, titre, ref_interne)')
      .order('date_debut', { ascending: true })
    if (sessionsData) setSessions(sessionsData)

    const { data: formationsData } = await supabase
      .from('formations')
      .select('id, titre, ref_interne, tarif')
      .order('titre')
    if (formationsData) setFormations(formationsData)
  }

  function reset() {
    setFormationId(''); setDateDebut(''); setDateFin(''); setLieu(''); setAdresse('')
    setNbPlacesMax('12'); setFormateur(''); setPrixHt(''); setStatut('planifiee'); setNotes('')
    setSelected(null)
  }

  async function save() {
    if (!formationId || !dateDebut || !dateFin) {
      return alert('Formation, date de début et date de fin obligatoires')
    }
    if (new Date(dateFin) < new Date(dateDebut)) {
      return alert('La date de fin doit être après la date de début')
    }
    setLoading(true)
    const data = {
      formation_id: formationId,
      date_debut: dateDebut,
      date_fin: dateFin,
      lieu: lieu || null,
      adresse: adresse || null,
      nb_places_max: parseInt(nbPlacesMax) || 12,
      formateur_principal: formateur || null,
      prix_session_ht: prixHt ? parseFloat(prixHt) : null,
      statut,
      notes: notes || null,
    }
    if (selected) {
      await supabase.from('formation_sessions').update(data).eq('id', selected.id)
    } else {
      await supabase.from('formation_sessions').insert(data)
    }
    setLoading(false); setShowForm(false); reset(); load()
  }

  async function del(id: string) {
    if (!confirm('Supprimer cette session ?')) return
    await supabase.from('formation_sessions').delete().eq('id', id); load()
  }

  function edit(s: any) {
    setSelected(s)
    setFormationId(s.formation_id || '')
    setDateDebut(s.date_debut || '')
    setDateFin(s.date_fin || '')
    setLieu(s.lieu || '')
    setAdresse(s.adresse || '')
    setNbPlacesMax(s.nb_places_max?.toString() || '12')
    setFormateur(s.formateur_principal || '')
    setPrixHt(s.prix_session_ht?.toString() || '')
    setStatut(s.statut || 'planifiee')
    setNotes(s.notes || '')
    setShowForm(true)
  }

  function newSession() {
    reset()
    // Pré-remplit avec la première formation si une seule existe
    if (formations.length === 1) setFormationId(formations[0].id)
    setShowForm(true)
  }

  const filtered = sessions.filter(s =>
    statutFilter === 'all' ? true : s.statut === statutFilter
  )

  const grouped = formations.map(f => ({
    formation: f,
    sessions: filtered.filter(s => s.formation_id === f.id),
  })).filter(g => g.sessions.length > 0)

  function SessionCard({ s }: { s: any }) {
    const color = STATUT_COLORS[s.statut] || '#6b7280'
    return (
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderTop: `3px solid ${color}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
            <div style={{ flex: 1 }}>
              {s.formations?.ref_interne && <div style={{ fontSize: '11px', color: '#9ca3af' }}>{s.formations.ref_interne}</div>}
              <div style={{ fontSize: '15px', fontWeight: '600', color: '#111827', marginTop: '2px' }}>{s.formations?.titre || 'Formation inconnue'}</div>
            </div>
            <span style={{ background: color + '20', color, fontSize: '11px', fontWeight: '600', padding: '3px 10px', borderRadius: '99px', whiteSpace: 'nowrap', marginLeft: '12px' }}>
              {STATUT_LABELS[s.statut] || s.statut}
            </span>
          </div>
          <div style={{ fontSize: '13px', color: '#374151', marginBottom: '8px' }}>
            <strong style={{ color: '#1A2C6B' }}>📅 {formatDate(s.date_debut)}</strong> → <strong style={{ color: '#1A2C6B' }}>{formatDate(s.date_fin)}</strong>
          </div>
          {s.lieu && <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>📍 {s.lieu}{s.adresse ? ` — ${s.adresse}` : ''}</div>}
          {s.formateur_principal && <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>👤 {s.formateur_principal}</div>}
          <div style={{ display: 'flex', gap: '16px', marginTop: '8px', fontSize: '12px', color: '#6b7280' }}>
            <div><strong style={{ color: '#1A2C6B' }}>{s.nb_places_max}</strong> places max</div>
            {s.prix_session_ht && <div><strong style={{ color: '#C9A84C' }}>{Number(s.prix_session_ht).toLocaleString('fr-FR')}€</strong> HT</div>}
          </div>
          {s.notes && <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '8px', fontStyle: 'italic' }}>{s.notes}</div>}
        </div>
        <div style={{ display: 'flex', gap: '8px', padding: '10px 20px', borderTop: '1px solid #f3f4f6', background: '#f9fafb' }}>
          <button onClick={() => edit(s)} style={{ flex: 1, background: '#fff', border: '1px solid #e5e7eb', borderRadius: '6px', padding: '6px', fontSize: '12px', cursor: 'pointer', color: '#374151' }}>Modifier</button>
          <button onClick={() => del(s.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '12px', padding: '6px 10px' }}>Supprimer</button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ fontFamily: 'sans-serif', padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ color: '#1A2C6B', marginBottom: '4px' }}>Sessions</h1>
          <p style={{ color: '#9ca3af', fontSize: '13px' }}>{sessions.length} session{sessions.length !== 1 ? 's' : ''} planifiée{sessions.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={newSession} style={{ background: '#1A2C6B', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 20px', fontSize: '13px', cursor: 'pointer', fontWeight: '500' }}>+ Nouvelle session</button>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '3px' }}>
          <button onClick={() => setView('calendar')} style={{ background: view === 'calendar' ? '#1A2C6B' : 'transparent', color: view === 'calendar' ? '#fff' : '#6b7280', border: 'none', borderRadius: '6px', padding: '6px 14px', fontSize: '12px', cursor: 'pointer', fontWeight: '500' }}>📅 Calendrier</button>
          <button onClick={() => setView('byFormation')} style={{ background: view === 'byFormation' ? '#1A2C6B' : 'transparent', color: view === 'byFormation' ? '#fff' : '#6b7280', border: 'none', borderRadius: '6px', padding: '6px 14px', fontSize: '12px', cursor: 'pointer', fontWeight: '500' }}>📚 Par formation</button>
        </div>
        <select value={statutFilter} onChange={e => setStatutFilter(e.target.value)} style={{ padding: '7px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '13px', background: '#fff' }}>
          <option value="all">Tous les statuts</option>
          {STATUTS.map(s => <option key={s} value={s}>{STATUT_LABELS[s]}</option>)}
        </select>
      </div>

      {showForm && (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '28px', marginBottom: '24px' }}>
          <h2 style={{ color: '#1A2C6B', marginBottom: '20px', fontSize: '16px' }}>{selected ? 'Modifier la session' : 'Nouvelle session'}</h2>
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Formation *</label>
            <select value={formationId} onChange={e => setFormationId(e.target.value)} style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '13px' }}>
              <option value="">-- Sélectionner une formation --</option>
              {formations.map(f => <option key={f.id} value={f.id}>{f.ref_interne ? `[${f.ref_interne}] ` : ''}{f.titre}</option>)}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Date de début *</label>
              <input type="date" value={dateDebut} onChange={e => setDateDebut(e.target.value)} style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Date de fin *</label>
              <input type="date" value={dateFin} onChange={e => setDateFin(e.target.value)} style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Statut</label>
              <select value={statut} onChange={e => setStatut(e.target.value)} style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '13px' }}>
                {STATUTS.map(s => <option key={s} value={s}>{STATUT_LABELS[s]}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px', marginBottom: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Lieu</label>
              <input value={lieu} onChange={e => setLieu(e.target.value)} placeholder="Ex: Studio Ardalos" style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Adresse</label>
              <input value={adresse} onChange={e => setAdresse(e.target.value)} placeholder="Ex: 9 Chemin du Sémaphore, 13500 Martigues" style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box' }} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '12px', marginBottom: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Formateur principal</label>
              <input value={formateur} onChange={e => setFormateur(e.target.value)} placeholder="Ex: Julien Meli" style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Places max</label>
              <input type="number" value={nbPlacesMax} onChange={e => setNbPlacesMax(e.target.value)} style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Prix session HT (€)</label>
              <input type="number" value={prixHt} onChange={e => setPrixHt(e.target.value)} placeholder="Optionnel" style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box' }} />
            </div>
          </div>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Notes internes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Remarques, logistique, contraintes..." style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box', resize: 'vertical' }} />
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={save} disabled={loading} style={{ background: '#1A2C6B', color: '#fff', border: 'none', borderRadius: '8px', padding: '9px 20px', fontSize: '13px', cursor: 'pointer', fontWeight: '500' }}>{loading ? 'Enregistrement...' : selected ? 'Modifier' : 'Créer la session'}</button>
            <button onClick={() => { setShowForm(false); reset() }} style={{ background: '#f9fafb', color: '#374151', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '9px 20px', fontSize: '13px', cursor: 'pointer' }}>Annuler</button>
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '60px', textAlign: 'center', color: '#9ca3af' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>📅</div>
          <p style={{ fontWeight: '500', marginBottom: '4px' }}>Aucune session {statutFilter !== 'all' ? STATUT_LABELS[statutFilter].toLowerCase() : ''}</p>
          <p style={{ fontSize: '13px' }}>Cliquez sur "+ Nouvelle session" pour commencer</p>
        </div>
      ) : view === 'calendar' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '16px' }}>
          {filtered.map(s => <SessionCard key={s.id} s={s} />)}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          {grouped.map(g => (
            <div key={g.formation.id}>
              <h3 style={{ color: '#1A2C6B', fontSize: '14px', marginBottom: '12px', fontWeight: '600' }}>{g.formation.ref_interne ? `[${g.formation.ref_interne}] ` : ''}{g.formation.titre} <span style={{ color: '#9ca3af', fontWeight: '400' }}>· {g.sessions.length} session{g.sessions.length !== 1 ? 's' : ''}</span></h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '16px' }}>
                {g.sessions.map(s => <SessionCard key={s.id} s={s} />)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function SessionsPage() {
  const { loading } = useAuth()
  if (loading) return <div style={{ fontFamily: 'sans-serif', padding: '40px', color: '#9ca3af' }}>Chargement...</div>
  return <SessionsContent />
}

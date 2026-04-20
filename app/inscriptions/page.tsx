'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/useAuth'
import { supabase } from '@/lib/supabase'
import { TEMPLATE_LIST, ALL_TEMPLATE_FILENAMES } from '@/lib/templatesList'

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
  // Infos stagiaire (P1)
  date_naissance_stagiaire: string | null
  lieu_naissance_stagiaire: string | null
  nationalite_stagiaire: string | null
  adresse_rue: string | null
  adresse_cp: string | null
  adresse_ville: string | null
  // Entreprise cliente (P1)
  raison_sociale_client: string | null
  forme_juridique_client: string | null
  adresse_client: string | null
  siret_client: string | null
  representant_client: string | null
  fonction_representant_client: string | null
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

// Styles réutilisés
const labelStyle: React.CSSProperties = { fontSize: '12px', color: '#6b7280', fontWeight: 500, display: 'block', marginBottom: '4px' }
const inputStyle: React.CSSProperties = { width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box' }
const sectionStyle: React.CSSProperties = { background: '#f9fafb', padding: '16px', borderRadius: '8px', marginBottom: '16px', border: '1px solid #e5e7eb' }
const sectionHeaderStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', userSelect: 'none' }

function InscriptionsContent() {
  const [inscriptions, setInscriptions] = useState<Inscription[]>([])
  const [contacts, setContacts] = useState<any[]>([])
  const [sessions, setSessions] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [selected, setSelected] = useState<Inscription | null>(null)
  const [statutFilter, setStatutFilter] = useState<string>('all')
  const [loading, setLoading] = useState(false)

  // Champs de base
  const [sessionId, setSessionId] = useState('')
  const [contactId, setContactId] = useState('')
  const [statut, setStatut] = useState('prospect')
  const [montantTotal, setMontantTotal] = useState('')
  const [notes, setNotes] = useState('')
  const [financements, setFinancements] = useState<Financement[]>([])

  // Infos stagiaire (P1)
  const [dateNaissance, setDateNaissance] = useState('')
  const [lieuNaissance, setLieuNaissance] = useState('')
  const [nationalite, setNationalite] = useState('française')
  const [adresseRue, setAdresseRue] = useState('')
  const [adresseCp, setAdresseCp] = useState('')
  const [adresseVille, setAdresseVille] = useState('')
  const [showStagiaireDetails, setShowStagiaireDetails] = useState(false)

  // Entreprise cliente (P1)
  const [hasClient, setHasClient] = useState(false)
  const [raisonSocialeClient, setRaisonSocialeClient] = useState('')
  const [formeJuridiqueClient, setFormeJuridiqueClient] = useState('')
  const [adresseClient, setAdresseClient] = useState('')
  const [siretClient, setSiretClient] = useState('')
  const [representantClient, setRepresentantClient] = useState('')
  const [fonctionRepresentantClient, setFonctionRepresentantClient] = useState('')

  // Dossier modal
  const [dossierIns, setDossierIns] = useState<Inscription | null>(null)
  const [selectedTpls, setSelectedTpls] = useState<Set<string>>(new Set(ALL_TEMPLATE_FILENAMES))
  const [generatingDossier, setGeneratingDossier] = useState(false)

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

  function resetForm() {
    setSelected(null)
    setSessionId(''); setContactId(''); setStatut('prospect')
    setMontantTotal(''); setNotes(''); setFinancements([])
    setDateNaissance(''); setLieuNaissance(''); setNationalite('française')
    setAdresseRue(''); setAdresseCp(''); setAdresseVille('')
    setShowStagiaireDetails(false)
    setHasClient(false)
    setRaisonSocialeClient(''); setFormeJuridiqueClient(''); setAdresseClient('')
    setSiretClient(''); setRepresentantClient(''); setFonctionRepresentantClient('')
  }

  function openNew() {
    resetForm()
    setShowForm(true)
  }

  async function openEdit(ins: Inscription) {
    resetForm()
    setSelected(ins)
    setSessionId(ins.session_id)
    setContactId(ins.contact_id)
    setStatut(ins.statut)
    setMontantTotal(ins.montant_total_ht?.toString() || '')
    setNotes(ins.notes || '')

    // Infos stagiaire
    setDateNaissance(ins.date_naissance_stagiaire || '')
    setLieuNaissance(ins.lieu_naissance_stagiaire || '')
    setNationalite(ins.nationalite_stagiaire || 'française')
    setAdresseRue(ins.adresse_rue || '')
    setAdresseCp(ins.adresse_cp || '')
    setAdresseVille(ins.adresse_ville || '')
    const hasAnyStagiaireData = !!(ins.date_naissance_stagiaire || ins.lieu_naissance_stagiaire || ins.adresse_rue || ins.adresse_cp || ins.adresse_ville)
    setShowStagiaireDetails(hasAnyStagiaireData)

    // Entreprise cliente
    const hasClientData = !!(ins.raison_sociale_client || ins.siret_client || ins.representant_client)
    setHasClient(hasClientData)
    setRaisonSocialeClient(ins.raison_sociale_client || '')
    setFormeJuridiqueClient(ins.forme_juridique_client || '')
    setAdresseClient(ins.adresse_client || '')
    setSiretClient(ins.siret_client || '')
    setRepresentantClient(ins.representant_client || '')
    setFonctionRepresentantClient(ins.fonction_representant_client || '')

    // Financements
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
      // Infos stagiaire
      date_naissance_stagiaire: dateNaissance || null,
      lieu_naissance_stagiaire: lieuNaissance || null,
      nationalite_stagiaire: nationalite || null,
      adresse_rue: adresseRue || null,
      adresse_cp: adresseCp || null,
      adresse_ville: adresseVille || null,
      // Entreprise cliente (effacé si hasClient=false)
      raison_sociale_client: hasClient ? (raisonSocialeClient || null) : null,
      forme_juridique_client: hasClient ? (formeJuridiqueClient || null) : null,
      adresse_client: hasClient ? (adresseClient || null) : null,
      siret_client: hasClient ? (siretClient || null) : null,
      representant_client: hasClient ? (representantClient || null) : null,
      fonction_representant_client: hasClient ? (fonctionRepresentantClient || null) : null,
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

  // Dossier modal
  function openDossierModal(ins: Inscription) {
    setDossierIns(ins)
    setSelectedTpls(new Set(ALL_TEMPLATE_FILENAMES))
  }
  function closeDossierModal() { if (!generatingDossier) setDossierIns(null) }
  function toggleTpl(fn: string) {
    const next = new Set(selectedTpls)
    if (next.has(fn)) next.delete(fn); else next.add(fn)
    setSelectedTpls(next)
  }
  function selectAllTpls() { setSelectedTpls(new Set(ALL_TEMPLATE_FILENAMES)) }
  function deselectAllTpls() { setSelectedTpls(new Set()) }

  async function runDossierGeneration() {
    if (!dossierIns || selectedTpls.size === 0) return
    setGeneratingDossier(true)
    try {
      const params = new URLSearchParams({
        inscriptionId: dossierIns.id,
        templates: Array.from(selectedTpls).join(','),
      })
      const res = await fetch(`/api/generate-dossier?${params}`, { credentials: 'include' })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
        alert('Erreur génération : ' + (err.error || 'inconnue'))
        setGeneratingDossier(false)
        return
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const cd = res.headers.get('Content-Disposition') || ''
      const m = cd.match(/filename="([^"]+)"/)
      a.download = m ? m[1] : 'dossier.zip'
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      setGeneratingDossier(false)
      setDossierIns(null)
    } catch (e: any) {
      alert('Erreur : ' + (e?.message || 'inconnue'))
      setGeneratingDossier(false)
    }
  }

  const filtered = statutFilter === 'all' ? inscriptions : inscriptions.filter(i => i.statut === statutFilter)
  const totalFinancement = financements.reduce((sum, f) => sum + (Number(f.montant_ht) || 0), 0)
  const montantNum = parseFloat(montantTotal) || 0
  const resteACharge = montantNum - totalFinancement

  return (
    <div style={{ fontFamily: 'sans-serif', padding: '40px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <h1 style={{ color: '#1A2C6B', fontSize: '1.8rem', margin: 0 }}>Inscriptions</h1>
        <button onClick={openNew} style={{ background: '#1A2C6B', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 18px', fontWeight: 500, cursor: 'pointer' }}>+ Nouvelle inscription</button>
      </div>
      <p style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '24px' }}>{inscriptions.length} inscription{inscriptions.length !== 1 ? 's' : ''} · <a href="/" style={{color:'#1A2C6B'}}>← Accueil</a></p>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <button onClick={() => setStatutFilter('all')} style={{ background: statutFilter==='all'?'#1A2C6B':'#fff', color: statutFilter==='all'?'#fff':'#1A2C6B', border: '1px solid #1A2C6B', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>Tous ({inscriptions.length})</button>
        {STATUTS.map(s => {
          const count = inscriptions.filter(i => i.statut === s.value).length
          return <button key={s.value} onClick={() => setStatutFilter(s.value)} style={{ background: statutFilter===s.value?s.color:'#fff', color: statutFilter===s.value?'#fff':s.color, border: `1px solid ${s.color}`, padding: '6px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>{s.label} ({count})</button>
        })}
      </div>

      {showForm && (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
          <h2 style={{ color: '#1A2C6B', fontSize: '1.1rem', marginBottom: '16px' }}>{selected ? 'Modifier' : 'Nouvelle'} inscription</h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={labelStyle}>Session *</label>
              <select value={sessionId} onChange={e => setSessionId(e.target.value)} style={inputStyle}>
                <option value="">-- Choisir --</option>
                {sessions.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.formations?.ref_interne ? `[${s.formations.ref_interne}] ` : ''}{s.formations?.titre || 'Formation'} · {fmtDate(s.date_debut)} → {fmtDate(s.date_fin)} · {s.nb_places_restantes_calc}/{s.nb_places_max} places
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Stagiaire *</label>
              <select value={contactId} onChange={e => setContactId(e.target.value)} style={inputStyle}>
                <option value="">-- Choisir --</option>
                {contacts.map(c => <option key={c.id} value={c.id}>{c.prenom} {c.nom}{c.email ? ` (${c.email})` : ''}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={labelStyle}>Statut</label>
              <select value={statut} onChange={e => setStatut(e.target.value)} style={inputStyle}>
                {STATUTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Montant total HT (€)</label>
              <input type="number" step="0.01" value={montantTotal} onChange={e => setMontantTotal(e.target.value)} style={inputStyle} />
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} style={{ ...inputStyle, fontFamily: 'inherit' }} />
          </div>

          {/* ============ SECTION : Infos stagiaire (P1) ============ */}
          <div style={sectionStyle}>
            <div style={sectionHeaderStyle} onClick={() => setShowStagiaireDetails(v => !v)}>
              <strong style={{ color: '#1A2C6B', fontSize: '14px' }}>
                {showStagiaireDetails ? '▼' : '▶'} 📋 Infos stagiaire (pour les documents)
              </strong>
              <span style={{ fontSize: '11px', color: '#9ca3af' }}>
                {showStagiaireDetails ? 'Replier' : 'Déplier'}
              </span>
            </div>
            {showStagiaireDetails && (
              <div style={{ marginTop: '12px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label style={labelStyle}>Date de naissance</label>
                    <input type="date" value={dateNaissance} onChange={e => setDateNaissance(e.target.value)} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Lieu de naissance</label>
                    <input type="text" value={lieuNaissance} onChange={e => setLieuNaissance(e.target.value)} placeholder="ex: Marseille (13)" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Nationalité</label>
                    <input type="text" value={nationalite} onChange={e => setNationalite(e.target.value)} style={inputStyle} />
                  </div>
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <label style={labelStyle}>Adresse (rue et n°)</label>
                  <input type="text" value={adresseRue} onChange={e => setAdresseRue(e.target.value)} placeholder="ex: 12 rue des Lilas" style={inputStyle} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px' }}>
                  <div>
                    <label style={labelStyle}>Code postal</label>
                    <input type="text" value={adresseCp} onChange={e => setAdresseCp(e.target.value)} placeholder="ex: 13500" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Ville</label>
                    <input type="text" value={adresseVille} onChange={e => setAdresseVille(e.target.value)} placeholder="ex: Martigues" style={inputStyle} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ============ SECTION : Entreprise cliente (P1) ============ */}
          <div style={sectionStyle}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={hasClient}
                onChange={e => setHasClient(e.target.checked)}
                style={{ accentColor: '#1A2C6B', width: '16px', height: '16px', cursor: 'pointer' }}
              />
              <strong style={{ color: '#1A2C6B', fontSize: '14px' }}>🏢 La formation est payée par une entreprise cliente</strong>
            </label>
            {hasClient && (
              <div style={{ marginTop: '14px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label style={labelStyle}>Raison sociale</label>
                    <input type="text" value={raisonSocialeClient} onChange={e => setRaisonSocialeClient(e.target.value)} placeholder="ex: ACME SARL" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Forme juridique</label>
                    <input type="text" value={formeJuridiqueClient} onChange={e => setFormeJuridiqueClient(e.target.value)} placeholder="ex: SARL, SAS…" style={inputStyle} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label style={labelStyle}>Adresse complète</label>
                    <input type="text" value={adresseClient} onChange={e => setAdresseClient(e.target.value)} placeholder="ex: 5 av. de la République, 13000 Marseille" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>SIRET</label>
                    <input type="text" value={siretClient} onChange={e => setSiretClient(e.target.value)} placeholder="14 chiffres" style={inputStyle} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={labelStyle}>Nom du représentant</label>
                    <input type="text" value={representantClient} onChange={e => setRepresentantClient(e.target.value)} placeholder="ex: Mme Jeanne Dupont" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Fonction du représentant</label>
                    <input type="text" value={fonctionRepresentantClient} onChange={e => setFonctionRepresentantClient(e.target.value)} placeholder="ex: Directrice RH" style={inputStyle} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ============ SECTION : Financements ============ */}
          <div style={sectionStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <strong style={{ color: '#1A2C6B', fontSize: '14px' }}>💰 Financements ({financements.length})</strong>
              <button onClick={addFinancement} style={{ background: '#C9A84C', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>+ Ajouter</button>
            </div>
            {financements.map((f, idx) => (
              <div key={idx} style={{ background: '#fff', padding: '12px', borderRadius: '6px', marginBottom: '8px', border: '1px solid #e5e7eb' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '8px', marginBottom: '8px' }}>
                  <select value={f.type} onChange={e => updateFinancement(idx, { type: e.target.value })} style={{ ...inputStyle, padding: '6px', fontSize: '12px' }}>
                    {TYPES_FINANCEMENT.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
                  </select>
                  <input type="number" step="0.01" placeholder="Montant HT" value={f.montant_ht || ''} onChange={e => updateFinancement(idx, { montant_ht: parseFloat(e.target.value) || 0 })} style={{ ...inputStyle, padding: '6px', fontSize: '12px' }} />
                  <select value={f.statut_dossier} onChange={e => updateFinancement(idx, { statut_dossier: e.target.value })} style={{ ...inputStyle, padding: '6px', fontSize: '12px' }}>
                    {STATUTS_DOSSIER.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <button onClick={() => removeFinancement(idx)} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: '4px', fontSize: '12px', cursor: 'pointer' }}>×</button>
                </div>
                <input type="text" placeholder="Référence dossier (N° AFDAS...)" value={f.reference_dossier} onChange={e => updateFinancement(idx, { reference_dossier: e.target.value })} style={{ ...inputStyle, padding: '6px', fontSize: '12px' }} />
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
            <button onClick={save} disabled={loading} style={{ background: '#1A2C6B', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 20px', fontWeight: 500, cursor: 'pointer' }}>{loading ? 'Enregistrement...' : (selected ? 'Modifier' : 'Créer')}</button>
            <button onClick={() => setShowForm(false)} style={{ background: '#fff', color: '#6b7280', border: '1px solid #d1d5db', borderRadius: '8px', padding: '10px 20px', cursor: 'pointer' }}>Annuler</button>
          </div>
        </div>
      )}

      {/* LISTE */}
      {filtered.length === 0 ? (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '60px', textAlign: 'center', color: '#9ca3af' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>👥</div>
          <p style={{ fontWeight: 500, marginBottom: '4px' }}>Aucune inscription{statutFilter !== 'all' ? ` "${STATUT_MAP[statutFilter]?.label || ''}"` : ''}</p>
          <p style={{ fontSize: '13px' }}>Clique sur "+ Nouvelle inscription" pour commencer</p>
        </div>
      ) : (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                <th style={{ padding: '12px', textAlign: 'left', color: '#6b7280', fontWeight: 500, fontSize: '12px' }}>Stagiaire</th>
                <th style={{ padding: '12px', textAlign: 'left', color: '#6b7280', fontWeight: 500, fontSize: '12px' }}>Formation · Session</th>
                <th style={{ padding: '12px', textAlign: 'left', color: '#6b7280', fontWeight: 500, fontSize: '12px' }}>Statut</th>
                <th style={{ padding: '12px', textAlign: 'right', color: '#6b7280', fontWeight: 500, fontSize: '12px' }}>Montant</th>
                <th style={{ padding: '12px', textAlign: 'left', color: '#6b7280', fontWeight: 500, fontSize: '12px' }}>Inscrit le</th>
                <th style={{ padding: '12px', textAlign: 'center', color: '#6b7280', fontWeight: 500, fontSize: '12px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(ins => {
                const st = STATUT_MAP[ins.statut] || { label: ins.statut, color: '#9ca3af' }
                return (
                  <tr key={ins.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '12px' }}>
                      <div style={{ fontWeight: 500, color: '#1A2C6B' }}>{ins.contacts?.prenom} {ins.contacts?.nom}</div>
                      {ins.contacts?.email && <div style={{ fontSize: '11px', color: '#9ca3af' }}>{ins.contacts.email}</div>}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ fontSize: '13px' }}>{ins.formation_sessions?.formations?.ref_interne && <span style={{color:'#9ca3af'}}>[{ins.formation_sessions.formations.ref_interne}] </span>}{ins.formation_sessions?.formations?.titre || '—'}</div>
                      <div style={{ fontSize: '11px', color: '#9ca3af' }}>{fmtDate(ins.formation_sessions?.date_debut)} → {fmtDate(ins.formation_sessions?.date_fin)}</div>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ background: st.color, color: '#fff', padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 500 }}>{st.label}</span>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right', color: '#C9A84C', fontWeight: 500 }}>{ins.montant_total_ht ? `${Number(ins.montant_total_ht).toLocaleString('fr-FR')} €` : '—'}</td>
                    <td style={{ padding: '12px', fontSize: '12px', color: '#6b7280' }}>{fmtDate(ins.date_inscription)}</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <button onClick={() => openDossierModal(ins)} title="Générer le dossier" style={{ background: '#C9A84C', color: '#fff', border: 'none', padding: '4px 10px', borderRadius: '4px', fontSize: '12px', cursor: 'pointer', marginRight: '4px', fontWeight: 500 }}>📥 Dossier</button>
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

      {/* DOSSIER MODAL */}
      {dossierIns && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={closeDossierModal}>
          <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', maxWidth: '560px', width: '92%', maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
            <h2 style={{ color: '#1A2C6B', fontSize: '1.2rem', margin: 0, marginBottom: '4px' }}>📥 Générer le dossier</h2>
            <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '16px', marginTop: 0 }}>
              {dossierIns.contacts?.prenom} {dossierIns.contacts?.nom}
              {dossierIns.formation_sessions?.formations?.titre ? ` · ${dossierIns.formation_sessions.formations.titre}` : ''}
            </p>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', alignItems: 'center' }}>
              <button onClick={selectAllTpls} style={{ background: '#fff', color: '#1A2C6B', border: '1px solid #1A2C6B', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', cursor: 'pointer' }}>Tout cocher</button>
              <button onClick={deselectAllTpls} style={{ background: '#fff', color: '#6b7280', border: '1px solid #d1d5db', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', cursor: 'pointer' }}>Tout décocher</button>
              <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#6b7280' }}>{selectedTpls.size} / {ALL_TEMPLATE_FILENAMES.length} sélectionnés</span>
            </div>
            <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '6px', marginBottom: '16px' }}>
              {TEMPLATE_LIST.map(tpl => {
                const checked = selectedTpls.has(tpl.filename)
                return (
                  <label key={tpl.filename} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', borderRadius: '6px', cursor: 'pointer', background: checked ? '#f9fafb' : 'transparent' }}>
                    <input type="checkbox" checked={checked} onChange={() => toggleTpl(tpl.filename)} style={{ cursor: 'pointer', accentColor: '#1A2C6B', width: '16px', height: '16px' }} />
                    <span style={{ fontSize: '13px', color: '#1A2C6B' }}>{tpl.label}</span>
                  </label>
                )
              })}
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button onClick={closeDossierModal} disabled={generatingDossier} style={{ background: '#fff', color: '#6b7280', border: '1px solid #d1d5db', borderRadius: '8px', padding: '10px 20px', cursor: generatingDossier ? 'not-allowed' : 'pointer', opacity: generatingDossier ? 0.5 : 1 }}>Annuler</button>
              <button onClick={runDossierGeneration} disabled={generatingDossier || selectedTpls.size === 0} style={{ background: (generatingDossier || selectedTpls.size === 0) ? '#9ca3af' : '#C9A84C', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 20px', fontWeight: 500, cursor: (generatingDossier || selectedTpls.size === 0) ? 'not-allowed' : 'pointer' }}>
                {generatingDossier ? 'Génération…' : `📥 Générer (${selectedTpls.size})`}
              </button>
            </div>
          </div>
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

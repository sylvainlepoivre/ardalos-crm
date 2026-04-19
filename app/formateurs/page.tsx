'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/useAuth'
import { supabase } from '@/lib/supabase'

const STATUTS_JURIDIQUES = [
  { value: 'interne_sas', label: 'Interne SAS', color: '#1A2C6B' },
  { value: 'independant_siret', label: 'Indépendant (SIRET)', color: '#C9A84C' },
  { value: 'intermittent_guso', label: 'Intermittent (GUSO)', color: '#0891B2' },
  { value: 'salarie', label: 'Salarié', color: '#059669' },
  { value: 'autre', label: 'Autre', color: '#9ca3af' },
]

const MODES_CONTRAT = ['prestation_service','mandat_social','salariat','intermittent','autre']
const TARIF_UNITES = ['heure','jour','mois','forfait_action']

type Formateur = {
  id: string
  prenom: string
  nom: string
  email: string | null
  telephone: string | null
  date_naissance: string | null
  lieu_naissance: string | null
  nationalite: string | null
  statut_juridique: string
  siret: string | null
  rcs_ville: string | null
  nda_personnel: string | null
  adresse_rue: string | null
  adresse_cp: string | null
  adresse_ville: string | null
  adresse_pays: string | null
  mode_contractualisation: string
  tarif_montant: number | null
  tarif_unite: string | null
  est_responsable_pedagogique: boolean
  est_referent_qualite: boolean
  est_referent_handicap: boolean
  est_intervenant: boolean
  est_dirigeant: boolean
  modules_animes: string | null
  specialite_principale: string | null
  specialites_tags: string[] | null
  diplomes: string | null
  experience_synthetique: string | null
  cv_url: string | null
  photo_url: string | null
  actif: boolean
  derniere_maj_dossier: string | null
  notes: string | null
}

function rolesBadges(f: Formateur) {
  const badges: { label: string; color: string }[] = []
  if (f.est_responsable_pedagogique) badges.push({ label: 'Resp. péda', color: '#1A2C6B' })
  if (f.est_referent_qualite) badges.push({ label: 'Réf. qualité', color: '#059669' })
  if (f.est_referent_handicap) badges.push({ label: 'Réf. handicap', color: '#C9A84C' })
  if (f.est_dirigeant) badges.push({ label: 'Dirigeant', color: '#7c3aed' })
  if (f.est_intervenant && badges.length === 0) badges.push({ label: 'Intervenant', color: '#6b7280' })
  return badges
}

function FormateursContent() {
  const [formateurs, setFormateurs] = useState<Formateur[]>([])
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [selected, setSelected] = useState<Formateur | null>(null)
  const [showInactive, setShowInactive] = useState(false)
  const [loading, setLoading] = useState(false)

  const [prenom, setPrenom] = useState('')
  const [nom, setNom] = useState('')
  const [email, setEmail] = useState('')
  const [telephone, setTelephone] = useState('')
  const [dateNaissance, setDateNaissance] = useState('')
  const [lieuNaissance, setLieuNaissance] = useState('')
  const [statutJuridique, setStatutJuridique] = useState('independant_siret')
  const [siret, setSiret] = useState('')
  const [rcsVille, setRcsVille] = useState('')
  const [ndaPersonnel, setNdaPersonnel] = useState('')
  const [adresseRue, setAdresseRue] = useState('')
  const [adresseCp, setAdresseCp] = useState('')
  const [adresseVille, setAdresseVille] = useState('')
  const [modeContrat, setModeContrat] = useState('prestation_service')
  const [tarifMontant, setTarifMontant] = useState('')
  const [tarifUnite, setTarifUnite] = useState('jour')
  const [estRespPeda, setEstRespPeda] = useState(false)
  const [estRefQualite, setEstRefQualite] = useState(false)
  const [estRefHandicap, setEstRefHandicap] = useState(false)
  const [estIntervenant, setEstIntervenant] = useState(true)
  const [estDirigeant, setEstDirigeant] = useState(false)
  const [modulesAnimes, setModulesAnimes] = useState('')
  const [specialitePrincipale, setSpecialitePrincipale] = useState('')
  const [specialitesTags, setSpecialitesTags] = useState('')
  const [diplomes, setDiplomes] = useState('')
  const [experience, setExperience] = useState('')
  const [actif, setActif] = useState(true)
  const [notes, setNotes] = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('formateurs').select('*').order('nom')
    setFormateurs(data || [])
  }

  function reset() {
    setSelected(null)
    setPrenom(''); setNom(''); setEmail(''); setTelephone('')
    setDateNaissance(''); setLieuNaissance('')
    setStatutJuridique('independant_siret'); setSiret(''); setRcsVille(''); setNdaPersonnel('')
    setAdresseRue(''); setAdresseCp(''); setAdresseVille('')
    setModeContrat('prestation_service'); setTarifMontant(''); setTarifUnite('jour')
    setEstRespPeda(false); setEstRefQualite(false); setEstRefHandicap(false)
    setEstIntervenant(true); setEstDirigeant(false)
    setModulesAnimes(''); setSpecialitePrincipale(''); setSpecialitesTags('')
    setDiplomes(''); setExperience(''); setActif(true); setNotes('')
  }

  function openNew() { reset(); setShowForm(true) }

  function openEdit(f: Formateur) {
    setSelected(f)
    setPrenom(f.prenom || ''); setNom(f.nom || '')
    setEmail(f.email || ''); setTelephone(f.telephone || '')
    setDateNaissance(f.date_naissance || ''); setLieuNaissance(f.lieu_naissance || '')
    setStatutJuridique(f.statut_juridique || 'independant_siret')
    setSiret(f.siret || ''); setRcsVille(f.rcs_ville || ''); setNdaPersonnel(f.nda_personnel || '')
    setAdresseRue(f.adresse_rue || ''); setAdresseCp(f.adresse_cp || ''); setAdresseVille(f.adresse_ville || '')
    setModeContrat(f.mode_contractualisation || 'prestation_service')
    setTarifMontant(f.tarif_montant?.toString() || '')
    setTarifUnite(f.tarif_unite || 'jour')
    setEstRespPeda(f.est_responsable_pedagogique || false)
    setEstRefQualite(f.est_referent_qualite || false)
    setEstRefHandicap(f.est_referent_handicap || false)
    setEstIntervenant(f.est_intervenant !== false)
    setEstDirigeant(f.est_dirigeant || false)
    setModulesAnimes(f.modules_animes || '')
    setSpecialitePrincipale(f.specialite_principale || '')
    setSpecialitesTags((f.specialites_tags || []).join(', '))
    setDiplomes(f.diplomes || '')
    setExperience(f.experience_synthetique || '')
    setActif(f.actif !== false)
    setNotes(f.notes || '')
    setShowForm(true)
  }

  async function save() {
    if (!prenom || !nom) { alert('Prénom et nom obligatoires'); return }
    setLoading(true)
    const payload: any = {
      prenom, nom,
      email: email || null,
      telephone: telephone || null,
      date_naissance: dateNaissance || null,
      lieu_naissance: lieuNaissance || null,
      statut_juridique: statutJuridique,
      siret: siret || null,
      rcs_ville: rcsVille || null,
      nda_personnel: ndaPersonnel || null,
      adresse_rue: adresseRue || null,
      adresse_cp: adresseCp || null,
      adresse_ville: adresseVille || null,
      mode_contractualisation: modeContrat,
      tarif_montant: tarifMontant ? parseFloat(tarifMontant) : null,
      tarif_unite: tarifUnite,
      est_responsable_pedagogique: estRespPeda,
      est_referent_qualite: estRefQualite,
      est_referent_handicap: estRefHandicap,
      est_intervenant: estIntervenant,
      est_dirigeant: estDirigeant,
      modules_animes: modulesAnimes || null,
      specialite_principale: specialitePrincipale || null,
      specialites_tags: specialitesTags ? specialitesTags.split(',').map(s => s.trim()).filter(Boolean) : [],
      diplomes: diplomes || null,
      experience_synthetique: experience || null,
      actif,
      notes: notes || null,
    }
    let err
    if (selected) {
      const res = await supabase.from('formateurs').update(payload).eq('id', selected.id)
      err = res.error
    } else {
      const res = await supabase.from('formateurs').insert(payload)
      err = res.error
    }
    setLoading(false)
    if (err) { alert('Erreur : ' + err.message); return }
    setShowForm(false)
    await load()
  }

  async function del(f: Formateur) {
    if (!confirm('Supprimer le formateur ' + f.prenom + ' ' + f.nom + ' ?')) return
    const { error } = await supabase.from('formateurs').delete().eq('id', f.id)
    if (error) { alert('Erreur : ' + error.message); return }
    await load()
  }

  const filtered = formateurs.filter(f => {
    if (!showInactive && !f.actif) return false
    if (!search) return true
    const q = search.toLowerCase()
    return (
      f.prenom?.toLowerCase().includes(q) ||
      f.nom?.toLowerCase().includes(q) ||
      f.email?.toLowerCase().includes(q) ||
      f.specialite_principale?.toLowerCase().includes(q)
    )
  })

  return (
    <div style={{ fontFamily: 'sans-serif', padding: '40px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <h1 style={{ color: '#1A2C6B', fontSize: '1.8rem', margin: 0 }}>Formateurs</h1>
        <button onClick={openNew} style={{ background: '#1A2C6B', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 18px', fontWeight: '500', cursor: 'pointer' }}>+ Nouveau formateur</button>
      </div>
      <p style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '20px' }}>
        {filtered.length} formateur{filtered.length !== 1 ? 's' : ''} · <a href="/" style={{color:'#1A2C6B'}}>← Accueil</a>
      </p>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..." style={{ flex: '1 1 240px', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '8px' }} />
        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#6b7280', cursor: 'pointer' }}>
          <input type="checkbox" checked={showInactive} onChange={e => setShowInactive(e.target.checked)} />
          Afficher les inactifs
        </label>
      </div>

      {showForm && (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
          <h2 style={{ color: '#1A2C6B', fontSize: '1.1rem', marginBottom: '16px' }}>{selected ? 'Modifier' : 'Nouveau'} formateur</h2>

          <h3 style={{ fontSize: '13px', color: '#6b7280', marginTop: '8px', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Identité</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div><label style={{ fontSize: '12px', color: '#6b7280' }}>Prénom *</label><input value={prenom} onChange={e => setPrenom(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', marginTop: '4px' }} /></div>
            <div><label style={{ fontSize: '12px', color: '#6b7280' }}>Nom *</label><input value={nom} onChange={e => setNom(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', marginTop: '4px' }} /></div>
            <div><label style={{ fontSize: '12px', color: '#6b7280' }}>Email</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', marginTop: '4px' }} /></div>
            <div><label style={{ fontSize: '12px', color: '#6b7280' }}>Téléphone</label><input value={telephone} onChange={e => setTelephone(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', marginTop: '4px' }} /></div>
            <div><label style={{ fontSize: '12px', color: '#6b7280' }}>Date de naissance</label><input type="date" value={dateNaissance} onChange={e => setDateNaissance(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', marginTop: '4px' }} /></div>
            <div><label style={{ fontSize: '12px', color: '#6b7280' }}>Lieu de naissance</label><input value={lieuNaissance} onChange={e => setLieuNaissance(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', marginTop: '4px' }} /></div>
          </div>

          <h3 style={{ fontSize: '13px', color: '#6b7280', marginTop: '16px', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Adresse</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 2fr', gap: '12px', marginBottom: '12px' }}>
            <div><label style={{ fontSize: '12px', color: '#6b7280' }}>Rue</label><input value={adresseRue} onChange={e => setAdresseRue(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', marginTop: '4px' }} /></div>
            <div><label style={{ fontSize: '12px', color: '#6b7280' }}>Code postal</label><input value={adresseCp} onChange={e => setAdresseCp(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', marginTop: '4px' }} /></div>
            <div><label style={{ fontSize: '12px', color: '#6b7280' }}>Ville</label><input value={adresseVille} onChange={e => setAdresseVille(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', marginTop: '4px' }} /></div>
          </div>

          <h3 style={{ fontSize: '13px', color: '#6b7280', marginTop: '16px', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Statut juridique</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div><label style={{ fontSize: '12px', color: '#6b7280' }}>Statut</label>
              <select value={statutJuridique} onChange={e => setStatutJuridique(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', marginTop: '4px' }}>
                {STATUTS_JURIDIQUES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div><label style={{ fontSize: '12px', color: '#6b7280' }}>SIRET</label><input value={siret} onChange={e => setSiret(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', marginTop: '4px' }} /></div>
            <div><label style={{ fontSize: '12px', color: '#6b7280' }}>RCS (ville)</label><input value={rcsVille} onChange={e => setRcsVille(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', marginTop: '4px' }} /></div>
            <div><label style={{ fontSize: '12px', color: '#6b7280' }}>NDA personnel</label><input value={ndaPersonnel} onChange={e => setNdaPersonnel(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', marginTop: '4px' }} /></div>
          </div>

          <h3 style={{ fontSize: '13px', color: '#6b7280', marginTop: '16px', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Contractualisation</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div><label style={{ fontSize: '12px', color: '#6b7280' }}>Mode</label>
              <select value={modeContrat} onChange={e => setModeContrat(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', marginTop: '4px' }}>
                {MODES_CONTRAT.map(m => <option key={m} value={m}>{m.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
            <div><label style={{ fontSize: '12px', color: '#6b7280' }}>Tarif (€)</label><input type="number" step="0.01" value={tarifMontant} onChange={e => setTarifMontant(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', marginTop: '4px' }} /></div>
            <div><label style={{ fontSize: '12px', color: '#6b7280' }}>Unité</label>
              <select value={tarifUnite} onChange={e => setTarifUnite(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', marginTop: '4px' }}>
                {TARIF_UNITES.map(u => <option key={u} value={u}>/{u.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
          </div>

          <h3 style={{ fontSize: '13px', color: '#6b7280', marginTop: '16px', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Rôles Qualiopi</h3>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '12px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}><input type="checkbox" checked={estRespPeda} onChange={e => setEstRespPeda(e.target.checked)} /> Responsable pédagogique</label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}><input type="checkbox" checked={estRefQualite} onChange={e => setEstRefQualite(e.target.checked)} /> Référent qualité</label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}><input type="checkbox" checked={estRefHandicap} onChange={e => setEstRefHandicap(e.target.checked)} /> Référent handicap</label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}><input type="checkbox" checked={estIntervenant} onChange={e => setEstIntervenant(e.target.checked)} /> Intervenant</label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}><input type="checkbox" checked={estDirigeant} onChange={e => setEstDirigeant(e.target.checked)} /> Dirigeant</label>
          </div>

          <h3 style={{ fontSize: '13px', color: '#6b7280', marginTop: '16px', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Intervention pédagogique</h3>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '12px', color: '#6b7280' }}>Modules animés</label>
            <input value={modulesAnimes} onChange={e => setModulesAnimes(e.target.value)} placeholder="Ex: Actions A à E" style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', marginTop: '4px' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div><label style={{ fontSize: '12px', color: '#6b7280' }}>Spécialité principale</label><input value={specialitePrincipale} onChange={e => setSpecialitePrincipale(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', marginTop: '4px' }} /></div>
            <div><label style={{ fontSize: '12px', color: '#6b7280' }}>Tags (séparés par ,)</label><input value={specialitesTags} onChange={e => setSpecialitesTags(e.target.value)} placeholder="danse, coaching, ..." style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', marginTop: '4px' }} /></div>
          </div>

          <h3 style={{ fontSize: '13px', color: '#6b7280', marginTop: '16px', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Qualifications (Qualiopi)</h3>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '12px', color: '#6b7280' }}>Diplômes</label>
            <textarea value={diplomes} onChange={e => setDiplomes(e.target.value)} rows={3} style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', marginTop: '4px', fontFamily: 'inherit' }} />
          </div>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '12px', color: '#6b7280' }}>Expérience synthétique</label>
            <textarea value={experience} onChange={e => setExperience(e.target.value)} rows={4} style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', marginTop: '4px', fontFamily: 'inherit' }} />
          </div>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '12px', color: '#6b7280' }}>Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', marginTop: '4px', fontFamily: 'inherit' }} />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}>
              <input type="checkbox" checked={actif} onChange={e => setActif(e.target.checked)} />
              Formateur actif (décoche si futur intervenant ou en pause)
            </label>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={save} disabled={loading} style={{ background: '#1A2C6B', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 20px', fontWeight: '500', cursor: 'pointer' }}>{loading ? 'Enregistrement...' : (selected ? 'Modifier' : 'Créer')}</button>
            <button onClick={() => setShowForm(false)} style={{ background: '#fff', color: '#6b7280', border: '1px solid #d1d5db', borderRadius: '8px', padding: '10px 20px', cursor: 'pointer' }}>Annuler</button>
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '60px', textAlign: 'center', color: '#9ca3af' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>🎓</div>
          <p style={{ fontWeight: '500', marginBottom: '4px' }}>Aucun formateur</p>
          <p style={{ fontSize: '13px' }}>Clique sur "+ Nouveau formateur" pour commencer</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '16px' }}>
          {filtered.map(f => {
            const badges = rolesBadges(f)
            const statutJur = STATUTS_JURIDIQUES.find(s => s.value === f.statut_juridique)
            return (
              <div key={f.id} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden', borderLeft: f.actif ? '4px solid #1A2C6B' : '4px solid #d1d5db', opacity: f.actif ? 1 : 0.6 }}>
                <div style={{ padding: '16px 20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '6px' }}>
                    <h3 style={{ color: '#1A2C6B', fontSize: '16px', margin: 0 }}>{f.prenom} {f.nom}</h3>
                    {!f.actif && <span style={{ fontSize: '10px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Inactif</span>}
                  </div>
                  {f.specialite_principale && <p style={{ fontSize: '13px', color: '#6b7280', margin: '0 0 10px 0' }}>{f.specialite_principale}</p>}
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '10px' }}>
                    {badges.map((b, i) => <span key={i} style={{ background: b.color, color: '#fff', padding: '2px 8px', borderRadius: '10px', fontSize: '10px', fontWeight: '500' }}>{b.label}</span>)}
                    {statutJur && <span style={{ background: '#fff', color: statutJur.color, padding: '2px 8px', borderRadius: '10px', fontSize: '10px', fontWeight: '500', border: '1px solid ' + statutJur.color }}>{statutJur.label}</span>}
                  </div>
                  {f.modules_animes && <p style={{ fontSize: '12px', color: '#374151', margin: '6px 0', lineHeight: '1.4' }}>📚 {f.modules_animes}</p>}
                  <div style={{ display: 'flex', gap: '12px', fontSize: '11px', color: '#9ca3af', marginTop: '10px', flexWrap: 'wrap' }}>
                    {f.email && <span>📧 {f.email}</span>}
                    {f.telephone && <span>📞 {f.telephone}</span>}
                  </div>
                  {f.siret && <p style={{ fontSize: '11px', color: '#9ca3af', margin: '6px 0 0 0' }}>SIRET : {f.siret}{f.rcs_ville ? ' · RCS ' + f.rcs_ville : ''}</p>}
                  {f.tarif_montant && <p style={{ fontSize: '12px', color: '#C9A84C', margin: '6px 0 0 0', fontWeight: '500' }}>💰 {f.tarif_montant}€ /{f.tarif_unite}</p>}
                </div>
                <div style={{ display: 'flex', gap: '8px', padding: '12px 20px', borderTop: '1px solid #f3f4f6', background: '#f9fafb' }}>
                  <button onClick={() => openEdit(f)} style={{ flex: 1, background: '#fff', color: '#1A2C6B', border: '1px solid #1A2C6B', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>Modifier</button>
                  <button onClick={() => del(f)} style={{ background: '#fff', color: '#ef4444', border: 'none', padding: '6px 12px', fontSize: '12px', cursor: 'pointer' }}>Supprimer</button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function FormateursPage() {
  const { loading } = useAuth()
  if (loading) return <div style={{ fontFamily: 'sans-serif', padding: '40px', color: '#9ca3af' }}>Chargement...</div>
  return <FormateursContent />
}

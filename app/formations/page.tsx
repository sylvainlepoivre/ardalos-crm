'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/useAuth'
import { supabase } from '@/lib/supabase'


const MODALITES = ['Présentiel', 'Distanciel', 'Hybride', 'E-learning']
const FINANCEMENTS = ['AFDAS', 'OPCO Atlas', 'OPCO EP', 'CPF', 'Plan de formation', 'Financement personnel']
const NIVEAUX = ['Débutant', 'Intermédiaire', 'Avancé', 'Tous niveaux']

function FormationsContent() {
  const [formations, setFormations] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [selected, setSelected] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')

  const [titre, setTitre] = useState('')
  const [description, setDescription] = useState('')
  const [objectifs, setObjectifs] = useState('')
  const [duree, setDuree] = useState('')
  const [tarif, setTarif] = useState('')
  const [modalite, setModalite] = useState('Présentiel')
  const [niveau, setNiveau] = useState('Tous niveaux')
  const [financement, setFinancement] = useState<string[]>([])
  const [prerequis, setPrerequis] = useState('')
  const [public_vise, setPublicVise] = useState('')
  const [ref_interne, setRefInterne] = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('formations').select('*').order('created_at', { ascending: false })
    if (data) setFormations(data)
  }

  function reset() {
    setTitre(''); setDescription(''); setObjectifs(''); setDuree(''); setTarif('')
    setModalite('Présentiel'); setNiveau('Tous niveaux'); setFinancement([])
    setPrerequis(''); setPublicVise(''); setRefInterne(''); setSelected(null)
  }

  async function save() {
    if (!titre || !duree) return alert('Titre et durée obligatoires')
    setLoading(true)
    const data = { titre, description, objectifs, duree: parseInt(duree), tarif: parseFloat(tarif)||0, modalite, niveau, financement: financement.join(','), prerequis, public_vise, ref_interne }
    if (selected) {
      await supabase.from('formations').update(data).eq('id', selected.id)
    } else {
      await supabase.from('formations').insert(data)
    }
    setLoading(false); setShowForm(false); reset(); load()
  }

  async function del(id: string) {
    if (!confirm('Supprimer cette formation ?')) return
    await supabase.from('formations').delete().eq('id', id); load()
  }

  function edit(f: any) {
    setSelected(f); setTitre(f.titre||''); setDescription(f.description||'')
    setObjectifs(f.objectifs||''); setDuree(f.duree?.toString()||''); setTarif(f.tarif?.toString()||'')
    setModalite(f.modalite||'Présentiel'); setNiveau(f.niveau||'Tous niveaux')
    setFinancement(f.financement?f.financement.split(','):[])
    setPrerequis(f.prerequis||''); setPublicVise(f.public_vise||''); setRefInterne(f.ref_interne||'')
    setShowForm(true)
  }

  function toggleFinancement(f: string) {
    setFinancement(prev => prev.includes(f) ? prev.filter(x=>x!==f) : [...prev, f])
  }

  const filtered = formations.filter(f => f.titre?.toLowerCase().includes(search.toLowerCase()))

  const modaliteColor: Record<string,string> = { 'Présentiel':'#1A2C6B', 'Distanciel':'#0891B2', 'Hybride':'#7C3AED', 'E-learning':'#059669' }

  return (
    <div style={{fontFamily:'sans-serif',padding:'40px',maxWidth:'1100px',margin:'0 auto'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'24px'}}>
        <div>
          <h1 style={{color:'#1A2C6B',marginBottom:'4px'}}>Formations</h1>
          <p style={{color:'#9ca3af',fontSize:'13px'}}>{formations.length} formation{formations.length!==1?'s':''} au catalogue</p>
        </div>
        <button onClick={()=>{reset();setShowForm(true)}} style={{background:'#1A2C6B',color:'#fff',border:'none',borderRadius:'8px',padding:'10px 20px',fontSize:'13px',cursor:'pointer',fontWeight:'500'}}>+ Nouvelle formation</button>
      </div>

      <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher une formation..." style={{width:'100%',padding:'10px 14px',border:'1px solid #d1d5db',borderRadius:'8px',fontSize:'14px',marginBottom:'24px',boxSizing:'border-box'}} />

      {showForm && (
        <div style={{background:'#fff',border:'1px solid #e5e7eb',borderRadius:'12px',padding:'28px',marginBottom:'24px'}}>
          <h2 style={{color:'#1A2C6B',marginBottom:'20px',fontSize:'16px'}}>{selected?'Modifier la formation':'Nouvelle formation'}</h2>
          <div style={{display:'grid',gridTemplateColumns:'2fr 1fr 1fr',gap:'12px',marginBottom:'14px'}}>
            <div>
              <label style={{display:'block',fontSize:'12px',color:'#6b7280',marginBottom:'4px'}}>Titre *</label>
              <input value={titre} onChange={e=>setTitre(e.target.value)} placeholder="Ex: Technique vocale avancée" style={{width:'100%',padding:'8px 12px',border:'1px solid #d1d5db',borderRadius:'8px',fontSize:'13px',boxSizing:'border-box'}} />
            </div>
            <div>
              <label style={{display:'block',fontSize:'12px',color:'#6b7280',marginBottom:'4px'}}>Durée (heures) *</label>
              <input value={duree} onChange={e=>setDuree(e.target.value)} type="number" placeholder="Ex: 35" style={{width:'100%',padding:'8px 12px',border:'1px solid #d1d5db',borderRadius:'8px',fontSize:'13px',boxSizing:'border-box'}} />
            </div>
            <div>
              <label style={{display:'block',fontSize:'12px',color:'#6b7280',marginBottom:'4px'}}>Tarif HT (€)</label>
              <input value={tarif} onChange={e=>setTarif(e.target.value)} type="number" placeholder="Ex: 1500" style={{width:'100%',padding:'8px 12px',border:'1px solid #d1d5db',borderRadius:'8px',fontSize:'13px',boxSizing:'border-box'}} />
            </div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'12px',marginBottom:'14px'}}>
            <div>
              <label style={{display:'block',fontSize:'12px',color:'#6b7280',marginBottom:'4px'}}>Référence interne</label>
              <input value={ref_interne} onChange={e=>setRefInterne(e.target.value)} placeholder="Ex: ARD-2026-001" style={{width:'100%',padding:'8px 12px',border:'1px solid #d1d5db',borderRadius:'8px',fontSize:'13px',boxSizing:'border-box'}} />
            </div>
            <div>
              <label style={{display:'block',fontSize:'12px',color:'#6b7280',marginBottom:'4px'}}>Modalité</label>
              <select value={modalite} onChange={e=>setModalite(e.target.value)} style={{width:'100%',padding:'8px 12px',border:'1px solid #d1d5db',borderRadius:'8px',fontSize:'13px'}}>
                {MODALITES.map(m=><option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label style={{display:'block',fontSize:'12px',color:'#6b7280',marginBottom:'4px'}}>Niveau</label>
              <select value={niveau} onChange={e=>setNiveau(e.target.value)} style={{width:'100%',padding:'8px 12px',border:'1px solid #d1d5db',borderRadius:'8px',fontSize:'13px'}}>
                {NIVEAUX.map(n=><option key={n} value={n}>{n}</option>)}
              </select>
            </div>
          </div>
          <div style={{marginBottom:'14px'}}>
            <label style={{display:'block',fontSize:'12px',color:'#6b7280',marginBottom:'8px'}}>Financements éligibles</label>
            <div style={{display:'flex',gap:'8px',flexWrap:'wrap'}}>
              {FINANCEMENTS.map(f=>(
                <button key={f} onClick={()=>toggleFinancement(f)} style={{padding:'5px 12px',borderRadius:'99px',fontSize:'12px',cursor:'pointer',border:`1px solid ${financement.includes(f)?'#1A2C6B':'#d1d5db'}`,background:financement.includes(f)?'#1A2C6B':'#fff',color:financement.includes(f)?'#fff':'#374151',fontWeight:financement.includes(f)?'600':'400'}}>{f}</button>
              ))}
            </div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px',marginBottom:'14px'}}>
            <div>
              <label style={{display:'block',fontSize:'12px',color:'#6b7280',marginBottom:'4px'}}>Public visé</label>
              <input value={public_vise} onChange={e=>setPublicVise(e.target.value)} placeholder="Ex: Artistes interprètes" style={{width:'100%',padding:'8px 12px',border:'1px solid #d1d5db',borderRadius:'8px',fontSize:'13px',boxSizing:'border-box'}} />
            </div>
            <div>
              <label style={{display:'block',fontSize:'12px',color:'#6b7280',marginBottom:'4px'}}>Prérequis</label>
              <input value={prerequis} onChange={e=>setPrerequis(e.target.value)} placeholder="Ex: Expérience scénique 2 ans" style={{width:'100%',padding:'8px 12px',border:'1px solid #d1d5db',borderRadius:'8px',fontSize:'13px',boxSizing:'border-box'}} />
            </div>
          </div>
          <div style={{marginBottom:'14px'}}>
            <label style={{display:'block',fontSize:'12px',color:'#6b7280',marginBottom:'4px'}}>Description</label>
            <textarea value={description} onChange={e=>setDescription(e.target.value)} placeholder="Description de la formation..." rows={3} style={{width:'100%',padding:'8px 12px',border:'1px solid #d1d5db',borderRadius:'8px',fontSize:'13px',boxSizing:'border-box',resize:'vertical'}} />
          </div>
          <div style={{marginBottom:'20px'}}>
            <label style={{display:'block',fontSize:'12px',color:'#6b7280',marginBottom:'4px'}}>Objectifs pédagogiques</label>
            <textarea value={objectifs} onChange={e=>setObjectifs(e.target.value)} placeholder="A l'issue de la formation, le stagiaire sera capable de..." rows={3} style={{width:'100%',padding:'8px 12px',border:'1px solid #d1d5db',borderRadius:'8px',fontSize:'13px',boxSizing:'border-box',resize:'vertical'}} />
          </div>
          <div style={{display:'flex',gap:'12px'}}>
            <button onClick={save} disabled={loading} style={{background:'#1A2C6B',color:'#fff',border:'none',borderRadius:'8px',padding:'9px 20px',fontSize:'13px',cursor:'pointer',fontWeight:'500'}}>{loading?'Enregistrement...':selected?'Modifier':'Créer la formation'}</button>
            <button onClick={()=>{setShowForm(false);reset()}} style={{background:'#f9fafb',color:'#374151',border:'1px solid #e5e7eb',borderRadius:'8px',padding:'9px 20px',fontSize:'13px',cursor:'pointer'}}>Annuler</button>
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <div style={{background:'#fff',border:'1px solid #e5e7eb',borderRadius:'12px',padding:'60px',textAlign:'center',color:'#9ca3af'}}>
          <div style={{fontSize:'40px',marginBottom:'12px'}}>🎓</div>
          <p style={{fontWeight:'500',marginBottom:'4px'}}>Aucune formation au catalogue</p>
          <p style={{fontSize:'13px'}}>Cliquez sur "+ Nouvelle formation" pour commencer</p>
        </div>
      ) : (
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))',gap:'16px'}}>
          {filtered.map((f:any)=>(
            <div key={f.id} style={{background:'#fff',border:'1px solid #e5e7eb',borderRadius:'12px',overflow:'hidden',display:'flex',flexDirection:'column'}}>
              <div style={{padding:'16px 20px',borderTop:`3px solid ${modaliteColor[f.modalite]||'#1A2C6B'}`,flex:1}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'8px'}}>
                  <div>
                    {f.ref_interne&&<div style={{fontSize:'11px',color:'#9ca3af',marginBottom:'2px'}}>{f.ref_interne}</div>}
                    <div style={{fontSize:'15px',fontWeight:'600',color:'#111827'}}>{f.titre}</div>
                  </div>
                  <span style={{background:modaliteColor[f.modalite]+'20',color:modaliteColor[f.modalite]||'#1A2C6B',fontSize:'11px',fontWeight:'600',padding:'2px 8px',borderRadius:'99px',whiteSpace:'nowrap',marginLeft:'8px'}}>{f.modalite}</span>
                </div>
                {f.description&&<p style={{fontSize:'12px',color:'#6b7280',marginBottom:'10px',lineHeight:'1.5'}}>{f.description.substring(0,100)}{f.description.length>100?'...':''}</p>}
                <div style={{display:'flex',gap:'16px',marginBottom:'10px'}}>
                  <div style={{fontSize:'12px',color:'#6b7280'}}><span style={{fontWeight:'600',color:'#1A2C6B'}}>{f.duree}h</span> de formation</div>
                  {f.tarif>0&&<div style={{fontSize:'12px',color:'#6b7280'}}><span style={{fontWeight:'600',color:'#C9A84C'}}>{f.tarif.toLocaleString('fr-FR')}€</span> HT</div>}
                  {f.niveau&&<div style={{fontSize:'12px',color:'#6b7280'}}>{f.niveau}</div>}
                </div>
                {f.financement&&<div style={{display:'flex',gap:'4px',flexWrap:'wrap',marginBottom:'10px'}}>
                  {f.financement.split(',').filter(Boolean).map((fin:string)=>(
                    <span key={fin} style={{background:'#eff6ff',color:'#1d4ed8',fontSize:'10px',padding:'2px 6px',borderRadius:'99px',fontWeight:'500'}}>{fin}</span>
                  ))}
                </div>}
                {f.public_vise&&<div style={{fontSize:'11px',color:'#9ca3af'}}>Public : {f.public_vise}</div>}
              </div>
              <div style={{padding:'8px 20px',borderTop:'1px solid #f3f4f6'}}>
                <a href={`/sessions`} style={{fontSize:'12px',color:'#1A2C6B',textDecoration:'none',fontWeight:'500'}}>📅 Voir les sessions planifiees →</a>
              </div>
              <div style={{display:'flex',gap:'8px',padding:'12px 20px',borderTop:'1px solid #f3f4f6',background:'#f9fafb'}}>
                <button onClick={()=>edit(f)} style={{flex:1,background:'#fff',border:'1px solid #e5e7eb',borderRadius:'6px',padding:'6px',fontSize:'12px',cursor:'pointer',color:'#374151'}}>Modifier</button>
                <button onClick={()=>del(f.id)} style={{background:'none',border:'none',color:'#ef4444',cursor:'pointer',fontSize:'12px',padding:'6px 10px'}}>Supprimer</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function FormationsPage() {
  const { loading } = useAuth()
  if (loading) return <div style={{fontFamily:'sans-serif',padding:'40px',color:'#9ca3af'}}>Chargement...</div>
  return <FormationsContent />
}

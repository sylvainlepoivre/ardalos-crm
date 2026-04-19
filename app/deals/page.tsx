'use client'
import { useAuth } from '@/lib/useAuth'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
const ETAPES = ['Nouveau lead','Qualification','Dossier en cours','Validation','Closing']
const COLORS = ['#9ca3af','#1A2C6B','#C9A84C','#0891B2','#059669']
function Deals() {
  const [deals, setDeals] = useState<any[]>([])
  const [nom, setNom] = useState('')
  const [valeur, setValeur] = useState('')
  const [contact, setContact] = useState('')
  const [etape, setEtape] = useState(0)
  useEffect(() => { load() }, [])
  async function load() {
    const { data } = await supabase.from('deals').select('*').order('created_at', { ascending: false })
    if (data) setDeals(data)
  }
  async function add() {
    if (!nom) return alert('Nom obligatoire')
    await supabase.from('deals').insert({ nom, valeur: parseInt(valeur)||0, contact, etape })
    setNom(''); setValeur(''); setContact(''); setEtape(0); load()
  }
  async function del(id: string) {
    await supabase.from('deals').delete().eq('id', id); load()
  }
  return (
    <div style={{fontFamily:'sans-serif',padding:'40px',maxWidth:'1000px',margin:'0 auto'}}>
      <h1 style={{color:'#1A2C6B',marginBottom:'24px'}}>Pipeline Ardalos CRM</h1>
      <div style={{background:'#fff',border:'1px solid #e5e7eb',borderRadius:'12px',padding:'20px',marginBottom:'24px'}}>
        <div style={{display:'flex',gap:'12px',flexWrap:'wrap'}}>
          <input value={nom} onChange={e=>setNom(e.target.value)} placeholder="Nom du deal *" style={{flex:2,minWidth:'160px',padding:'8px 12px',border:'1px solid #d1d5db',borderRadius:'8px',fontSize:'14px'}} />
          <input value={valeur} onChange={e=>setValeur(e.target.value)} placeholder="Valeur €" type="number" style={{flex:1,minWidth:'100px',padding:'8px 12px',border:'1px solid #d1d5db',borderRadius:'8px',fontSize:'14px'}} />
          <input value={contact} onChange={e=>setContact(e.target.value)} placeholder="Contact" style={{flex:1,minWidth:'120px',padding:'8px 12px',border:'1px solid #d1d5db',borderRadius:'8px',fontSize:'14px'}} />
          <select value={etape} onChange={e=>setEtape(parseInt(e.target.value))} style={{flex:1,minWidth:'140px',padding:'8px 12px',border:'1px solid #d1d5db',borderRadius:'8px',fontSize:'14px'}}>
            {ETAPES.map((e,i)=><option key={i} value={i}>{e}</option>)}
          </select>
          <button onClick={add} style={{background:'#1A2C6B',color:'#fff',border:'none',borderRadius:'8px',padding:'8px 16px',fontSize:'13px',cursor:'pointer'}}>+ Ajouter</button>
        </div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:'12px'}}>
        {ETAPES.map((e,i)=>(
          <div key={i} style={{background:'#f9fafb',borderRadius:'12px',overflow:'hidden',border:'1px solid #e5e7eb'}}>
            <div style={{padding:'10px 12px',borderTop:`3px solid ${COLORS[i]}`,borderBottom:'1px solid #e5e7eb'}}>
              <div style={{fontSize:'12px',fontWeight:'600',color:'#374151'}}>{e}</div>
              <div style={{fontSize:'11px',color:'#9ca3af'}}>{deals.filter(d=>d.etape===i).length} deal{deals.filter(d=>d.etape===i).length!==1?'s':''}</div>
            </div>
            <div style={{padding:'8px',display:'flex',flexDirection:'column',gap:'6px',minHeight:'100px'}}>
              {deals.filter(d=>d.etape===i).length===0?<div style={{fontSize:'11px',color:'#d1d5db',padding:'8px',textAlign:'center'}}>Vide</div>:
              deals.filter(d=>d.etape===i).map((d:any)=>(
                <div key={d.id} style={{background:'#fff',borderRadius:'8px',padding:'10px',border:'1px solid #e5e7eb'}}>
                  <div style={{fontSize:'12px',fontWeight:'600',color:'#111827',marginBottom:'3px'}}>{d.nom}</div>
                  {d.contact&&<div style={{fontSize:'11px',color:'#9ca3af',marginBottom:'4px'}}>{d.contact}</div>}
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <span style={{fontSize:'12px',fontWeight:'600',color:COLORS[i]}}>{d.valeur?d.valeur.toLocaleString('fr-FR')+'€':'—'}</span>
                    <button onClick={()=>del(d.id)} style={{background:'none',border:'none',color:'#ef4444',cursor:'pointer',fontSize:'11px'}}>✕</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}


export default function DealsPage() {
  const { loading } = useAuth()
  if (loading) return <div style={{fontFamily:"sans-serif",padding:"40px",color:"#9ca3af"}}>Chargement...</div>
  return <Deals />
}
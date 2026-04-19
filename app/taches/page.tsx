'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
const supabase = createClient('https://cvxzdiutxonnsnwoicqt.supabase.co','sb_publishable_J8ta-7L05zgK9rBy2OS9Bg_CjXHwZVK')
const PRIOS = ['Urgent','Haute','Normale','Basse']
const COLORS = {'Urgent':'#ef4444','Haute':'#f97316','Normale':'#eab308','Basse':'#22c55e'}
export default function Taches() {
  const [taches, setTaches] = useState([])
  const [titre, setTitre] = useState('')
  const [prio, setPrio] = useState('Normale')
  const [date, setDate] = useState('')
  const [contact, setContact] = useState('')
  useEffect(() => { load() }, [])
  async function load() {
    const { data } = await supabase.from('taches').select('*').order('created_at', { ascending: false })
    if (data) setTaches(data)
  }
  async function add() {
    if (!titre) return alert('Titre obligatoire')
    await supabase.from('taches').insert({ titre, priorite: prio, date_echeance: date||null, contact })
    setTitre(''); setPrio('Normale'); setDate(''); setContact(''); load()
  }
  async function toggle(id, done) {
    await supabase.from('taches').update({ done: !done }).eq('id', id); load()
  }
  async function del(id) {
    await supabase.from('taches').delete().eq('id', id); load()
  }
  const pending = taches.filter((t:any) => !t.done)
  const done = taches.filter((t:any) => t.done)
  return (
    <div style={{fontFamily:'sans-serif',padding:'40px',maxWidth:'800px',margin:'0 auto'}}>
      <h1 style={{color:'#1A2C6B',marginBottom:'8px'}}>Tâches Ardalos CRM</h1>
      <p style={{color:'#9ca3af',marginBottom:'24px'}}>{pending.length} à faire · {done.length} terminée{done.length!==1?'s':''}</p>
      <div style={{background:'#fff',border:'1px solid #e5e7eb',borderRadius:'12px',padding:'20px',marginBottom:'24px'}}>
        <div style={{display:'flex',gap:'12px',flexWrap:'wrap'}}>
          <input value={titre} onChange={e=>setTitre(e.target.value)} placeholder="Titre de la tâche *" style={{flex:2,minWidth:'180px',padding:'8px 12px',border:'1px solid #d1d5db',borderRadius:'8px',fontSize:'14px'}} />
          <select value={prio} onChange={e=>setPrio(e.target.value)} style={{flex:1,minWidth:'110px',padding:'8px 12px',border:'1px solid #d1d5db',borderRadius:'8px',fontSize:'14px'}}>
            {PRIOS.map(p=><option key={p} value={p}>{p}</option>)}
          </select>
          <input value={date} onChange={e=>setDate(e.target.value)} type="date" style={{flex:1,minWidth:'130px',padding:'8px 12px',border:'1px solid #d1d5db',borderRadius:'8px',fontSize:'14px'}} />
          <input value={contact} onChange={e=>setContact(e.target.value)} placeholder="Contact lié" style={{flex:1,minWidth:'120px',padding:'8px 12px',border:'1px solid #d1d5db',borderRadius:'8px',fontSize:'14px'}} />
          <button onClick={add} style={{background:'#1A2C6B',color:'#fff',border:'none',borderRadius:'8px',padding:'8px 16px',fontSize:'13px',cursor:'pointer'}}>+ Ajouter</button>
        </div>
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
        {taches.length===0&&<div style={{background:'#fff',border:'1px solid #e5e7eb',borderRadius:'12px',padding:'40px',textAlign:'center',color:'#9ca3af'}}>Aucune tâche</div>}
        {taches.map((t:any)=>(
          <div key={t.id} style={{background:'#fff',border:`1px solid ${t.done?'#e5e7eb':'#e5e7eb'}`,borderRadius:'10px',padding:'12px 16px',display:'flex',alignItems:'flex-start',gap:'12px',opacity:t.done?.6:1}}>
            <input type="checkbox" checked={t.done} onChange={()=>toggle(t.id,t.done)} style={{marginTop:'2px',cursor:'pointer',width:'16px',height:'16px'}} />
            <div style={{flex:1}}>
              <div style={{fontSize:'14px',fontWeight:'500',color:'#111827',textDecoration:t.done?'line-through':'none'}}>{t.titre}</div>
              <div style={{display:'flex',gap:'6px',marginTop:'5px',flexWrap:'wrap'}}>
                <span style={{background:COLORS[t.priorite]+'20',color:COLORS[t.priorite],fontSize:'11px',fontWeight:'600',padding:'2px 8px',borderRadius:'99px',border:`1px solid ${COLORS[t.priorite]}40`}}>{t.priorite}</span>
                {t.date_echeance&&<span style={{background:'#f3f4f6',color:'#6b7280',fontSize:'11px',padding:'2px 8px',borderRadius:'99px'}}>📅 {new Date(t.date_echeance).toLocaleDateString('fr-FR')}</span>}
                {t.contact&&<span style={{background:'#eff6ff',color:'#1d4ed8',fontSize:'11px',padding:'2px 8px',borderRadius:'99px'}}>👤 {t.contact}</span>}
              </div>
            </div>
            <button onClick={()=>del(t.id)} style={{background:'none',border:'none',color:'#ef4444',cursor:'pointer',fontSize:'13px'}}>✕</button>
          </div>
        ))}
      </div>
    </div>
  )
}

'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
const supabase = createClient('https://cvxzdiutxonnsnwoicqt.supabase.co','sb_publishable_J8ta-7L05zgK9rBy2OS9Bg_CjXHwZVK')
export default function Contacts() {
  const [contacts, setContacts] = useState<any[]>([])
  const [prenom, setPrenom] = useState('')
  const [nom, setNom] = useState('')
  const [email, setEmail] = useState('')
  useEffect(() => { load() }, [])
  async function load() {
    const { data } = await supabase.from('contacts').select('*').order('created_at', { ascending: false })
    if (data) setContacts(data)
  }
  async function add() {
    if (!prenom || !nom) return alert('Prénom et nom obligatoires')
    await supabase.from('contacts').insert({ prenom, nom, email })
    setPrenom(''); setNom(''); setEmail(''); load()
  }
  async function del(id: string) {
    await supabase.from('contacts').delete().eq('id', id); load()
  }
  return (
    <div style={{fontFamily:'sans-serif',padding:'40px',maxWidth:'800px',margin:'0 auto'}}>
      <h1 style={{color:'#1A2C6B',marginBottom:'24px'}}>Contacts Ardalos CRM</h1>
      <div style={{background:'#fff',border:'1px solid #e5e7eb',borderRadius:'12px',padding:'20px',marginBottom:'24px'}}>
        <div style={{display:'flex',gap:'12px',marginBottom:'12px'}}>
          <input value={prenom} onChange={e=>setPrenom(e.target.value)} placeholder="Prénom *" style={{flex:1,padding:'8px 12px',border:'1px solid #d1d5db',borderRadius:'8px',fontSize:'14px'}} />
          <input value={nom} onChange={e=>setNom(e.target.value)} placeholder="Nom *" style={{flex:1,padding:'8px 12px',border:'1px solid #d1d5db',borderRadius:'8px',fontSize:'14px'}} />
          <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" style={{flex:1,padding:'8px 12px',border:'1px solid #d1d5db',borderRadius:'8px',fontSize:'14px'}} />
          <button onClick={add} style={{background:'#1A2C6B',color:'#fff',border:'none',borderRadius:'8px',padding:'8px 16px',fontSize:'13px',cursor:'pointer'}}>+ Ajouter</button>
        </div>
      </div>
      <div style={{background:'#fff',border:'1px solid #e5e7eb',borderRadius:'12px',overflow:'hidden'}}>
        {contacts.length === 0 ? <div style={{padding:'40px',textAlign:'center',color:'#9ca3af'}}>Aucun contact</div> : contacts.map((c:any) => (
          <div key={c.id} style={{display:'flex',alignItems:'center',padding:'12px 20px',borderBottom:'1px solid #f9fafb'}}>
            <div style={{width:'36px',height:'36px',borderRadius:'50%',background:'#eef1f8',color:'#1A2C6B',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:'600',fontSize:'13px',marginRight:'12px'}}>{c.prenom[0]}{c.nom[0]}</div>
            <div style={{flex:1}}><div style={{fontWeight:'500'}}>{c.prenom} {c.nom}</div><div style={{fontSize:'12px',color:'#9ca3af'}}>{c.email||'—'}</div></div>
            <button onClick={()=>del(c.id)} style={{background:'none',border:'none',color:'#ef4444',cursor:'pointer'}}>Supprimer</button>
          </div>
        ))}
      </div>
    </div>
  )
}

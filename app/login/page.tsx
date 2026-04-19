'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  async function login() {
    setLoading(true); setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError('Email ou mot de passe incorrect'); setLoading(false) }
    else window.location.href = '/'
  }
  return (
    <div style={{minHeight:'100vh',background:'#F3F4F8',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{background:'#fff',borderRadius:'16px',padding:'40px',width:'100%',maxWidth:'380px',boxShadow:'0 4px 24px rgba(26,44,107,.1)'}}>
        <div style={{textAlign:'center',marginBottom:'32px'}}>
          <div style={{width:'52px',height:'52px',background:'#1A2C6B',borderRadius:'12px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'22px',fontWeight:'700',color:'#C9A84C',margin:'0 auto 12px',fontFamily:'serif'}}>A</div>
          <h1 style={{fontSize:'1.4rem',color:'#1A2C6B',marginBottom:'4px'}}>Ardalos CRM</h1>
          <p style={{fontSize:'13px',color:'#9ca3af'}}>Connectez-vous à votre espace</p>
        </div>
        {error && <div style={{background:'#fef2f2',border:'1px solid #fecaca',borderRadius:'8px',padding:'10px 14px',fontSize:'13px',color:'#dc2626',marginBottom:'16px'}}>{error}</div>}
        <div style={{marginBottom:'14px'}}>
          <label style={{display:'block',fontSize:'12px',fontWeight:'500',color:'#374151',marginBottom:'4px'}}>Email</label>
          <input value={email} onChange={e=>setEmail(e.target.value)} type="email" placeholder="vous@ardalos.fr" style={{width:'100%',padding:'9px 12px',border:'1px solid #d1d5db',borderRadius:'8px',fontSize:'14px',outline:'none',boxSizing:'border-box'}} />
        </div>
        <div style={{marginBottom:'20px'}}>
          <label style={{display:'block',fontSize:'12px',fontWeight:'500',color:'#374151',marginBottom:'4px'}}>Mot de passe</label>
          <input value={password} onChange={e=>setPassword(e.target.value)} type="password" placeholder="••••••••" onKeyDown={e=>e.key==='Enter'&&login()} style={{width:'100%',padding:'9px 12px',border:'1px solid #d1d5db',borderRadius:'8px',fontSize:'14px',outline:'none',boxSizing:'border-box'}} />
        </div>
        <button onClick={login} disabled={loading} style={{width:'100%',background:'#1A2C6B',color:'#fff',border:'none',borderRadius:'8px',padding:'11px',fontSize:'14px',fontWeight:'500',cursor:'pointer'}}>
          {loading ? 'Connexion...' : 'Se connecter'}
        </button>
      </div>
    </div>
  )
}

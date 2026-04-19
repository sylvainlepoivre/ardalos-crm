'use client'
import { useAuth } from '@/lib/useAuth'

function HomeContent() {
  return (
    <div style={{fontFamily:'sans-serif',minHeight:'100vh',background:'#F3F4F8',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{textAlign:'center',maxWidth:'640px',padding:'40px'}}>
        <div style={{width:'64px',height:'64px',background:'#1A2C6B',borderRadius:'16px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'28px',fontWeight:'700',color:'#C9A84C',margin:'0 auto 20px',fontFamily:'serif'}}>A</div>
        <h1 style={{fontSize:'2rem',color:'#1A2C6B',marginBottom:'8px'}}>Ardalos CRM</h1>
        <p style={{color:'#6b7280',marginBottom:'40px'}}>Votre CRM connecté à Supabase</p>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'16px',marginBottom:'16px'}}>
          <a href="/contacts" style={{background:'#fff',border:'1px solid #e5e7eb',borderRadius:'12px',padding:'24px',textDecoration:'none',display:'block'}}>
            <div style={{fontSize:'28px',marginBottom:'8px'}}>👥</div>
            <div style={{fontSize:'15px',fontWeight:'600',color:'#1A2C6B'}}>Contacts</div>
            <div style={{fontSize:'12px',color:'#9ca3af',marginTop:'4px'}}>Gérer vos contacts</div>
          </a>
          <a href="/deals" style={{background:'#fff',border:'1px solid #e5e7eb',borderRadius:'12px',padding:'24px',textDecoration:'none',display:'block'}}>
            <div style={{fontSize:'28px',marginBottom:'8px'}}>💼</div>
            <div style={{fontSize:'15px',fontWeight:'600',color:'#1A2C6B'}}>Pipeline</div>
            <div style={{fontSize:'12px',color:'#9ca3af',marginTop:'4px'}}>Deals & opportunités</div>
          </a>
          <a href="/taches" style={{background:'#fff',border:'1px solid #e5e7eb',borderRadius:'12px',padding:'24px',textDecoration:'none',display:'block'}}>
            <div style={{fontSize:'28px',marginBottom:'8px'}}>✅</div>
            <div style={{fontSize:'15px',fontWeight:'600',color:'#1A2C6B'}}>Tâches</div>
            <div style={{fontSize:'12px',color:'#9ca3af',marginTop:'4px'}}>Actions à faire</div>
          </a>
          <a href="/afdas" style={{background:'#fff',border:'1px solid #e5e7eb',borderRadius:'12px',padding:'24px',textDecoration:'none',display:'block'}}>
            <div style={{fontSize:'28px',marginBottom:'8px'}}>⏱</div>
            <div style={{fontSize:'15px',fontWeight:'600',color:'#1A2C6B'}}>AFDAS</div>
            <div style={{fontSize:'12px',color:'#9ca3af',marginTop:'4px'}}>Moteur éligibilité</div>
          </a>
          <a href="/sessions" style={{background:'#fff',border:'1px solid #e5e7eb',borderRadius:'12px',padding:'24px',textDecoration:'none',display:'block'}}>
            <div style={{fontSize:'28px',marginBottom:'8px'}}>📅</div>
            <div style={{fontSize:'15px',fontWeight:'600',color:'#1A2C6B'}}>Sessions</div>
            <div style={{fontSize:'12px',color:'#9ca3af',marginTop:'4px'}}>Planning des formations</div>
          </a>
          <a href="/formations" style={{background:'#fff',border:'1px solid #e5e7eb',borderRadius:'12px',padding:'24px',textDecoration:'none',display:'block'}}>
            <div style={{fontSize:'28px',marginBottom:'8px'}}>🎓</div>
            <div style={{fontSize:'15px',fontWeight:'600',color:'#1A2C6B'}}>Formations</div>
            <div style={{fontSize:'12px',color:'#9ca3af',marginTop:'4px'}}>Catalogue des formations</div>
          </a>
          <a href="/formateurs" style={{background:'#fff',border:'1px solid #e5e7eb',borderRadius:'12px',padding:'24px',textDecoration:'none',display:'block'}}>
            <div style={{fontSize:'28px',marginBottom:'8px'}}>👥</div>
            <div style={{fontSize:'15px',fontWeight:'600',color:'#1A2C6B'}}>Formateurs</div>
            <div style={{fontSize:'12px',color:'#9ca3af',marginTop:'4px'}}>Equipe pedagogique</div>
          </a>
          <a href="/inscriptions" style={{background:'#fff',border:'1px solid #e5e7eb',borderRadius:'12px',padding:'24px',textDecoration:'none',display:'block'}}>
            <div style={{fontSize:'28px',marginBottom:'8px'}}>📝</div>
            <div style={{fontSize:'15px',fontWeight:'600',color:'#1A2C6B'}}>Inscriptions</div>
            <div style={{fontSize:'12px',color:'#9ca3af',marginTop:'4px'}}>Stagiaires & financements</div>
          </a>
        </div>
        <a href="/crm.html" style={{background:'#1A2C6B',border:'1px solid #1A2C6B',borderRadius:'12px',padding:'20px',textDecoration:'none',display:'block'}}>
          <div style={{fontSize:'24px',marginBottom:'6px'}}>🚀</div>
          <div style={{fontSize:'15px',fontWeight:'600',color:'#C9A84C'}}>CRM Complet</div>
          <div style={{fontSize:'12px',color:'rgba(255,255,255,0.6)',marginTop:'4px'}}>Interface complète Ardalos</div>
        </a>
      </div>
    </div>
  )
}

export default function Home() {
  const { loading } = useAuth()
  if (loading) return <div style={{fontFamily:'sans-serif',padding:'40px',color:'#9ca3af'}}>Chargement...</div>
  return <HomeContent />
}

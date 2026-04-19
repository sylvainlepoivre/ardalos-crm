'use client'
import { useState } from 'react'
import { useAuth } from '@/lib/useAuth'

const SEUILS: Record<string,number> = { artiste:48, technicien_vivant:88, technicien_cinema:130, realisateur:48 }
const CARENCE = [{max:40,mois:12},{max:80,mois:18},{max:999,mois:24}]

function AfdasContent() {
  const [cat, setCat] = useState('artiste')
  const [volume, setVolume] = useState('')
  const [lastDur, setLastDur] = useState('')
  const [lastDate, setLastDate] = useState('')
  const [newHours, setNewHours] = useState('')
  const [taux, setTaux] = useState('60')
  const [result, setResult] = useState<any>(null)

  function calculate() {
    const vol = parseInt(volume)
    const seuil = SEUILS[cat]
    if (!vol) return alert('Renseignez le volume')
    if (vol < seuil) { setResult({ eligible: false, vol, seuil }); return }
    const dur = parseInt(lastDur) || 0
    const hours = parseInt(newHours) || 0
    const carenceRule = CARENCE.find(r => dur <= r.max) || CARENCE[2]
    const newCarence = CARENCE.find(r => hours <= r.max) || CARENCE[2]
    let inCarence = false, daysLeft = 0
    if (lastDate && dur > 0) {
      const carenceEnd = new Date(lastDate)
      carenceEnd.setMonth(carenceEnd.getMonth() + carenceRule.mois)
      inCarence = carenceEnd > new Date()
      daysLeft = Math.max(0, Math.ceil((carenceEnd.getTime() - Date.now()) / 86400000))
    }
    const budget = parseInt(taux) * hours
    const month = new Date().getMonth()
    const quadri = month < 4 ? 'Q1 (Jan-Avr)' : month < 8 ? 'Q2 (Mai-Aout)' : 'Q3 (Sep-Dec)'
    setResult({ eligible: true, inCarence, daysLeft, budget, newCarence: newCarence.mois, quadri, vol, seuil, hours, taux })
  }

  return (
    <div style={{fontFamily:'sans-serif',padding:'40px',maxWidth:'900px',margin:'0 auto'}}>
      <h1 style={{color:'#1A2C6B',marginBottom:'8px'}}>Moteur AFDAS 2026</h1>
      <p style={{color:'#9ca3af',marginBottom:'32px'}}>Calcul eligibilite - Carence - Budget - Quadrimestres</p>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'24px'}}>
        <div style={{background:'#fff',borderRadius:'12px',border:'1px solid #e5e7eb',padding:'24px'}}>
          <h2 style={{fontSize:'14px',fontWeight:'600',color:'#374151',marginBottom:'20px'}}>Calculateur</h2>
          <div style={{marginBottom:'14px'}}>
            <label style={{display:'block',fontSize:'12px',fontWeight:'500',color:'#6b7280',marginBottom:'4px'}}>Categorie</label>
            <select value={cat} onChange={e=>setCat(e.target.value)} style={{width:'100%',padding:'8px 12px',border:'1px solid #d1d5db',borderRadius:'8px',fontSize:'13px'}}>
              <option value="artiste">Artiste / Metteur en scene (48 cachets)</option>
              <option value="technicien_vivant">Technicien spectacle vivant (88 jours)</option>
              <option value="technicien_cinema">Technicien cinema / audiovisuel (130 jours)</option>
              <option value="realisateur">Realisateur (48 cachets)</option>
            </select>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px',marginBottom:'14px'}}>
            <div>
              <label style={{display:'block',fontSize:'12px',color:'#6b7280',marginBottom:'4px'}}>Volume activite</label>
              <input value={volume} onChange={e=>setVolume(e.target.value)} type="number" placeholder="Ex: 95" style={{width:'100%',padding:'8px 12px',border:'1px solid #d1d5db',borderRadius:'8px',fontSize:'13px',boxSizing:'border-box'}} />
            </div>
            <div>
              <label style={{display:'block',fontSize:'12px',color:'#6b7280',marginBottom:'4px'}}>Duree derniere formation (h)</label>
              <input value={lastDur} onChange={e=>setLastDur(e.target.value)} type="number" placeholder="Ex: 45" style={{width:'100%',padding:'8px 12px',border:'1px solid #d1d5db',borderRadius:'8px',fontSize:'13px',boxSizing:'border-box'}} />
            </div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px',marginBottom:'14px'}}>
            <div>
              <label style={{display:'block',fontSize:'12px',color:'#6b7280',marginBottom:'4px'}}>Date fin derniere formation</label>
              <input value={lastDate} onChange={e=>setLastDate(e.target.value)} type="date" style={{width:'100%',padding:'8px 12px',border:'1px solid #d1d5db',borderRadius:'8px',fontSize:'13px',boxSizing:'border-box'}} />
            </div>
            <div>
              <label style={{display:'block',fontSize:'12px',color:'#6b7280',marginBottom:'4px'}}>Duree formation souhaitee (h)</label>
              <input value={newHours} onChange={e=>setNewHours(e.target.value)} type="number" placeholder="Ex: 70" style={{width:'100%',padding:'8px 12px',border:'1px solid #d1d5db',borderRadius:'8px',fontSize:'13px',boxSizing:'border-box'}} />
            </div>
          </div>
          <div style={{marginBottom:'20px'}}>
            <label style={{display:'block',fontSize:'12px',color:'#6b7280',marginBottom:'4px'}}>Tarif horaire</label>
            <select value={taux} onChange={e=>setTaux(e.target.value)} style={{width:'100%',padding:'8px 12px',border:'1px solid #d1d5db',borderRadius:'8px',fontSize:'13px'}}>
              <option value="60">Pratiques artistiques - 60 euros/h</option>
              <option value="48">Securite / CACES - 48 euros/h</option>
              <option value="40">Transverses / PAO - 40 euros/h</option>
            </select>
          </div>
          <button onClick={calculate} style={{width:'100%',background:'#1A2C6B',color:'#fff',border:'none',borderRadius:'8px',padding:'11px',fontSize:'14px',fontWeight:'500',cursor:'pointer'}}>Calculer</button>
          {result && (
            <div style={{marginTop:'20px',padding:'16px',borderRadius:'8px',background:result.eligible&&!result.inCarence?'#ecfdf5':result.eligible?'#fffbeb':'#fef2f2',border:'1px solid #e5e7eb'}}>
              {!result.eligible && <p style={{color:'#dc2626',fontWeight:'600'}}>Non eligible - Volume {result.vol} inferieur au seuil {result.seuil}</p>}
              {result.eligible && result.inCarence && <p style={{color:'#d97706',fontWeight:'600'}}>En carence - {result.daysLeft} jours restants</p>}
              {result.eligible && !result.inCarence && <p style={{color:'#059669',fontWeight:'600'}}>Eligible - Pret a deposer</p>}
              {result.eligible && <div style={{fontSize:'13px',color:'#374151',marginTop:'8px'}}>
                <p>Budget estime : {result.budget.toLocaleString('fr-FR')} euros ({result.hours}h x {result.taux} euros/h)</p>
                <p>Carence induite : {result.newCarence} mois</p>
                <p>Quadrimestre actuel : {result.quadri}</p>
              </div>}
            </div>
          )}
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:'16px'}}>
          <div style={{background:'#fff',borderRadius:'12px',border:'1px solid #e5e7eb',padding:'20px'}}>
            <h3 style={{fontSize:'13px',fontWeight:'600',marginBottom:'12px'}}>Baremes 2026</h3>
            <p style={{fontSize:'13px',color:'#6b7280',padding:'6px 0',borderBottom:'1px solid #f3f4f6'}}>Pratiques artistiques : <strong style={{color:'#C9A84C'}}>60 euros/h</strong></p>
            <p style={{fontSize:'13px',color:'#6b7280',padding:'6px 0',borderBottom:'1px solid #f3f4f6'}}>Securite / CACES : <strong>48 euros/h</strong></p>
            <p style={{fontSize:'13px',color:'#6b7280',padding:'6px 0'}}>Transverses / PAO : <strong>40 euros/h</strong></p>
          </div>
          <div style={{background:'#fff',borderRadius:'12px',border:'1px solid #e5e7eb',padding:'20px'}}>
            <h3 style={{fontSize:'13px',fontWeight:'600',marginBottom:'12px'}}>Seuils eligibilite</h3>
            <p style={{fontSize:'13px',color:'#6b7280',padding:'6px 0',borderBottom:'1px solid #f3f4f6'}}>Artiste / Realisateur : <strong>48 cachets</strong></p>
            <p style={{fontSize:'13px',color:'#6b7280',padding:'6px 0',borderBottom:'1px solid #f3f4f6'}}>Tech. spectacle vivant : <strong>88 jours</strong></p>
            <p style={{fontSize:'13px',color:'#6b7280',padding:'6px 0'}}>Tech. cinema/audiovisuel : <strong>130 jours</strong></p>
          </div>
          <div style={{background:'#fff',borderRadius:'12px',border:'1px solid #e5e7eb',padding:'20px'}}>
            <h3 style={{fontSize:'13px',fontWeight:'600',marginBottom:'12px'}}>Regles de carence</h3>
            <p style={{fontSize:'13px',color:'#6b7280',padding:'6px 0',borderBottom:'1px solid #f3f4f6'}}>Formation 40h max : <strong>12 mois</strong></p>
            <p style={{fontSize:'13px',color:'#6b7280',padding:'6px 0',borderBottom:'1px solid #f3f4f6'}}>Formation 41-80h : <strong>18 mois</strong></p>
            <p style={{fontSize:'13px',color:'#6b7280',padding:'6px 0',borderBottom:'1px solid #f3f4f6'}}>Formation plus de 80h : <strong>24 mois</strong></p>
            <p style={{fontSize:'13px',color:'#059669',padding:'6px 0'}}>Securite : Sans carence</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AfdasPage() {
  const { loading } = useAuth()
  if (loading) return <div style={{fontFamily:'sans-serif',padding:'40px',color:'#9ca3af'}}>Chargement...</div>
  return <AfdasContent />
}

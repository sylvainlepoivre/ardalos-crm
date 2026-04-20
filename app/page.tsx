'use client'
import { useAuth } from '@/lib/useAuth'

// ============================================================================
// DESIGN SYSTEM ARDALOS
// ============================================================================
const BLEU = '#1A2C6B'
const DORE = '#C9A84C'
const BG = '#F3F4F8'

// ============================================================================
// COMPOSANTS
// ============================================================================

// Tuile standard (blanche)
function Tuile({ href, emoji, titre, desc }: { href: string; emoji: string; titre: string; desc: string }) {
  return (
    <a href={href} style={{
      background: '#fff',
      border: '1px solid #e5e7eb',
      borderRadius: '12px',
      padding: '20px 18px',
      textDecoration: 'none',
      display: 'block',
      transition: 'all 0.2s',
    }}>
      <div style={{ fontSize: '26px', marginBottom: '6px' }}>{emoji}</div>
      <div style={{ fontSize: '14px', fontWeight: 600, color: BLEU }}>{titre}</div>
      <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '3px' }}>{desc}</div>
    </a>
  )
}

// Tuile "feature" (gradient doré) pour mettre en avant
function TuileDoree({ href, emoji, titre, desc }: { href: string; emoji: string; titre: string; desc: string }) {
  return (
    <a href={href} style={{
      background: 'linear-gradient(135deg, #C9A84C 0%, #d4b95e 100%)',
      border: '1px solid #C9A84C',
      borderRadius: '12px',
      padding: '20px 18px',
      textDecoration: 'none',
      display: 'block',
      boxShadow: '0 4px 12px rgba(201,168,76,0.2)',
    }}>
      <div style={{ fontSize: '26px', marginBottom: '6px' }}>{emoji}</div>
      <div style={{ fontSize: '14px', fontWeight: 700, color: BLEU }}>{titre}</div>
      <div style={{ fontSize: '11px', color: 'rgba(26,44,107,0.8)', marginTop: '3px' }}>{desc}</div>
    </a>
  )
}

// Tuile "premium" (gradient bleu) pour mettre en avant le dashboard
function TuileBleue({ href, emoji, titre, desc }: { href: string; emoji: string; titre: string; desc: string }) {
  return (
    <a href={href} style={{
      background: 'linear-gradient(135deg, #1A2C6B 0%, #2d4491 100%)',
      border: '1px solid #1A2C6B',
      borderRadius: '12px',
      padding: '20px 18px',
      textDecoration: 'none',
      display: 'block',
      boxShadow: '0 4px 12px rgba(26,44,107,0.15)',
    }}>
      <div style={{ fontSize: '26px', marginBottom: '6px' }}>{emoji}</div>
      <div style={{ fontSize: '14px', fontWeight: 700, color: DORE }}>{titre}</div>
      <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.75)', marginTop: '3px' }}>{desc}</div>
    </a>
  )
}

// Section title (petit titre catégorie)
function Categorie({ emoji, titre }: { emoji: string; titre: string }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      margin: '28px 0 12px 0',
    }}>
      <div style={{
        fontSize: '11px',
        fontWeight: 700,
        color: BLEU,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
      }}>
        {emoji} {titre}
      </div>
      <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }} />
    </div>
  )
}

// ============================================================================
// CONTENU
// ============================================================================
function HomeContent() {
  return (
    <div style={{
      fontFamily: 'sans-serif',
      minHeight: '100vh',
      background: BG,
      padding: '32px 20px',
    }}>
      <div style={{ maxWidth: '720px', margin: '0 auto' }}>

        {/* HEADER */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            width: '56px',
            height: '56px',
            background: BLEU,
            borderRadius: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            fontWeight: 700,
            color: DORE,
            margin: '0 auto 14px',
            fontFamily: 'serif',
          }}>A</div>
          <h1 style={{ fontSize: '1.6rem', color: BLEU, margin: 0, fontWeight: 700 }}>Ardalos CRM</h1>
          <p style={{ color: '#6b7280', margin: '4px 0 0 0', fontSize: '13px' }}>Gestion complète Qualiopi / AFDAS</p>
        </div>

        {/* ═══ 📊 PILOTAGE ═══ */}
        <Categorie emoji="📊" titre="Pilotage" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <TuileBleue href="/dashboard" emoji="📊" titre="Dashboard" desc="KPI · Alertes · Métriques" />
          <TuileDoree href="/pipeline" emoji="🎯" titre="Pipeline" desc="Kanban suivi commercial" />
        </div>

        {/* ═══ 👥 DONNÉES CRM ═══ */}
        <Categorie emoji="👥" titre="Données CRM" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <Tuile href="/contacts" emoji="👥" titre="Contacts" desc="Stagiaires & prospects" />
          <Tuile href="/formateurs" emoji="🎤" titre="Formateurs" desc="Équipe pédagogique" />
          <Tuile href="/deals" emoji="💼" titre="Deals" desc="Opportunités" />
          <Tuile href="/taches" emoji="✅" titre="Tâches" desc="Actions à faire" />
        </div>

        {/* ═══ 🎓 FORMATION ═══ */}
        <Categorie emoji="🎓" titre="Formation" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <Tuile href="/formations" emoji="🎓" titre="Formations" desc="Catalogue des formations" />
          <Tuile href="/sessions" emoji="📅" titre="Sessions" desc="Planning" />
          <Tuile href="/inscriptions" emoji="📝" titre="Inscriptions" desc="Dossiers & financements" />
          <Tuile href="/afdas" emoji="⏱" titre="AFDAS" desc="Moteur éligibilité" />
        </div>

        {/* ═══ 💼 COMPTABILITÉ ═══ */}
        <Categorie emoji="💼" titre="Comptabilité" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <Tuile href="/export-compta" emoji="📊" titre="Export compta" desc="CSV pour Julien" />
          <Tuile href="/factures" emoji="📄" titre="Factures" desc="Liste + téléchargement PDF" />
        </div>

        {/* FOOTER */}
        <div style={{ textAlign: 'center', marginTop: '40px', color: '#9ca3af', fontSize: '11px' }}>
          Ardalos Formation SAS · NDA 93132464513 · Qualiopi en cours
        </div>
      </div>
    </div>
  )
}

export default function Home() {
  const { loading } = useAuth()
  if (loading) return <div style={{ fontFamily: 'sans-serif', padding: '40px', color: '#9ca3af' }}>Chargement...</div>
  return <HomeContent />
}

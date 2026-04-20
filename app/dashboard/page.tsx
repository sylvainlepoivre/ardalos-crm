'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/useAuth'
import { supabase } from '@/lib/supabase'

// ============================================================================
// COULEURS ARDALOS
// ============================================================================
const BLEU = '#1A2C6B'
const DORE = '#C9A84C'
const COLORS = {
  gris: '#9ca3af',
  bleu: BLEU,
  vert: '#059669',
  cyan: '#0891B2',
  orange: '#f97316',
  rouge: '#ef4444',
  dore: DORE,
}

const STATUTS: { value: string; label: string; color: string }[] = [
  { value: 'prospect', label: 'Prospect', color: COLORS.gris },
  { value: 'inscrit', label: 'Inscrit', color: COLORS.bleu },
  { value: 'confirme', label: 'Confirmé', color: COLORS.vert },
  { value: 'present', label: 'Présent', color: COLORS.cyan },
  { value: 'absent', label: 'Absent', color: COLORS.orange },
  { value: 'abandon', label: 'Abandon', color: COLORS.rouge },
]

// ============================================================================
// TYPES
// ============================================================================
type Ins = {
  id: string
  statut: string
  contact_id: string
  session_id: string
  montant_total_ht: number | null
  date_inscription: string | null
  date_confirmation: string | null
  created_at: string
  contacts?: { prenom: string; nom: string; email: string | null; telephone: string | null }
  formation_sessions?: { date_debut: string; date_fin: string; formations?: { titre: string } | null } | null
}

type Fin = {
  id: string
  inscription_id: string
  type_financement: string
  montant_ht: number
  statut_dossier: string
  created_at: string
}

// ============================================================================
// HELPERS
// ============================================================================
function fmtEuro(n: number): string {
  return n.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + ' €'
}
function fmtDate(d: string | null | undefined): string {
  if (!d) return ''
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}
function daysBetween(d1: string | Date, d2: string | Date = new Date()): number {
  const a = typeof d1 === 'string' ? new Date(d1) : d1
  const b = typeof d2 === 'string' ? new Date(d2) : d2
  return Math.floor((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24))
}

// ============================================================================
// COMPOSANTS UI
// ============================================================================
function KpiCard({ label, value, color = BLEU, sublabel }: { label: string; value: string; color?: string; sublabel?: string }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '18px' }}>
      <div style={{ fontSize: '11px', color: '#6b7280', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>{label}</div>
      <div style={{ fontSize: '26px', fontWeight: 700, color, lineHeight: 1.1 }}>{value}</div>
      {sublabel && <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>{sublabel}</div>}
    </div>
  )
}

function SectionTitle({ children, emoji }: { children: React.ReactNode; emoji?: string }) {
  return (
    <h2 style={{ color: BLEU, fontSize: '1.2rem', fontWeight: 600, margin: '32px 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
      {emoji && <span>{emoji}</span>}
      <span>{children}</span>
    </h2>
  )
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '18px' }}>
      <h3 style={{ color: '#6b7280', fontSize: '12px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0, marginBottom: '12px' }}>{title}</h3>
      {children}
    </div>
  )
}

// Barre horizontale
function HBar({ label, count, max, color, right }: { label: string; count: number; max: number; color: string; right?: string }) {
  const pct = max > 0 ? Math.round((count / max) * 100) : 0
  return (
    <div style={{ marginBottom: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px', fontSize: '12px' }}>
        <span style={{ color: BLEU, fontWeight: 500 }}>{label}</span>
        <span style={{ color: '#6b7280' }}>{right || count}</span>
      </div>
      <div style={{ height: '8px', background: '#f3f4f6', borderRadius: '4px', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, transition: 'width 0.3s' }} />
      </div>
    </div>
  )
}

// Camembert en SVG
function Pie({ segments, size = 140 }: { segments: { label: string; value: number; color: string }[]; size?: number }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0)
  if (total === 0) {
    return <div style={{ width: size, height: size, borderRadius: '50%', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: '11px' }}>Aucune donnée</div>
  }
  const r = size / 2 - 2
  const cx = size / 2
  const cy = size / 2
  let startAngle = -Math.PI / 2
  const paths: React.ReactElement[] = []
  segments.forEach((seg, i) => {
    if (seg.value === 0) return
    const angle = (seg.value / total) * 2 * Math.PI
    const endAngle = startAngle + angle
    const x1 = cx + r * Math.cos(startAngle)
    const y1 = cy + r * Math.sin(startAngle)
    const x2 = cx + r * Math.cos(endAngle)
    const y2 = cy + r * Math.sin(endAngle)
    const largeArc = angle > Math.PI ? 1 : 0
    const d = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`
    paths.push(<path key={i} d={d} fill={seg.color} />)
    startAngle = endAngle
  })
  return <svg width={size} height={size}>{paths}</svg>
}

// ============================================================================
// DASHBOARD PAGE
// ============================================================================
function DashboardContent() {
  const [inscriptions, setInscriptions] = useState<Ins[]>([])
  const [financements, setFinancements] = useState<Fin[]>([])
  const [sessions, setSessions] = useState<any[]>([])
  const [formations, setFormations] = useState<any[]>([])
  const [contacts, setContacts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const [ins, fin, ses, form, con] = await Promise.all([
      supabase.from('formation_inscriptions').select('*, contacts(prenom, nom, email, telephone), formation_sessions(date_debut, date_fin, formations(titre))').order('created_at', { ascending: false }),
      supabase.from('formation_financements').select('*'),
      supabase.from('formation_sessions').select('*, formations(titre, ref_interne)').order('date_debut'),
      supabase.from('formations').select('*'),
      supabase.from('contacts').select('*'),
    ])
    setInscriptions(ins.data || [])
    setFinancements(fin.data || [])
    setSessions(ses.data || [])
    setFormations(form.data || [])
    setContacts(con.data || [])
    setLoading(false)
  }

  if (loading) {
    return <div style={{ fontFamily: 'sans-serif', padding: '40px', color: '#9ca3af' }}>Chargement du dashboard…</div>
  }

  // ====================================================
  // SECTION 1 — VUE D'ENSEMBLE
  // ====================================================
  const total = inscriptions.length
  const countByStatut: Record<string, number> = {}
  STATUTS.forEach(s => { countByStatut[s.value] = inscriptions.filter(i => i.statut === s.value).length })

  const caPrevisionnel = inscriptions.reduce((s, i) => s + (Number(i.montant_total_ht) || 0), 0)
  const caEncaisse = inscriptions
    .filter(i => i.statut === 'confirme' || i.statut === 'present')
    .reduce((s, i) => s + (Number(i.montant_total_ht) || 0), 0)

  const nbProspects = countByStatut['prospect'] || 0
  const nbConfirmes = countByStatut['confirme'] || 0
  const nbTransformes = (countByStatut['confirme'] || 0) + (countByStatut['present'] || 0)
  const tauxConversion = (nbProspects + nbTransformes) > 0
    ? Math.round((nbTransformes / (nbProspects + nbTransformes)) * 100)
    : 0

  // ====================================================
  // SECTION 2 — ACTIVITÉ TEMPORELLE
  // ====================================================
  const today = new Date()
  const debutMois = new Date(today.getFullYear(), today.getMonth(), 1)
  const ilY30Jours = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)

  const insCeMois = inscriptions.filter(i => i.created_at && new Date(i.created_at) >= debutMois).length
  const ins30j = inscriptions.filter(i => i.created_at && new Date(i.created_at) >= ilY30Jours).length

  const sessionsAVenir = sessions.filter(s => {
    if (!s.date_debut) return false
    const d = new Date(s.date_debut)
    return d >= today && d <= new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)
  })
  const sessionsTerminesMois = sessions.filter(s => {
    if (!s.date_fin) return false
    const d = new Date(s.date_fin)
    return d >= debutMois && d <= today
  })

  // ====================================================
  // SECTION 3 — FINANCEMENT
  // ====================================================
  const finByType: Record<string, number> = {}
  financements.forEach(f => {
    if (!f.type_financement) return
    finByType[f.type_financement] = (finByType[f.type_financement] || 0) + Number(f.montant_ht || 0)
  })
  const totalFin = Object.values(finByType).reduce((s, n) => s + n, 0)

  const afdasEnCours = financements
    .filter(f => f.type_financement === 'AFDAS' && (f.statut_dossier === 'en_instruction' || f.statut_dossier === 'soumis'))
    .reduce((s, f) => s + Number(f.montant_ht || 0), 0)

  // Reste à charge total : montant HT - somme des financements par inscription
  let resteAChargeTotal = 0
  inscriptions.forEach(ins => {
    const montant = Number(ins.montant_total_ht) || 0
    const fins = financements.filter(f => f.inscription_id === ins.id)
    const financePourIns = fins.reduce((s, f) => s + Number(f.montant_ht || 0), 0)
    const reste = montant - financePourIns
    if (reste > 0) resteAChargeTotal += reste
  })

  // Palette couleurs pour les types de financement
  const finColors: Record<string, string> = {
    AFDAS: '#1A2C6B',
    CPF: '#C9A84C',
    OPCO_Atlas: '#0891B2',
    OPCO_EP: '#059669',
    Plan_formation: '#f97316',
    Financement_personnel: '#8b5cf6',
    Autre: '#9ca3af',
  }
  const finSegments = Object.entries(finByType).map(([type, value]) => ({
    label: type.replace(/_/g, ' '),
    value,
    color: finColors[type] || '#9ca3af',
  }))

  // ====================================================
  // SECTION 4 — TOP FORMATIONS
  // ====================================================
  const countByFormation: Record<string, { titre: string; count: number }> = {}
  inscriptions.forEach(i => {
    const titre = i.formation_sessions?.formations?.titre || null
    if (!titre) return
    if (!countByFormation[titre]) countByFormation[titre] = { titre, count: 0 }
    countByFormation[titre].count++
  })
  const topFormations = Object.values(countByFormation).sort((a, b) => b.count - a.count).slice(0, 5)
  const maxTopCount = topFormations.length > 0 ? topFormations[0].count : 0

  // Formations sans aucune inscription
  const formationsAvecInscription = new Set(Object.keys(countByFormation))
  const formationsSansInscription = formations.filter(f => f.titre && !formationsAvecInscription.has(f.titre))

  // ====================================================
  // SECTION 5 — ALERTES & RELANCES
  // ====================================================
  const prospectsFroids = inscriptions.filter(i => {
    if (i.statut !== 'prospect') return false
    if (!i.created_at) return false
    return daysBetween(i.created_at) >= 30
  })

  const afdasRelancer = financements.filter(f => {
    if (f.type_financement !== 'AFDAS') return false
    if (f.statut_dossier !== 'en_instruction' && f.statut_dossier !== 'soumis') return false
    if (!f.created_at) return false
    return daysBetween(f.created_at) >= 15
  })

  const contactsIncomplets = contacts.filter(c => !c.email && !c.telephone)

  const sessionsSansDossier = sessions.filter(s => {
    if (!s.date_debut) return false
    const d = new Date(s.date_debut)
    const diff = daysBetween(today, d)
    return diff <= 7 && diff >= 0
  })

  const nbAlertes = prospectsFroids.length + afdasRelancer.length + contactsIncomplets.length + sessionsSansDossier.length

  // ====================================================
  // RENDU
  // ====================================================
  return (
    <div style={{ fontFamily: 'sans-serif', padding: '32px 40px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
        <h1 style={{ color: BLEU, fontSize: '2rem', margin: 0 }}>📊 Dashboard</h1>
        <button onClick={load} style={{ background: '#fff', color: BLEU, border: `1px solid ${BLEU}`, borderRadius: '6px', padding: '6px 14px', fontSize: '12px', cursor: 'pointer' }}>↻ Actualiser</button>
      </div>
      <p style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '24px' }}>
        Vue d'ensemble de l'activité Ardalos Formation · <a href="/" style={{ color: BLEU }}>← Accueil</a>
      </p>

      {/* ============================================= */}
      {/* 1. VUE D'ENSEMBLE */}
      {/* ============================================= */}
      <SectionTitle emoji="🎯">Vue d'ensemble</SectionTitle>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
        <KpiCard label="Inscriptions totales" value={String(total)} color={BLEU} />
        <KpiCard label="CA prévisionnel" value={fmtEuro(caPrevisionnel)} color={DORE} />
        <KpiCard label="CA encaissé" value={fmtEuro(caEncaisse)} color={COLORS.vert} sublabel="Confirmés + Présents" />
        <KpiCard label="Taux conversion" value={`${tauxConversion}%`} color={COLORS.cyan} sublabel="Prospect → Confirmé" />
      </div>

      <Card title="Répartition par statut">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '12px', marginTop: '8px' }}>
          {STATUTS.map(s => (
            <div key={s.value} style={{ textAlign: 'center', padding: '10px', borderRadius: '8px', background: '#f9fafb' }}>
              <div style={{ fontSize: '22px', fontWeight: 700, color: s.color }}>{countByStatut[s.value] || 0}</div>
              <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* ============================================= */}
      {/* 2. ACTIVITÉ TEMPORELLE */}
      {/* ============================================= */}
      <SectionTitle emoji="📅">Activité temporelle</SectionTitle>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
        <KpiCard label="Inscriptions ce mois" value={String(insCeMois)} color={BLEU} />
        <KpiCard label="Inscriptions 30 derniers jours" value={String(ins30j)} color={COLORS.cyan} />
        <KpiCard label="Sessions à venir (30j)" value={String(sessionsAVenir.length)} color={DORE} />
        <KpiCard label="Sessions terminées ce mois" value={String(sessionsTerminesMois.length)} color={COLORS.vert} />
      </div>

      <Card title="Sessions à venir (30 prochains jours)">
        {sessionsAVenir.length === 0 ? (
          <p style={{ color: '#9ca3af', fontSize: '13px', margin: 0 }}>Aucune session programmée dans les 30 prochains jours.</p>
        ) : (
          <div>
            {sessionsAVenir.slice(0, 5).map(s => (
              <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f3f4f6', fontSize: '13px' }}>
                <div>
                  <div style={{ color: BLEU, fontWeight: 500 }}>{s.formations?.titre || 'Formation'}</div>
                  <div style={{ color: '#9ca3af', fontSize: '11px' }}>{fmtDate(s.date_debut)} → {fmtDate(s.date_fin)}</div>
                </div>
                <div style={{ color: '#6b7280', fontSize: '12px', alignSelf: 'center' }}>
                  Dans {daysBetween(today, s.date_debut)} jours
                </div>
              </div>
            ))}
            {sessionsAVenir.length > 5 && <p style={{ color: '#9ca3af', fontSize: '11px', margin: '8px 0 0 0' }}>… et {sessionsAVenir.length - 5} autres.</p>}
          </div>
        )}
      </Card>

      {/* ============================================= */}
      {/* 3. FINANCEMENT & COMPTABLE */}
      {/* ============================================= */}
      <SectionTitle emoji="💰">Financement & comptable</SectionTitle>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
        <KpiCard label="Total financé (tous types)" value={fmtEuro(totalFin)} color={BLEU} />
        <KpiCard label="AFDAS en cours d'instruction" value={fmtEuro(afdasEnCours)} color={DORE} sublabel="Soumis + en_instruction" />
        <KpiCard label="Reste à charge total" value={fmtEuro(resteAChargeTotal)} color={COLORS.orange} sublabel="Stagiaires + inscriptions" />
      </div>

      <Card title="Répartition par type de financement">
        {totalFin === 0 ? (
          <p style={{ color: '#9ca3af', fontSize: '13px', margin: 0 }}>Aucun financement enregistré.</p>
        ) : (
          <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
            <Pie segments={finSegments} />
            <div style={{ flex: 1 }}>
              {finSegments.map((s, i) => {
                const pct = totalFin > 0 ? Math.round((s.value / totalFin) * 100) : 0
                return (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '12px', height: '12px', borderRadius: '2px', background: s.color }} />
                      <span style={{ color: BLEU }}>{s.label}</span>
                    </div>
                    <span style={{ color: '#6b7280' }}>{fmtEuro(s.value)} <span style={{ color: '#9ca3af' }}>({pct}%)</span></span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </Card>

      {/* ============================================= */}
      {/* 4. TOP FORMATIONS */}
      {/* ============================================= */}
      <SectionTitle emoji="📚">Top formations</SectionTitle>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
        <Card title="Top 5 formations par nombre d'inscriptions">
          {topFormations.length === 0 ? (
            <p style={{ color: '#9ca3af', fontSize: '13px', margin: 0 }}>Aucune inscription pour le moment.</p>
          ) : (
            topFormations.map((f, i) => (
              <HBar key={i} label={f.titre} count={f.count} max={maxTopCount} color={DORE} right={`${f.count} inscription${f.count > 1 ? 's' : ''}`} />
            ))
          )}
        </Card>

        <Card title="Formations sans inscription">
          {formationsSansInscription.length === 0 ? (
            <p style={{ color: COLORS.vert, fontSize: '13px', margin: 0 }}>✅ Toutes les formations ont au moins 1 inscription !</p>
          ) : (
            <div>
              <div style={{ fontSize: '22px', fontWeight: 700, color: COLORS.orange, marginBottom: '8px' }}>{formationsSansInscription.length}</div>
              <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '10px' }}>à promouvoir / relancer</div>
              {formationsSansInscription.slice(0, 3).map(f => (
                <div key={f.id} style={{ fontSize: '12px', color: BLEU, padding: '4px 0', borderBottom: '1px solid #f3f4f6' }}>
                  {f.titre}
                </div>
              ))}
              {formationsSansInscription.length > 3 && <p style={{ color: '#9ca3af', fontSize: '11px', margin: '6px 0 0 0' }}>… et {formationsSansInscription.length - 3} autres.</p>}
            </div>
          )}
        </Card>
      </div>

      {/* ============================================= */}
      {/* 5. ALERTES & RELANCES */}
      {/* ============================================= */}
      <SectionTitle emoji="⚠️">Alertes & relances</SectionTitle>

      {nbAlertes === 0 ? (
        <Card title="Aucune alerte">
          <p style={{ color: COLORS.vert, fontSize: '14px', margin: 0 }}>✅ Tout est à jour, rien à relancer pour le moment !</p>
        </Card>
      ) : (
        <>
          <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: '8px', padding: '12px', marginBottom: '12px', fontSize: '13px', color: '#92400e' }}>
            ⚠️ <strong>{nbAlertes} point{nbAlertes > 1 ? 's' : ''} d'attention</strong> à traiter
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
            {/* Prospects froids */}
            <Card title={`Prospects froids (+30 jours)`}>
              {prospectsFroids.length === 0 ? (
                <p style={{ color: COLORS.vert, fontSize: '13px', margin: 0 }}>✅ Aucun prospect à relancer.</p>
              ) : (
                <div>
                  <div style={{ fontSize: '22px', fontWeight: 700, color: COLORS.orange, marginBottom: '8px' }}>{prospectsFroids.length}</div>
                  {prospectsFroids.slice(0, 4).map(p => (
                    <div key={p.id} style={{ fontSize: '12px', padding: '6px 0', borderBottom: '1px solid #f3f4f6' }}>
                      <div style={{ color: BLEU, fontWeight: 500 }}>{p.contacts?.prenom} {p.contacts?.nom}</div>
                      <div style={{ color: '#9ca3af', fontSize: '11px' }}>
                        {p.formation_sessions?.formations?.titre || 'Sans formation'} · il y a {daysBetween(p.created_at)} jours
                      </div>
                    </div>
                  ))}
                  {prospectsFroids.length > 4 && <p style={{ color: '#9ca3af', fontSize: '11px', margin: '6px 0 0 0' }}>… et {prospectsFroids.length - 4} autres.</p>}
                </div>
              )}
            </Card>

            {/* AFDAS à relancer */}
            <Card title="Dossiers AFDAS à relancer (+15j)">
              {afdasRelancer.length === 0 ? (
                <p style={{ color: COLORS.vert, fontSize: '13px', margin: 0 }}>✅ Aucun dossier AFDAS en attente depuis +15j.</p>
              ) : (
                <div>
                  <div style={{ fontSize: '22px', fontWeight: 700, color: COLORS.orange, marginBottom: '8px' }}>{afdasRelancer.length}</div>
                  {afdasRelancer.slice(0, 4).map(a => (
                    <div key={a.id} style={{ fontSize: '12px', padding: '6px 0', borderBottom: '1px solid #f3f4f6' }}>
                      <div style={{ color: BLEU, fontWeight: 500 }}>{fmtEuro(Number(a.montant_ht || 0))} · statut : {a.statut_dossier}</div>
                      <div style={{ color: '#9ca3af', fontSize: '11px' }}>Créé il y a {daysBetween(a.created_at)} jours</div>
                    </div>
                  ))}
                  {afdasRelancer.length > 4 && <p style={{ color: '#9ca3af', fontSize: '11px', margin: '6px 0 0 0' }}>… et {afdasRelancer.length - 4} autres.</p>}
                </div>
              )}
            </Card>

            {/* Contacts incomplets */}
            <Card title="Contacts sans email ni téléphone">
              {contactsIncomplets.length === 0 ? (
                <p style={{ color: COLORS.vert, fontSize: '13px', margin: 0 }}>✅ Tous les contacts ont email ou téléphone.</p>
              ) : (
                <div>
                  <div style={{ fontSize: '22px', fontWeight: 700, color: COLORS.orange, marginBottom: '8px' }}>{contactsIncomplets.length}</div>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>Fiches à compléter pour pouvoir contacter le stagiaire</div>
                  {contactsIncomplets.slice(0, 4).map(c => (
                    <div key={c.id} style={{ fontSize: '12px', padding: '4px 0', borderBottom: '1px solid #f3f4f6', color: BLEU }}>
                      {c.prenom} {c.nom}
                    </div>
                  ))}
                  {contactsIncomplets.length > 4 && <p style={{ color: '#9ca3af', fontSize: '11px', margin: '6px 0 0 0' }}>… et {contactsIncomplets.length - 4} autres.</p>}
                </div>
              )}
            </Card>

            {/* Sessions à J-7 */}
            <Card title="Sessions à J-7 (dossiers à envoyer)">
              {sessionsSansDossier.length === 0 ? (
                <p style={{ color: COLORS.vert, fontSize: '13px', margin: 0 }}>✅ Aucune session imminente.</p>
              ) : (
                <div>
                  <div style={{ fontSize: '22px', fontWeight: 700, color: COLORS.orange, marginBottom: '8px' }}>{sessionsSansDossier.length}</div>
                  {sessionsSansDossier.slice(0, 4).map(s => (
                    <div key={s.id} style={{ fontSize: '12px', padding: '6px 0', borderBottom: '1px solid #f3f4f6' }}>
                      <div style={{ color: BLEU, fontWeight: 500 }}>{s.formations?.titre || 'Formation'}</div>
                      <div style={{ color: '#9ca3af', fontSize: '11px' }}>Démarre dans {daysBetween(today, s.date_debut)} jours</div>
                    </div>
                  ))}
                  {sessionsSansDossier.length > 4 && <p style={{ color: '#9ca3af', fontSize: '11px', margin: '6px 0 0 0' }}>… et {sessionsSansDossier.length - 4} autres.</p>}
                </div>
              )}
            </Card>
          </div>
        </>
      )}

      <div style={{ textAlign: 'center', marginTop: '40px', color: '#9ca3af', fontSize: '11px' }}>
        Données mises à jour à {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { loading } = useAuth()
  if (loading) return <div style={{ fontFamily: 'sans-serif', padding: '40px', color: '#9ca3af' }}>Chargement...</div>
  return <DashboardContent />
}

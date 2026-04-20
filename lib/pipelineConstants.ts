// lib/pipelineConstants.ts
// Constantes partagées pour le pipeline commercial Ardalos

export const COMMERCIAUX = ['Sylvain', 'David', 'Shaun', 'Jérôme', 'Julien']

export const STATUTS_PROSPECTION: { value: string; label: string; color: string; emoji: string }[] = [
  { value: 'a_contacter',    label: 'À contacter',    color: '#9ca3af', emoji: '📞' },
  { value: 'renvoie_vous',   label: 'Rappeler',       color: '#f97316', emoji: '🔔' },
  { value: 'interesse',      label: 'Intéressé',      color: '#0891B2', emoji: '👀' },
  { value: 'pas_interesse',  label: 'Pas intéressé',  color: '#ef4444', emoji: '❌' },
  { value: 'non_applicable', label: 'N/A',            color: '#6b7280', emoji: '—' },
]

// Les 4 grandes phases du pipeline (pour le kanban)
export const PHASES_PIPELINE = [
  { key: 'prospection', label: '🔵 Prospection', color: '#9ca3af', bg: '#f3f4f6' },
  { key: 'dossier',     label: '🟡 Dossier',     color: '#C9A84C', bg: '#fef3c7' },
  { key: 'financement', label: '🟢 Financement', color: '#059669', bg: '#d1fae5' },
  { key: 'cloture',     label: '✅ Clôturé',     color: '#1A2C6B', bg: '#dbeafe' },
] as const

// Détermine la phase actuelle d'une inscription en fonction de son état
export function getPhase(ins: any): 'prospection' | 'dossier' | 'financement' | 'cloture' {
  // Clôturé : statut présent, confirmé, absent ou abandon
  if (['present', 'absent', 'abandon'].includes(ins.statut)) return 'cloture'

  // Financement : demande envoyée ou statut confirmé
  if (ins.demande_financement_envoyee_at || ins.statut === 'confirme') return 'financement'

  // Dossier : devis ou programme ou convention envoyés
  if (ins.devis_envoye_at || ins.programme_envoye_at || ins.convention_envoyee_at) {
    return 'dossier'
  }

  // Prospection : par défaut
  return 'prospection'
}

// Libellés lisibles pour l'historique
export const ETAPES_LABELS: Record<string, string> = {
  devis_envoye: 'Devis envoyé',
  programme_envoye: 'Programme envoyé',
  convention_envoyee: 'Convention envoyée',
  convention_signee: 'Convention signée reçue',
  autres_docs_signes: 'Autres documents signés',
  demande_financement_envoyee: 'Demande financement envoyée',
  statut_inscription: 'Statut inscription',
  statut_prospection: 'Statut prospection',
  commercial_responsable: 'Commercial responsable',
}

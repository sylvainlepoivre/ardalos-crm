// lib/templatesList.ts
// Liste centralisée des 10 templates du dossier Qualiopi/AFDAS.
// Safe à importer côté client ET côté serveur (aucune dépendance Node).

export type TemplateInfo = {
  filename: string
  label: string
}

export const TEMPLATE_LIST: TemplateInfo[] = [
  { filename: '01_CONVENTION_DE_FORMATION_PROFESSIONNELLE.docx', label: 'Convention de formation professionnelle' },
  { filename: '02_PROGRAMME_DE_FORMATION.docx',                 label: 'Programme de formation' },
  { filename: '03_ANNEXE_1_GRILLE_EVALUATION.docx',             label: "Annexe 1 — Grille d'évaluation" },
  { filename: '04_ANNEXE_2_FEUILLE_EMARGEMENT.docx',            label: "Annexe 2 — Feuille d'émargement" },
  { filename: '05_ANNEXE_3_ATTESTATION_FIN_DE_FORMATION.docx',  label: 'Annexe 3 — Attestation de fin de formation' },
  { filename: '06_ANNEXE_4_CERTIFICAT_DE_REALISATION.docx',     label: 'Annexe 4 — Certificat de réalisation' },
  { filename: '07_ANNEXE_5_REGLEMENT_INTERIEUR.docx',           label: 'Annexe 5 — Règlement intérieur' },
  { filename: '08_ANNEXE_5_BIS_ATTESTATION_LECTURE_RI.docx',    label: 'Annexe 5 bis — Attestation lecture du RI' },
  { filename: '09_ANNEXE_6_QUESTIONNAIRE_SATISFACTION.docx',    label: 'Annexe 6 — Questionnaire de satisfaction' },
  { filename: '10_ATTESTATION_FONCTION_DIRIGEANT.docx',         label: 'Attestation fonction dirigeant' },
]

export const ALL_TEMPLATE_FILENAMES: string[] = TEMPLATE_LIST.map(t => t.filename)

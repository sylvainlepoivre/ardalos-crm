export const metadata = { title: 'Ardalos CRM', description: 'CRM Ardalos Groupe' }
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  )
}

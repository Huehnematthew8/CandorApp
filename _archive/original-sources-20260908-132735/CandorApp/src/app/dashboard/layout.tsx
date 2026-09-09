import { Sidebar } from '@/components/sidebar'
import { IndustriesProvider } from '@/contexts/IndustriesContext'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <IndustriesProvider>
      <div className="flex h-screen bg-[var(--bg)]">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </IndustriesProvider>
  )
}
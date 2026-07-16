import { useState } from 'react'
import { AppProvider, useApp } from './context/AppContext'
import DashboardPage from './pages/DashboardPage'
import LecturaPage from './pages/LecturaPage'
import ScraperPage from './pages/ScraperPage'
import UploadPage from './pages/UploadPage'
import AlertasPage from './pages/AlertasPage'
import TipsPage from './pages/TipsPage'

const tabs = [
  { id: 'dashboard', label: 'Dashboard', icon: '◉' },
  { id: 'lectura', label: 'Lectura', icon: '◈' },
  { id: 'scraper', label: 'Air-E', icon: '◇' },
  { id: 'upload', label: 'PDFs', icon: '⊞' },
  { id: 'alerts', label: 'Alertas', icon: '△' },
  { id: 'tips', label: 'Consejos', icon: '○' },
]

function AppContent() {
  const [activeTab, setActiveTab] = useState('dashboard')

  const renderPage = () => {
    switch (activeTab) {
      case 'dashboard': return <DashboardPage />
      case 'lectura': return <LecturaPage />
      case 'scraper': return <ScraperPage />
      case 'upload': return <UploadPage />
      case 'alerts': return <AlertasPage />
      case 'tips': return <TipsPage />
      default: return <DashboardPage />
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Navbar */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(8,8,15,0.85)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
      }}>
        <div style={{
          maxWidth: 1280, margin: '0 auto',
          padding: '0 24px',
          display: 'flex', alignItems: 'center',
          height: 64, gap: 32,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'linear-gradient(135deg, #00e5ff, #3b82f6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, fontWeight: 900, color: '#08080f',
              boxShadow: '0 0 20px rgba(0,229,255,0.3)',
            }}>A</div>
            <span style={{ fontWeight: 700, fontSize: 15, color: '#f0f0f5', letterSpacing: '-0.02em' }}>
              aire·e <span style={{ fontWeight: 400, color: '#606080', fontSize: 13 }}>monitor</span>
            </span>
          </div>

          <div style={{ display: 'flex', gap: 2, overflow: 'auto', flex: 1 }}>
            {tabs.map(tab => {
              const active = activeTab === tab.id
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '6px 14px', borderRadius: 8,
                    border: 'none', cursor: 'pointer', flexShrink: 0,
                    fontSize: 13, fontWeight: active ? 600 : 450,
                    fontFamily: "'Inter', sans-serif",
                    color: active ? '#00e5ff' : '#606080',
                    background: active ? 'rgba(0,229,255,0.08)' : 'transparent',
                    transition: 'all 0.2s',
                  }}>
                  <span style={{ fontSize: 10 }}>{tab.icon}</span>
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>
      </nav>

      {/* Main */}
      <main style={{
        flex: 1, maxWidth: 1280, margin: '0 auto',
        padding: '28px 24px 60px', width: '100%',
      }}>
        <div className="animate-fade-in-up" key={activeTab}>
          {renderPage()}
        </div>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  )
}

import { useState, useEffect } from 'react'
import Dashboard from './components/Dashboard'
import CameraReader from './components/CameraReader'
import ManualInput from './components/ManualInput'
import ScraperPanel from './components/ScraperPanel'
import AlertList from './components/AlertList'
import TipsPanel from './components/TipsPanel'
import UploadPanel from './components/UploadPanel'

const API = '/api'

function App() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [clientId, setClientId] = useState(1)
  const [dashboardData, setDashboardData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchDashboard()
  }, [clientId])

  const fetchDashboard = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API}/dashboard/${clientId}`)
      
      if (!res.ok) {
        throw new Error(`Error en el servidor: ${res.status} ${res.statusText}`)
      }

      const data = await res.json()
      setDashboardData(data)
    } catch (err) {
      console.error('Error cargando dashboard:', err)
      setError(err.message)
      setDashboardData({ error: true, status: 404 })
    } finally {
      setLoading(false)
    }
  }

  const handleNewReading = () => {
    fetchDashboard()
  }

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'camera', label: 'Leer Contador', icon: '📷' },
    { id: 'manual', label: 'Ingreso Manual', icon: '📝' },
    { id: 'scraper', label: 'Facturas AirE', icon: '🤖' },
    { id: 'upload', label: 'Subir PDF', icon: '📤' },
    { id: 'alerts', label: 'Alertas', icon: '🔔' },
    { id: 'tips', label: 'Consejos', icon: '💡' }
  ]

  return (
    <div className="min-h-screen bg-brand-dark text-brand-title font-sans selection:bg-brand-neon/30 selection:text-white">
      {/* Barra de Navegación de Cristal */}
      <nav className="sticky top-0 z-50 w-full border-b border-white/5 bg-black/40 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 flex-col md:flex-row md:items-center md:justify-between py-2 md:py-0 gap-3 md:gap-0">
            {/* Logo de la Marca con Efecto de Resplandor */}
            <div className="flex items-center justify-between">
              <span className="text-lg font-black tracking-wider text-brand-title flex items-center gap-1.5 select-none">
                <span className="text-brand-neon drop-shadow-[0_0_8px_rgba(0,242,254,0.6)] animate-pulse">⚡</span>
                AIRE-E <span className="font-light text-brand-muted text-sm">Monitor</span>
              </span>
            </div>

            {/* Links / Pestañas de Navegación */}
            <div className="flex items-center gap-1 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
              {tabs.map(tab => {
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold tracking-wide transition-all duration-200 shrink-0 select-none ${
                      isActive
                        ? 'bg-brand-neon/10 text-brand-neon border border-brand-neon/20 shadow-[0_0_12px_rgba(0,242,254,0.1)]'
                        : 'text-brand-muted border border-transparent hover:text-brand-title hover:bg-white/[0.03]'
                    }`}
                  >
                    <span>{tab.icon}</span>
                    <span>{tab.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </nav>

      {/* Contenedor Principal */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {loading && activeTab === 'dashboard' ? (
          /* Estado de Carga Futurista */
          <div className="flex flex-col items-center justify-center py-20">
            <div className="relative h-12 w-12">
              <div className="absolute inset-0 rounded-full border-4 border-white/5" />
              <div className="absolute inset-0 rounded-full border-4 border-t-brand-neon animate-spin shadow-[0_0_15px_rgba(0,242,254,0.4)]" />
            </div>
            <p className="mt-4 text-xs font-bold tracking-widest text-brand-muted uppercase animate-pulse-glow">
              Sincronizando con el monitor...
            </p>
          </div>
        ) : (
          /* Renderizado Dinámico de Vistas */
          <div className="animate-fade-in">
            {activeTab === 'dashboard' && (
              <Dashboard data={dashboardData} onRefresh={fetchDashboard} />
            )}
            {activeTab === 'camera' && (
              <CameraReader clientId={clientId} onComplete={handleNewReading} />
            )}
            {activeTab === 'manual' && (
              <ManualInput clientId={clientId} onComplete={handleNewReading} />
            )}
            {activeTab === 'scraper' && (
              <ScraperPanel onComplete={handleNewReading} />
            )}
            {activeTab === 'alerts' && (
              <AlertList clientId={clientId} />
            )}
            {activeTab === 'tips' && (
              <TipsPanel prediction={dashboardData?.prediction} />
            )}
            {activeTab === 'upload' && (
              <UploadPanel clientId={clientId} />
            )}
          </div>
        )}
      </main>
    </div>
  )
}

export default App
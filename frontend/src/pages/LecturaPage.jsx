import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { todayStr } from '../utils/format'
import ManualInput from '../components/ManualInput'
import CameraReader from '../components/CameraReader'

export default function LecturaPage() {
  const { clientId, fetchDashboard } = useApp()
  const [mode, setMode] = useState('manual')

  const handleComplete = () => fetchDashboard()

  if (mode === 'camera') {
    return <CameraReader clientId={clientId} onComplete={handleComplete} onBack={() => setMode('manual')} />
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 className="section-title">Registrar Lectura</h1>
          <p className="section-subtitle">Ingresa la lectura actual de tu contador eléctrico</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className={mode === 'manual' ? 'btn-prime' : 'btn-ghost'} onClick={() => setMode('manual')} style={{ fontSize: 13 }}>
            ✎ Manual
          </button>
          <button className={mode === 'camera' ? 'btn-prime' : 'btn-ghost'} onClick={() => setMode('camera')} style={{ fontSize: 13 }}>
            ⊙ Cámara
          </button>
        </div>
      </div>

      {mode === 'manual' && <ManualInput clientId={clientId} onComplete={handleComplete} />}
    </div>
  )
}

import { useApp } from '../context/AppContext'
import AlertList from '../components/AlertList'

export default function AlertasPage() {
  const { clientId } = useApp()

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 className="section-title">Alertas</h1>
        <p className="section-subtitle">Notificaciones sobre tu consumo, vencimientos y anomalías</p>
      </div>
      <AlertList clientId={clientId} />
    </div>
  )
}

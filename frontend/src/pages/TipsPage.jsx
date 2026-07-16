import { useApp } from '../context/AppContext'
import TipsPanel from '../components/TipsPanel'

export default function TipsPage() {
  const { dashboardData } = useApp()

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 className="section-title">Consejos de Ahorro</h1>
        <p className="section-subtitle">Recomendaciones personalizadas basadas en tu consumo</p>
      </div>
      <TipsPanel prediction={dashboardData?.prediction} />
    </div>
  )
}

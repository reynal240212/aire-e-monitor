import { useState, useEffect } from 'react'

export default function AlertList({ clientId }) {
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAlerts()
  }, [clientId])

  const fetchAlerts = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/alerts/${clientId}`)
      const data = await res.json()
      setAlerts(data.alerts || [])
    } catch (e) {
      console.error('Error:', e)
    }
    setLoading(false)
  }

  const checkNewAlerts = async () => {
    try {
      await fetch(`/api/alerts/${clientId}/check`, { method: 'POST' })
      fetchAlerts()
    } catch (e) {
      console.error('Error:', e)
    }
  }

  const markAsRead = async (alertId) => {
    try {
      await fetch(`/api/alerts/${alertId}/read`, { method: 'PUT' })
      fetchAlerts()
    } catch (e) {
      console.error('Error:', e)
    }
  }

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical': return '🚨'
      case 'high': return '⚠️'
      case 'warning': return '⚡'
      case 'positive': return '✅'
      default: return 'ℹ️'
    }
  }

  // Estilos de bordes y fondos semánticos para cada tipo de alerta
  const getAlertStyles = (severity) => {
    switch (severity) {
      case 'critical':
        return 'bg-brand-danger/5 border-brand-danger/20 border-l-brand-danger animate-pulse-glow'
      case 'high':
        return 'bg-brand-danger/5 border-brand-danger/12 border-l-brand-danger'
      case 'warning':
        return 'bg-amber-500/5 border-amber-500/12 border-l-amber-500'
      case 'positive':
        return 'bg-brand-success/5 border-brand-success/12 border-l-brand-success'
      default:
        return 'bg-white/5 border-white/10 border-l-brand-neon'
    }
  }

  const getLabelColor = (severity) => {
    if (severity === 'critical' || severity === 'high') return 'text-brand-danger'
    if (severity === 'warning') return 'text-amber-500'
    if (severity === 'positive') return 'text-brand-success'
    return 'text-brand-neon'
  }

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center py-20">
        <div className="inline-block w-8 h-8 border-2 border-white/20 border-t-brand-neon rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex justify-between items-center text-xl font-bold text-brand-title tracking-tight">
        <span className="flex items-center gap-2">🔔 Alertas</span>
        <button 
          className="inline-flex items-center justify-center rounded-xl bg-primary-gradient px-4 py-2 text-xs font-semibold text-brand-dark shadow-[0_4px_15px_rgba(0,242,254,0.25)] transition-all duration-200 hover:scale-[1.02] hover:brightness-105 active:scale-95" 
          onClick={checkNewAlerts}
        >
          Verificar Ahora
        </button>
      </div>

      {/* Listado de Alertas u Estado Vacío */}
      {alerts.length === 0 ? (
        <div className="group relative overflow-hidden rounded-2xl border border-white/5 bg-brand-card p-8 shadow-glass backdrop-blur-md text-center">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/[0.015] to-transparent" />
          <div className="text-4xl mb-3">🎉</div>
          <h3 className="mb-1 text-white font-bold text-lg">No hay alertas</h3>
          <p className="text-brand-muted text-sm">Tu consumo está dentro de los parámetros normales.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {alerts.map((alert, i) => (
            <div 
              key={i} 
              className={`p-4 rounded-xl flex items-start gap-4 border border-l-[4px] shadow-sm transition-all duration-200 ${getAlertStyles(alert.severity)}`}
            >
              <div className="text-2xl select-none">
                {getSeverityIcon(alert.severity)}
              </div>
              <div className="flex-1 min-w-0">
                <div className={`text-xs font-bold tracking-wider uppercase ${getLabelColor(alert.severity)}`}>
                  {alert.tipo.replace(/_/g, ' ')}
                </div>
                <div className="text-brand-main text-sm mt-1 leading-relaxed">
                  {alert.mensaje}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Glosario / Leyenda de Alertas */}
      <div className="group relative overflow-hidden rounded-2xl border border-white/5 bg-brand-card p-6 shadow-glass backdrop-blur-md">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/[0.015] to-transparent" />
        <div className="text-sm font-bold tracking-wider text-brand-title uppercase mb-4">
          Tipos de Alertas
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center justify-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-brand-danger/10 text-brand-danger border border-brand-danger/20 animate-pulse-glow">
              CRÍTICO
            </span>
            <span className="text-brand-muted">Consumo excesivo o factura vencida</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center justify-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-brand-danger/10 text-brand-danger border border-brand-danger/20">
              ALTO
            </span>
            <span className="text-brand-muted">Consumo subió significativamente</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center justify-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-amber-500/10 text-amber-500 border border-amber-500/20">
              AVISO
            </span>
            <span className="text-brand-muted">Recordatorio de vencimiento</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center justify-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-brand-success/10 text-brand-success border border-brand-success/20">
              POSITIVO
            </span>
            <span className="text-brand-muted">Consumo reducido</span>
          </div>

        </div>
      </div>
    </div>
  )
}
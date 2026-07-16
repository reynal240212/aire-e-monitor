import { useState, useEffect } from 'react'

const severityConfig = {
  critical: { label: 'CRITICO', icon: '🚨', color: '#f43f5e', bg: 'rgba(244,63,94,0.08)', border: 'rgba(244,63,94,0.2)' },
  high: { label: 'ALTO', icon: '⚠️', color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)' },
  warning: { label: 'AVISO', icon: '⚡', color: '#00e5ff', bg: 'rgba(0,229,255,0.08)', border: 'rgba(0,229,255,0.2)' },
  positive: { label: 'POSITIVO', icon: '✅', color: '#10b981', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)' },
}

export default function AlertList({ clientId }) {
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchAlerts() }, [clientId])

  const fetchAlerts = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/alerts/${clientId}`)
      const data = await res.json()
      setAlerts(data.alerts || [])
    } catch (e) { console.error('Error:', e) }
    setLoading(false)
  }

  const checkNewAlerts = async () => {
    try { await fetch(`/api/alerts/${clientId}/check`, { method: 'POST' }); fetchAlerts() }
    catch (e) { console.error('Error:', e) }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid rgba(255,255,255,0.06)', borderTopColor: '#00e5ff', animation: 'spin 0.8s linear infinite' }} />
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 700 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: '#f0f0f5' }}>Alertas ({alerts.length})</h3>
          <p style={{ fontSize: 13, color: '#606080', margin: '2px 0 0' }}>Notificaciones de consumo y vencimientos</p>
        </div>
        <button className="btn-ghost" onClick={checkNewAlerts} style={{ fontSize: 13 }}>Verificar Ahora</button>
      </div>

      {alerts.length === 0 ? (
        <div className="glass-card" style={{ padding: 48, textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🎉</div>
          <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 4px', color: '#f0f0f5' }}>No hay alertas</h3>
          <p style={{ fontSize: 13, color: '#606080' }}>Tu consumo esta dentro de los parametros normales.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {alerts.map((alert, i) => {
            const cfg = severityConfig[alert.severity] || severityConfig.warning
            return (
              <div key={i} className="glass-card" style={{
                padding: '16px 20px', display: 'flex', gap: 14, alignItems: 'flex-start',
                borderLeft: `4px solid ${cfg.color}`,
                background: cfg.bg,
              }}>
                <span style={{ fontSize: 20, flexShrink: 0 }}>{cfg.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: cfg.color, marginBottom: 4 }}>
                    {cfg.label} · {alert.tipo?.replace(/_/g, ' ')}
                  </div>
                  <div style={{ fontSize: 14, color: '#d0d0e0', lineHeight: 1.5 }}>{alert.mensaje}</div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Leyenda */}
      <div className="glass-card" style={{ padding: 20 }}>
        <h4 style={{ fontSize: 13, fontWeight: 600, color: '#9090b0', textTransform: 'uppercase', letterSpacing: 0.5, margin: '0 0 12px' }}>Tipos de alertas</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 13 }}>
          {Object.entries(severityConfig).map(([key, cfg]) => (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className={`badge`} style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>{cfg.label}</span>
              <span style={{ color: '#606080' }}>
                {key === 'critical' ? 'Consumo excesivo o vencida' :
                 key === 'high' ? 'Consumo subio significativamente' :
                 key === 'warning' ? 'Recordatorio de vencimiento' :
                 'Consumo reducido'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

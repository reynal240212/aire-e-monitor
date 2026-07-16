const defaultTips = [
  { text: 'Desconecta los electrodomesticos en modo de espera por las noches.', icon: '🔌' },
  { text: 'Aprovecha la luz natural durante las horas pico de la manana.', icon: '☀️' },
  { text: 'El aire acondicionado a 22°C mantiene un consumo optimo.', icon: '❄️' },
]

export default function TipsPanel({ prediction }) {
  const tips = prediction?.tips?.length
    ? prediction.tips.map((t, i) => ({ text: t, icon: ['💡', '⚡', '🌱', '📊', '🎯'][i % 5] }))
    : defaultTips

  return (
    <div style={{ maxWidth: 600 }}>
      <div className="glass-card" style={{ padding: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0,
          }}>💡</div>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: '#f0f0f5' }}>Consejos de Ahorro</h3>
            <p style={{ fontSize: 13, color: '#606080', margin: '2px 0 0' }}>Recomendaciones personalizadas</p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {tips.map((tip, i) => (
            <div key={i} style={{
              display: 'flex', gap: 14, padding: '14px 16px',
              background: 'rgba(255,255,255,0.03)', borderRadius: 10,
              border: '1px solid rgba(255,255,255,0.06)',
              alignItems: 'flex-start',
            }}>
              <span style={{ fontSize: 18, flexShrink: 0 }}>{tip.icon}</span>
              <span style={{ fontSize: 14, color: '#d0d0e0', lineHeight: 1.5 }}>{tip.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

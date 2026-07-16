import React from 'react'

function TipsPanel({ prediction }) {
  const tips = [
    { id: 1, text: "Desconecta los electrodomésticos en modo 'espera' por las noches.", icon: "🔌" },
    { id: 2, text: "Aprovecha al máximo la luz natural durante las horas pico de la mañana.", icon: "☀️" },
    { id: 3, text: "El aire acondicionado a 22°C mantiene un consumo óptimo de energía.", icon: "❄️" }
  ]

  return (
    <div className="glass-card p-4">
      <h4 className="fw-bold text-white mb-3 d-flex align-items-center gap-2">
        <span className="text-neon">💡</span> Consejos de Ahorro Personalizados
      </h4>
      <p className="text-brand-muted small mb-4">
        Basándonos en tu tendencia de consumo proyectada para este mes.
      </p>

      <div className="d-flex flex-column gap-3">
        {tips.map(tip => (
          <div key={tip.id} className="d-flex gap-3 p-3 rounded bg-white bg-opacity-5 border border-white border-opacity-5 align-items-start">
            <span className="fs-4">{tip.icon}</span>
            <div>
              <p className="text-white m-0 small fw-medium">{tip.text}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default TipsPanel
import { useState } from 'react'

export default function ManualInput({ clientId, onComplete }) {
  const [lectura, setLectura] = useState('')
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0])
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!lectura || parseFloat(lectura) <= 0) {
      alert('Ingresa una lectura válida')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/lecturas/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: clientId,
          fecha: fecha,
          lectura_kwh: parseFloat(lectura),
          fuente: 'manual'
        })
      })

      if (res.ok) {
        setSuccess(true)
        setLectura('')
        onComplete()
        setTimeout(() => setSuccess(false), 3000)
      } else {
        const err = await res.json()
        alert(err.detail || 'Error guardando')
      }
    } catch (e) {
      alert('Error de conexión: ' + e.message)
    }
    setSaving(false)
  }

  return (
    <div className="space-y-6">
      {/* Título de la sección */}
      <h2 className="text-xl font-bold text-brand-title tracking-tight">
        Ingreso Manual de Lectura
      </h2>

      {/* Tarjeta de Formulario de Cristal */}
      <div className="group relative overflow-hidden rounded-2xl border border-white/5 bg-brand-card p-6 shadow-glass backdrop-blur-md max-w-lg">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/[0.015] to-transparent" />
        
        <p className="text-brand-muted text-sm mb-6 leading-relaxed">
          Lee el display de tu contador y escribe los números que ves. Los últimos dígitos después del punto corresponden a los decimales.
        </p>

        {/* Display del Contador de Ejemplo (Estilo Digital Cyberpunk) */}
        <div className="relative overflow-hidden rounded-xl border border-white/10 bg-black/40 p-4 mb-6 text-center shadow-inner">
          <div className="text-[10px] font-bold tracking-wider text-brand-muted uppercase mb-2">
            Ejemplo de Lectura
          </div>
          <div className="font-mono text-2xl tracking-widest font-extrabold select-none">
            <span className="text-brand-title">1 2 3 4 5</span>
            <span className="text-brand-danger shadow-neon">.</span>
            <span className="text-brand-danger shadow-neon">6</span>
          </div>
          <div className="text-[11px] font-medium text-brand-muted mt-2">
            = 12,345.6 kWh
          </div>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Campo Fecha */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold tracking-wider text-brand-title uppercase">
              Fecha de la lectura
            </label>
            <input
              type="date"
              value={fecha}
              onChange={e => setFecha(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-brand-title text-sm outline-none transition-all duration-200 focus:border-brand-neon focus:bg-white/[0.05] focus:ring-2 focus:ring-brand-neon/20 scheme-dark"
            />
          </div>

          {/* Campo Lectura */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold tracking-wider text-brand-title uppercase">
              Lectura actual del contador (kWh)
            </label>
            <input
              type="number"
              step="0.1"
              placeholder="Ej: 12345.6"
              value={lectura}
              onChange={e => setLectura(e.target.value)}
              autoFocus
              className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-brand-title text-sm outline-none transition-all duration-200 placeholder:text-brand-muted focus:border-brand-neon focus:bg-white/[0.05] focus:ring-2 focus:ring-brand-neon/20"
            />
          </div>

          {/* Botón de envío */}
          <button
            type="submit"
            disabled={saving || !lectura}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary-gradient py-3 text-sm font-semibold text-brand-dark shadow-[0_4px_15px_rgba(0,242,254,0.25)] transition-all duration-200 hover:scale-[1.01] hover:brightness-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
          >
            {saving ? 'Guardando...' : '✓ Guardar Lectura'}
          </button>
        </form>

        {/* Notificación de Éxito */}
        {success && (
          <div className="mt-4 p-4 rounded-xl flex items-center gap-3 border border-brand-success/20 border-l-[4px] border-l-brand-success bg-brand-success/5 text-brand-success text-sm font-medium animate-pulse-glow">
            ✅ Lectura guardada exitosamente
          </div>
        )}
      </div>
    </div>
  )
}
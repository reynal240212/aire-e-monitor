import { useState } from 'react'
import { todayStr } from '../utils/format'

export default function ManualInput({ clientId, onComplete }) {
  const [lectura, setLectura] = useState('')
  const [fecha, setFecha] = useState(todayStr())
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!lectura || parseFloat(lectura) <= 0) {
      setErrorMsg('Ingresa una lectura valida mayor a 0')
      return
    }
    setErrorMsg('')
    setSaving(true)
    try {
      const res = await fetch('/api/lecturas/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id: clientId, fecha, lectura_kwh: parseFloat(lectura), fuente: 'manual' })
      })
      if (res.ok) {
        setSuccess(true); setLectura('')
        onComplete()
        setTimeout(() => setSuccess(false), 3000)
      } else {
        const err = await res.json()
        setErrorMsg(err.detail || 'Error guardando')
      }
    } catch (e) {
      setErrorMsg('Error de conexion: ' + e.message)
    }
    setSaving(false)
  }

  return (
    <div style={{ maxWidth: 500 }}>
      <div className="glass-card" style={{ padding: 28 }}>
        <div style={{ background: 'rgba(0,0,0,0.4)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)', padding: '20px', textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 11, color: '#606080', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Ejemplo de lectura</div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 28, fontWeight: 600, letterSpacing: 6, color: '#f0f0f5' }}>
            <span>1 2 3 4 5</span><span style={{ color: '#f43f5e' }}>.</span><span style={{ color: '#f43f5e' }}>6</span>
          </div>
          <div style={{ fontSize: 12, color: '#606080', marginTop: 6 }}>= 12,345.6 kWh</div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#9090b0', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6, display: 'block' }}>Fecha de la lectura</label>
            <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} max={todayStr()} className="glass-input" style={{ colorScheme: 'dark' }} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#9090b0', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6, display: 'block' }}>Lectura del contador (kWh)</label>
            <input type="number" step="0.1" placeholder="Ej: 12345.6" value={lectura} onChange={e => setLectura(e.target.value)} autoFocus className="glass-input" />
          </div>
          {errorMsg && <div style={{ fontSize: 13, color: '#f43f5e', padding: '8px 12px', background: 'rgba(244,63,94,0.08)', borderRadius: 8, border: '1px solid rgba(244,63,94,0.15)' }}>{errorMsg}</div>}
          <button type="submit" disabled={saving || !lectura} className="btn-prime" style={{ width: '100%' }}>{saving ? 'Guardando...' : 'Guardar Lectura'}</button>
        </form>

        {success && <div style={{ marginTop: 16, padding: '12px 16px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: 8, fontSize: 14, color: '#10b981', fontWeight: 600, textAlign: 'center' }}>Lectura guardada exitosamente</div>}
      </div>
    </div>
  )
}

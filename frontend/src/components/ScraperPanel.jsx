import { useState } from 'react'

const CAPTCHA_COLORS = ['Amarillo', 'Naranja', 'Marron', 'Morado', 'Verde', 'Azul', 'Rojo', 'Rosado', 'Gris', 'Negro']

export default function ScraperPanel({ onComplete }) {
  const [nic, setNic] = useState('')
  const [color, setColor] = useState('')
  const [manualColor, setManualColor] = useState(false)
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState(null)
  const [captchaPreview, setCaptchaPreview] = useState(null)
  const [loadingCaptcha, setLoadingCaptcha] = useState(false)

  const handleCaptureCaptcha = async () => {
    if (!nic) { alert('Ingresa un NIC valido'); return }
    setLoadingCaptcha(true)
    try {
      const params = new URLSearchParams({ nic })
      const res = await fetch(`/api/scraper/capture-captcha?${params}`, { method: 'POST' })
      const data = await res.json()
      if (data.success && data.captcha_image) {
        setCaptchaPreview(data)
        setColor(data.detected_color || '')
      } else {
        alert('Error capturando CAPTCHA: ' + (data.error || 'Error desconocido'))
      }
    } catch (e) { alert('Error de conexion: ' + e.message) }
    setLoadingCaptcha(false)
  }

  const handleScrape = async () => {
    if (!nic) { alert('Ingresa un NIC valido'); return }
    setRunning(true); setResult(null)
    try {
      const res = await fetch('/api/scraper/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nic, captcha_color: color || null })
      })
      const data = await res.json()
      setResult(data)
      if (data.success) onComplete()
    } catch (e) { setResult({ success: false, error: 'Error de conexion: ' + e.message }) }
    setRunning(false)
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
      {/* Config panel */}
      <div className="glass-card" style={{ padding: 28 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 20px', color: '#f0f0f5' }}>Configuracion</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#9090b0', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6, display: 'block' }}>NIC</label>
            <input type="text" value={nic} onChange={e => setNic(e.target.value)} placeholder="Ej: 7566507" className="glass-input" />
          </div>

          <button onClick={handleCaptureCaptcha} disabled={loadingCaptcha || !nic} className="btn-ghost" style={{ width: '100%' }}>
            {loadingCaptcha ? 'Capturando...' : 'Ver CAPTCHA'}
          </button>

          {captchaPreview?.captcha_image && (
            <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 10, padding: 16, textAlign: 'center', border: '1px solid rgba(255,255,255,0.06)' }}>
              <img src={captchaPreview.captcha_image} alt="CAPTCHA" style={{ maxHeight: 70, borderRadius: 6 }} />
              <div style={{ marginTop: 8, fontSize: 12, color: '#606080' }}>
                Color detectado: <span className="badge badge-cyan" style={{ marginLeft: 6 }}>{captchaPreview.detected_color}</span>
              </div>
            </div>
          )}

          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13, color: '#9090b0' }}>
            <input type="checkbox" checked={manualColor} onChange={e => setManualColor(e.target.checked)}
              style={{ accentColor: '#00e5ff', width: 16, height: 16 }} />
            Seleccionar color manualmente
          </label>

          {manualColor && (
            <select value={color} onChange={e => setColor(e.target.value)} className="glass-input">
              <option value="">Selecciona un color</option>
              {CAPTCHA_COLORS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          )}

          <button onClick={handleScrape} disabled={running || !nic} className="btn-prime" style={{ width: '100%' }}>
            {running ? 'Buscando facturas...' : 'Descargar Facturas'}
          </button>

          <div style={{ fontSize: 12, color: '#606080', lineHeight: 1.5, padding: 12, background: 'rgba(255,255,255,0.02)', borderRadius: 8 }}>
            Usa "Ver CAPTCHA" para sincronizar la sesion remota en Air-E. Si la deteccion automatica falla, activa el selector manual.
          </div>
        </div>
      </div>

      {/* Results panel */}
      <div className="glass-card" style={{ padding: 28, display: 'flex', flexDirection: 'column' }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 20px', color: '#f0f0f5' }}>Resultados</h3>

        {result ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{
              padding: '14px 18px', borderRadius: 10, fontSize: 14, fontWeight: 600,
              background: result.success ? 'rgba(16,185,129,0.08)' : 'rgba(244,63,94,0.08)',
              border: `1px solid ${result.success ? 'rgba(16,185,129,0.2)' : 'rgba(244,63,94,0.2)'}`,
              color: result.success ? '#10b981' : '#f43f5e',
            }}>
              {result.success
                ? `Exito! Se encontraron ${result.invoices_found} factura(s).`
                : result.error || 'Error en la ejecucion'}
            </div>

            {result.downloaded?.length > 0 && (
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#9090b0', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Archivos guardados</div>
                {result.downloaded.map((inv, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)', marginBottom: 6, fontSize: 13, color: '#d0d0e0' }}>
                    <span style={{ color: '#00e5ff' }}>📄</span>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{inv.filename}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', color: '#606080', flex: 1 }}>
            <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.3 }}>◇</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#9090b0', marginBottom: 4 }}>Sistema Inactivo</div>
            <div style={{ fontSize: 13, textAlign: 'center' }}>Configura el NIC y presiona "Ver CAPTCHA" para iniciar.</div>
          </div>
        )}
      </div>
    </div>
  )
}

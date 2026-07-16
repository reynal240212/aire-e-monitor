import { useState } from 'react'

const CAPTCHA_COLORS = [
  'Amarillo', 'Naranja', 'Marrón', 'Morado', 'Verde',
  'Azul', 'Rojo', 'Rosado', 'Gris', 'Negro'
]

export default function ScraperPanel({ onComplete }) {
  const [nic, setNic] = useState('')
  const [color, setColor] = useState('')
  const [manualColor, setManualColor] = useState(false)
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState(null)
  const [captchaPreview, setCaptchaPreview] = useState(null)
  const [loadingCaptcha, setLoadingCaptcha] = useState(false)

  const handleCaptureCaptcha = async () => {
    if (!nic) {
      alert('Ingresa un NIC válido')
      return
    }

    setLoadingCaptcha(true)
    try {
      const params = new URLSearchParams({ nic })
      const res = await fetch(`/api/scraper/capture-captcha?${params}`, {
        method: 'POST'
      })
      const data = await res.json()
      
      if (data.success && data.captcha_image) {
        setCaptchaPreview(data)
        setColor(data.detected_color || '')
      } else {
        alert('Error capturando CAPTCHA: ' + (data.error || 'Error desconocido'))
      }
    } catch (e) {
      alert('Error de conexión: ' + e.message)
    }
    setLoadingCaptcha(false)
  }

  const handleScrape = async () => {
    if (!nic) {
      alert('Ingresa un NIC válido')
      return
    }

    setRunning(true)
    setResult(null)
    try {
      const res = await fetch('/api/scraper/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nic: nic,
          captcha_color: color || null
        })
      })
      const data = await res.json()
      setResult(data)
      if (data.success) {
        onComplete()
      }
    } catch (e) {
      setResult({ success: false, error: 'Error de conexión: ' + e.message })
    }
    setRunning(false)
  }

  return (
    <div className="space-y-6">
      {/* Título de la Sección */}
      <h2 className="text-xl font-bold text-brand-title tracking-tight">
        Descargar Facturas de AirE
      </h2>

      {/* Grid de dos columnas responsivo */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        
        {/* Columna Izquierda: Configuración */}
        <div className="group relative overflow-hidden rounded-2xl border border-white/5 bg-brand-card p-6 shadow-glass backdrop-blur-md">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/[0.015] to-transparent" />
          
          <h3 className="text-md font-bold tracking-wider text-brand-title uppercase mb-6 border-b border-white/5 pb-3">
            Configuración del Scraper
          </h3>

          <div className="space-y-5">
            {/* Campo NIC */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold tracking-wider text-brand-title uppercase">
                NIC (Número de Identificación)
              </label>
              <input
                type="text"
                value={nic}
                onChange={e => setNic(e.target.value)}
                placeholder="Ej: 7566507"
                className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-brand-title text-sm outline-none transition-all duration-200 placeholder:text-brand-muted focus:border-brand-neon focus:bg-white/[0.05] focus:ring-2 focus:ring-brand-neon/20"
              />
            </div>

            {/* Botón Capturar CAPTCHA */}
            <button
              onClick={handleCaptureCaptcha}
              disabled={loadingCaptcha || !nic}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] py-2.5 text-sm font-semibold text-brand-title transition-all duration-200 hover:bg-white/[0.08] active:scale-[0.98] disabled:opacity-40 disabled:hover:bg-white/[0.04]"
            >
              {loadingCaptcha ? (
                <>
                  <span className="animate-spin text-brand-neon">🔄</span> Capturando CAPTCHA...
                </>
              ) : (
                <>📸 Ver CAPTCHA</>
              )}
            </button>

            {/* Previsualización del CAPTCHA capturado */}
            {captchaPreview && captchaPreview.captcha_image && (
              <div className="rounded-xl border border-white/10 bg-black/40 p-4 text-center">
                <img 
                  src={captchaPreview.captcha_image} 
                  alt="CAPTCHA" 
                  className="mx-auto max-h-24 rounded-lg border border-white/5 shadow-md"
                />
                <div className="mt-3 text-xs text-brand-muted">
                  <span className="font-semibold text-brand-title">Color detectado automáticamente:</span>{' '}
                  <span className="px-2 py-0.5 rounded bg-brand-neon/10 text-brand-neon border border-brand-neon/20 font-bold uppercase text-[10px]">
                    {captchaPreview.detected_color}
                  </span>
                </div>
              </div>
            )}

            {/* Switch / Checkbox Personalizado */}
            <label className="relative flex cursor-pointer items-start gap-3 select-none">
              <input
                type="checkbox"
                checked={manualColor}
                onChange={e => setManualColor(e.target.checked)}
                className="peer sr-only"
              />
              <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-white/20 bg-white/[0.03] text-brand-dark transition-all duration-150 peer-checked:border-brand-neon peer-checked:bg-brand-neon peer-checked:shadow-[0_0_10px_rgba(0,242,254,0.4)]">
                <span className="hidden text-xs font-bold peer-checked:block">✓</span>
              </div>
              <span className="text-xs font-medium text-brand-muted leading-tight peer-checked:text-brand-title">
                Seleccionar color del CAPTCHA manualmente
              </span>
            </label>

            {/* Selector de Color Manual */}
            {manualColor && (
              <div className="space-y-1.5 animate-fade-in">
                <label className="block text-xs font-bold tracking-wider text-brand-title uppercase">
                  Color de la figura en el CAPTCHA
                </label>
                <div className="relative">
                  <select 
                    value={color} 
                    onChange={e => setColor(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-brand-title text-sm outline-none transition-all duration-200 focus:border-brand-neon focus:bg-white/[0.05] focus:ring-2 focus:ring-brand-neon/20 appearance-none"
                  >
                    <option value="" className="bg-brand-dark text-brand-muted">Selecciona un color</option>
                    {CAPTCHA_COLORS.map(c => (
                      <option key={c} value={c} className="bg-brand-dark text-brand-title">{c}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-brand-muted">
                    ▼
                  </div>
                </div>
              </div>
            )}

            {/* Botón Principal: Ejecutar Scraper */}
            <button
              onClick={handleScrape}
              disabled={running || !nic}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary-gradient py-3 text-sm font-semibold text-brand-dark shadow-[0_4px_15px_rgba(0,242,254,0.25)] transition-all duration-200 hover:scale-[1.01] hover:brightness-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
            >
              {running ? (
                <>
                  <span className="animate-spin">🔄</span> Buscando facturas...
                </>
              ) : (
                <>🤖 Descargar Facturas</>
              )}
            </button>

            {/* Nota Informativa */}
            <div className="rounded-xl border border-white/5 bg-white/[0.01] p-3 text-[11px] leading-relaxed text-brand-muted">
              <span className="font-bold text-brand-title">Nota:</span> Usa el botón <span className="text-brand-neon">"Ver CAPTCHA"</span> para procesar la sesión remota en la plataforma de AirE. Si el módulo OCR falla al resolver el color, activa la opción manual.
            </div>
          </div>
        </div>

        {/* Columna Derecha: Consola de Resultados */}
        <div className="group relative overflow-hidden rounded-2xl border border-white/5 bg-brand-card p-6 shadow-glass backdrop-blur-md flex flex-col justify-between">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/[0.015] to-transparent" />
          
          <div>
            <h3 className="text-md font-bold tracking-wider text-brand-title uppercase mb-6 border-b border-white/5 pb-3">
              Resultados de la Operación
            </h3>

            {result ? (
              <div className="space-y-4">
                {/* Banner de Estado */}
                {result.success ? (
                  <div className="p-4 rounded-xl flex items-center gap-3 border border-brand-success/20 border-l-[4px] border-l-brand-success bg-brand-success/5 text-brand-success text-sm font-medium">
                    ✅ ¡Éxito! Se encontraron {result.invoices_found} factura(s).
                  </div>
                ) : (
                  <div className="p-4 rounded-xl flex items-center gap-3 border border-brand-danger/20 border-l-[4px] border-l-brand-danger bg-brand-danger/5 text-brand-danger text-sm font-medium">
                    ❌ {result.error || 'Error en la ejecución del scraping'}
                  </div>
                )}

                {/* Info del Color Usado */}
                {result.captcha_color && (
                  <div className="text-xs text-brand-muted">
                    <span className="font-semibold text-brand-title">Color enviado:</span>{' '}
                    <span className="underline decoration-brand-neon decoration-2 underline-offset-2 text-brand-title">
                      {result.captcha_color}
                    </span>
                  </div>
                )}

                {/* Lista de Documentos Descargados */}
                {result.downloaded && result.downloaded.length > 0 && (
                  <div className="space-y-2 mt-4">
                    <div className="text-xs font-bold tracking-wider text-brand-title uppercase mb-1">
                      Archivos Guardados:
                    </div>
                    {result.downloaded.map((inv, i) => (
                      <div 
                        key={i} 
                        className="flex items-center gap-2.5 rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3 text-xs font-medium text-brand-title hover:bg-white/[0.04] transition-colors"
                      >
                        <span className="text-brand-neon text-lg">📄</span>
                        <span className="truncate">{inv.filename}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              /* Empty State de la Consola */
              <div className="flex flex-col items-center justify-center text-center py-12 px-4 rounded-xl border border-dashed border-white/10 bg-black/10">
                <div className="text-5xl mb-4 animate-bounce select-none">🤖</div>
                <h4 className="text-sm font-bold text-brand-title mb-1">Sistema Inactivo</h4>
                <p className="text-xs text-brand-muted max-w-xs leading-relaxed">
                  Haz clic en "Ver CAPTCHA" para sincronizar la solicitud, luego inicia la descarga automatizada de documentos.
                </p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
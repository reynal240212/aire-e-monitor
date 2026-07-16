import { useState, useCallback, useRef, useEffect } from 'react'
import { formatKB, currentMonth } from '../utils/format'

export default function UploadPanel() {
  const [files, setFiles] = useState([])
  const [nic, setNic] = useState('')
  const [periodo, setPeriodo] = useState('')
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadResults, setUploadResults] = useState([])
  const [uploadedList, setUploadedList] = useState([])
  const [loadingList, setLoadingList] = useState(false)
  const fileInputRef = useRef(null)

  const fetchUploaded = useCallback(async () => {
    setLoadingList(true)
    try {
      const res = await fetch('/api/upload/uploads')
      if (res.ok) setUploadedList(await res.json())
    } catch { /* ignore */ }
    finally { setLoadingList(false) }
  }, [])

  useEffect(() => { fetchUploaded() }, [fetchUploaded])

  const handleDrop = useCallback((e) => {
    e.preventDefault(); setDragging(false)
    const dropped = Array.from(e.dataTransfer.files).filter(f => f.name.toLowerCase().endsWith('.pdf'))
    setFiles(prev => [...prev, ...dropped])
  }, [])

  const handleFileInput = (e) => { setFiles(prev => [...prev, ...Array.from(e.target.files)]); e.target.value = '' }
  const removeFile = (idx) => setFiles(prev => prev.filter((_, i) => i !== idx))

  const handleUpload = async () => {
    if (!nic.trim()) { alert('Ingresa el NIC del cliente.'); return }
    if (!files.length) { alert('Selecciona al menos un PDF.'); return }
    setUploading(true); setUploadResults([])
    const results = []
    for (const file of files) {
      const fd = new FormData()
      fd.append('file', file); fd.append('nic', nic.trim())
      if (periodo) fd.append('periodo', periodo)
      try {
        const res = await fetch('/api/upload/upload', { method: 'POST', body: fd })
        const data = await res.json()
        results.push({ name: file.name, ok: data.success, msg: data.success ? `${data.size_kb} KB guardado` : (data.detail || 'Error') })
      } catch (e) { results.push({ name: file.name, ok: false, msg: e.message }) }
    }
    setUploadResults(results); setFiles([]); setUploading(false)
    fetchUploaded()
  }

  const handleDelete = async (id) => {
    if (!confirm('Eliminar esta factura?')) return
    await fetch(`/api/upload/uploads/${id}`, { method: 'DELETE' })
    fetchUploaded()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 900 }}>

      {/* Upload card */}
      <div className="glass-card" style={{ padding: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: 'linear-gradient(135deg, #00e5ff, #3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>⊞</div>
          <div>
            <h3 style={{ fontSize: 17, fontWeight: 700, margin: 0, color: '#f0f0f5' }}>Subir Factura PDF</h3>
            <p style={{ fontSize: 13, color: '#606080', margin: '2px 0 0' }}>Carga facturas Air-E al sistema</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#9090b0', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6, display: 'block' }}>NIC del cliente</label>
            <input type="text" className="glass-input" placeholder="Ej: 7566507" value={nic} onChange={e => setNic(e.target.value)} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#9090b0', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6, display: 'block' }}>Periodo</label>
            <input type="month" className="glass-input" value={periodo} onChange={e => setPeriodo(e.target.value)} max={currentMonth()} style={{ colorScheme: 'dark' }} />
          </div>
        </div>

        {/* Drop zone */}
        <div onDragOver={e => { e.preventDefault(); setDragging(true) }} onDragLeave={() => setDragging(false)} onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: `2px dashed ${dragging ? '#00e5ff' : 'rgba(0,229,255,0.2)'}`,
            borderRadius: 14, padding: '40px 20px', textAlign: 'center', cursor: 'pointer',
            transition: 'all 0.25s', background: dragging ? 'rgba(0,229,255,0.05)' : 'rgba(0,229,255,0.02)',
            marginBottom: 20,
          }}>
          <input ref={fileInputRef} type="file" accept=".pdf" multiple style={{ display: 'none' }} onChange={handleFileInput} />
          <div style={{ fontSize: 36, marginBottom: 8 }}>{dragging ? '📂' : '📄'}</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#d0d0e0' }}>{dragging ? 'Suelta los archivos aqui' : 'Arrastra PDFs o haz clic para elegir'}</div>
          <div style={{ fontSize: 13, color: '#606080', marginTop: 4 }}>Solo <code style={{ color: '#00e5ff' }}>.pdf</code> · Max 20 MB</div>
        </div>

        {/* File queue */}
        {files.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#606080', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              {files.length} archivo(s) seleccionado(s)
            </div>
            {files.map((f, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10 }}>
                <span style={{ fontSize: 18 }}>📄</span>
                <span style={{ flex: 1, color: '#d0d0e0', fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</span>
                <span style={{ color: '#606080', fontSize: 12, flexShrink: 0 }}>{formatKB(f.size)}</span>
                <button onClick={e => { e.stopPropagation(); removeFile(i) }} style={{ background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.2)', color: '#f43f5e', borderRadius: 6, cursor: 'pointer', fontSize: 12, padding: '2px 8px' }}>✕</button>
              </div>
            ))}
            <button onClick={handleUpload} disabled={uploading} className="btn-prime" style={{ width: '100%', marginTop: 4 }}>
              {uploading ? 'Subiendo...' : `Subir ${files.length} archivo(s)`}
            </button>
          </div>
        )}

        {/* Upload results */}
        {uploadResults.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {uploadResults.map((r, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 10, fontSize: 13,
                background: r.ok ? 'rgba(16,185,129,0.08)' : 'rgba(244,63,94,0.08)',
                border: `1px solid ${r.ok ? 'rgba(16,185,129,0.2)' : 'rgba(244,63,94,0.2)'}`,
              }}>
                <span style={{ fontSize: 16 }}>{r.ok ? '✅' : '❌'}</span>
                <span style={{ flex: 1, color: '#d0d0e0', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</span>
                <span style={{ color: '#606080', fontSize: 12, flexShrink: 0 }}>{r.msg}</span>
              </div>
            ))}
            <button onClick={() => setUploadResults([])} className="btn-ghost" style={{ alignSelf: 'flex-start', marginTop: 4, fontSize: 12 }}>Limpiar</button>
          </div>
        )}
      </div>

      {/* History */}
      <div className="glass-card" style={{ padding: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: '#f0f0f5' }}>Facturas en el sistema</h3>
          <button onClick={fetchUploaded} disabled={loadingList} className="btn-ghost" style={{ fontSize: 13 }}>
            {loadingList ? '⟳' : '↻'} Actualizar
          </button>
        </div>

        {loadingList && <div style={{ textAlign: 'center', padding: 32, color: '#606080' }}>Cargando...</div>}

        {!loadingList && uploadedList.length === 0 && (
          <div style={{ textAlign: 'center', padding: 48, color: '#606080' }}>
            <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.4 }}>📂</div>
            <p style={{ fontSize: 15, fontWeight: 600, color: '#9090b0', margin: '0 0 4px' }}>No hay facturas en el sistema</p>
            <p style={{ fontSize: 13, margin: 0 }}>Sube tu primera factura arriba</p>
          </div>
        )}

        {!loadingList && uploadedList.length > 0 && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr>
                  {['#', 'NIC', 'Cliente', 'Periodo', 'Archivo', 'Tamanio', 'Fecha', ''].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: '#606080', borderBottom: '1px solid rgba(255,255,255,0.06)', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {uploadedList.map((item, i) => (
                  <tr key={item.id} style={{ transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '12px 14px', color: '#606080', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>{i + 1}</td>
                    <td style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <code style={{ background: 'rgba(0,229,255,0.08)', border: '1px solid rgba(0,229,255,0.2)', color: '#00e5ff', padding: '2px 8px', borderRadius: 4, fontSize: 12 }}>{item.nic}</code>
                    </td>
                    <td style={{ padding: '12px 14px', color: '#d0d0e0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>{item.nombre}</td>
                    <td style={{ padding: '12px 14px', color: '#9090b0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>{item.periodo || '—'}</td>
                    <td style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.04)', maxWidth: 200 }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: item.pdf_exists ? 'rgba(255,255,255,0.04)' : 'rgba(245,158,11,0.1)', border: `1px solid ${item.pdf_exists ? 'rgba(255,255,255,0.08)' : 'rgba(245,158,11,0.2)'}`, color: item.pdf_exists ? '#d0d0e0' : '#f59e0b', padding: '3px 8px', borderRadius: 4, fontSize: 12, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.pdf_exists ? '📄' : '⚠️'} {item.filename || '—'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', color: '#9090b0', borderBottom: '1px solid rgba(255,255,255,0.04)', whiteSpace: 'nowrap' }}>{item.size_kb > 0 ? `${item.size_kb} KB` : '—'}</td>
                    <td style={{ padding: '12px 14px', color: '#606080', borderBottom: '1px solid rgba(255,255,255,0.04)', whiteSpace: 'nowrap', fontSize: 12 }}>{item.fecha ? new Date(item.fecha).toLocaleDateString('es-CO') : '—'}</td>
                    <td style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <button onClick={() => handleDelete(item.id)} style={{ background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.2)', color: '#f43f5e', borderRadius: 6, cursor: 'pointer', fontSize: 14, padding: '4px 8px' }}>🗑</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

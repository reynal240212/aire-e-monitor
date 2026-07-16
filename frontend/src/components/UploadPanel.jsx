import { useState, useCallback, useRef, useEffect } from 'react';

const API = '/api';

export default function UploadPanel() {
  const [files, setFiles] = useState([]);
  const [nic, setNic] = useState('');
  const [periodo, setPeriodo] = useState('');
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState([]);
  const [uploadedList, setUploadedList] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const fileInputRef = useRef(null);

  const fetchUploaded = useCallback(async () => {
    setLoadingList(true);
    try {
      const res = await fetch(`${API}/upload/uploads`);
      if (res.ok) setUploadedList(await res.json());
    } catch { /* ignore */ }
    finally { setLoadingList(false); }
  }, []);

  useEffect(() => { fetchUploaded(); }, [fetchUploaded]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const dropped = Array.from(e.dataTransfer.files).filter(f => f.name.toLowerCase().endsWith('.pdf'));
    setFiles(prev => [...prev, ...dropped]);
  }, []);

  const handleFileInput = (e) => {
    setFiles(prev => [...prev, ...Array.from(e.target.files)]);
    e.target.value = '';
  };

  const removeFile = (idx) => setFiles(prev => prev.filter((_, i) => i !== idx));
  const formatKB = (bytes) => bytes < 1024 * 1024
    ? `${(bytes / 1024).toFixed(0)} KB`
    : `${(bytes / 1024 / 1024).toFixed(1)} MB`;

  const handleUpload = async () => {
    if (!nic.trim()) { alert('Ingresa el NIC del cliente.'); return; }
    if (!files.length) { alert('Selecciona al menos un PDF.'); return; }
    setUploading(true);
    setUploadResults([]);
    const results = [];
    for (const file of files) {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('nic', nic.trim());
      if (periodo) fd.append('periodo', periodo);
      try {
        const res = await fetch(`${API}/upload/upload`, { method: 'POST', body: fd });
        const data = await res.json();
        results.push({ name: file.name, ok: data.success, msg: data.success ? `${data.size_kb} KB guardado` : (data.detail || data.error || 'Error') });
      } catch (e) {
        results.push({ name: file.name, ok: false, msg: e.message });
      }
    }
    setUploadResults(results);
    setFiles([]);
    setUploading(false);
    fetchUploaded();
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar esta factura?')) return;
    await fetch(`${API}/upload/uploads/${id}`, { method: 'DELETE' });
    fetchUploaded();
  };

  const currentMonth = new Date().toISOString().slice(0, 7);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{
          width: '52px', height: '52px', borderRadius: '16px',
          background: 'linear-gradient(135deg,#00f2fe,#4facfe)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '24px', flexShrink: 0,
          boxShadow: '0 0 24px rgba(0,242,254,0.3)'
        }}>📤</div>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#fff', margin: 0 }}>Subir Facturas PDF</h2>
          <p style={{ fontSize: '14px', color: '#94a3b8', margin: 0, marginTop: '2px' }}>
            Carga facturas Air-E directamente al sistema
          </p>
        </div>
      </div>

      {/* Card formulario */}
      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* Campos NIC + Periodo */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.06em' }}>
              NIC del cliente *
            </label>
            <input
              type="text"
              className="glass-input"
              placeholder="Ej: 7566507"
              value={nic}
              onChange={e => setNic(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.06em' }}>
              Periodo (mes/año)
            </label>
            <input
              type="month"
              className="glass-input"
              value={periodo}
              onChange={e => setPeriodo(e.target.value)}
              max={currentMonth}
              style={{ width: '100%', colorScheme: 'dark' }}
            />
          </div>
        </div>

        {/* Zona de arrastre */}
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: `2px dashed ${dragging ? '#00f2fe' : 'rgba(0,242,254,0.25)'}`,
            borderRadius: '16px',
            padding: '48px 24px',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all .25s',
            background: dragging ? 'rgba(0,242,254,0.07)' : 'rgba(0,242,254,0.02)',
            boxShadow: dragging ? '0 0 24px rgba(0,242,254,0.18)' : 'none',
          }}
        >
          <input ref={fileInputRef} type="file" accept=".pdf" multiple style={{ display: 'none' }} onChange={handleFileInput} />
          <div style={{ fontSize: '44px', marginBottom: '12px' }}>{dragging ? '📂' : '📄'}</div>
          <div style={{ fontSize: '15px', fontWeight: 700, color: '#e2e8f0' }}>
            {dragging ? 'Suelta los archivos aquí' : 'Arrastra PDFs aquí o haz clic para elegir'}
          </div>
          <div style={{ fontSize: '13px', color: '#64748b', marginTop: '6px' }}>
            Solo archivos <code style={{ color: '#00f2fe' }}>.pdf</code> · Máx. 20 MB por archivo
          </div>
        </div>

        {/* Lista de archivos en cola */}
        {files.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.06em' }}>
              {files.length} archivo{files.length > 1 ? 's' : ''} seleccionado{files.length > 1 ? 's' : ''}
            </div>
            {files.map((f, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '12px 16px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: '12px',
              }}>
                <span style={{ fontSize: '20px' }}>📄</span>
                <span style={{ flex: 1, color: '#e2e8f0', fontSize: '14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</span>
                <span style={{ color: '#64748b', fontSize: '12px', flexShrink: 0 }}>{formatKB(f.size)}</span>
                <button onClick={e => { e.stopPropagation(); removeFile(i); }} style={{
                  background: 'rgba(255,0,127,0.12)', border: '1px solid rgba(255,0,127,0.25)',
                  color: '#ff007f', borderRadius: '8px', cursor: 'pointer',
                  fontSize: '13px', padding: '3px 9px', lineHeight: 1.4
                }}>✕</button>
              </div>
            ))}
            <button
              onClick={handleUpload}
              disabled={uploading}
              style={{
                width: '100%', justifyContent: 'center', marginTop: '4px', opacity: uploading ? .65 : 1,
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                background: 'linear-gradient(135deg, #00f2fe, #4facfe)',
                border: 'none', borderRadius: '12px', padding: '10px 20px',
                color: '#0a0a0c', fontWeight: 600, fontSize: '14px',
                cursor: uploading ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 15px rgba(0,242,254,0.25)',
                transition: 'all 0.2s'
              }}
            >
              {uploading
                ? <><span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid rgba(255,255,255,.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin .7s linear infinite', marginRight: 8, verticalAlign: 'middle' }} />Subiendo...</>
                : <>📤 Subir {files.length} archivo{files.length > 1 ? 's' : ''}</>}
            </button>
          </div>
        )}

        {/* Resultados */}
        {uploadResults.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {uploadResults.map((r, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '12px 16px', borderRadius: '12px', fontSize: '13px',
                background: r.ok ? 'rgba(16,185,129,0.1)' : 'rgba(255,0,127,0.1)',
                border: `1px solid ${r.ok ? 'rgba(16,185,129,0.3)' : 'rgba(255,0,127,0.3)'}`,
              }}>
                <span style={{ fontSize: '18px' }}>{r.ok ? '✅' : '❌'}</span>
                <span style={{ flex: 1, color: '#e2e8f0', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</span>
                <span style={{ color: '#94a3b8', fontSize: '12px', flexShrink: 0 }}>{r.msg}</span>
              </div>
            ))}
            <button onClick={() => setUploadResults([])} style={{
              background: 'none', border: '1px solid rgba(255,255,255,0.1)', color: '#64748b',
              borderRadius: '8px', padding: '6px 14px', cursor: 'pointer', fontSize: '12px', fontFamily: 'inherit',
              alignSelf: 'flex-start', marginTop: '4px', transition: 'all .2s'
            }}>Limpiar</button>
          </div>
        )}
      </div>

      {/* Historial */}
      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#fff', margin: 0 }}>
            📋 Facturas en el sistema
          </h3>
          <button onClick={fetchUploaded} disabled={loadingList} style={{
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
            color: '#94a3b8', borderRadius: '10px', padding: '6px 14px', cursor: 'pointer',
            fontSize: '13px', fontFamily: 'inherit', transition: 'all .2s'
          }}>
            {loadingList ? '⟳' : '🔄'} Actualizar
          </button>
        </div>

        {loadingList && (
          <div style={{ textAlign: 'center', padding: '32px', color: '#64748b', fontSize: '14px' }}>Cargando...</div>
        )}

        {!loadingList && uploadedList.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px', color: '#64748b' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>📂</div>
            <p style={{ fontSize: '15px', fontWeight: 600, color: '#94a3b8', margin: 0 }}>No hay facturas en el sistema</p>
            <p style={{ fontSize: '13px', margin: '6px 0 0' }}>Sube tu primera factura arriba</p>
          </div>
        )}

        {!loadingList && uploadedList.length > 0 && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr>
                  {['#', 'NIC', 'Cliente', 'Periodo', 'Archivo', 'Tamaño', 'Fecha', ''].map(h => (
                    <th key={h} style={{
                      padding: '10px 14px', textAlign: 'left',
                      fontSize: '11px', fontWeight: 700, textTransform: 'uppercase',
                      letterSpacing: '.06em', color: '#64748b',
                      borderBottom: '1px solid rgba(255,255,255,0.07)', whiteSpace: 'nowrap'
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {uploadedList.map((item, i) => (
                  <tr key={item.id} style={{ transition: 'background .15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '13px 14px', color: '#64748b', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>{i + 1}</td>
                    <td style={{ padding: '13px 14px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <code style={{
                        background: 'rgba(0,242,254,0.08)', border: '1px solid rgba(0,242,254,0.2)',
                        color: '#00f2fe', padding: '2px 8px', borderRadius: '6px', fontSize: '12px'
                      }}>{item.nic}</code>
                    </td>
                    <td style={{ padding: '13px 14px', color: '#e2e8f0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>{item.nombre}</td>
                    <td style={{ padding: '13px 14px', color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>{item.periodo || '—'}</td>
                    <td style={{ padding: '13px 14px', borderBottom: '1px solid rgba(255,255,255,0.04)', maxWidth: '200px' }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '5px',
                        background: item.pdf_exists ? 'rgba(255,255,255,0.06)' : 'rgba(255,159,67,0.1)',
                        border: `1px solid ${item.pdf_exists ? 'rgba(255,255,255,0.1)' : 'rgba(255,159,67,0.25)'}`,
                        color: item.pdf_exists ? '#e2e8f0' : '#ff9f43',
                        padding: '3px 9px', borderRadius: '6px', fontSize: '12px',
                        maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                      }}>
                        {item.pdf_exists ? '📄' : '⚠️'} {item.filename || '—'}
                      </span>
                    </td>
                    <td style={{ padding: '13px 14px', color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.04)', whiteSpace: 'nowrap' }}>
                      {item.size_kb > 0 ? `${item.size_kb} KB` : '—'}
                    </td>
                    <td style={{ padding: '13px 14px', color: '#64748b', borderBottom: '1px solid rgba(255,255,255,0.04)', whiteSpace: 'nowrap', fontSize: '12px' }}>
                      {item.fecha ? new Date(item.fecha).toLocaleDateString('es-CO') : '—'}
                    </td>
                    <td style={{ padding: '13px 14px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <button onClick={() => handleDelete(item.id)} style={{
                        background: 'rgba(255,0,127,0.08)', border: '1px solid rgba(255,0,127,0.2)',
                        color: '#ff007f', borderRadius: '8px', cursor: 'pointer',
                        fontSize: '14px', padding: '4px 9px', lineHeight: 1,
                        transition: 'all .2s'
                      }}
                        onMouseEnter={e => e.target.style.background = 'rgba(255,0,127,0.2)'}
                        onMouseLeave={e => e.target.style.background = 'rgba(255,0,127,0.08)'}
                      >🗑</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

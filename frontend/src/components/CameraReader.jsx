export default function CameraReader({ clientId, onComplete, onBack }) {
  return (
    <div className="glass-card glass-card-neon" style={{ padding: 28, maxWidth: 500 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: 'linear-gradient(135deg, #00e5ff, #3b82f6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20, flexShrink: 0,
        }}>⊙</div>
        <div>
          <h3 style={{ fontSize: 17, fontWeight: 700, margin: 0, color: '#f0f0f5' }}>Lector de Camara</h3>
          <p style={{ fontSize: 13, color: '#606080', margin: '2px 0 0' }}>Alinea el medidor en el recuadro</p>
        </div>
      </div>

      <div style={{
        background: '#000', borderRadius: 12,
        border: '2px dashed rgba(0,229,255,0.3)',
        height: 250, display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 20,
      }}>
        <span style={{ color: '#606080', fontSize: 13 }}>Interfaz de Camara Activa</span>
      </div>

      <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
        <button className="btn-ghost" onClick={onBack}>Cancelar</button>
        <button className="btn-prime" onClick={onComplete}>Capturar Lectura</button>
      </div>
    </div>
  )
}

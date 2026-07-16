import React from 'react'

function CameraReader({ onScanSuccess, onCancel }) {
  return (
    <div className="glass-card glass-card-neon p-4 text-center">
      <h4 className="fw-bold text-white mb-3">Lector de Cámara</h4>
      <p className="text-brand-muted small mb-4">
        Alinea el medidor en el recuadro para capturar la lectura automáticamente.
      </p>

      {/* Visor de cámara (Placeholder) */}
      <div className="bg-black rounded border border-secondary border-opacity-25 mb-4 d-flex align-items-center justify-content-center" 
           style={{ height: '250px', position: 'relative' }}>
        <span className="text-brand-muted">Interfaz de Cámara Activa</span>
      </div>

      <div className="d-flex gap-2 justify-content-center">
        <button className="btn btn-outline-secondary text-white border-opacity-25" onClick={onCancel}>
          Cancelar
        </button>
        <button className="btn" style={{ background: 'var(--brand-neon)', color: 'var(--brand-dark)', fontWeight: 'bold' }} onClick={onScanSuccess}>
          Capturar Lectura
        </button>
      </div>
    </div>
  )
}

export default CameraReader
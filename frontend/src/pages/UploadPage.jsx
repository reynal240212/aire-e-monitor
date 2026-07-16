import { useApp } from '../context/AppContext'
import UploadPanel from '../components/UploadPanel'

export default function UploadPage() {
  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 className="section-title">Subir Facturas</h1>
        <p className="section-subtitle">Carga facturas PDF de Air-E directamente al sistema</p>
      </div>
      <UploadPanel />
    </div>
  )
}

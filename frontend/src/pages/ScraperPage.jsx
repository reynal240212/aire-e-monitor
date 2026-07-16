import { useState } from 'react'
import { useApp } from '../context/AppContext'
import ScraperPanel from '../components/ScraperPanel'

export default function ScraperPage() {
  const { fetchDashboard } = useApp()

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 className="section-title">Facturas Air-E</h1>
        <p className="section-subtitle">Descarga automatizada de facturas desde el portal de Air-E</p>
      </div>
      <ScraperPanel onComplete={fetchDashboard} />
    </div>
  )
}

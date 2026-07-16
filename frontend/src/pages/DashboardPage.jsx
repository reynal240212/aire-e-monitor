import React from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'
import { useApp } from '../context/AppContext'
import { fmtNum, fmtMoney } from '../utils/format'

function KpiCard({ label, value, unit, accent = 'cyan', icon }) {
  const accentColors = { cyan: '#00e5ff', emerald: '#10b981', purple: '#8b5cf6', gold: '#f59e0b', rose: '#f43f5e' }
  const color = accentColors[accent] || accentColors.cyan
  return (
    <div className="glass-card" style={{ padding: '20px 22px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, right: 0, width: 100, height: 100, opacity: 0.03 }}>
        <div style={{ width: 100, height: 100, borderRadius: '50%', background: color, transform: 'translate(30%, -30%)' }} />
      </div>
      <div style={{ color, fontSize: 18, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: '#f0f0f5', letterSpacing: '-0.02em' }}>{value}</div>
      <div style={{ fontSize: 13, color: '#606080', marginTop: 2 }}>{label}</div>
      {unit && <div style={{ fontSize: 11, color, marginTop: 4, fontWeight: 600 }}>{unit}</div>}
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card" style={{ padding: '12px 16px', fontSize: 13 }}>
        <div style={{ color: '#9090b0', marginBottom: 4, fontWeight: 500 }}>{label}</div>
        {payload.map((p, i) => (
          <div key={i} style={{ color: p.color, fontWeight: 600 }}>
            {p.name === 'consumo_kwh' ? `${fmtNum(p.value)} kWh` : fmtMoney(p.value)}
          </div>
        ))}
      </div>
    )
  }
  return null
}

function EmptyState({ icon, title, desc }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', color: '#606080' }}>
      <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.4 }}>{icon}</div>
      <div style={{ fontSize: 15, fontWeight: 600, color: '#9090b0', marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 13 }}>{desc}</div>
    </div>
  )
}

export default function DashboardPage() {
  const { dashboardData, loading, fetchDashboard } = useApp()

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '100px 0' }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid rgba(255,255,255,0.06)', borderTopColor: '#00e5ff', animation: 'spin 0.8s linear infinite', boxShadow: '0 0 20px rgba(0,229,255,0.15)' }} />
        <p style={{ marginTop: 16, fontSize: 13, color: '#606080', fontWeight: 500 }}>Cargando dashboard...</p>
      </div>
    )
  }

  if (!dashboardData) {
    return <EmptyState icon="◎" title="Sin datos del dashboard" desc="Verifica que el cliente exista y el backend esté activo." />
  }

  const s = dashboardData.summary || {}
  const monthly = dashboardData.monthly_data || []
  const prediction = dashboardData.prediction

  const kpis = [
    { label: 'Consumo promedio', value: `${fmtNum(s.promedio_consumo)} kWh`, accent: 'cyan', icon: '⚡', unit: `de ${dashboardData.total_facturas || 0} facturas` },
    { label: 'Pago promedio', value: fmtMoney(s.promedio_pago), accent: 'emerald', icon: '◆', unit: `total ${fmtMoney(s.total_pagado)}` },
    { label: 'Última lectura', value: dashboardData.ultima_lectura != null ? `${fmtNum(dashboardData.ultima_lectura)} kWh` : '—', accent: 'purple', icon: '◎' },
    { label: 'Próximo estimado', value: prediction?.predicted_valor ? fmtMoney(prediction.predicted_valor) : '—', accent: 'gold', icon: '◈', unit: prediction?.trend_valor === 'creciente' ? '↑ Tendencia al alza' : '↓ Tendencia a la baja' },
  ]

  const consumoAcumulado = monthly.reduce((sum, m) => sum + (m.consumo_kwh || 0), 0)
  const valorAcumulado = monthly.reduce((sum, m) => sum + (m.valor_total || 0), 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, letterSpacing: '-0.03em' }}>Dashboard</h1>
          <p style={{ fontSize: 14, color: '#606080', margin: '4px 0 0' }}>
            {dashboardData.cliente?.nombre || `NIC ${dashboardData.cliente?.nic || '—'}`} · {dashboardData.total_facturas || 0} facturas registradas
          </p>
        </div>
        <button className="btn-ghost" onClick={fetchDashboard} style={{ flexShrink: 0 }}>↻ Sincronizar</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
        {kpis.map((k, i) => <KpiCard key={i} {...k} />)}
      </div>

      <div style={{ display: 'flex', gap: 24, fontSize: 13, color: '#606080', flexWrap: 'wrap' }}>
        <span>Consumo acumulado: <strong style={{ color: '#f0f0f5' }}>{fmtNum(consumoAcumulado)} kWh</strong></span>
        <span>· Gasto acumulado: <strong style={{ color: '#f0f0f5' }}>{fmtMoney(valorAcumulado)}</strong></span>
        {prediction?.success && <span>· Confianza predicción: <strong style={{ color: '#10b981' }}>{prediction.confidence_kwh}%</strong></span>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="glass-card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 20px', color: '#f0f0f5' }}>Consumo mensual (kWh)</h3>
          {monthly.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={monthly}>
                <defs>
                  <linearGradient id="fillKwh" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00e5ff" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#00e5ff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="#404060" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#404060" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="consumo_kwh" stroke="#00e5ff" strokeWidth={2} fill="url(#fillKwh)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : <EmptyState icon="░" title="Sin datos" desc="No hay facturas registradas aún." />}
        </div>

        <div className="glass-card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 20px', color: '#f0f0f5' }}>Gasto mensual ($)</h3>
          {monthly.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={monthly}>
                <XAxis dataKey="month" stroke="#404060" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#404060" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="valor_total" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyState icon="░" title="Sin datos" desc="No hay facturas registradas aún." />}
        </div>
      </div>
    </div>
  )
}

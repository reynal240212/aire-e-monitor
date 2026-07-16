import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#00f2fe', '#3b82f6', '#a855f7', '#f43f5e', '#10b981'];

function formatter(val) {
  if (val == null) return 0;
  return val.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function Dashboard({ data }) {
  if (!data || data.error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-brand-muted">
        <span className="text-4xl mb-4">📡</span>
        <p className="text-sm font-semibold">Sin datos disponibles</p>
        <p className="text-xs">Verifica que el backend esté corriendo y el cliente exista.</p>
      </div>
    );
  }

  const s = data.summary || {};
  const monthly = data.monthly_data || [];
  const prediction = data.prediction;

  const kpiItems = [
    { title: 'Consumo Promedio', val: `${formatter(s.promedio_consumo)}`, unit: 'kWh/mes', icon: '⚡' },
    { title: 'Pago Promedio', val: `$${formatter(s.promedio_pago)}`, unit: 'COP/mes', icon: '💵' },
    { title: 'Total Facturas', val: `${data.total_facturas || 0}`, unit: 'registradas', icon: '📄' },
    { title: 'Próxima Factura', val: prediction?.predicted_valor ? `$${formatter(prediction.predicted_valor)}` : '—', unit: prediction?.trend_valor === 'creciente' ? '↑ Est.' : '↓ Est.', icon: '🔮' }
  ];

  const pieData = monthly.length > 0
    ? monthly.slice(-6).map(m => ({ name: m.month, value: m.valor_total }))
    : [];

  return (
    <div className="container-fluid p-0">
      <div className="mb-4">
        <h2 className="text-white fw-bold">Consumo General</h2>
        <p className="text-brand-muted small">
          Hola, {data.cliente?.nombre || `Usuario ${data.cliente?.nic || ''}`}
        </p>
      </div>

      <div className="row g-3 mb-4">
        {kpiItems.map((item, idx) => (
          <div className="col-12 col-md-3" key={idx}>
            <div className="glass-card glass-card-neon p-3">
              <div className="d-flex justify-content-between">
                <span className="text-neon">{item.icon}</span>
              </div>
              <p className="text-brand-muted text-uppercase small mt-2 mb-0">{item.title}</p>
              <h4 className="text-white fw-bold my-1">{item.val}</h4>
              <p className="text-neon small">{item.unit}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="row g-3">
        <div className="col-12 col-lg-8">
          <div className="glass-card p-4 h-100">
            <h5 className="text-white mb-4">Historial Mensual (kWh)</h5>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={monthly}>
                <XAxis dataKey="month" stroke="#666" fontSize={10} />
                <YAxis stroke="#666" fontSize={10} />
                <Tooltip contentStyle={{ background: '#0a0a0c', border: '1px solid #333' }} />
                <Bar dataKey="consumo_kwh" fill="#00f2fe" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="col-12 col-lg-4">
          <div className="glass-card p-4 h-100">
            <h5 className="text-white mb-4">Distribución de Costos</h5>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={pieData} innerRadius={60} outerRadius={80} dataKey="value">
                    {pieData.map((entry, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[250px] text-brand-muted text-xs">Sin datos</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
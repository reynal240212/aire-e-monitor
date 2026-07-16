import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [clientId, setClientId] = useState(1)
  const [dashboardData, setDashboardData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchDashboard = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/dashboard/${clientId}`)
      if (!res.ok) throw new Error(`Error ${res.status}`)
      const data = await res.json()
      setDashboardData(data)
    } catch (err) {
      setError(err.message)
      setDashboardData(null)
    } finally {
      setLoading(false)
    }
  }, [clientId])

  useEffect(() => { fetchDashboard() }, [fetchDashboard])

  return (
    <AppContext.Provider value={{ clientId, setClientId, dashboardData, loading, error, fetchDashboard }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)

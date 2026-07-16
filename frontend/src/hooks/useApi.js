import { useState, useCallback } from 'react'

const API = '/api'

async function request(url, options = {}) {
  const res = await fetch(`${API}${url}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: `Error ${res.status}` }))
    throw new Error(err.detail || err.message || `Error ${res.status}`)
  }
  return res.json()
}

export function useApi() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const get = useCallback(async (url) => {
    setLoading(true); setError(null)
    try {
      const data = await request(url)
      return data
    } catch (e) {
      setError(e.message)
      throw e
    } finally {
      setLoading(false)
    }
  }, [])

  const post = useCallback(async (url, body) => {
    setLoading(true); setError(null)
    try {
      const data = await request(url, { method: 'POST', body: JSON.stringify(body) })
      return data
    } catch (e) {
      setError(e.message)
      throw e
    } finally {
      setLoading(false)
    }
  }, [])

  const put = useCallback(async (url) => {
    setLoading(true); setError(null)
    try {
      const data = await request(url, { method: 'PUT' })
      return data
    } catch (e) {
      setError(e.message)
      throw e
    } finally {
      setLoading(false)
    }
  }, [])

  const del = useCallback(async (url) => {
    setLoading(true); setError(null)
    try {
      const data = await request(url, { method: 'DELETE' })
      return data
    } catch (e) {
      setError(e.message)
      throw e
    } finally {
      setLoading(false)
    }
  }, [])

  const upload = useCallback(async (url, formData) => {
    setLoading(true); setError(null)
    try {
      const res = await fetch(`${API}${url}`, { method: 'POST', body: formData })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: `Error ${res.status}` }))
        throw new Error(err.detail || err.message || `Error ${res.status}`)
      }
      return res.json()
    } catch (e) {
      setError(e.message)
      throw e
    } finally {
      setLoading(false)
    }
  }, [])

  return { loading, error, get, post, put, del, upload, setError }
}

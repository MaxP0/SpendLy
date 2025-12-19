import React, { useState } from 'react'
import { api } from '../api'

const Receipts: React.FC = () => {
  const [file, setFile] = useState<File | null>(null)
  const [result, setResult] = useState<{ filename: string; raw_text?: string; amount?: string; date?: string; message: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const onUpload = async () => {
    if (!file) return
    setLoading(true); setError(null); setResult(null)
    const form = new FormData()
    form.append('file', file)
    try {
      const res = await api.post('/receipts/upload', form)
      setResult(res.data)
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Upload failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Receipts & Expenses</h1>
      <div className="bg-white border rounded p-4">
        <p className="text-gray-700 mb-4">Upload a receipt image or PDF to extract basic details.</p>
        <div className="flex items-center gap-3">
          <input
            type="file"
            accept="image/*,application/pdf"
            onChange={e => setFile(e.target.files?.[0] || null)}
          />
          <button className="btn" onClick={onUpload} disabled={!file || loading}>
            {loading ? 'Uploading…' : 'Upload Receipt'}
          </button>
        </div>
        {error && <div className="mt-3 text-red-600">{error}</div>}
        {result && (
          <div className="mt-4 border-t pt-4">
            <div className="text-sm text-gray-600">File Name</div>
            <div className="font-medium">{result.filename}</div>
            <div className="mt-2 text-sm text-gray-600">Raw Text</div>
            <pre className="bg-gray-100 p-2 rounded whitespace-pre-wrap text-sm">{result.raw_text || '—'}</pre>
            <div className="mt-2 text-sm text-gray-600">Amount</div>
            <div className="font-medium">{result.amount || '—'}</div>
            <div className="mt-2 text-sm text-gray-600">Date</div>
            <div className="font-medium">{result.date || '—'}</div>
            <div className="mt-2 text-sm text-gray-600">Status</div>
            <div className="font-medium">{result.message}</div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Receipts

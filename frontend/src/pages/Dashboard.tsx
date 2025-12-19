import React from 'react'

const Dashboard: React.FC = () => {
  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border rounded p-4">
          <div className="text-sm text-gray-600">Total Income</div>
          <div className="text-2xl font-semibold">€5,000.00</div>
        </div>
        <div className="bg-white border rounded p-4">
          <div className="text-sm text-gray-600">Total Expenses</div>
          <div className="text-2xl font-semibold">€2,300.00</div>
        </div>
        <div className="bg-white border rounded p-4">
          <div className="text-sm text-gray-600">VAT Due</div>
          <div className="text-2xl font-semibold">€450.00</div>
        </div>
      </div>
      <p className="mt-6 text-gray-700">This is a demo dashboard.</p>
    </div>
  )
}

export default Dashboard

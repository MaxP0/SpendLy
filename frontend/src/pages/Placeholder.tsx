import React from 'react'

const Placeholder: React.FC<{ title: string; description: string }> = ({ title, description }) => {
  return (
    <div>
      <h1 className="text-2xl font-semibold mb-2">{title}</h1>
      <p className="text-gray-700">{description}</p>
    </div>
  )
}

export default Placeholder

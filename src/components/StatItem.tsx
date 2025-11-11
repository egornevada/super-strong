import React from 'react'

export interface DefaultStrokeProps {
  label: string
  value: string | number
}

export function DefaultStroke({ label, value }: DefaultStrokeProps) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-fg-3">{label}</span>
      <span className="text-fg-1 font-medium">{value}</span>
    </div>
  )
}

import React from 'react'

export default function Popup({ message, onClose }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-gray-700 p-4 rounded relative w-full max-w-[50rem]">
        <p className="whitespace-pre-wrap mb-4">{message}</p>
        <div className="text-right">
          <button onClick={onClose}>OK</button>
        </div>
      </div>
    </div>
  )
}

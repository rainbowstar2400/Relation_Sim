import React, { useState, useEffect } from 'react'

export default function Popup({ message, onClose }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const id = setTimeout(() => setVisible(true), 10)
    return () => clearTimeout(id)
  }, [])

  const handleClose = () => {
    setVisible(false)
    setTimeout(onClose, 300)
  }

  return (
    <div
      className={`fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'}`}
    >
      <div className="bg-gray-700 p-4 rounded relative w-full max-w-[50rem]">
        <p className="whitespace-pre-wrap mb-4">{message}</p>
        <div className="text-right">
          <button onClick={handleClose}>OK</button>
        </div>
      </div>
    </div>
  )
}

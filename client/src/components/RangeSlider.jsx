import React, { useEffect, useRef } from 'react'

export default function RangeSlider({
  min,
  max,
  value,
  onChange,
  showNumbers = true,
  step = 1,
  tickInterval = 1,
  disabled = false,
}) {
  const sliderRef = useRef(null)
  const tickRefs = useRef([])

  useEffect(() => {
    const alignTicks = () => {
      const slider = sliderRef.current
      const ticks = tickRefs.current
      if (!slider || ticks.length === 0) return
      const sliderWidth = slider.offsetWidth
      const thumbWidth = 10
      const trackWidth = sliderWidth - thumbWidth
      const numTicks = ticks.length
      ticks.forEach((span, idx) => {
        const position = (thumbWidth / 2) + (trackWidth / (numTicks - 1)) * idx
        span.style.left = position + 'px'
      })
    }
    alignTicks()
    window.addEventListener('resize', alignTicks)
    return () => window.removeEventListener('resize', alignTicks)
  }, [])

  const ticks = []
  for (let i = min; i <= max; i += tickInterval) {
    ticks.push(i)
  }

  return (
    <div className="slider-container">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={onChange}
        ref={sliderRef}
        disabled={disabled}
      />
      <div className="slider-ticks">
        {ticks.map((t, idx) => (
          <span key={idx} ref={el => tickRefs.current[idx] = el}>{showNumbers ? t : ''}</span>
        ))}
      </div>
    </div>
  )
}

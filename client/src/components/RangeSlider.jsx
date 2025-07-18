import React, { useEffect, useRef } from 'react'

// step: スライダーの実際の移動単位
// tickStep: 目盛り線の間隔。指定がなければ step と同じ値を使う
export default function RangeSlider({ min, max, value, onChange, step = 1, tickStep, showNumbers = true }) {
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

  const tickInterval = tickStep ?? step
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
      />
      <div className="slider-ticks">
        {ticks.map((t, idx) => (
          <span key={idx} ref={el => tickRefs.current[idx] = el}>{showNumbers ? t : ''}</span>
        ))}
      </div>
    </div>
  )
}

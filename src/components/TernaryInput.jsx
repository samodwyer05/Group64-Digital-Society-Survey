import React, { useRef, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import ThankYouModal from './ThankYouModal'

/*
TernaryInput renders an interactive SVG equilateral triangle.
- Users click inside the triangle to place a point.
- Coordinates are converted to barycentric proportions (innovation, equality, stability).
- On submit, the selection is saved to Supabase.
- localStorage enforces one submission per year.
- After a successful submit, a thank-you modal is shown.
*/

function pointInTriangle(pt, v1, v2, v3) {
  // Barycentric technique
  const dX = pt.x - v3.x
  const dY = pt.y - v3.y
  const dX21 = v2.x - v3.x
  const dY12 = v1.y - v3.y
  const D = dY12 * (v1.x - v3.x) + (v3.x - v2.x) * (v1.y - v3.y)
  const s = dY12 * dX + (v3.x - v2.x) * dY
  const t = (v3.y - v1.y) * dX + (v1.x - v3.x) * dY
  if (D < 0) return s <= 0 && t <= 0 && s + t >= D
  return s >= 0 && t >= 0 && s + t <= D
}

function cartesianToBarycentric(pt, A, B, C) {
  // Solve for weights a,b,c such that pt = a*A + b*B + c*C and a+b+c=1
  // Using 2x2 system:
  // Let v0 = B - A, v1 = C - A, v2 = pt - A
  const v0x = B.x - A.x
  const v0y = B.y - A.y
  const v1x = C.x - A.x
  const v1y = C.y - A.y
  const v2x = pt.x - A.x
  const v2y = pt.y - A.y

  const d00 = v0x * v0x + v0y * v0y
  const d01 = v0x * v1x + v0y * v1y
  const d11 = v1x * v1x + v1y * v1y
  const d20 = v2x * v0x + v2y * v0y
  const d21 = v2x * v1x + v2y * v1y

  const denom = d00 * d11 - d01 * d01
  let v = 0, w = 0
  if (Math.abs(denom) > 1e-9) {
    v = (d11 * d20 - d01 * d21) / denom
    w = (d00 * d21 - d01 * d20) / denom
  }

  const b = v
  const c = w
  const a = 1 - b - c
  return { a, b, c }
}

export default function TernaryInput({ year, title }) {
  const svgRef = useRef()
  const [selected, setSelected] = useState(null) // {a,b,c,x,y}
  const [status, setStatus] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [lastSubmission, setLastSubmission] = useState(null)

  useEffect(() => {
    const key = `submitted-${year}`
    setSubmitted(!!localStorage.getItem(key))
  }, [year])

  async function handleClick(e) {
    if (submitted) {
      setStatus('You have already submitted for this year (one submission allowed).')
      return
    }

    const svg = svgRef.current
    const rect = svg.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const clickY = e.clientY - rect.top

    const width = rect.width
    const height = rect.height

    // Define triangle vertices within svg coordinate system
    // We'll define an equilateral triangle with padding
    const pad = 12
    // coordinates in pixels:
    const A = { x: pad, y: height - pad } // bottom-left -> Innovation
    const B = { x: width - pad, y: height - pad } // bottom-right -> Equality
    const C = { x: width / 2, y: pad } // top -> Stability

    const pt = { x: clickX, y: clickY }
    // Check if inside triangle bounding region using barycentric or point in triangle
    // Use barycentric convert then clamp; but first check bounding using triangle area test
    // We'll use cartesianToBarycentric
    const bary = cartesianToBarycentric(pt, A, B, C)
    // If bary values are roughly between 0 and 1, it's inside
    if (bary.a < -0.001 || bary.b < -0.001 || bary.c < -0.001) {
      setStatus('Click inside the triangle. Your click was outside the valid region.')
      return
    }

    // Normalize small negatives to zero
    const a = Math.max(0, bary.a)
    const b = Math.max(0, bary.b)
    const c = Math.max(0, bary.c)
    const sum = a + b + c || 1
    const norm = { innovation: a / sum, equality: b / sum, stability: c / sum }

    setSelected({
      ...norm,
      x: pt.x,
      y: pt.y
    })
    setStatus('')
  }

  async function handleSubmit() {
    if (!selected) {
      setStatus('Please click inside the triangle to select a point before submitting.')
      return
    }
    setStatus('Saving...')
    try {
      const payload = {
        year: String(year),
        innovation: Number(selected.innovation.toFixed(6)),
        equality: Number(selected.equality.toFixed(6)),
        stability: Number(selected.stability.toFixed(6))
      }
      const { data, error } = await supabase.from('responses').insert([payload])
      if (error) {
        console.error(error)
        setStatus('Error saving to database. See console for details.')
        return
      }
      // Mark as submitted in localStorage to enforce one submission per plot per user
      localStorage.setItem(`submitted-${year}`, 'true')
      setSubmitted(true)
      setLastSubmission(payload)
      setShowModal(true)
      setStatus('Thank you — your response has been recorded.')
    } catch (err) {
      console.error(err)
      setStatus('Unexpected error while saving.')
    }
  }

  function handleCloseModal() {
    setShowModal(false)
  }

  return (
    <article className="card">
      <div className="triangle-wrap">
        <h3>{title}</h3>

        <svg
          ref={svgRef}
          className="ternary-canvas"
          viewBox="0 0 400 350"
          preserveAspectRatio="xMidYMid meet"
          onClick={handleClick}
          style={{ width: '100%', height: 'auto' }}
        >
          {/* Define vertices in viewBox coords */}
          <defs>
            <style>{`.label{font-size:14px; fill:#0f172a; font-weight:600}`}</style>
          </defs>

          {/* triangle */}
          <polygon
            points="12,338 388,338 200,12"
            fill="#f1f5f9"
            stroke="#e2e8f0"
            strokeWidth="2"
            rx="6"
          />
          {/* grid lines (simple: lines from each vertex to intervals) */}
          {/* optional shading or guidance */}
          {/* Labels */}
          <text x="18" y="352" className="label">Innovation</text>
          <text x="320" y="352" className="label">Equality</text>
          <text x="180" y="24" className="label" textAnchor="middle">Stability</text>

          {/* Selected point (mapped back to viewBox coordinates) */}
          {selected && (
            <circle cx={selected.x} cy={selected.y} r="8" fill="#2563eb" stroke="#fff" strokeWidth="2" />
          )}
        </svg>

        <div className="info small">
          {submitted ? (
            <div>
              <strong>Submitted</strong>
              <div>Your recorded proportions (approx):</div>
              {lastSubmission ? (
                <div>
                  Innovation: {(lastSubmission.innovation * 100).toFixed(1)}% · Equality: {(lastSubmission.equality * 100).toFixed(1)}% · Stability: {(lastSubmission.stability * 100).toFixed(1)}%
                </div>
              ) : (
                <div className="small">You submitted previously for this year.</div>
              )}
            </div>
          ) : (
            <>
              <div>Click inside the triangle to place a dot representing the balance.</div>
              <div style={{ marginTop: 8 }}>
                <button className="button" onClick={handleSubmit}>Submit for {year}</button>
              </div>
              <div style={{ marginTop: 8, color: '#6b7280', fontSize: 13 }}>
                Innovation · Equality · Stability — values sum to 100%.
              </div>
            </>
          )}
          {status && <div style={{ marginTop: 8, color: '#1f2937' }}>{status}</div>}
        </div>
      </div>

      <ThankYouModal open={showModal} onClose={handleCloseModal} data={lastSubmission} year={year} />
    </article>
  )
}
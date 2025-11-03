import React, { useEffect } from 'react'

/**
 * ThankYouModal
 * Props:
 * - open: boolean
 * - onClose: () => void
 * - data: { innovation, equality, stability } (optional)
 * - year: string
 *
 * Behavior:
 * - Renders a centered modal overlay when open is true.
 * - Shows the submitted proportions (if provided).
 * - Closes on overlay click, close button, or Escape key.
 */
export default function ThankYouModal({ open, onClose, data, year }) {
  useEffect(() => {
    if (!open) return
    function onKey(e) {
      if (e.key === 'Escape') onClose && onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const pct = (v) => `${(Number(v || 0) * 100).toFixed(1)}%`;

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="modal"
        role="document"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3>Thank you!</h3>
          <div className="modal-sub">Your response for {year} has been recorded.</div>
        </div>

        {data ? (
          <div className="modal-content">
            <div className="stats-row">
              <div className="stat">
                <div className="stat-label">Innovation</div>
                <div className="stat-value">{pct(data.innovation)}</div>
              </div>
              <div className="stat">
                <div className="stat-label">Equality</div>
                <div className="stat-value">{pct(data.equality)}</div>
              </div>
              <div className="stat">
                <div className="stat-label">Stability</div>
                <div className="stat-value">{pct(data.stability)}</div>
              </div>
            </div>

            <div className="modal-note">
              You can view aggregated results from the "View Aggregated Results" tab.
            </div>
          </div>
        ) : (
          <div className="modal-content">
            <div className="modal-note">We recorded your submission. Thank you for participating!</div>
          </div>
        )}

        <div className="modal-actions">
          <button className="button" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  )
}

import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'

export default function ContainerTycoon() {
  const iframeRef = useRef(null)

  // Make iframe fill full height
  useEffect(() => {
    function resize() {
      if (iframeRef.current) {
        iframeRef.current.style.height = (window.innerHeight - 56) + 'px'
      }
    }
    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])

  return (
    <div style={{ paddingTop: 56, height: '100vh', display: 'flex', flexDirection: 'column', background: '#050f1c', overflow: 'hidden' }}>

      {/* Slim header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 1rem', height: 44, background: 'rgba(0,0,0,0.5)', borderBottom: '1px solid rgba(0,180,255,0.12)', flexShrink: 0, position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Link to="/lobby" style={{ color: 'rgba(245,240,232,0.45)', fontSize: '0.8rem', textDecoration: 'none' }}>← Back</Link>
          <span style={{ fontFamily: "'Space Grotesk', sans-serif", color: '#00c9ff', fontWeight: 700, fontSize: '0.9rem' }}>🚢 Container Tycoon</span>
          <span style={{ fontSize: '0.68rem', background: 'rgba(0,201,255,0.1)', color: '#00c9ff', padding: '2px 8px', borderRadius: 20, border: '1px solid rgba(0,201,255,0.2)' }}>Global Shipping Simulator</span>
        </div>
        <Link to="/games" style={{ fontSize: '0.75rem', color: 'rgba(245,240,232,0.4)', textDecoration: 'none' }}>All Games →</Link>
      </div>

      {/* Game iframe */}
      <iframe
        ref={iframeRef}
        src="/container-tycoon.html"
        title="Container Tycoon"
        style={{
          width: '100%',
          border: 'none',
          display: 'block',
          flex: 1,
        }}
        allow="fullscreen"
      />
    </div>
  )
}

import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { Link } from 'react-router-dom'

const PAYPAL_CLIENT_ID = 'BAAkMA4KUZC3DlzIxceYsdlIu1sV7_-tQZ241b0fgiBIyW9wfxZKJ2slqKB_6R7daIaRjT4mPFC7zQtyXo'
const PLAN_IDS = {
  plus: 'P-46E37703W5629881TNIV5EGY',
  club: 'P-1V455033JE604344NNIV5GVY'
}

const PLANS = [
  {
    id: 'plus',
    name: 'Plus',
    price: 6,
    period: 'month',
    features: ['Zero ads ever', 'Full game history & replays', 'Custom avatar & profile', 'Priority matchmaking', 'Monthly tournament entries'],
    color: 'var(--gold)',
    popular: true,
  },
  {
    id: 'club',
    name: 'Club',
    price: 30,
    period: 'month',
    features: ['Private club room', 'Up to 20 members', 'Club leaderboard', 'Host your own tournaments', 'All Plus features included', 'Club admin dashboard'],
    color: 'var(--green-accent)',
    popular: false,
  },
]

export default function Upgrade() {
  const { profile, fetchProfile, user } = useAuth()
  const [paypalLoaded, setPaypalLoaded] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState('plus')
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    // Load PayPal SDK
    if (document.getElementById('paypal-sdk')) { setPaypalLoaded(true); return }
    const script = document.createElement('script')
    script.id = 'paypal-sdk'
    script.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&vault=true&intent=subscription&currency=USD`
    script.setAttribute('data-sdk-integration-source', 'button-factory')
    script.onload = () => setPaypalLoaded(true)
    document.body.appendChild(script)
  }, [])

  useEffect(() => {
    if (!paypalLoaded) return
    renderPayPalButton()
  }, [paypalLoaded, selectedPlan])

  function renderPayPalButton() {
    const container = document.getElementById('paypal-button-container')
    if (!container) return
    container.innerHTML = ''

    if (!window.paypal) return

    window.paypal.Buttons({
      style: {
        shape: 'rect',
        color: 'gold',
        layout: 'vertical',
        label: 'subscribe',
      },
      createSubscription: function(data, actions) {
        return actions.subscription.create({
          plan_id: selectedPlan === 'plus' ? PLAN_IDS.plus : PLAN_IDS.club,
        })
      },
      onApprove: async function(data) {
        // Update user plan in Supabase
        const { error: dbError } = await supabase
          .from('profiles')
          .update({ plan: selectedPlan })
          .eq('id', user.id)

        if (dbError) {
          setError('Payment approved but profile update failed. Contact support.')
          return
        }

        await fetchProfile(user.id)
        setSuccess(true)
      },
      onError: function(err) {
        setError('Payment failed. Please try again.')
        console.error('PayPal error:', err)
      }
    }).render('#paypal-button-container')
  }

  if (profile?.plan !== 'free') return (
    <div style={{ paddingTop: 80, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem 2rem' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⭐</div>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '2rem', color: 'var(--gold)', marginBottom: '0.5rem' }}>
          You're on {profile?.plan?.toUpperCase()}
        </h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>You already have a premium plan. Enjoy!</p>
        <Link to="/lobby" className="btn-gold">Back to Games →</Link>
      </div>
    </div>
  )

  if (success) return (
    <div style={{ paddingTop: 80, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem 2rem' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '2rem', color: 'var(--gold)', marginBottom: '0.5rem' }}>
          Welcome to {selectedPlan === 'plus' ? 'Plus' : 'Club'}!
        </h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Your account has been upgraded. No more ads and all premium features are now active.</p>
        <Link to="/lobby" className="btn-gold">Start Playing →</Link>
      </div>
    </div>
  )

  return (
    <div style={{ paddingTop: 80, minHeight: '100vh' }}>
      <div className="page-wrap" style={{ padding: '2rem 1.5rem', maxWidth: 800, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <span className="section-eye">Upgrade</span>
          <h1 className="display-title" style={{ fontSize: '2.2rem', marginBottom: '0.5rem' }}>Go Premium</h1>
          <p style={{ color: 'var(--text-muted)' }}>Remove ads and unlock the full CardGamers experience</p>
        </div>

        {/* Plan selector */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px,1fr))', gap: '1rem', marginBottom: '2rem' }}>
          {PLANS.map(plan => (
            <div
              key={plan.id}
              onClick={() => setSelectedPlan(plan.id)}
              style={{
                background: 'var(--felt-light)',
                border: `2px solid ${selectedPlan === plan.id ? plan.color : 'var(--border)'}`,
                borderRadius: 14, padding: '1.5rem',
                cursor: 'pointer', position: 'relative',
                transition: 'border-color 0.2s',
              }}
            >
              {plan.popular && <span style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: 'var(--gold)', color: 'var(--felt-dark)', fontSize: '0.68rem', fontWeight: 700, padding: '2px 12px', borderRadius: 20, whiteSpace: 'nowrap' }}>Most Popular</span>}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>{plan.name}</div>
                  <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '2.2rem', fontWeight: 700, color: 'var(--cream)', lineHeight: 1 }}>
                    ${plan.price}<span style={{ fontSize: '1rem', opacity: 0.5 }}>/mo</span>
                  </div>
                </div>
                <div style={{ width: 24, height: 24, borderRadius: '50%', border: `2px solid ${selectedPlan === plan.id ? plan.color : 'var(--border)'}`, background: selectedPlan === plan.id ? plan.color : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {selectedPlan === plan.id && <span style={{ color: 'var(--felt-dark)', fontSize: '0.75rem', fontWeight: 700 }}>✓</span>}
                </div>
              </div>
              <ul style={{ listStyle: 'none' }}>
                {plan.features.map(f => (
                  <li key={f} style={{ fontSize: '0.85rem', color: 'rgba(245,240,232,0.7)', padding: '0.3rem 0', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: plan.color }}>✓</span> {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* PayPal button */}
        <div style={{ maxWidth: 400, margin: '0 auto' }}>
          <div style={{ background: 'var(--felt-light)', border: '1px solid var(--border)', borderRadius: 14, padding: '1.5rem' }}>
            <p style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Subscribing to <strong style={{ color: 'var(--cream)' }}>{selectedPlan === 'plus' ? 'Plus — $6/month' : 'Club — $30/month'}</strong>
            </p>
            {error && <div style={{ background: 'rgba(192,57,43,0.15)', border: '1px solid rgba(192,57,43,0.3)', color: '#f09595', borderRadius: 8, padding: '0.6rem 0.9rem', fontSize: '0.875rem', marginBottom: '1rem' }}>{error}</div>}
            <div id="paypal-button-container">
              {!paypalLoaded && <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>Loading payment options...</div>}
            </div>
            <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'rgba(245,240,232,0.3)', marginTop: '1rem' }}>
              Cancel anytime. No hidden fees. Secured by PayPal.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

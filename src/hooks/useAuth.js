import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

const ADJECTIVES = ['Swift','Lucky','Bold','Clever','Sharp','Royal','Golden','Silent','Wild','Brave']
const NOUNS = ['Ace','King','Joker','Dealer','Shark','Player','Bluffer','Bidder','Trumper','Caller']

function generateGuestName() {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)]
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)]
  const num = Math.floor(Math.random() * 900) + 100
  return `${adj}${noun}${num}`
}

function getOrCreateGuest() {
  let guest = null
  try {
    const stored = localStorage.getItem('cg_guest')
    if (stored) guest = JSON.parse(stored)
  } catch {}
  if (!guest) {
    guest = { username: generateGuestName(), isGuest: true }
    try { localStorage.setItem('cg_guest', JSON.stringify(guest)) } catch {}
  }
  return guest
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [guestProfile, setGuestProfile] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user)
        fetchProfile(session.user.id)
      } else {
        const guest = getOrCreateGuest()
        setGuestProfile(guest)
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        setGuestProfile(null)
        fetchProfile(session.user.id)
      } else {
        setProfile(null)
        const guest = getOrCreateGuest()
        setGuestProfile(guest)
        setLoading(false)
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  async function fetchProfile(userId) {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
    setProfile(data)
    setLoading(false)
  }

  async function signUp(email, password, username) {
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { data: { username } }
    })
    return { error }
  }

  async function signIn(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error }
  }

  async function signInWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' })
    return { error }
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  const activeProfile = profile || guestProfile

  return (
    <AuthContext.Provider value={{
      user,
      profile: activeProfile,
      isGuest: !user && !!guestProfile,
      loading,
      signUp, signIn, signInWithGoogle, signOut, fetchProfile
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)

import { useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'

const SERVER_URL = process.env.REACT_APP_GAME_SERVER_URL || 'http://localhost:4000'

let socketInstance = null

export function useSocket() {
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    if (!socketInstance) {
      socketInstance = io(SERVER_URL, {
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      })
    }

    const socket = socketInstance

    socket.on('connect', () => setConnected(true))
    socket.on('disconnect', () => setConnected(false))

    if (socket.connected) setConnected(true)

    return () => {
      socket.off('connect')
      socket.off('disconnect')
    }
  }, [])

  return { socket: socketInstance, connected }
}

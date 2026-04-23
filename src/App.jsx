import { useState } from 'react'
import Home from './screens/Home'
import Log from './screens/Log'
import './App.css'

export default function App() {
  const [{ screen, props }, setNav] = useState({ screen: 'home', props: {} })
  const [isUnlocked, setIsUnlocked] = useState(
    () => Boolean(localStorage.getItem('sleeplab_unlocked'))
  )

  function navigate(screen, props = {}) {
    setNav({ screen, props })
  }

  function handleUnlock() {
    localStorage.setItem('sleeplab_unlocked', '1')
    setIsUnlocked(true)
  }

  if (screen === 'home') return <Home navigate={navigate} isUnlocked={isUnlocked} onUnlock={handleUnlock} />
  if (screen === 'log') return <Log navigate={navigate} {...props} isUnlocked={isUnlocked} />
}

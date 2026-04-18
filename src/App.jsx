import { useState } from 'react'
import Home from './screens/Home'
import Log from './screens/Log'
import './App.css'

export default function App() {
  const [{ screen, props }, setNav] = useState({ screen: 'home', props: {} })

  function navigate(screen, props = {}) {
    setNav({ screen, props })
  }

  if (screen === 'home') return <Home navigate={navigate} />
  if (screen === 'log') return <Log navigate={navigate} {...props} />
}

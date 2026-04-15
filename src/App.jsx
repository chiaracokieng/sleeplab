import { useState } from 'react'
import Home from './screens/Home'
import Log from './screens/Log'
import './App.css'

export default function App() {
  const [screen, setScreen] = useState('home')

  if (screen === 'home') return <Home navigate={setScreen} />
  if (screen === 'log') return <Log navigate={setScreen} />
}

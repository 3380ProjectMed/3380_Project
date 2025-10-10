import { useState } from 'react'
import clinicLogo from '/logo.jpg'
import './App.css'
import LandingPage from './components/LandingPage.jsx'
// import './components/LandingPage.jsx'

function App() {
  // const [count, setCount] = useState(0)
  return <LandingPage logo={clinicLogo} />
}

export default App

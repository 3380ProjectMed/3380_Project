import React from 'react'
import './App.css'
import LandingPage from './components/LandingPage.jsx'
import DoctorPortal from './components/doctor/DoctorPortal.jsx'
import TestPhpConnection from './components/TestPhpConnection.jsx'
import {BrowserRouter as Router, Route, Routes} from 'react-router-dom';
import NotFound from './components/NotFound.js'
// import './components/LandingPage.jsx'

function App() {
  // const [count, setCount] = useState(0)
  
  return(
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage/>} />
        <Route path="/doctor" element={<DoctorPortal/>} />
        <Route path="*" element={<NotFound/>} />
      </Routes>
    </Router>
  );
}


export default App; 
import React from 'react'
import {
  Navigate,
  BrowserRouter as Router,
  Routes,
  Route,
} from "react-router-dom";
import Home from './pages/Home'
import Research from './pages/Research'
import Roadmap from './pages/Roadmap'
import CoreBusiness from './pages/CoreBusiness'

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/home" element={<Navigate to="/" replace />} />
      <Route path="/research" element={<Research />} />
      <Route path="/core" element={<CoreBusiness />} />
      <Route path="/roadmap" element={<Roadmap />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
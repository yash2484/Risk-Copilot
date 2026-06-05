import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useState } from 'react'
import Sidebar from './components/Sidebar'
import Chat from './pages/Chat'
import Dashboard from './pages/Dashboard'

export default function App() {
  const [role, setRole] = useState('analyst')
  return (
    <BrowserRouter>
      <div className="flex h-screen overflow-hidden">
        <Sidebar role={role} setRole={setRole} />
        <main className="flex-1 overflow-hidden">
          <Routes>
            <Route path="/" element={<Chat role={role} />} />
            <Route path="/dashboard" element={<Dashboard />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
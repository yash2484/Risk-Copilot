import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useState, useEffect, useCallback } from 'react'
import Sidebar from './components/Sidebar'
import CommandPalette from './components/CommandPalette'
import Chat from './pages/Chat'
import Dashboard from './pages/Dashboard'
 
export default function App() {
  const [role, setRole] = useState('analyst')
  const [paletteOpen, setPaletteOpen] = useState(false)
 
  // Ctrl+K / Cmd+K opens the command palette
  const onKeyDown = useCallback((e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault()
      setPaletteOpen(open => !open)
    }
    if (e.key === 'Escape') setPaletteOpen(false)
  }, [])
 
  useEffect(() => {
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onKeyDown])
 
  return (
    <BrowserRouter>
      <div className="flex h-screen overflow-hidden">
        <Sidebar role={role} setRole={setRole} onOpenPalette={() => setPaletteOpen(true)} />
        <main className="flex-1 overflow-hidden">
          <Routes>
            <Route path="/" element={<Chat role={role} />} />
            <Route path="/dashboard" element={<Dashboard />} />
          </Routes>
        </main>
        <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
      </div>
    </BrowserRouter>
  )
}
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useState, useEffect, useCallback } from 'react'
import Sidebar from './components/Sidebar'
import CommandPalette from './components/CommandPalette'
import Chat from './pages/Chat'
import Dashboard from './pages/Dashboard'

export default function App() {
  const [role, setRole] = useState('analyst')
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [navOpen, setNavOpen] = useState(true)

  // ⌘K / Ctrl+K → palette · ⌘B / Ctrl+B → toggle the rail · Esc → close palette
  const onKeyDown = useCallback((e) => {
    const mod = e.ctrlKey || e.metaKey
    if (mod && e.key.toLowerCase() === 'k') {
      e.preventDefault()
      setPaletteOpen(open => !open)
    }
    if (mod && e.key.toLowerCase() === 'b') {
      e.preventDefault()
      setNavOpen(open => !open)
    }
    if (e.key === 'Escape') setPaletteOpen(false)
  }, [])

  useEffect(() => {
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onKeyDown])

  const toggleNav = useCallback(() => setNavOpen(o => !o), [])

  return (
    <BrowserRouter>
      <div className="flex h-screen overflow-hidden">
        <Sidebar
          role={role}
          setRole={setRole}
          open={navOpen}
          onClose={() => setNavOpen(false)}
          onOpenPalette={() => setPaletteOpen(true)}
        />
        <main className="flex-1 min-w-0 overflow-hidden">
          <Routes>
            <Route path="/"          element={<Chat role={role} navOpen={navOpen} onToggleNav={toggleNav} />} />
            <Route path="/dashboard" element={<Dashboard navOpen={navOpen} onToggleNav={toggleNav} />} />
          </Routes>
        </main>
        <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
      </div>
    </BrowserRouter>
  )
}

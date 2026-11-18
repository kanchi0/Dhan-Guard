import { useState } from 'react'
import { NavLink, Link, useNavigate } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import Logo from './Logo'
import { useAuth } from '../context/AuthContext'

const links = [
  { to: '/check', label: 'Check' },
  { to: '/history', label: 'History' },
  { to: '/about', label: 'About' },
]

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false) // mobile menu open or closed

  // The navbar is only shown when logged in
  if (!user) return null

  function handleLogout() {
    logout()
    setOpen(false)
    navigate('/login')
  }

  // Style for a link: bold with an underline when it is the current page
  function linkClass({ isActive }) {
    return (
      'flex min-h-11 items-center border-b-2 px-1 ' +
      (isActive ? 'border-field font-semibold' : 'border-transparent')
    )
  }

  return (
    <header className="border-b border-sage">
      <nav className="mx-auto flex max-w-[960px] items-center justify-between px-4 py-2">
        <Link to="/check" aria-label="DhanGuard home">
          <Logo />
        </Link>

        {/* Desktop links */}
        <div className="hidden items-center gap-6 md:flex">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} className={linkClass}>
              {l.label}
            </NavLink>
          ))}
          <span className="text-sm">{user.name}</span>
          <button
            onClick={handleLogout}
            className="min-h-11 rounded-md border border-sage px-3"
          >
            Log out
          </button>
        </div>

        {/* Mobile menu button */}
        <button
          onClick={() => setOpen(!open)}
          className="flex min-h-11 min-w-11 items-center justify-center md:hidden"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      {/* Mobile links */}
      {open && (
        <div className="border-t border-sage px-4 pb-3 md:hidden">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={linkClass}
              onClick={() => setOpen(false)}
            >
              {l.label}
            </NavLink>
          ))}
          <p className="mt-2 text-sm">{user.name}</p>
          <button
            onClick={handleLogout}
            className="mt-2 min-h-11 rounded-md border border-sage px-3"
          >
            Log out
          </button>
        </div>
      )}
    </header>
  )
}
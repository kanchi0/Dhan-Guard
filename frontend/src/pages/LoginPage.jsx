import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import api from '../api'
import Logo from '../components/Logo'
import { useAuth } from '../context/AuthContext'
import riceField from '../assets/rice-field.webp'

// Turn an API error into a short plain message
function errorText(err) {
  // No answer from the server at all
  if (!err.response) {
    return 'Cannot reach the server. Please check that the backend is running.'
  }
  const detail = err.response.data?.detail
  // FastAPI sends a plain text message for 401 and 409
  if (typeof detail === 'string') return detail
  // FastAPI sends a list for 422 (invalid input)
  if (err.response.status === 422) {
    return 'Please check your details. The password needs at least 6 characters.'
  }
  return 'Something went wrong. Please try again.'
}

export default function LoginPage() {
  const { user, saveLogin } = useAuth()
  const navigate = useNavigate()

  const [mode, setMode] = useState('login') // 'login' or 'register'
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Already logged in: go straight to the Check page
  if (user) return <Navigate to="/check" replace />

  const isRegister = mode === 'register'

  function switchMode() {
    setMode(isRegister ? 'login' : 'register')
    setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (isRegister) {
        // Create the account first, then log in with the same details
        await api.post('/register', { name, email, password })
      }
      const res = await api.post('/login', { email, password })
      saveLogin(res.data.access_token, res.data.user)
      navigate('/check')
    } catch (err) {
      setError(errorText(err))
    } finally {
      setLoading(false)
    }
  }

  const inputClass =
    'mt-1 block min-h-11 w-full rounded-md border border-sage bg-white px-3'

  return (
    <div className="mx-auto max-w-sm">
      <div className="flex justify-center">
        <Logo />
      </div>
      <p className="mt-3 text-center">
        Check rice leaf photos for common diseases and see general treatment
        advice.
      </p>
      <img
        src={riceField}
        alt="A hand holding golden rice stalks in front of a green rice field"
        className="mt-6 h-40 w-full rounded-md border border-sage object-cover object-[50%_25%]"
      />
      <h1 className="mt-8 font-serif text-2xl font-semibold text-field">
        {isRegister ? 'Create an account' : 'Log in'}
      </h1>

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        {isRegister && (
          <div>
            <label htmlFor="name" className="block font-medium">
              Name
            </label>
            <input
              id="name"
              type="text"
              required
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
            />
          </div>
        )}

        <div>
          <label htmlFor="email" className="block font-medium">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="password" className="block font-medium">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={isRegister ? 6 : undefined}
            autoComplete={isRegister ? 'new-password' : 'current-password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
          />
          {isRegister && (
            <p className="mt-1 text-sm">At least 6 characters.</p>
          )}
        </div>

        {/* Error from the API, shown in brick red with a label */}
        {error && (
          <p
            role="alert"
            className="rounded-md border border-brick px-3 py-2 text-brick"
          >
            <span className="font-semibold">Error: </span>
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="min-h-11 w-full rounded-md bg-field px-4 text-paper disabled:opacity-60"
        >
          {loading
            ? 'Please wait...'
            : isRegister
              ? 'Create account'
              : 'Log in'}
        </button>
      </form>

      <p className="mt-6 text-center">
        {isRegister ? 'Already have an account?' : 'New here?'}{' '}
        <button
          type="button"
          onClick={switchMode}
          className="font-semibold text-field underline"
        >
          {isRegister ? 'Log in' : 'Create an account'}
        </button>
      </p>
    </div>
  )
}
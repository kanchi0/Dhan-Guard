import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import api, { imageSrc } from '../api'

// Show the date in a short readable form
function dateText(iso) {
  return new Date(iso).toLocaleString('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

// One shared grid so the header and the rows line up on desktop
const GRID = 'md:grid md:grid-cols-[64px_1fr_120px_180px] md:items-center md:gap-4'

export default function HistoryPage() {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Load the history once, when the page opens
  useEffect(() => {
    api
      .get('/history', { params: { limit: 50 } })
      .then((res) => setItems(res.data))
      .catch((err) => {
        if (!err.response) {
          setError('Cannot reach the server. Please check that the backend is running.')
        } else if (err.response.status === 401) {
          setError('Your login has expired. Please log out and log in again.')
        } else {
          setError('Could not load your history. Please try again.')
        }
      })
      .finally(() => setLoading(false))
  }, [])

  // Open a past check in the Result page
  function openItem(item) {
    navigate('/result', { state: { result: item } })
  }

  return (
    <div>
      <h1 className="font-serif text-3xl font-semibold text-field">History</h1>

      {loading && (
        <p role="status" className="mt-6 flex items-center gap-2 text-field">
          <Loader2 size={20} className="animate-spin" aria-hidden="true" />
          Loading your checks
        </p>
      )}

      {error && (
        <p
          role="alert"
          className="mt-6 rounded-md border border-brick px-3 py-2 text-brick"
        >
          <span className="font-semibold">Error: </span>
          {error}
        </p>
      )}

      {/* Empty state */}
      {!loading && !error && items.length === 0 && (
        <div className="mt-6">
          <p>No checks yet. Upload your first leaf photo.</p>
          <Link
            to="/check"
            className="mt-4 inline-flex min-h-11 items-center rounded-md bg-field px-4 text-paper"
          >
            Check a leaf
          </Link>
        </div>
      )}

      {items.length > 0 && (
        <div className="mt-6">
          {/* Column titles, desktop only */}
          <div
            className={`hidden border-b border-sage pb-2 text-sm font-semibold ${GRID}`}
            aria-hidden="true"
          >
            <span>Photo</span>
            <span>Disease</span>
            <span>Confidence</span>
            <span>Date</span>
          </div>

          <ul>
            {items.map((item) => (
              <li key={item.prediction_id} className="border-b border-sage">
                <button
                  type="button"
                  onClick={() => openItem(item)}
                  className={`flex min-h-11 w-full items-center gap-4 rounded-md py-3 text-left transition-colors hover:bg-sage/30 ${GRID}`}
                >
                  <img
                    src={imageSrc(item.image_url)}
                    alt=""
                    className="h-16 w-16 rounded-md border border-sage object-cover"
                  />
                  <span className="flex-1 md:flex-none">
                    <span className="block font-medium">
                      {item.disease ? item.disease.name : 'Not identified'}
                    </span>
                    {/* On a phone the details sit under the name */}
                    <span className="block text-sm md:hidden">
                      {item.confidence_percent}% &middot; {dateText(item.created_at)}
                    </span>
                  </span>
                  <span className="hidden md:block">{item.confidence_percent}%</span>
                  <span className="hidden md:block">{dateText(item.created_at)}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
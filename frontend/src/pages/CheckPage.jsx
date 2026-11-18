import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload, Camera, Loader2 } from 'lucide-react'
import api from '../api'

const MAX_BYTES = 5 * 1024 * 1024 // 5 MB, same limit as the backend
const ALLOWED_TYPES = ['image/jpeg', 'image/png']

// Turn an API error into a short plain message
function errorText(err) {
  if (!err.response) {
    return 'Cannot reach the server. Please check that the backend is running.'
  }
  switch (err.response.status) {
    case 400:
      return 'We could not read this file as an image. Please choose a clear JPG or PNG photo.'
    case 413:
      return 'This photo is larger than 5 MB. Please choose a smaller one.'
    case 415:
      return 'Only JPG and PNG photos are accepted.'
    case 401:
      return 'Your login has expired. Please log out and log in again.'
    default:
      return 'Something went wrong. Please try again.'
  }
}

export default function CheckPage() {
  const navigate = useNavigate()
  const fileInputRef = useRef(null) // hidden file picker
  const cameraInputRef = useRef(null) // hidden camera input

  const [file, setFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Called when the user picks a file or takes a photo
  function handleFile(e) {
    const picked = e.target.files[0]
    e.target.value = '' // lets the user pick the same file again later
    if (!picked) return

    setError('')
    // Check type and size here first, so the user gets a quick answer
    if (!ALLOWED_TYPES.includes(picked.type)) {
      setError('Only JPG and PNG photos are accepted.')
      return
    }
    if (picked.size > MAX_BYTES) {
      setError('This photo is larger than 5 MB. Please choose a smaller one.')
      return
    }

    // Free the old preview from memory, then make a new one
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setFile(picked)
    setPreviewUrl(URL.createObjectURL(picked))
  }

  // Send the photo to the backend
  async function handleSubmit() {
    if (!file) return
    setError('')
    setLoading(true)
    try {
      const form = new FormData()
      form.append('file', file) // the backend expects the field name "file"
      const res = await api.post('/predict', form)
      // Pass the answer to the Result page
      navigate('/result', { state: { result: res.data } })
    } catch (err) {
      setError(errorText(err))
      setLoading(false)
    }
  }

  return (
    <div>
      <h1 className="font-serif text-3xl font-semibold text-field">
        Check a rice leaf
      </h1>
      <p className="mt-2">
        Take a close, clear photo of one leaf in daylight. Keep the leaf flat
        and fill the frame.
      </p>

      {/* Dashed drop area with the preview or the buttons */}
      <div className="mt-6 rounded-md border border-dashed border-field p-6 text-center">
        {previewUrl ? (
          <img
            src={previewUrl}
            alt="The leaf photo you selected"
            className="mx-auto max-h-80 rounded-md"
          />
        ) : (
          <p>No photo selected yet.</p>
        )}

        <div className="mt-4 flex flex-col justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => fileInputRef.current.click()}
            disabled={loading}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-field px-4 text-field disabled:opacity-60"
          >
            <Upload size={18} aria-hidden="true" />
            {file ? 'Choose another photo' : 'Choose a photo'}
          </button>
          <button
            type="button"
            onClick={() => cameraInputRef.current.click()}
            disabled={loading}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-field px-4 text-field disabled:opacity-60"
          >
            <Camera size={18} aria-hidden="true" />
            Take a photo
          </button>
        </div>

        <p className="mt-4 text-sm">JPG or PNG, up to 5 MB.</p>

        {/* Hidden inputs, opened by the buttons above */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png"
          onChange={handleFile}
          className="hidden"
          aria-label="Choose a leaf photo from your device"
        />
        {/* On a phone this opens the camera. On a laptop it opens the file picker. */}
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFile}
          className="hidden"
          aria-label="Take a leaf photo with the camera"
        />
      </div>

      {error && (
        <p
          role="alert"
          className="mt-4 rounded-md border border-brick px-3 py-2 text-brick"
        >
          <span className="font-semibold">Error: </span>
          {error}
        </p>
      )}

      {loading ? (
        <p
          role="status"
          className="mt-6 flex items-center gap-2 text-field"
        >
          <Loader2 size={20} className="animate-spin" aria-hidden="true" />
          Checking the leaf, this may take a few seconds
        </p>
      ) : (
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!file}
          className="mt-6 min-h-11 w-full rounded-md bg-field px-4 text-paper disabled:opacity-50 sm:w-auto"
        >
          Check this leaf
        </button>
      )}
    </div>
  )
}
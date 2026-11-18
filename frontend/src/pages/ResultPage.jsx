import { useLocation, Link } from 'react-router-dom'
import { TriangleAlert } from 'lucide-react'
import { imageSrc } from '../api'

const NOTE =
  'This is decision support, not a final diagnosis. Please consult a local agricultural officer before applying any treatment.'

// Order and labels for the treatment groups
const TREATMENT_GROUPS = [
  { type: 'preventive', label: 'Preventive' },
  { type: 'organic', label: 'Organic' },
  { type: 'chemical', label: 'Chemical' },
]

// Show a probability (0 to 1) as a readable percentage
function percentText(p) {
  const value = p * 100
  if (value < 0.1) return 'less than 0.1%'
  return `${value.toFixed(1)}%`
}

// Small heading used for each section
function SectionTitle({ children }) {
  return (
    <h2 className="mt-6 font-serif text-xl font-semibold text-field">
      {children}
    </h2>
  )
}

export default function ResultPage() {
  const { state } = useLocation()
  const result = state?.result

  // Opened directly without a result (for example after a refresh)
  if (!result) {
    return (
      <div>
        <p>No result to show.</p>
        <Link
          to="/check"
          className="mt-4 inline-flex min-h-11 items-center rounded-md bg-field px-4 text-paper"
        >
          Check a leaf
        </Link>
      </div>
    )
  }

  const disease = result.disease
  // Treat a missing disease as uncertain too, so we never show empty sections
  const uncertain = result.uncertain || !disease

  return (
    <div>
      <h1 className="font-serif text-3xl font-semibold text-field">
        {uncertain ? 'We could not identify this reliably' : disease.name}
      </h1>

      <div className="mt-6 grid gap-8 md:grid-cols-2">
        {/* Left: the leaf photo */}
        <div>
          <img
            src={imageSrc(result.image_url)}
            alt="The leaf photo you checked"
            className="w-full rounded-md border border-sage"
          />
        </div>

        {/* Right: the answer */}
        <div>
          {uncertain ? (
            <div
              role="alert"
              className="rounded-md border border-harvest border-l-4 p-4"
            >
              <p className="flex items-center gap-2 font-semibold">
                <TriangleAlert
                  size={20}
                  className="text-harvest"
                  aria-hidden="true"
                />
                Not a reliable result
              </p>
              <p className="mt-2">
                {result.message ||
                  'Please retake a clear, close photo of a single rice leaf in good light.'}
              </p>
            </div>
          ) : (
            <>
              {/* Confidence bar: the number is always shown, not only the bar */}
              <p className="font-medium">
                Confidence: {result.confidence_percent}%
              </p>
              <div
                className="mt-1 h-3 w-full overflow-hidden rounded-md border border-sage"
                role="progressbar"
                aria-valuenow={result.confidence_percent}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Confidence"
              >
                <div
                  className="h-full bg-field"
                  style={{ width: `${result.confidence_percent}%` }}
                />
              </div>

              <SectionTitle>Symptoms</SectionTitle>
              <p className="mt-1">{disease.symptoms}</p>

              <SectionTitle>Cause</SectionTitle>
              <p className="mt-1">{disease.cause}</p>

              <SectionTitle>Treatment</SectionTitle>
              {TREATMENT_GROUPS.map((group) => {
                const items = disease.treatments.filter(
                  (t) => t.type === group.type,
                )
                if (items.length === 0) return null
                return (
                  <div key={group.type} className="mt-3">
                    <h3 className="font-semibold">{group.label}</h3>
                    <ul className="mt-1 list-disc space-y-1 pl-5">
                      {items.map((t, i) => (
                        <li key={i}>{t.recommendation}</li>
                      ))}
                    </ul>
                    {group.type === 'chemical' && (
                      <p className="mt-2 text-sm font-medium">
                        Confirm with your local agricultural officer before
                        using any chemical.
                      </p>
                    )}
                  </div>
                )
              })}
            </>
          )}

          {/* Top 3 possibilities, shown in both states */}
          {result.top3 && (
            <>
              <SectionTitle>Top 3 possibilities</SectionTitle>
              <ul className="mt-1 divide-y divide-sage border-y border-sage">
                {result.top3.map((item) => (
                  <li
                    key={item.disease}
                    className="flex justify-between gap-4 py-2"
                  >
                    <span>{item.disease}</span>
                    <span>{percentText(item.confidence)}</span>
                  </li>
                ))}
              </ul>
            </>
          )}

          {uncertain && (
            <Link
              to="/check"
              className="mt-6 inline-flex min-h-11 items-center rounded-md bg-field px-4 text-paper"
            >
              Try another photo
            </Link>
          )}
        </div>
      </div>

      {/* Always shown */}
      <p className="mt-8 border-t border-sage pt-4 text-sm">{NOTE}</p>

      {!uncertain && (
        <Link
          to="/check"
          className="mt-4 inline-flex min-h-11 items-center rounded-md border border-field px-4 text-field"
        >
          Check another leaf
        </Link>
      )}
    </div>
  )
}
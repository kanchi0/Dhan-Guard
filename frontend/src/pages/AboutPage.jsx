import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import api, { imageSrc } from '../api'

// Load every example photo from src/assets/examples (works with .jpg or .png)
const exampleFiles = import.meta.glob('../assets/examples/*', {
  eager: true,
  import: 'default',
})

// Find the photo for a class by its file name, for example "brown-spot"
function exampleSrc(slug) {
  const key = Object.keys(exampleFiles).find((k) => k.includes(`/${slug}.`))
  return key ? exampleFiles[key] : null
}

const EXAMPLES = [
  { name: 'Healthy Rice Leaf', slug: 'healthy-rice-leaf' },
  { name: 'Bacterial Leaf Blight', slug: 'bacterial-leaf-blight' },
  { name: 'Brown Spot', slug: 'brown-spot' },
  { name: 'Leaf Blast', slug: 'leaf-blast' },
  { name: 'Leaf scald', slug: 'leaf-scald' },
  { name: 'Narrow Brown Leaf Spot', slug: 'narrow-brown-leaf-spot' },
  { name: 'Rice Hispa', slug: 'rice-hispa' },
  { name: 'Sheath Blight', slug: 'sheath-blight' },
]

// Small heading used for each section
function SectionTitle({ children }) {
  return (
    <h2 className="mt-8 font-serif text-xl font-semibold text-field">
      {children}
    </h2>
  )
}

export default function AboutPage() {
  const [metrics, setMetrics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Load the model results once, when the page opens
  useEffect(() => {
    api
      .get('/metrics')
      .then((res) => setMetrics(res.data))
      .catch((err) => {
        if (!err.response) {
          setError('Cannot reach the server. Please check that the backend is running.')
        } else {
          setError('Could not load the model results. Please try again.')
        }
      })
      .finally(() => setLoading(false))
  }, [])

  // Sort the per-class table from best F1 to worst
  const perClass = metrics
    ? [...metrics.per_class].sort((a, b) => b.f1 - a.f1)
    : []

  // Only show the classes that have a photo
  const examples = EXAMPLES.map((e) => ({ ...e, src: exampleSrc(e.slug) })).filter(
    (e) => e.src,
  )

  return (
    <div>
      <h1 className="font-serif text-3xl font-semibold text-field">About</h1>

      <SectionTitle>How it works</SectionTitle>
      <p className="mt-2">
        You upload a photo of one rice leaf. A trained image model looks at the
        photo and predicts which of eight classes it most likely shows: seven
        diseases or a healthy leaf. The model only predicts the class.
      </p>
      <p className="mt-2">
        The symptoms, cause and treatment advice are not written by the model.
        They are looked up in a reference database for the predicted disease.
        This advice is general guidance and should be checked with a local
        agricultural officer.
      </p>

      {examples.length > 0 && (
        <>
          <SectionTitle>What the eight classes look like</SectionTitle>
          <p className="mt-2 text-sm">
            One example photo for each class. Real leaves vary a lot, so use
            these only as a rough guide.
          </p>
          <div className="mt-3 grid grid-cols-2 gap-4 md:grid-cols-4">
            {examples.map((e) => (
              <figure key={e.slug}>
                <img
                  src={e.src}
                  alt={`Example of ${e.name} on a rice leaf`}
                  loading="lazy"
                  className="aspect-square w-full rounded-md border border-sage object-cover"
                />
                <figcaption className="mt-1 text-sm">{e.name}</figcaption>
              </figure>
            ))}
          </div>
          <p className="mt-3 text-sm">
            Photos from the Rice Leaf Bacterial and Fungal Disease Dataset by
            Hasan, Khatun, Raihan and Uddin (2023), Mendeley Data, V2.
          </p>
        </>
      )}

      {loading && (
        <p role="status" className="mt-8 flex items-center gap-2 text-field">
          <Loader2 size={20} className="animate-spin" aria-hidden="true" />
          Loading model results
        </p>
      )}

      {error && (
        <p
          role="alert"
          className="mt-8 rounded-md border border-brick px-3 py-2 text-brick"
        >
          <span className="font-semibold">Error: </span>
          {error}
        </p>
      )}

      {metrics && (
        <>
          <SectionTitle>Test results</SectionTitle>
          <p className="mt-2">
            On {metrics.test_images} photos the model had never seen, it named
            the right class{' '}
            <span className="font-semibold">
              {metrics.test_accuracy_percent}%
            </span>{' '}
            of the time. That means about 1 in 5 answers can be wrong.
          </p>
          <p className="mt-2 text-sm">
            Macro F1: {Number(metrics.macro_f1).toFixed(2)}. Weighted F1:{' '}
            {Number(metrics.weighted_f1).toFixed(2)}. Model: {metrics.model}.
          </p>

          <SectionTitle>Results for each class</SectionTitle>
          <p className="mt-2 text-sm">
            F1 is a score from 0 to 1 that balances missed cases and false
            alarms. Higher is better.
          </p>
          <div className="mt-2 overflow-x-auto">
            <table className="w-full border-y border-sage text-left">
              <thead>
                <tr className="border-b border-sage text-sm">
                  <th className="py-2 pr-4 font-semibold">Class</th>
                  <th className="py-2 pr-4 font-semibold">F1</th>
                  <th className="py-2 font-semibold">Test photos</th>
                </tr>
              </thead>
              <tbody>
                {perClass.map((row) => (
                  <tr key={row.disease} className="border-b border-sage last:border-0">
                    <td className="py-2 pr-4">{row.disease}</td>
                    <td className="py-2 pr-4">{Number(row.f1).toFixed(2)}</td>
                    <td className="py-2">{row.test_images}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <SectionTitle>Confusion matrix</SectionTitle>
          <p className="mt-2 text-sm">
            Each row is the true class and each column is the model's answer.
            Numbers away from the diagonal are mistakes.
          </p>
          <img
            src={imageSrc(metrics.confusion_matrix_url)}
            alt="Confusion matrix of the model on the test photos"
            className="mt-2 w-full max-w-xl rounded-md border border-sage"
          />

          <SectionTitle>Limitations</SectionTitle>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {metrics.limitations.map((text, i) => (
              <li key={i}>{text}</li>
            ))}
          </ul>
        </>
      )}

      <SectionTitle>Data credit</SectionTitle>
      <p className="mt-2">
        The model was trained on the Rice Leaf Bacterial and Fungal Disease
        Dataset by Hasan, Khatun, Raihan and Uddin (2023), Mendeley Data, V2.
      </p>

      <p className="mt-8 border-t border-sage pt-4 text-sm">
        This is decision support, not a final diagnosis. Please consult a local
        agricultural officer before applying any treatment.
      </p>
    </div>
  )
}
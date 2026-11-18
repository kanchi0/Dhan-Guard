// Text wordmark with a small leaf-shaped mark drawn as inline SVG
export default function Logo() {
  return (
    <span className="inline-flex items-center gap-2">
      <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M4 20C4 10 10 4 20 4c0 10-6 16-16 16z"
          fill="#2F5D3A"
        />
        <path
          d="M4 20L14 10"
          stroke="#F6F4EC"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
      <span className="font-serif text-xl font-semibold text-field">
        DhanGuard
      </span>
    </span>
  )
}
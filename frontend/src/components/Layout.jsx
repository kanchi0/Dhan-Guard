import { Outlet, useLocation } from 'react-router-dom'
import Navbar from './Navbar'

// Every page sits inside this frame: navbar on top, content below
export default function Layout() {
  const { pathname } = useLocation()
  return (
    <>
      <Navbar />
      {/* The key makes the fade play again on every page change */}
      <main
        key={pathname}
        className="page-fade mx-auto max-w-[960px] px-4 py-8"
      >
        <Outlet />
      </main>
    </>
  )
}
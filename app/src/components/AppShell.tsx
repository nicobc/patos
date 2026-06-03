import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faListCheck } from '@fortawesome/free-solid-svg-icons'
import { UserMenu } from './UserMenu'
import './AppShell.css'

export function AppShell() {
  const navigate = useNavigate()

  return (
    <div className="shell">
      <header className="shell-header">
        <button className="shell-brand" onClick={() => navigate('/', { state: { reset: Date.now() } })}>
          <img src="/logo.svg" alt="Nido" className="shell-logo" />
          <span className="shell-brand-name">Nido</span>
        </button>
        <UserMenu />
      </header>

      <nav className="shell-sidebar">
        <NavLink to="/" end className={({ isActive }) => `shell-nav-item${isActive ? ' active' : ''}`}>
          <FontAwesomeIcon icon={faListCheck} />
          <span>Board</span>
        </NavLink>
      </nav>

      <div className="shell-content">
        <Outlet />
      </div>
    </div>
  )
}

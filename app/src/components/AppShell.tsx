import { NavLink, Outlet } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCoins, faListCheck } from '@fortawesome/free-solid-svg-icons'
import { UserMenu } from './UserMenu'
import './AppShell.css'

const navItems = [
  { to: '/', icon: faListCheck, label: 'Board', end: true },
  { to: '/costs', icon: faCoins, label: 'Costs', end: false },
]

function NavItems() {
  return (
    <>
      {navItems.map(({ to, icon, label, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) => `shell-nav-item${isActive ? ' active' : ''}`}
        >
          <FontAwesomeIcon icon={icon} />
          <span>{label}</span>
        </NavLink>
      ))}
    </>
  )
}

export function AppShell() {
  return (
    <div className="shell">
      <header className="shell-header">
        <div className="shell-brand">
          <img src="/logo.svg" alt="Nido" className="shell-logo" />
          <span className="shell-brand-name">Nido</span>
        </div>
        <UserMenu />
      </header>

      <nav className="shell-sidebar">
        <NavItems />
      </nav>

      <div className="shell-content">
        <Outlet />
      </div>

      <nav className="shell-bottom-nav">
        <NavItems />
      </nav>
    </div>
  )
}

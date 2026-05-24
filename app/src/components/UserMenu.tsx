import { useEffect, useRef, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChevronDown, faRightFromBracket } from '@fortawesome/free-solid-svg-icons'
import { useAuth } from '../context/useAuth'
import './UserMenu.css'

export function UserMenu() {
  const { session, signOut } = useAuth()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const fullName = session?.user.user_metadata?.full_name ?? session?.user.email ?? ''
  const name = fullName.split(' ')[0]

  useEffect(() => {
    if (!open) return
    function onOutside(e: MouseEvent | TouchEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onOutside)
    document.addEventListener('touchstart', onOutside)
    return () => {
      document.removeEventListener('mousedown', onOutside)
      document.removeEventListener('touchstart', onOutside)
    }
  }, [open])

  return (
    <div className="user-menu" ref={ref}>
      <button
        className="btn-ghost user-menu-trigger"
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
      >
        {name}
        <FontAwesomeIcon icon={faChevronDown} className={`user-menu-chevron${open ? ' open' : ''}`} />
      </button>

      {open && (
        <div className="user-menu-dropdown">
          <button className="btn-ghost user-menu-signout" onClick={signOut}>
            <FontAwesomeIcon icon={faRightFromBracket} />
            Sign out
          </button>
        </div>
      )}
    </div>
  )
}

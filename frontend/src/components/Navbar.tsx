import { useState, useEffect, useRef } from "react";
import styles from "./Navbar.module.css";
import { Link, useNavigate } from "react-router-dom";
// @ts-ignore
import perfilService from "../services/perfil.js";

interface NavbarProps {
  username?: string;
  staff?: number; // 1 = admin, otros = usuario normal
  userType?: number; // Alternate prop name for user type
  onMenuToggle?: (open: boolean) => void;
}

export default function Navbar({ username: propUsername, onMenuToggle }: NavbarProps) {
  const [open, setOpen] = useState(false);
  const [username, setUsername] = useState(propUsername || "Usuario");
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Fetch real user name from profile API
    const fetchUserName = async () => {
      if (!propUsername) {
        try {
          const perfil = await perfilService.getPerfil();
          if (perfil?.nombre_colaborador && perfil?.apellido_colaborador) {
            setUsername(`${perfil.nombre_colaborador} ${perfil.apellido_colaborador}`);
          } else {
            // Fallback to localStorage
            const user = localStorage.getItem('user');
            if (user) {
              try {
                const userData = JSON.parse(user);
                setUsername(userData.username || userData.usuario || "Usuario");
              } catch (e) {
                setUsername("Usuario");
              }
            }
          }
        } catch (err) {
          console.error('Error fetching user profile:', err);
          // Fallback to localStorage
          const user = localStorage.getItem('user');
          if (user) {
            try {
              const userData = JSON.parse(user);
              setUsername(userData.username || userData.usuario || "Usuario");
            } catch (e) {
              setUsername("Usuario");
            }
          }
        }
      }
    };

    fetchUserName();
  }, [propUsername]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    };

    if (userDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [userDropdownOpen]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
    setUserDropdownOpen(false);
  };

  const handleMenuToggle = () => {
    const newState = !open;
    setOpen(newState);
    if (onMenuToggle) onMenuToggle(newState);
  };

  const handleUserDropdownToggle = () => {
    setUserDropdownOpen(!userDropdownOpen);
  };

  return (
    <header className={styles.navbar}>
      <div className={styles.left}>
        <button
          className={styles.menuButton}
          onClick={handleMenuToggle}
          title="Menú"
        >
          ☰
        </button>
      </div>

      <div className={styles.branding}>
        <h1>LMS</h1>
      </div>

      <div className={styles.right}>
        <div className={styles.userMenu} ref={userMenuRef}>
          <button className={styles.userButton} onClick={handleUserDropdownToggle} title={username}>
            <span className={styles.userIcon}>👤</span>
            <span className={styles.userName}>{username}</span>
          </button>

          <div className={`${styles.dropdown} ${userDropdownOpen ? styles.dropdownOpen : ''}`}>
            <Link to="/perfil" onClick={() => setUserDropdownOpen(false)}>Mi Perfil</Link>
            <button onClick={handleLogout} className={styles.logoutBtn}>Cerrar sesión</button>
          </div>
        </div>
      </div>
    </header>
  );
}

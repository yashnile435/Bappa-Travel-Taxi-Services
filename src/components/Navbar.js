import React, { useState, useEffect } from 'react';
import './Navbar.css';
import logo from '../images/logo.jpg';
import { FaPhoneAlt, FaBars, FaTimes, FaUser, FaChevronDown, FaCalendarCheck, FaComments, FaSignOutAlt } from 'react-icons/fa';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [userFullName, setUserFullName] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const [navbarVisible, setNavbarVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(window.scrollY);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);

      const sections = ['cars', 'about', 'contact'];
      let currentSection = 'home';
      const scrollPosition = window.scrollY + window.innerHeight / 3;

      for (const sectionId of sections) {
        const section = document.getElementById(sectionId);
        if (section && scrollPosition >= section.offsetTop) {
          currentSection = sectionId;
        }
      }
      setActiveSection(currentSection);
    };

    if (location.pathname === '/') {
      window.addEventListener('scroll', handleScroll);
      handleScroll();
    } else {
      setActiveSection('');
      setIsScrolled(true);
    }
    return () => window.removeEventListener('scroll', handleScroll);
  }, [location.pathname]);

  useEffect(() => {
    let ticking = false;
    let lastY = window.scrollY;
    function handleScrollAutoHide() {
      if (window.innerWidth > 900 || location.pathname === '/') {
        setNavbarVisible(true);
        setLastScrollY(window.scrollY);
        return;
      }
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentY = window.scrollY;
          if (currentY < 0) return;
          if (currentY < lastY) {
            setNavbarVisible(true);
          } else if (currentY > lastY + 5) {
            setNavbarVisible(false);
          }
          lastY = currentY;
          setLastScrollY(currentY);
          ticking = false;
        });
        ticking = true;
      }
    }
    if (location.pathname !== '/') {
      window.addEventListener('scroll', handleScrollAutoHide);
    }
    return () => window.removeEventListener('scroll', handleScrollAutoHide);
  }, [location.pathname]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Fetch full name from Firestore
        const fetchName = async () => {
          const q = query(collection(db, 'users'), where('uid', '==', currentUser.uid));
          const snap = await getDocs(q);
          if (!snap.empty) {
            setUserFullName(snap.docs[0].data().name || '');
          } else {
            setUserFullName('');
          }
        };
        fetchName();
      } else {
        setUserFullName('');
      }
    });
    return () => unsubscribe();
  }, []);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const isLoginPage = location.pathname === '/login' || location.pathname === '/signup';

  const handleNavClick = (e, sectionId) => {
    if (location.pathname === '/') {
      e.preventDefault();
      document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
    }
    if(isMobileMenuOpen) {
      toggleMobileMenu();
    }
  };

  const handleDropdownToggle = () => setDropdownOpen((open) => !open);
  const handleDropdownClose = () => setDropdownOpen(false);

  const handleLogout = async () => {
    await signOut(auth);
    handleDropdownClose();
    navigate('/');
  };

  return (
    <>
      <nav className={`navbar${isScrolled ? ' scrolled' : ''}${navbarVisible ? '' : ' navbar-hidden'}`}>
        <div className="nav-container">
          <a href="/" className="nav-logo">
            <img src={logo} alt="Bappa travels taxi services" className="nav-logo-img" />
            <span>Bappa Travels</span>
          </a>

          <div className="nav-links">
            <Link to="/" className={`nav-link ${activeSection === 'home' ? 'active' : ''}`}>Home</Link>
            <a href="/#cars" onClick={(e) => handleNavClick(e, 'cars')} className={`nav-link ${activeSection === 'cars' ? 'active' : ''}`}>Cars</a>
            <a href="/#about" onClick={(e) => handleNavClick(e, 'about')} className={`nav-link ${activeSection === 'about' ? 'active' : ''}`}>About</a>
            <a href="/#contact" onClick={(e) => handleNavClick(e, 'contact')} className={`nav-link ${activeSection === 'contact' ? 'active' : ''}`}>Contact</a>
          </div>

          <div className="nav-buttons" style={{ position: 'relative' }}>
            {!isLoginPage && (
              user ? (
                <div style={{ position: 'relative', display: 'inline-block' }}>
                  <button className="nav-button profile-button" style={{marginRight: '10px', background: '#388e3c', color: '#fff', borderRadius: '6px'}} onClick={handleDropdownToggle}>
                    <FaUser style={{marginRight: '6px'}} /> {userFullName || user.displayName || user.email || 'Profile'} <FaChevronDown style={{marginLeft: '6px'}} />
                  </button>
                  {dropdownOpen && (
                    <div className="profile-dropdown" style={{ position: 'absolute', right: 0, top: '110%', background: '#fff', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.15)', minWidth: '180px', zIndex: 1000 }} onMouseLeave={handleDropdownClose}>
                      <Link to="/profile" className="dropdown-item" style={{ display: 'flex', alignItems: 'center', padding: '10px', color: '#388e3c', textDecoration: 'none', borderBottom: '1px solid #eee' }} onClick={handleDropdownClose}>
                        <FaUser style={{marginRight: '10px'}} /> My Profile
                      </Link>
                      <Link to="/my-bookings" className="dropdown-item" style={{ display: 'flex', alignItems: 'center', padding: '10px', color: '#388e3c', textDecoration: 'none', borderBottom: '1px solid #eee' }} onClick={handleDropdownClose}>
                        <FaCalendarCheck style={{marginRight: '10px'}} /> My Bookings
                      </Link>
                      <button className="dropdown-item" style={{ display: 'flex', alignItems: 'center', padding: '10px', color: 'red', background: 'none', border: 'none', width: '100%', textAlign: 'left' }} onClick={handleLogout}>
                        <FaSignOutAlt style={{marginRight: '10px'}} /> Logout
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link to="/login" className="nav-button login-button">
                  <FaUser /> Login
                </Link>
              )
            )}
            <a
              href="tel:+919011333966"
              className="nav-button call-button"
              aria-label="Call Bappa Travels now"
            >
              <FaPhoneAlt />Call Now 
            </a>
          </div>

          {/* Hamburger and Close Button for Mobile */}
          {!isMobileMenuOpen && (
            <button className="menu-button" onClick={toggleMobileMenu}>
              <FaBars />
            </button>
          )}
          {isMobileMenuOpen && (
            <button className="menu-button" onClick={toggleMobileMenu}>
              <FaTimes />
            </button>
          )}
        </div>
      </nav>

      {/* Mobile Navigation */}
      <div className={`mobile-nav ${isMobileMenuOpen ? 'active' : ''}`}>
        <div className="mobile-nav-header">
          <span className="mobile-company-name">Bappa Travels</span>
        </div>

        <div className="mobile-nav-links">
          <Link to="/" className={`mobile-nav-link ${activeSection === 'home' ? 'active' : ''}`} onClick={toggleMobileMenu}>Home</Link>
          <a href="/#cars" onClick={(e) => handleNavClick(e, 'cars')} className={`mobile-nav-link ${activeSection === 'cars' ? 'active' : ''}`}>Cars</a>
          <a href="/#about" onClick={(e) => handleNavClick(e, 'about')} className={`mobile-nav-link ${activeSection === 'about' ? 'active' : ''}`}>About</a>
          <a href="/#contact" onClick={(e) => handleNavClick(e, 'contact')} className={`mobile-nav-link ${activeSection === 'contact' ? 'active' : ''}`}>Contact</a>
        </div>

        <div className="mobile-nav-buttons" style={{ position: 'relative' }}>
          {!isLoginPage && (
            user ? (
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <button className="nav-button profile-button" style={{marginRight: '10px', background: '#388e3c', color: '#fff', borderRadius: '6px'}} onClick={handleDropdownToggle}>
                  <FaUser style={{marginRight: '6px'}} /> {userFullName || user.displayName || user.email || 'Profile'} <FaChevronDown style={{marginLeft: '6px'}} />
                </button>
                {dropdownOpen && (
                  <div className="profile-dropdown" style={{ position: 'absolute', right: 0, top: '110%', background: '#fff', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.15)', minWidth: '180px', zIndex: 1000 }} onMouseLeave={handleDropdownClose}>
                    <Link to="/profile" className="dropdown-item" style={{ display: 'flex', alignItems: 'center', padding: '10px', color: '#388e3c', textDecoration: 'none', borderBottom: '1px solid #eee' }} onClick={handleDropdownClose}>
                      <FaUser style={{marginRight: '10px'}} /> My Profile
                    </Link>
                    <Link to="/my-bookings" className="dropdown-item" style={{ display: 'flex', alignItems: 'center', padding: '10px', color: '#388e3c', textDecoration: 'none', borderBottom: '1px solid #eee' }} onClick={handleDropdownClose}>
                      <FaCalendarCheck style={{marginRight: '10px'}} /> My Bookings
                    </Link>
                    <button className="dropdown-item" style={{ display: 'flex', alignItems: 'center', padding: '10px', color: 'red', background: 'none', border: 'none', width: '100%', textAlign: 'left' }} onClick={handleLogout}>
                      <FaSignOutAlt style={{marginRight: '10px'}} /> Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login" className="nav-button login-button" onClick={toggleMobileMenu}>
                <FaUser /> Login
              </Link>
            )
          )}
          <a
            href="tel:+919011333966"
            className="nav-button call-button"
            aria-label="Call Bappa Travels now"
          >
            Call Now <FaPhoneAlt />
          </a>
        </div>
      </div>
    </>
  );
};

export default Navbar; 
import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import './AdminNavbar.css';
import { FaTachometerAlt, FaUsers, FaCar, FaCalendarCheck, FaUserCircle, FaSignOutAlt, FaBars, FaTimes, FaFileInvoice } from 'react-icons/fa';
import { getAuth, signOut } from 'firebase/auth';
import { db } from '../../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

const AdminNavbar = () => {
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);
    const [adminInfo, setAdminInfo] = useState(null);
    const [loading, setLoading] = useState(true);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuOpen && !event.target.closest('.admin-navbar')) {
                setMenuOpen(false);
            }
        };

        if (menuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('touchstart', handleClickOutside, { passive: true });
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, [menuOpen]);

    // Close menu on route change
    useEffect(() => {
        setMenuOpen(false);
    }, [navigate]);

    const toggleMenu = () => {
        setMenuOpen(prev => !prev);
    };

    const closeMenu = () => {
        setMenuOpen(false);
    };

    useEffect(() => {
        const fetchAdminInfo = async () => {
            try {
                const adminEmail = localStorage.getItem('adminEmail');
                if (adminEmail) {
                    const usersRef = collection(db, 'users');
                    const q = query(usersRef, where('email', '==', adminEmail));
                    const querySnapshot = await getDocs(q);
                    if (!querySnapshot.empty) {
                        const userData = querySnapshot.docs[0].data();
                        setAdminInfo({
                            name: userData.name || adminEmail,
                            email: adminEmail,
                            isMainAdmin: adminEmail === 'admin@bappatravels.com',
                            promotedAt: userData.promotedAt
                        });
                    }
                }
            } catch (error) {
                console.error('Error fetching admin info:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchAdminInfo();
    }, []);

    const handleLogout = async () => {
        localStorage.removeItem('isAdminLoggedIn');
        localStorage.removeItem('adminEmail');
        const auth = getAuth();
        try {
            await signOut(auth);
        } catch (error) {
            console.error('Error signing out:', error);
        }
        navigate('/login');
    };

    return (
        <nav className="admin-navbar">
            {/* Hamburger menu for mobile */}
            <button className="navbar-toggle" onClick={toggleMenu} aria-label="Toggle menu" aria-expanded={menuOpen}>
                {menuOpen ? <FaTimes /> : <FaBars />}
            </button>
            {/* Admin Info Card on the left */}
            {!loading && adminInfo && (
                <div className="admin-info-card">
                    <div className="admin-avatar-circle">
                        {adminInfo.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="admin-info-details">
                        <span className="admin-name">{adminInfo.name}</span>
                        <span className="admin-role">Admin</span>
                    </div>
                </div>
            )}
            {/* Navigation links and logout on the right */}
            <div className={`admin-navbar-links${menuOpen ? ' open' : ''}`}>  
                <NavLink to="/admin/dashboard" className="admin-nav-link" onClick={closeMenu}>
                    <FaTachometerAlt /> <span>Dashboard</span>
                </NavLink>
                <NavLink to="/admin/manage-users" className="admin-nav-link" onClick={closeMenu}>
                    <FaUsers /> <span>Manage Users</span>
                </NavLink>
                <NavLink to="/admin/manage-bookings" className="admin-nav-link" onClick={closeMenu}>
                    <FaCalendarCheck /> <span>Manage Bookings</span>
                </NavLink>
                <NavLink to="/admin/manage-cars" className="admin-nav-link" onClick={closeMenu}>
                    <FaCar /> <span>Manage Cars</span>
                </NavLink>
                <NavLink to="/admin/bill-generation" className="admin-nav-link" onClick={closeMenu}>
                    <FaFileInvoice /> <span>Bill Generation</span>
                </NavLink>
                <NavLink to="/admin/profile" className="admin-nav-link" onClick={closeMenu}>
                    <FaUserCircle /> <span>Profile</span>
                </NavLink>
                <button className="admin-logout-btn" onClick={handleLogout}>
                    <FaSignOutAlt />
                    <span>Logout</span>
                </button>
            </div>
            {/* Mobile backdrop for menu */}
            {menuOpen && <div className="admin-navbar-backdrop" onClick={closeMenu}></div>}
        </nav>
    );
};

export default AdminNavbar; 
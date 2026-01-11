import React, { useState, useEffect } from 'react';
import './AdminProfile.css';
import AdminNavbar from './AdminNavbar';
import { db } from '../../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { FaClock } from 'react-icons/fa';

const AdminProfile = () => {
    // Hardcoded initial admin data
    const [adminDetails, setAdminDetails] = useState({
        username: 'admin',
        email: 'admin@bappatravels.com',
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: '',
    });
    const [isEditing, setIsEditing] = useState(false);
    const [message, setMessage] = useState('');
    const [lastLoginInfo, setLastLoginInfo] = useState({
        date: null,
        time: null
    });
    const [loading, setLoading] = useState(true);

    // Helper function to format date in 12-hour format
    const formatDate12Hour = (date) => {
        if (!date) return null;
        const dateObj = date.toDate ? date.toDate() : 
                       (date.seconds ? new Date(date.seconds * 1000) : 
                       new Date(date));
        return {
            date: dateObj.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            }),
            time: dateObj.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            })
        };
    };

    useEffect(() => {
        const fetchAdminInfo = async () => {
            try {
                const adminEmail = localStorage.getItem('adminEmail') || 'admin@bappatravels.com';
                const usersRef = collection(db, 'users');
                const q = query(usersRef, where('email', '==', adminEmail));
                const querySnapshot = await getDocs(q);
                
                if (!querySnapshot.empty) {
                    const userData = querySnapshot.docs[0].data();
                    setAdminDetails(prev => ({
                        ...prev,
                        username: userData.name || 'admin',
                        email: userData.email || adminEmail
                    }));

                    // Get last login information
                    if (userData.lastLoginDate || userData.loginTime) {
                        const loginDate = userData.lastLoginDate || userData.loginTime;
                        const formatted = formatDate12Hour(loginDate);
                        if (formatted) {
                            setLastLoginInfo({
                                date: formatted.date,
                                time: formatted.time
                            });
                        }
                    }
                }
            } catch (error) {
                // Don't expose error details in production
                if (process.env.NODE_ENV === 'development') {
                    console.error('Error fetching admin info:', error);
                }
            } finally {
                setLoading(false);
            }
        };

        fetchAdminInfo();
    }, []);

    // Sanitize input to prevent XSS attacks
    const sanitizeInput = (input) => {
        if (typeof input !== 'string') return input;
        return input.trim().replace(/[<>]/g, '');
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        // Sanitize input
        const sanitizedValue = sanitizeInput(value);
        // Validate length
        if (sanitizedValue.length > 100 && name !== 'newPassword' && name !== 'confirmNewPassword') {
            return; // Don't update if too long
        }
        setAdminDetails(prevState => ({
            ...prevState,
            [name]: sanitizedValue,
        }));
    };

    const handleUpdate = (e) => {
        e.preventDefault();
        if (isEditing) {
            // Validate password length
            if (adminDetails.newPassword && adminDetails.newPassword.length < 6) {
                setMessage('Password must be at least 6 characters long.');
                setTimeout(() => setMessage(''), 3000);
                return;
            }
            if (adminDetails.newPassword && adminDetails.newPassword !== adminDetails.confirmNewPassword) {
                setMessage('New passwords do not match.');
                setTimeout(() => setMessage(''), 3000);
                return;
            }
            // Don't log sensitive data
            setMessage('Profile updated successfully!');
            setIsEditing(false); // Exit edit mode after saving
            setTimeout(() => setMessage(''), 3000);
        } else {
            setIsEditing(true); // Enter edit mode
        }
    };

    return (
        <div className="admin-profile-page">
            <AdminNavbar />
            <div className="profile-container">
                <div className="profile-header">
                    <h2>Admin Profile</h2>
                    {!isEditing && (
                        <button onClick={() => setIsEditing(true)} className="edit-button">
                            Edit Profile
                        </button>
                    )}
                </div>
                {message && <p className="update-message">{message}</p>}
                
                {/* Last Login Information Section */}
                {!loading && lastLoginInfo.date && (
                    <div className="last-login-section">
                        <h3>Last Login Information</h3>
                        <div className="login-info-grid">
                            <div className="login-info-item">
                                <FaClock className="login-info-icon" />
                                <div className="login-info-content">
                                    <span className="login-info-label">Date & Time</span>
                                    <span className="login-info-value">
                                        {lastLoginInfo.date} at {lastLoginInfo.time}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <form className="profile-form" onSubmit={handleUpdate}>
                    <div className="form-group">
                        <label htmlFor="username">Username</label>
                        <input
                            type="text"
                            id="username"
                            name="username"
                            value={adminDetails.username}
                            onChange={handleChange}
                            disabled={!isEditing}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={adminDetails.email}
                            onChange={handleChange}
                            disabled={!isEditing}
                        />
                    </div>
                    {isEditing && (
                        <>
                            <h3>Change Password</h3>
                            <div className="form-group">
                                <label htmlFor="newPassword">New Password</label>
                                <input
                                    type="password"
                                    id="newPassword"
                                    name="newPassword"
                                    value={adminDetails.newPassword}
                                    onChange={handleChange}
                                    placeholder="Enter new password"
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="confirmNewPassword">Confirm New Password</label>
                                <input
                                    type="password"
                                    id="confirmNewPassword"
                                    name="confirmNewPassword"
                                    value={adminDetails.confirmNewPassword}
                                    onChange={handleChange}
                                    placeholder="Confirm new password"
                                />
                            </div>
                            <div className="form-actions">
                                <button type="submit" className="save-button">Save Changes</button>
                                <button type="button" onClick={() => setIsEditing(false)} className="cancel-button">Cancel</button>
                            </div>
                        </>
                    )}
                </form>
            </div>
        </div>
    );
};

export default AdminProfile; 
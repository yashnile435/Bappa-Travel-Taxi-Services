import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './SignUp.css';
import logo from '../images/logo.jpg';
import { FaUser, FaEnvelope, FaPhoneAlt, FaLock, FaArrowRight, FaEye, FaEyeSlash } from 'react-icons/fa';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../firebase';

const SignUp = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        mobile: '',
        password: '',
        confirmPassword: '',
    });
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevState) => ({
            ...prevState,
            [name]: value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        try {
            // Check if email or mobile already exists
            const usersRef = collection(db, 'users');
            const emailQuery = query(usersRef, where('email', '==', formData.email));
            const mobileQuery = query(usersRef, where('mobile', '==', formData.mobile));
            const [emailSnap, mobileSnap] = await Promise.all([
                getDocs(emailQuery),
                getDocs(mobileQuery)
            ]);
            if (!emailSnap.empty) {
                setError('This email is already registered. Please log in or use a different email.');
                return;
            }
            if (!mobileSnap.empty) {
                setError('This mobile number is already registered. Please log in or use a different number.');
                return;
            }
            const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
            await addDoc(collection(db, 'users'), {
                uid: userCredential.user.uid,
                email: formData.email,
                name: formData.name,
                mobile: formData.mobile,
                loginTime: new Date(),
                createdAt: new Date(),
                signupMethod: 'manual',
                role: 'user', // Default role for new users
            });
            setError('');
            navigate('/login');
        } catch (err) {
            if (err.code === 'auth/email-already-in-use') {
                setError('This email is already registered. Please log in or use a different email.');
            } else {
                setError('Failed to register user. Please try again. ' + err.message);
            }
            console.error('Firestore error:', err);
        }
    };

    return (
        <div className="signup-page-container">
            <div className="signup-container">
                <div className="signup-info-panel">
                    <div className="signup-info-content">
                        <img src={logo} alt="Bappa Tours and Travels Logo" className="signup-page-logo" />
                        <h2>Bappa Travels</h2>
                        <p>Create an account to get started.</p>
                    </div>
                </div>
                <div className="signup-form-panel">
                    <div className="signup-form-box">
                        <h2>Sign Up</h2>
                        {error && <p className="error-message" style={{ color: 'red', textAlign: 'center' }}>{error}</p>}
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <div className="input-row">
                                    <FaUser className="input-icon" />
                                    <input type="text" name="name" placeholder="Full Name" value={formData.name} onChange={handleChange} required />
                                </div>
                            </div>
                            <div className="form-group">
                                <div className="input-row">
                                    <FaEnvelope className="input-icon" />
                                    <input type="email" name="email" placeholder="Email Address" value={formData.email} onChange={handleChange} required />
                                </div>
                            </div>
                            <div className="form-group">
                                <div className="input-row">
                                    <FaPhoneAlt className="input-icon" />
                                    <input type="tel" name="mobile" placeholder="Mobile Number" value={formData.mobile} onChange={handleChange} required />
                                </div>
                            </div>
                            <div className="form-group">
                                <div className="input-row input-password-wrapper">
                                    <FaLock className="input-icon" />
                                    <input type={showPassword ? "text" : "password"} name="password" placeholder="Password" value={formData.password} onChange={handleChange} required />
                                    <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                                    </button>
                                </div>
                            </div>
                            <div className="form-group">
                                <div className="input-row input-password-wrapper">
                                    <FaLock className="input-icon" />
                                    <input type={showConfirmPassword ? "text" : "password"} name="confirmPassword" placeholder="Confirm Password" value={formData.confirmPassword} onChange={handleChange} required />
                                    <button type="button" className="password-toggle" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                                        {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                                    </button>
                                </div>
                            </div>
                            <button type="submit" className="signup-button">
                                <FaArrowRight className="signup-button-icon" /> Sign Up
                            </button>
                        </form>
                        <p className="login-text">
                            Already have an account? <Link to="/login">Login</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SignUp; 
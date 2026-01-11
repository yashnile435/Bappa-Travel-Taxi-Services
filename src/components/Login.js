import React, { useState } from "react";
import './Login.css';
import logo from "../images/logo.jpg";
import { FiEye, FiEyeOff, FiUser, FiArrowRight, FiLock } from "react-icons/fi";
import { useNavigate, Link } from 'react-router-dom';
import { db, auth, googleProvider } from '../firebase';
import { collection, getDocs, query, where, addDoc, updateDoc, doc } from 'firebase/firestore';
import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';

const GoogleG = () => (
  <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true" focusable="false">
    <path fill="#FFC107" d="M43.611,20.083h-1.611V20H24v8h11.3c-1.649,4.657-6.08,8-11.3,8c-6.627,0-12-5.373-12-12 s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C32.701,6.053,28.561,4,24,4C12.955,4,4,12.955,4,24 s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
    <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.191,16.104,18.71,13,24,13c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657 C32.701,6.053,28.561,4,24,4C16.318,4,9.656,8.386,6.306,14.691z"/>
    <path fill="#4CAF50" d="M24,44c5.171,0,9.86-1.977,13.409-5.197l-6.199-5.214 C29.702,35.091,26.955,36,24,36c-5.199,0-9.616-3.317-11.277-7.958l-6.543,5.037C9.455,39.556,16.138,44,24,44z"/>
    <path fill="#1976D2" d="M43.611,20.083h-1.611V20H24v8h11.3c-0.792,2.237-2.235,4.151-4.09,5.589l0.002-0.001l6.199,5.214 C35.13,39.541,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
  </svg>
);

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    identifier: "",
    password: "",
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  // Sanitize input to prevent XSS attacks
  const sanitizeInput = (input) => {
    if (typeof input !== 'string') return input;
    return input.trim().replace(/[<>]/g, '');
  };

  // Get device information
  const getDeviceInfo = () => {
    const userAgent = navigator.userAgent;
    let browser = 'Unknown';
    let os = 'Unknown';
    let deviceType = 'Desktop';

    // Detect Browser
    if (userAgent.indexOf('Firefox') > -1) {
      browser = 'Firefox';
    } else if (userAgent.indexOf('Chrome') > -1) {
      browser = 'Chrome';
    } else if (userAgent.indexOf('Safari') > -1) {
      browser = 'Safari';
    } else if (userAgent.indexOf('Edge') > -1) {
      browser = 'Edge';
    } else if (userAgent.indexOf('Opera') > -1 || userAgent.indexOf('OPR') > -1) {
      browser = 'Opera';
    }

    // Detect OS
    if (userAgent.indexOf('Win') > -1) {
      os = 'Windows';
    } else if (userAgent.indexOf('Mac') > -1) {
      os = 'MacOS';
    } else if (userAgent.indexOf('Linux') > -1) {
      os = 'Linux';
    } else if (userAgent.indexOf('Android') > -1) {
      os = 'Android';
    } else if (userAgent.indexOf('iOS') > -1 || userAgent.indexOf('iPhone') > -1 || userAgent.indexOf('iPad') > -1) {
      os = 'iOS';
    }

    // Detect Device Type
    if (/Mobile|Android|iPhone|iPad|iPod/i.test(userAgent)) {
      deviceType = 'Mobile';
    } else if (/Tablet|iPad/i.test(userAgent)) {
      deviceType = 'Tablet';
    }

    return {
      browser,
      os,
      deviceType,
      fullInfo: `${browser} on ${os} (${deviceType})`
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Sanitize inputs
    const identifier = sanitizeInput(formData.identifier);
    const password = formData.password; // Password doesn't need sanitization for display
    setError('');

    // Validate input
    if (!identifier || !password) {
      setError('Please fill in all fields.');
      return;
    }

    // Additional validation
    if (identifier.length > 100 || password.length > 100) {
      setError('Invalid input length.');
      return;
    }

    let userEmail = '';
    let userQuery;
    if (/^\d{10}$/.test(identifier)) {
      userQuery = query(collection(db, 'users'), where('mobile', '==', identifier));
    } else {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(identifier)) {
        setError('Please enter a valid email address or mobile number.');
        return;
      }
      userQuery = query(collection(db, 'users'), where('email', '==', identifier));
    }
    const querySnapshot = await getDocs(userQuery);
    if (!querySnapshot.empty) {
      const userDoc = querySnapshot.docs[0];
      userEmail = userDoc.data().email;
      try {
        await signInWithEmailAndPassword(auth, userEmail, password);
        localStorage.setItem('loginTimestamp', Date.now());
        const userRef = doc(db, 'users', userDoc.id);
        const deviceInfo = getDeviceInfo();
        const loginData = {
          loginTime: new Date(),
          lastLoginDate: new Date(),
          lastLoginDevice: deviceInfo.fullInfo,
          lastLoginBrowser: deviceInfo.browser,
          lastLoginOS: deviceInfo.os,
          lastLoginDeviceType: deviceInfo.deviceType
        };
        await updateDoc(userRef, loginData);
        const userData = userDoc.data();
        if (userData.role === 'admin') {
          localStorage.setItem('isAdminLoggedIn', 'true');
          localStorage.setItem('adminEmail', userEmail);
          if (userEmail !== 'admin@bappatravels.com') {
            alert(`Welcome back, ${userData.name || userEmail}! You have admin privileges.`);
          }
          navigate('/admin');
        } else {
          localStorage.removeItem('isAdminLoggedIn');
          localStorage.removeItem('adminEmail');
          navigate('/');
        }
        return;
      } catch (err) {
        // Don't expose specific error details for security
        setError('Invalid credentials. Please check your email/mobile and password.');
        return;
      }
    } else {
      setError('No user found with this email or mobile number.');
      return;
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('uid', '==', user.uid));
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        await addDoc(usersRef, {
          uid: user.uid,
          email: user.email || '',
          name: (user.displayName || '').substring(0, 100), // Limit length
          mobile: '',
          loginTime: new Date(),
          lastLoginDate: new Date(),
          createdAt: new Date(),
          signupMethod: 'google',
          role: 'user',
        });
      } else {
        const userDoc = querySnapshot.docs[0];
        const userData = userDoc.data();
        const userRef = doc(db, 'users', userDoc.id);
        const deviceInfo = getDeviceInfo();
        await updateDoc(userRef, {
          loginTime: new Date(),
          lastLoginDate: new Date(),
          lastLoginDevice: deviceInfo.fullInfo,
          lastLoginBrowser: deviceInfo.browser,
          lastLoginOS: deviceInfo.os,
          lastLoginDeviceType: deviceInfo.deviceType
        });
        if (userData.role === 'admin') {
          localStorage.setItem('isAdminLoggedIn', 'true');
          localStorage.setItem('adminEmail', user.email);
          if (user.email !== 'admin@bappatravels.com') {
            alert(`Welcome back, ${userData.name || user.email}! You have admin privileges.`);
          }
          navigate('/admin');
          return;
        }
      }
      localStorage.setItem('loginTimestamp', Date.now());
      localStorage.removeItem('isAdminLoggedIn');
      localStorage.removeItem('adminEmail');
      navigate('/');
    } catch (err) {
      // Don't expose specific error details for security
      setError('Google login failed. Please try again.');
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="login-page-container">
      <div className="login-container">
        <div className="login-info-panel">
          <div className="login-info-content">
            <img src={logo} alt="Bappa Tours and Travels Logo" className="login-page-logo" />
            <h2>Bappa Travels</h2>
            <p>Your Trusted Travel Partner</p>
          </div>
        </div>
        <div className="login-form-panel">
          <div className="login-form-box">
            <h2>Login</h2>
            {error && <p className="error-message" style={{color: 'red', textAlign: 'center'}}>{error}</p>}
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <div className="input-row">
                  <FiUser className="input-icon" />
                  <input
                    type="text"
                    name="identifier"
                    placeholder="Email or Mobile Number"
                    value={formData.identifier}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <div className="input-row input-password-wrapper">
                  <FiLock className="input-icon" />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={togglePasswordVisibility}
                  >
                    {showPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
              </div>
              <button type="submit" className="login-button">
                 Login <FiArrowRight className="login-button-icon" /> 
              </button>
            </form>
            <button onClick={handleGoogleLogin} className="login-button google-signin-button" type="button">
              <span className="google-icon-wrapper"><GoogleG /></span>
              <span className="google-btn-text">Sign in with Google</span>
            </button>
            <p className="signup-text">
              Don't have an account? <Link to="/signup"> Sign Up</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

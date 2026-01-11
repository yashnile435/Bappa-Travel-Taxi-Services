// Security Utility Functions

// Email Validation
export const validateEmail = (email) => {
  const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
  return emailRegex.test(email) && email.length <= 100;
};

// Mobile Validation (10 digits)
export const validateMobile = (mobile) => {
  const mobileRegex = /^[0-9]{10}$/;
  return mobileRegex.test(mobile);
};

// Password Strength Validation
// Minimum 8 characters, at least one uppercase, one lowercase, one number
export const validatePassword = (password) => {
  if (!password || password.length < 8 || password.length > 50) {
    return {
      isValid: false,
      message: 'Password must be 8-50 characters long'
    };
  }
  
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  
  if (!hasUpperCase) {
    return {
      isValid: false,
      message: 'Password must contain at least one uppercase letter'
    };
  }
  
  if (!hasLowerCase) {
    return {
      isValid: false,
      message: 'Password must contain at least one lowercase letter'
    };
  }
  
  if (!hasNumber) {
    return {
      isValid: false,
      message: 'Password must contain at least one number'
    };
  }
  
  return {
    isValid: true,
    message: 'Password is strong'
  };
};

// XSS Prevention - Sanitize Input
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  return input
    .trim()
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '');
};

// Rate Limiting for Login Attempts
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_TIME = 15 * 60 * 1000; // 15 minutes

export const checkLoginAttempts = (identifier) => {
  const attempts = JSON.parse(localStorage.getItem('loginAttempts') || '{}');
  const userAttempts = attempts[identifier] || { count: 0, timestamp: Date.now() };
  
  // Reset if lockout time has passed
  if (Date.now() - userAttempts.timestamp > LOCKOUT_TIME) {
    userAttempts.count = 0;
    userAttempts.timestamp = Date.now();
  }
  
  if (userAttempts.count >= MAX_LOGIN_ATTEMPTS) {
    const remainingTime = Math.ceil((LOCKOUT_TIME - (Date.now() - userAttempts.timestamp)) / 60000);
    return {
      allowed: false,
      message: `Too many login attempts. Please try again in ${remainingTime} minutes.`
    };
  }
  
  return {
    allowed: true,
    attempts: userAttempts
  };
};

export const recordLoginAttempt = (identifier, success) => {
  const attempts = JSON.parse(localStorage.getItem('loginAttempts') || '{}');
  
  if (success) {
    // Clear attempts on successful login
    delete attempts[identifier];
  } else {
    // Increment failed attempts
    const userAttempts = attempts[identifier] || { count: 0, timestamp: Date.now() };
    userAttempts.count += 1;
    userAttempts.timestamp = Date.now();
    attempts[identifier] = userAttempts;
  }
  
  localStorage.setItem('loginAttempts', JSON.stringify(attempts));
};

// Session Management
const SESSION_TIMEOUT = 60 * 60 * 1000; // 1 hour

export const checkSessionTimeout = () => {
  const lastActivity = localStorage.getItem('lastActivity');
  if (lastActivity && Date.now() - parseInt(lastActivity) > SESSION_TIMEOUT) {
    return {
      expired: true,
      message: 'Session expired. Please login again.'
    };
  }
  return {
    expired: false
  };
};

export const updateLastActivity = () => {
  localStorage.setItem('lastActivity', Date.now().toString());
};

export const initializeSession = () => {
  updateLastActivity();
  
  // Update activity on user interaction
  const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
  events.forEach(event => {
    document.addEventListener(event, updateLastActivity, { passive: true });
  });
};

// HTTPS Enforcement (for production)
export const enforceHTTPS = () => {
  if (process.env.NODE_ENV === 'production' && window.location.protocol !== 'https:') {
    window.location.href = 'https:' + window.location.href.substring(window.location.protocol.length);
  }
};

// Secure Local Storage
export const secureSetItem = (key, value) => {
  try {
    const data = typeof value === 'string' ? value : JSON.stringify(value);
    localStorage.setItem(key, data);
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
};

export const secureGetItem = (key, defaultValue = null) => {
  try {
    const item = localStorage.getItem(key);
    if (!item) return defaultValue;
    
    try {
      return JSON.parse(item);
    } catch {
      return item;
    }
  } catch (error) {
    console.error('Error reading from localStorage:', error);
    return defaultValue;
  }
};

// Input Length Validation
export const validateLength = (input, minLength, maxLength, fieldName) => {
  if (!input || input.length < minLength) {
    return {
      isValid: false,
      message: `${fieldName} must be at least ${minLength} characters`
    };
  }
  
  if (input.length > maxLength) {
    return {
      isValid: false,
      message: `${fieldName} must not exceed ${maxLength} characters`
    };
  }
  
  return {
    isValid: true
  };
};

// Prevent SQL Injection (though Firebase handles this)
export const preventSQLInjection = (input) => {
  const sqlKeywords = ['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'DROP', 'CREATE', 'ALTER', 'EXEC', 'UNION', '--', ';'];
  const upperInput = input.toUpperCase();
  
  for (const keyword of sqlKeywords) {
    if (upperInput.includes(keyword)) {
      return {
        safe: false,
        message: 'Invalid input detected'
      };
    }
  }
  
  return {
    safe: true
  };
};

// Generate secure random token
export const generateSecureToken = (length = 32) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  const array = new Uint8Array(length);
  window.crypto.getRandomValues(array);
  
  for (let i = 0; i < length; i++) {
    token += chars[array[i] % chars.length];
  }
  
  return token;
};

// Validate file upload (if needed)
export const validateFileUpload = (file, maxSize = 5 * 1024 * 1024, allowedTypes = ['image/jpeg', 'image/png', 'image/jpg']) => {
  if (!file) {
    return {
      isValid: false,
      message: 'No file selected'
    };
  }
  
  if (file.size > maxSize) {
    return {
      isValid: false,
      message: `File size must not exceed ${maxSize / (1024 * 1024)}MB`
    };
  }
  
  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      message: `File type must be one of: ${allowedTypes.join(', ')}`
    };
  }
  
  return {
    isValid: true
  };
};

export default {
  validateEmail,
  validateMobile,
  validatePassword,
  sanitizeInput,
  checkLoginAttempts,
  recordLoginAttempt,
  checkSessionTimeout,
  updateLastActivity,
  initializeSession,
  enforceHTTPS,
  secureSetItem,
  secureGetItem,
  validateLength,
  preventSQLInjection,
  generateSecureToken,
  validateFileUpload
};

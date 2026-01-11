import React, { useEffect, useState, Suspense, lazy } from "react";
import "./App.css";
import Navbar from "./components/Navbar";
import About from "./components/About";
import Footer from "./components/Footer";
import Loading, { MinimalLoading } from "./components/Loading";
import Login from "./components/Login";
import SignUp from "./components/SignUp";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
import { auth } from "./firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";

// Lazy load components to reduce initial bundle size
const CarList = lazy(() => import("./components/CarList"));
const AdminDashboard = lazy(() => import("./components/Admin/AdminDashboard"));
const AdminProfile = lazy(() => import("./components/Admin/AdminProfile"));
const ManageCars = lazy(() => import("./components/Admin/ManageCars"));
const ManageUsers = lazy(() => import("./components/Admin/ManageUsers"));
const ManageBookings = lazy(() => import("./components/Admin/ManageBookings"));
const BillGeneration = lazy(() => import("./components/Admin/BillGeneration"));
const BookingForm = lazy(() => import("./components/BookingForm"));
const UserProfile = lazy(() => import("./components/UserProfile"));
const UserBookings = lazy(() => import("./components/UserBookings"));
const ChangePassword = lazy(() => import("./components/Admin/ChangePassword"));

const ProtectedRoute = ({ children }) => {
  const isAdminLoggedIn = localStorage.getItem("isAdminLoggedIn");
  if (!isAdminLoggedIn) {
    return <Navigate to="/login" />;
  }
  return children;
};

// Simple loading fallback for lazy components
const LoadingFallback = () => (
  <div style={{ 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    height: '200px',
    fontSize: '16px',
    color: '#666'
  }}>
    Loading...
  </div>
);

function App() {
  const [authChecked, setAuthChecked] = useState(false);
  const [showInitialLoading, setShowInitialLoading] = useState(true);
  const [homepageReady, setHomepageReady] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        const loginTimestamp = localStorage.getItem('loginTimestamp');
        if (loginTimestamp) {
          const now = Date.now();
          const hours24 = 24 * 60 * 60 * 1000;
          if (now - loginTimestamp > hours24) {
            // More than 24 hours passed, log out
            signOut(auth);
            localStorage.removeItem('loginTimestamp');
            localStorage.removeItem('isAdminLoggedIn');
            localStorage.removeItem('adminEmail');
          }
        }
      } else {
        // User is logged out, clear timestamp
        localStorage.removeItem('loginTimestamp');
        localStorage.removeItem('isAdminLoggedIn');
        localStorage.removeItem('adminEmail');
      }
      setAuthChecked(true); // Auth state has been checked
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (authChecked) {
      // Reduced loading time from 3 seconds to 1.5 seconds for faster homepage
      const timer = setTimeout(() => {
        setShowInitialLoading(false);
        // Set homepage as ready after a short delay to ensure smooth transition
        setTimeout(() => setHomepageReady(true), 100);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [authChecked]);

  if (!authChecked || showInitialLoading) {
    // Only show the full loading screen for the homepage
    if (window.location.pathname === "/") {
      return <Loading />;
    } else {
      return <MinimalLoading />;
    }
  }

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            <div className="App">
              <Navbar />
              <div id="cars">
                {/* No Suspense fallback for homepage after initial load */}
                <CarList />
              </div>
              <div id="about">
                <About />
              </div>
              <div id="contact">
                <Footer />
              </div>
            </div>
          }
        />
        {/* All other routes use MinimalLoading as Suspense fallback */}
        <Route path="/login" element={<><Navbar /><Login /></>} />
        <Route path="/signup" element={<><Navbar /><SignUp /></>} />
        <Route path="/admin" element={<ProtectedRoute><Suspense fallback={<MinimalLoading />}><Navigate to="/admin/dashboard" replace /></Suspense></ProtectedRoute>} />
        <Route path="/admin/dashboard" element={<ProtectedRoute><Suspense fallback={<MinimalLoading />}><AdminDashboard /></Suspense></ProtectedRoute>} />
        <Route path="/admin/profile" element={<ProtectedRoute><Suspense fallback={<MinimalLoading />}><AdminProfile /></Suspense></ProtectedRoute>} />
        <Route path="/admin/manage-cars" element={<ProtectedRoute><Suspense fallback={<MinimalLoading />}><ManageCars /></Suspense></ProtectedRoute>} />
        <Route path="/admin/manage-users" element={<ProtectedRoute><Suspense fallback={<MinimalLoading />}><ManageUsers /></Suspense></ProtectedRoute>} />
        <Route path="/admin/manage-bookings" element={<ProtectedRoute><Suspense fallback={<MinimalLoading />}><ManageBookings /></Suspense></ProtectedRoute>} />
        <Route path="/admin/bill-generation" element={<ProtectedRoute><Suspense fallback={<MinimalLoading />}><BillGeneration /></Suspense></ProtectedRoute>} />
        <Route path="/book-car" element={<Suspense fallback={<MinimalLoading />}><BookingForm /></Suspense>} />
        <Route path="/profile" element={<Suspense fallback={<MinimalLoading />}><UserProfile /></Suspense>} />
        <Route path="/bookings" element={<Suspense fallback={<MinimalLoading />}><UserBookings /></Suspense>} />
        <Route path="/my-bookings" element={<Suspense fallback={<MinimalLoading />}><UserBookings /></Suspense>} />
        <Route path="/admin/change-password" element={<ProtectedRoute><Suspense fallback={<MinimalLoading />}><ChangePassword /></Suspense></ProtectedRoute>} />
      </Routes>
    </Router>
  );
}

export default App;

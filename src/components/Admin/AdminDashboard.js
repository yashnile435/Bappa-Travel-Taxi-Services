import React, { useEffect, useState } from "react";
import AdminNavbar from "./AdminNavbar";
import { db } from "../../firebase";
import {
  collection,
  getDocs,
} from "firebase/firestore";
import "./AdminDashboard.css";
import {
  FaUsers,
  FaCar,
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
  FaFileInvoice,
} from "react-icons/fa";

const AdminDashboard = () => {
  const [totalUsers, setTotalUsers] = useState(0);
  const [completedBookings, setCompletedBookings] = useState(0);
  const [pendingBookings, setPendingBookings] = useState(0);
  const [availableCars, setAvailableCars] = useState(0);
  const [unavailableCars, setUnavailableCars] = useState(0);
  const [totalBills, setTotalBills] = useState(0);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      // Bookings
      const bookingsCol = collection(db, "bookings");
      const bookingsSnap = await getDocs(bookingsCol);
      let completed = 0,
        pending = 0;
      bookingsSnap.forEach((doc) => {
        const status = doc.data().status;
        if (status === "pending") pending++;
        else if (status === "accepted" || status === "completed") completed++;
      });
      setCompletedBookings(completed);
      setPendingBookings(pending);
      // Users
      const usersCol = collection(db, "users");
      const usersSnap = await getDocs(usersCol);
      setTotalUsers(usersSnap.size);
      // Cars
      const carsCol = collection(db, "carlist");
      const carsSnap = await getDocs(carsCol);
      let available = 0,
        unavailable = 0;
      carsSnap.forEach((doc) => {
        const status = doc.data().status;
        if (status === "available") available++;
        else unavailable++;
      });
      setAvailableCars(available);
      setUnavailableCars(unavailable);
      // Bills
      const billsCol = collection(db, "bills");
      const billsSnap = await getDocs(billsCol);
      setTotalBills(billsSnap.size);
      setLoadingStats(false);
    };
    fetchStats();
  }, []);

  return (
    <>
      <AdminNavbar />
      <div className="admin-dashboard">
        <div className="dashboard-stats">
          <div className="stat-card">
            <FaUsers className="stat-icon users" />
            <div className="stat-info">
              <h2>{loadingStats ? "..." : totalUsers}</h2>
              <span>Total Users</span>
            </div>
          </div>
          <div className="stat-card">
            <FaCheckCircle
              className="stat-icon bookings"
              style={{ color: "#388e3c" }}
            />
            <div className="stat-info">
              <h2>{loadingStats ? "..." : completedBookings}</h2>
              <span>Completed Bookings</span>
            </div>
          </div>
          <div className="stat-card">
            <FaClock
              className="stat-icon revenue"
              style={{ color: "#fbc02d" }}
            />
            <div className="stat-info">
              <h2>{loadingStats ? "..." : pendingBookings}</h2>
              <span>Pending Bookings</span>
            </div>
          </div>
          <div className="stat-card">
            <FaCar className="stat-icon users" style={{ color: "#1976d2" }} />
            <div className="stat-info">
              <h2>{loadingStats ? "..." : availableCars}</h2>
              <span>Available Cars</span>
            </div>
          </div>
          <div className="stat-card">
            <FaTimesCircle
              className="stat-icon bookings"
              style={{ color: "#d32f2f" }}
            />
            <div className="stat-info">
              <h2>{loadingStats ? "..." : unavailableCars}</h2>
              <span>Unavailable Cars</span>
            </div>
          </div>
          <div className="stat-card stat-card-bills">
            <FaFileInvoice className="stat-icon bills-icon" />
            <div className="stat-info">
              <h2>{loadingStats ? "..." : totalBills}</h2>
              <span>Total Bills Generated</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminDashboard;

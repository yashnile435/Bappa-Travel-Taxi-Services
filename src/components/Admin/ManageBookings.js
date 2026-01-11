import React, { useEffect, useState } from 'react';
import AdminNavbar from './AdminNavbar';
import { db } from '../../firebase';
import { collection, getDocs, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { FaCar, FaUser, FaMapMarkerAlt, FaCalendarAlt, FaCheck, FaTimes, FaUserCheck, FaRegEdit, FaQuestionCircle } from 'react-icons/fa';
import './ManageUsers.css';
import ReactModal from 'react-modal';

// Helper function to format date in 12-hour format
const formatDate12Hour = (date) => {
  if (!date) return '-';
  
  const dateObj = date.toDate ? date.toDate() : 
                  (date.seconds ? new Date(date.seconds * 1000) : 
                  new Date(date));
  
  return dateObj.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

// Helper function to format time only in 12-hour format
const formatTime12Hour = (date) => {
  if (!date) return '-';
  
  const dateObj = date.toDate ? date.toDate() : 
                  (date.seconds ? new Date(date.seconds * 1000) : 
                  new Date(date));
  
  return dateObj.toLocaleString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

const sendWhatsAppMessage = (mobile, message) => {
  if (!mobile) return;
  const phone = mobile.replace(/\D/g, '');
  const url = `https://wa.me/91${phone}?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank');
};

const ManageBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectBooking, setRejectBooking] = useState(null);
  const [showAcceptDialog, setShowAcceptDialog] = useState(false);
  const [acceptBooking, setAcceptBooking] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteBooking, setDeleteBooking] = useState(null);

  // Move fetchBookings outside useEffect
  const fetchBookings = async () => {
    const bookingsCol = collection(db, 'bookings');
    const snapshot = await getDocs(bookingsCol);
    const bookingsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Sort bookings by creation date (newest first)
    const sortedBookings = bookingsData.sort((a, b) => {
      const dateA = a.createdAt && a.createdAt.toDate ? a.createdAt.toDate() : 
                   (a.createdAt && a.createdAt.seconds ? new Date(a.createdAt.seconds * 1000) : 
                   (a.createdAt ? new Date(a.createdAt) : new Date(0)));
      const dateB = b.createdAt && b.createdAt.toDate ? b.createdAt.toDate() : 
                   (b.createdAt && b.createdAt.seconds ? new Date(b.createdAt.seconds * 1000) : 
                   (b.createdAt ? new Date(b.createdAt) : new Date(0)));
      
      return dateB - dateA; // Newest first
    });
    
    setBookings(sortedBookings);
    setLoading(false);
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleStatus = async (id, status, mobile, booking) => {
    setUpdating(id + status);
    setErrorMessage('');

    // Try to send email, but do not block status update on failure
    try {
      const emailRes = await fetch('https://us-central1-bappatravels-8fa47.cloudfunctions.net/sendEmail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...booking,
          status,
          reason: status === 'rejected' ? rejectReason : ''
        })
      });
      if (!emailRes.ok) {
        setErrorMessage('Email notification failed, but status was updated.');
      }
    } catch (err) {
      setErrorMessage('Email notification failed, but status was updated.');
    }

    // Always update Firestore status regardless of email result
    try {
      await updateDoc(doc(db, 'bookings', id), { status, rejectReason: status === 'rejected' ? rejectReason : '' });
      setBookings(bookings.map(b => b.id === id ? { ...b, status, rejectReason: status === 'rejected' ? rejectReason : '' } : b));
      setShowRejectDialog(false);
      setRejectReason('');
      setRejectBooking(null);
      setShowAcceptDialog(false);
      setAcceptBooking(null);
    } catch (err) {
      setErrorMessage('Failed to update booking status. Please try again.');
    } finally {
      setUpdating(null);
    }
  };

  const handleRejectClick = (booking) => {
    setRejectBooking(booking);
    setShowRejectDialog(true);
    setRejectReason('');
  };

  const handleAcceptClick = (booking) => {
    setAcceptBooking(booking);
    setShowAcceptDialog(true);
  };

  const handleDeleteClick = (booking) => {
    setDeleteBooking(booking);
    setShowDeleteDialog(true);
  };

  const handleDeleteBooking = async () => {
    if (!deleteBooking) return;
    try {
      await deleteDoc(doc(db, 'bookings', deleteBooking.id));
      setBookings(bookings.filter(b => b.id !== deleteBooking.id));
      setShowDeleteDialog(false);
      setDeleteBooking(null);
    } catch (error) {
      console.error('Error deleting booking:', error);
    }
  };

  return (
    <>
      <AdminNavbar />
      <div className="manage-bookings-container">
        <h2 className="manage-bookings-header">Manage Bookings</h2>
        {errorMessage && (
          <div className="manage-bookings-error">{errorMessage}</div>
        )}
        {loading ? (
          <div className="manage-bookings-loading">Loading bookings...</div>
        ) : bookings.length === 0 ? (
          <div className="manage-bookings-empty">No bookings found.</div>
        ) : (
          <div className="booking-card-grid">
            {bookings.map(booking => {
              const date = booking.createdAt;
              const isAccount = !!booking.uid;
              return (
                <div key={booking.id} className="booking-card">
                  {/* Status badge */}
                  <span className={`booking-status-badge ${booking.status || 'pending'}`}>
                    {booking.status ? booking.status.charAt(0).toUpperCase() + booking.status.slice(1) : 'Pending'}
                  </span>
                  {/* User info */}
                  <div className="booking-user-info">
                    <FaUser className="booking-user-icon" />
                    <div>
                      <div className="booking-user-name">{booking.fullName || '-'}</div>
                      <div className="booking-user-mobile">{booking.mobileNumber || '-'}</div>
                    </div>
                  </div>
                  {/* Booking details */}
                  <div className="booking-detail"><FaCar className="booking-detail-icon" /> {booking.selectedCar || '-'}</div>
                  <div className="booking-detail"><FaMapMarkerAlt className="booking-detail-icon" /> {booking.pickupLocation || '-'} → {booking.dropoffLocation || '-'}</div>
                  <div className="booking-detail"><FaCalendarAlt className="booking-detail-icon" /> {booking.pickupDate || '-'} {(() => { const t=String(booking.pickupTime||'').split(':'); if(!t[0]) return ''; const h=((parseInt(t[0],10)%12)||12); const m=(t[1]||'00'); const suf=(parseInt(t[0],10)>=12?'PM':'AM'); return `${h}:${m} ${suf}`; })()}</div>
                  {/* Account/Manual badge */}
                  <div className="booking-account-badge">
                    {isAccount ? (
                      <span className="account"> <FaUserCheck /> Account</span>
                    ) : (
                      <span className="manual"> <FaRegEdit /> Manual</span>
                    )}
                  </div>
                  {/* Action buttons */}
                  <div className="booking-card-actions">
                    <button
                      className="booking-card-btn accept"
                      title="Accept Booking"
                      onClick={() => handleAcceptClick(booking)}
                      disabled={updating === booking.id + 'accepted' || booking.status === 'accepted'}
                    >
                      <FaCheck /> Accept
                    </button>
                    <button
                      className="booking-card-btn reject"
                      title="Reject Booking"
                      onClick={() => handleRejectClick(booking)}
                      disabled={updating === booking.id + 'rejected' || booking.status === 'rejected'}
                    >
                      <FaTimes /> Reject
                    </button>
                    <button
                      className="booking-card-btn delete"
                      title="Delete Booking"
                      onClick={() => handleDeleteClick(booking)}
                      disabled={updating === booking.id + 'delete'}
                    >
                      Delete
                    </button>
                  </div>
                  {/* Booked date */}
                  <div className="booking-card-date">
                    {date ? `Booked: ${formatDate12Hour(date)}` : ''}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {/* Accept Confirmation Dialog */}
        <ReactModal
          isOpen={showAcceptDialog}
          onRequestClose={() => setShowAcceptDialog(false)}
          contentLabel="Accept Confirmation"
          style={{
            overlay: { backgroundColor: 'rgba(0,0,0,0.3)', zIndex: 2000 },
            content: {
              maxWidth: 420,
              margin: 'auto',
              borderRadius: 12,
              padding: 18,
              textAlign: 'center',
              height: 360, // <-- Set your desired height here
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center'
            }
          }}
          ariaHideApp={false}
        >
          <FaQuestionCircle size={70} color="#90a4ae" style={{ marginBottom: 18 }} />
          <h2 style={{ marginBottom: 12, fontWeight: 700, fontSize: 28, color: '#444' }}>Confirm Action</h2>
          <div style={{ fontSize: 18, marginBottom: 32, color: '#444' }}>
            Are you sure you want to change this booking status to confirmed?
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 18 }}>
            <button
              onClick={() => {
                handleStatus(acceptBooking.id, 'accepted', acceptBooking.mobileNumber, acceptBooking);
                setShowAcceptDialog(false);
                setAcceptBooking(null);
              }}
              style={{ background: '#4caf50', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 28px', fontWeight: 600, fontSize: 17, cursor: 'pointer', boxShadow: '0 2px 6px #0001' }}
            >
              Yes, update it!
            </button>
            <button
              onClick={() => setShowAcceptDialog(false)}
              style={{ background: '#607d8b', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 28px', fontWeight: 600, fontSize: 17, cursor: 'pointer' }}
            >
              Cancel
            </button>
          </div>
        </ReactModal>
        <ReactModal
          isOpen={showRejectDialog}
          onRequestClose={() => setShowRejectDialog(false)}
          contentLabel="Reject Reason"
          style={{
            overlay: { backgroundColor: 'rgba(0,0,0,0.3)', zIndex: 2000 },
            content: { maxWidth: 400, margin: 'auto', borderRadius: 12, padding: 24 }
          }}
          ariaHideApp={false}
        >
          <h2 style={{ marginBottom: 16 }}>Reason for Rejection</h2>
          <textarea
            value={rejectReason}
            onChange={e => setRejectReason(e.target.value)}
            rows={4}
            style={{ width: '100%', borderRadius: 8, border: '1px solid #ccc', padding: 10, marginBottom: 16 }}
            placeholder="Please provide a reason for rejecting this booking..."
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button onClick={() => setShowRejectDialog(false)} style={{ background: '#888', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 18px', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>Cancel</button>
            <button
              onClick={() => handleStatus(rejectBooking.id, 'rejected', rejectBooking.mobileNumber, rejectBooking)}
              style={{ background: '#c62828', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 18px', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}
              disabled={!rejectReason.trim()}
            >Reject</button>
          </div>
        </ReactModal>
        <ReactModal
          isOpen={showDeleteDialog}
          onRequestClose={() => setShowDeleteDialog(false)}
          contentLabel="Delete Booking Confirmation"
          style={{
            overlay: { backgroundColor: 'rgba(0,0,0,0.3)', zIndex: 2000 },
            content: {
              maxWidth: 340,
              margin: 'auto',
              borderRadius: 12,
              padding: 18,
              textAlign: 'center',
              height: 220,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center'
            }
          }}
          ariaHideApp={false}
        >
          <h2 style={{ marginBottom: 12, fontWeight: 700, fontSize: 22, color: '#d32f2f' }}>Delete Booking</h2>
          <div style={{ fontSize: 16, marginBottom: 28, color: '#444' }}>
            Are you sure you want to delete this booking? This action cannot be undone.
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 18 }}>
            <button
              onClick={handleDeleteBooking}
              style={{ background: '#d32f2f', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 24px', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}
              disabled={updating === (deleteBooking && deleteBooking.id + 'delete')}
            >
              Delete
            </button>
            <button
              onClick={() => setShowDeleteDialog(false)}
              style={{ background: '#607d8b', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 24px', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}
            >
              Cancel
            </button>
          </div>
        </ReactModal>
      </div>
    </>
  );
};

export default ManageBookings; 
import React, { useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { collection, query, where, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import Navbar from './Navbar';
import { FaCalendarAlt, FaClock, FaMapMarkerAlt, FaMapPin, FaHistory, FaTrashAlt, FaExclamationTriangle } from 'react-icons/fa';

const statusColors = {
  pending: '#ffb300',
  accepted: '#388e3c',
  confirmed: '#388e3c',
  rejected: '#d32f2f',
  completed: '#1976d2',
};

const statusBg = {
  pending: '#fff8e1',
  accepted: '#e6f9e6',
  confirmed: '#e6f9e6',
  rejected: '#ffeaea',
  completed: '#e3f2fd',
};

// Helper function to format date in 12-hour format
const formatDate12Hour = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
};

// Helper function to format time in 12-hour format
const formatTime12Hour = (timeStr) => {
  if (!timeStr) return '';
  const d = new Date('1970-01-01T' + timeStr + 'Z');
  return d.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  });
};

// Helper function to format creation date in 12-hour format
const formatCreatedAt12Hour = (ts) => {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  });
};

const UserBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState(null); // { id, carName }
  const [deleting, setDeleting] = useState(false);
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'bookings'), where('uid', '==', user.uid));
    const unsub = onSnapshot(q, (snapshot) => {
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
    });
    return () => unsub();
  }, [user]);

  const handleDeleteBooking = async (bookingId) => {
    setDeleting(true);
    try {
      await deleteDoc(doc(db, 'bookings', bookingId));
      setDeleteConfirm(null);
      // Success feedback could be added here
    } catch (error) {
      console.error('Error deleting booking:', error);
      alert('Failed to delete booking. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <Navbar />
      <div style={{ background: '#f6f8fa', minHeight: '100vh', padding: '2rem 0' }}>
        <div style={{ maxWidth: 900, margin: '2rem auto', background: '#fff', borderRadius: 18, boxShadow: '0 4px 24px rgba(44,62,80,0.10)', padding: '2.5rem 2rem' }}>
          <h1 style={{ textAlign: 'center', color: '#222', fontWeight: 700, marginBottom: 36, fontSize: 36, letterSpacing: 1 }}>My Bookings</h1>
          {loading ? (
            <div>Loading your bookings...</div>
          ) : bookings.length === 0 ? (
            <div style={{ color: '#888', textAlign: 'center', fontSize: 18 }}>You have no bookings yet.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
              {bookings.map(booking => (
                <div key={booking.id} style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 12px rgba(44,62,80,0.08)', padding: 0, border: '1px solid #e0e0e0', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ padding: '1.5rem 1.5rem 1rem 1.5rem', borderRadius: 12, background: statusBg[booking.status] || '#f8fff4', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                      <span style={{ color: '#388e3c', fontWeight: 700, fontSize: 20 }}>{booking.selectedCar || booking.carName}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{
                          background: statusBg[booking.status] || '#e6f9e6',
                          color: statusColors[booking.status] || '#388e3c',
                          fontWeight: 600,
                          borderRadius: 18,
                          padding: '6px 22px',
                          fontSize: 16,
                          minWidth: 90,
                          textAlign: 'center',
                          display: 'inline-block',
                        }}>{booking.status ? booking.status.charAt(0).toUpperCase() + booking.status.slice(1) : 'Pending'}</span>
                        <button
                          onClick={() => setDeleteConfirm({ id: booking.id, carName: booking.selectedCar || booking.carName })}
                          style={{
                            background: '#ffebee',
                            color: '#d32f2f',
                            border: '1px solid #ffcdd2',
                            borderRadius: 8,
                            padding: '8px 12px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            fontSize: 14,
                            fontWeight: 600,
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.background = '#d32f2f';
                            e.target.style.color = '#fff';
                            e.target.style.transform = 'translateY(-2px)';
                            e.target.style.boxShadow = '0 4px 12px rgba(211, 47, 47, 0.3)';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.background = '#ffebee';
                            e.target.style.color = '#d32f2f';
                            e.target.style.transform = 'translateY(0)';
                            e.target.style.boxShadow = 'none';
                          }}
                        >
                          <FaTrashAlt /> Delete
                        </button>
                      </div>
                    </div>
                    <hr style={{ border: 'none', borderTop: '1px solid #eee', margin: '0 0 1rem 0' }} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, color: '#2e7d32', fontSize: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <FaCalendarAlt />
                        <span>Date: <span style={{ color: '#222' }}>{formatDate12Hour(booking.pickupDate)}</span></span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <FaClock />
                        <span>Time: <span style={{ color: '#222' }}>{formatTime12Hour(booking.pickupTime)}</span></span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <FaMapMarkerAlt />
                        <span>Pickup: <span style={{ color: '#222' }}>{booking.pickupLocation}</span></span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <FaMapPin />
                        <span>Drop-off: <span style={{ color: '#222' }}>{booking.dropoffLocation}</span></span>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', padding: '0.7rem 1.5rem', borderTop: '1px solid #eee', color: '#888', fontSize: 14, borderBottomLeftRadius: 12, borderBottomRightRadius: 12 }}>
                    <FaHistory style={{ marginRight: 6 }} /> Booking created on: {formatCreatedAt12Hour(booking.createdAt)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {deleteConfirm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          animation: 'fadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}>
          <div style={{
            background: '#fff',
            borderRadius: 16,
            padding: '2rem',
            maxWidth: 450,
            width: '90%',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            animation: 'scaleIn 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          }}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 20,
            }}>
              <div style={{
                width: 70,
                height: 70,
                borderRadius: '50%',
                background: '#ffebee',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#d32f2f',
                fontSize: 32,
              }}>
                <FaExclamationTriangle />
              </div>
              
              <h2 style={{
                margin: 0,
                fontSize: 24,
                fontWeight: 700,
                color: '#222',
                textAlign: 'center',
              }}>Delete Booking?</h2>
              
              <p style={{
                margin: 0,
                fontSize: 16,
                color: '#666',
                textAlign: 'center',
                lineHeight: 1.6,
              }}>
                Are you sure you want to delete your booking for <strong style={{ color: '#388e3c' }}>{deleteConfirm.carName}</strong>? This action cannot be undone.
              </p>

              <div style={{
                display: 'flex',
                gap: 12,
                width: '100%',
                marginTop: 10,
              }}>
                <button
                  onClick={() => setDeleteConfirm(null)}
                  disabled={deleting}
                  style={{
                    flex: 1,
                    padding: '12px 24px',
                    background: '#f5f5f5',
                    color: '#666',
                    border: '1px solid #e0e0e0',
                    borderRadius: 8,
                    fontSize: 16,
                    fontWeight: 600,
                    cursor: deleting ? 'not-allowed' : 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    opacity: deleting ? 0.5 : 1,
                  }}
                  onMouseEnter={(e) => {
                    if (!deleting) {
                      e.target.style.background = '#e0e0e0';
                      e.target.style.transform = 'translateY(-2px)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = '#f5f5f5';
                    e.target.style.transform = 'translateY(0)';
                  }}
                >
                  Cancel
                </button>
                
                <button
                  onClick={() => handleDeleteBooking(deleteConfirm.id)}
                  disabled={deleting}
                  style={{
                    flex: 1,
                    padding: '12px 24px',
                    background: '#d32f2f',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    fontSize: 16,
                    fontWeight: 600,
                    cursor: deleting ? 'not-allowed' : 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    opacity: deleting ? 0.7 : 1,
                  }}
                  onMouseEnter={(e) => {
                    if (!deleting) {
                      e.target.style.background = '#b71c1c';
                      e.target.style.transform = 'translateY(-2px)';
                      e.target.style.boxShadow = '0 4px 12px rgba(211, 47, 47, 0.4)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = '#d32f2f';
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = 'none';
                  }}
                >
                  {deleting ? (
                    <>
                      <span style={{ 
                        display: 'inline-block',
                        width: 16,
                        height: 16,
                        border: '2px solid #fff',
                        borderTopColor: 'transparent',
                        borderRadius: '50%',
                        animation: 'spin 0.6s linear infinite',
                      }} />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <FaTrashAlt />
                      Delete Booking
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
};

export default UserBookings; 
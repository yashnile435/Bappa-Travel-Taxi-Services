import React, { useEffect, useState } from 'react';
import AdminNavbar from './AdminNavbar';
import './AdminFeedback.css'; // Make sure to create this CSS file
import { db } from '../../firebase';
import { collection, getDocs, deleteDoc, doc, orderBy, query } from 'firebase/firestore';
import { FaStar, FaTrash, FaClock, FaUser } from 'react-icons/fa';

const AdminFeedback = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const fetchFeedbacks = async () => {
    try {
      const q = query(collection(db, 'feedback'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const feedbackData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setFeedbacks(feedbackData);
    } catch (error) {
      console.error("Error fetching feedback:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this feedback?')) {
      try {
        await deleteDoc(doc(db, 'feedback', id));
        setFeedbacks(feedbacks.filter(f => f.id !== id));
      } catch (error) {
        console.error("Error deleting feedback:", error);
      }
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const renderStars = (rating) => {
    return [...Array(5)].map((_, index) => (
      <FaStar 
        key={index} 
        color={index < rating ? "#ffc107" : "#e4e5e9"} 
        size={16}
      />
    ));
  };

  return (
    <>
      <AdminNavbar />
      <div className="manage-bookings-container">
        <h2 className="manage-bookings-header">User Feedback</h2>
        
        {loading ? (
          <div className="loading-feedback">Loading feedback...</div>
        ) : (
          <div className="feedback-grid">
            {feedbacks.length === 0 ? (
              <div className="no-feedback">No feedback received yet.</div>
            ) : (
              feedbacks.map((item) => (
                <div key={item.id} className="feedback-card">
                  <div className="feedback-header">
                    <div className="feedback-user-info">
                      <h3>{item.name}</h3>
                      <span>{item.email}</span>
                    </div>
                    <div className="feedback-rating">
                      {renderStars(item.rating)}
                    </div>
                  </div>
                  
                  <div className="feedback-message">
                    "{item.message}"
                  </div>
                  
                  <div className="feedback-date">
                    <FaClock size={12} /> {formatDate(item.createdAt)}
                  </div>
                  
                  <div className="feedback-actions">
                    <button 
                      className="delete-feedback-btn"
                      onClick={() => handleDelete(item.id)}
                    >
                      <FaTrash size={14} /> Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default AdminFeedback;

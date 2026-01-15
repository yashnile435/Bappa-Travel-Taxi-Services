import React, { useState } from 'react';
import './Feedback.css';
import Navbar from './Navbar';
import { FaStar, FaPaperPlane } from 'react-icons/fa';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const Feedback = () => {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [submitStatus, setSubmitStatus] = useState(null); // 'success', 'error', or null
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      alert('Please select a rating');
      return;
    }
    
    setLoading(true);
    try {
      await addDoc(collection(db, 'feedback'), {
        ...formData,
        rating,
        createdAt: serverTimestamp()
      });

      // Send email notification
      try {
        await fetch('https://us-central1-bappatravels-8fa47.cloudfunctions.net/sendFeedback', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            message: formData.message,
            rating
          }),
        });
      } catch (emailError) {
        console.error("Error sending feedback email:", emailError);
        // Continue to show success message even if email fails
      }

      setSubmitStatus('success');
      setFormData({ name: '', email: '', message: '' });
      setRating(0);
    } catch (error) {
      console.error("Error submitting feedback: ", error);
      setSubmitStatus('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="feedback-container">
        <div className="feedback-card">
          <div className="feedback-header">
            <h2>We Value Your Feedback</h2>
            <p>Tell us about your experience with Bappa Travels</p>
          </div>

          {submitStatus === 'success' ? (
            <div className="success-message">
              <h3>Thank You!</h3>
              <p>Your feedback has been submitted successfully.</p>
              <button onClick={() => setSubmitStatus(null)} className="submit-btn">Send Another</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="feedback-form">
              <div className="rating-section">
                <p>How would you rate your experience?</p>
                <div className="stars">
                  {[...Array(5)].map((star, index) => {
                    const ratingValue = index + 1;
                    return (
                      <label key={index}>
                        <input
                          type="radio"
                          name="rating"
                          value={ratingValue}
                          onClick={() => setRating(ratingValue)}
                        />
                        <FaStar
                          className="star"
                          color={ratingValue <= (hover || rating) ? "#ffc107" : "#e4e5e9"}
                          size={30}
                          onMouseEnter={() => setHover(ratingValue)}
                          onMouseLeave={() => setHover(null)}
                        />
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="form-group">
                <label>Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  placeholder="Your Name"
                />
              </div>

              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  placeholder="Your Email"
                />
              </div>

              <div className="form-group">
                <label>Message</label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  required
                  placeholder="What did you like or dislike?"
                  rows="4"
                ></textarea>
              </div>

              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? 'Sending...' : <><FaPaperPlane /> Send Feedback</>}
              </button>
              
              {submitStatus === 'error' && <p className="error-text">Something went wrong. Please try again.</p>}
            </form>
          )}
        </div>
      </div>
    </>
  );
};

export default Feedback;

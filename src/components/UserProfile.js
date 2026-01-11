import React, { useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import Navbar from './Navbar';
import { FaUser } from 'react-icons/fa';
import './UserProfile.css';

// Helper function to format date in 12-hour format
const formatDate12Hour = (date) => {
  if (!date) return '';
  
  const dateObj = date.toDate ? date.toDate() : 
                  (date.seconds ? new Date(date.seconds * 1000) : 
                  new Date(date));
  
  return dateObj.toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

const UserProfile = () => {
  const [userData, setUserData] = useState(null);
  const [memberSince, setMemberSince] = useState('');
  const [lastLoginTime, setLastLoginTime] = useState('');
  const [lastLoginDevice, setLastLoginDevice] = useState('');
  const [form, setForm] = useState({ name: '', email: '', mobile: '' });
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });

  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (user) {
        const q = query(collection(db, 'users'), where('uid', '==', user.uid));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const data = querySnapshot.docs[0].data();
          setUserData(data);
          setForm({ name: data.name || '', email: data.email || '', mobile: data.mobile || '' });
          
          // Set member since date
          if (data.createdAt) {
            setMemberSince(formatDate12Hour(data.createdAt));
          }
          
          // Set last login time
          if (data.lastLoginDate || data.loginTime) {
            const lastLogin = data.lastLoginDate || data.loginTime;
            setLastLoginTime(formatDate12Hour(lastLogin));
          }
          
          // Set last login device
          if (data.lastLoginDevice) {
            setLastLoginDevice(data.lastLoginDevice);
          }
        }
      }
    };
    fetchUserData();
  }, []);

  if (!userData) return <div className="userprofile-loading">Loading profile...</div>;

  return (
    <>
      <Navbar />
      <div className="profile-bg">
        <div className="profile-card">
          <div className="profile-avatar-section">
            <div className="profile-avatar">
              <FaUser size={48} />
            </div>
            <div className="profile-name">{form.name}</div>
            <div className="profile-member-since">Member since {memberSince}</div>
          </div>
          <form className="profile-form">
            <div className="profile-section-title">Personal Information</div>
            <div className="profile-form-group">
              <label>Full Name</label>
              <input type="text" value={form.name} readOnly className="profile-input" />
            </div>
            <div className="profile-form-group">
              <label>Email Address</label>
              <input type="email" value={form.email} readOnly className="profile-input" />
            </div>
            <div className="profile-form-group">
              <label>Mobile Number</label>
              <input type="text" value={form.mobile} readOnly className="profile-input" />
            </div>
            
            {/* Last Login Time Section */}
            {lastLoginTime && (
              <div className="profile-form-group">
                <label>Last Login Time</label>
                <input 
                  type="text" 
                  value={lastLoginTime} 
                  readOnly 
                  className="profile-input profile-input-highlight" 
                  title="Your last login time"
                />
              </div>
            )}
            
            {/* Last Login Device Section */}
            {lastLoginDevice && (
              <div className="profile-form-group">
                <label>Last Login Device</label>
                <input 
                  type="text" 
                  value={lastLoginDevice} 
                  readOnly 
                  className="profile-input profile-input-device" 
                  title="Device used for last login"
                />
              </div>
            )}
            
            <div className="profile-section-title">Change Password</div>
            <div className="profile-form-group">
              <label>Current Password</label>
              <input type="password" value={passwords.current} className="profile-input" readOnly />
            </div>
            <div className="profile-form-group">
              <label>New Password</label>
              <input type="password" value={passwords.new} className="profile-input" readOnly />
            </div>
            <div className="profile-form-group">
              <label>Confirm Password</label>
              <input type="password" value={passwords.confirm} className="profile-input" readOnly />
            </div>
            <button type="button" className="profile-update-btn">Update Profile</button>
          </form>
        </div>
      </div>
    </>
  );
};

export default UserProfile; 
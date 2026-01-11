import React, { useEffect, useState } from "react";
import AdminNavbar from './AdminNavbar';
import { db } from '../../firebase';
import { collection, getDocs, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { FaUserCircle, FaPhoneAlt, FaCalendarAlt, FaGoogle, FaUser, FaEye, FaTrash, FaCrown, FaUserShield } from 'react-icons/fa';
import './ManageUsers.css';

const getLoginMethod = (user) => {
  if (user.signupMethod === 'google') return 'Google';
  return 'Manual';
};

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

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [promoting, setPromoting] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 600);

  useEffect(() => {
    const fetchUsers = async () => {
      const usersCol = collection(db, "users");
      const userSnapshot = await getDocs(usersCol);
      const usersData = userSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Sort users by registration date (newest first)
      const sortedUsers = usersData.sort((a, b) => {
        const dateA = a.createdAt && a.createdAt.toDate ? a.createdAt.toDate() : 
                     (a.createdAt && a.createdAt.seconds ? new Date(a.createdAt.seconds * 1000) : 
                     (a.createdAt ? new Date(a.createdAt) : new Date(0)));
        const dateB = b.createdAt && b.createdAt.toDate ? b.createdAt.toDate() : 
                     (b.createdAt && b.createdAt.seconds ? new Date(b.createdAt.seconds * 1000) : 
                     (b.createdAt ? new Date(b.createdAt) : new Date(0)));
        
        return dateB - dateA; // Newest first
      });
      
      setUsers(sortedUsers);
      setLoading(false);
    };
    fetchUsers();
  }, []);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 600);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    setDeleting(id);
    await deleteDoc(doc(db, 'users', id));
    setUsers(users.filter(u => u.id !== id));
    setDeleting(null);
  };

  const handlePromoteToAdmin = async (userId, userEmail) => {
    if (!window.confirm(`Are you sure you want to promote ${userEmail} to admin status?`)) return;
    
    try {
      setPromoting(userId);
      
      // Update the user's role to admin in Firestore
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        role: 'admin',
        promotedAt: new Date(),
        promotedBy: 'admin@bappatravels.com' // Main admin email
      });

      // Update local state
      setUsers(users.map(user => 
        user.id === userId 
          ? { ...user, role: 'admin', promotedAt: new Date() }
          : user
      ));

      // Show success message
      alert(`${userEmail} has been successfully promoted to admin!`);
      
    } catch (error) {
      console.error('Error promoting user to admin:', error);
      alert('Failed to promote user to admin. Please try again.');
    } finally {
      setPromoting(null);
    }
  };

  const handleDemoteFromAdmin = async (userId, userEmail) => {
    if (!window.confirm(`Are you sure you want to remove admin status from ${userEmail}?`)) return;
    
    try {
      setPromoting(userId);
      
      // Update the user's role back to user in Firestore
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        role: 'user',
        demotedAt: new Date(),
        demotedBy: 'admin@bappatravels.com'
      });

      // Update local state
      setUsers(users.map(user => 
        user.id === userId 
          ? { ...user, role: 'user', demotedAt: new Date() }
          : user
      ));

      alert(`${userEmail} admin status has been removed!`);
      
    } catch (error) {
      console.error('Error demoting admin:', error);
      alert('Failed to remove admin status. Please try again.');
    } finally {
      setPromoting(null);
    }
  };

  return (
    <>
      <AdminNavbar />
      <div className="manage-users-container pro-manage-users">
        <h2 className="manage-users-header pro-manage-users-header">Manage Users</h2>
        <div className="pro-manage-users-table-wrapper">
        {loading ? (
            <div className="pro-manage-users-loading">Loading users...</div>
        ) : users.length === 0 ? (
            <div className="pro-manage-users-empty">No users found.</div>
          ) : isMobile ? (
            <div className="pro-users-mobile-list">
              {users.map((user, idx) => {
                const joined = user.createdAt;
                const loginMethod = getLoginMethod(user);
                const isAdmin = user.role === 'admin';
                const isMainAdmin = user.email === 'admin@bappatravels.com';
                const initial = user.name ? user.name.charAt(0).toUpperCase() : '?';
                return (
                  <div className="pro-user-mobile-card" key={user.id}>
                    <div className="pro-user-mobile-header">
                      <div className="pro-user-avatar" data-admin={isAdmin}>{initial}</div>
                      <div>
                        <div className="pro-user-name">{user.name || '-'}</div>
                        {isMainAdmin && <span className="pro-main-admin-badge">MAIN ADMIN</span>}
                        <div className={`pro-role-badge ${isAdmin ? 'admin' : 'user'}`}>{isAdmin ? 'Admin' : 'User'}</div>
                      </div>
                    </div>
                    <div className="pro-user-mobile-info"><b>Email:</b> {user.email || '-'}</div>
                    <div className="pro-user-mobile-info"><b>Phone:</b> {user.mobile || '-'}</div>
                    <div className="pro-user-mobile-info"><b>Joined:</b> {formatDate12Hour(joined)}</div>
                    <div className="pro-user-mobile-info"><b>Login:</b> <span className={`pro-login-method ${loginMethod === 'Google' ? 'google' : 'manual'}`}>{loginMethod}</span></div>
                    <div className="pro-user-mobile-info"><b>Last Login:</b> {formatTime12Hour(user.loginTime)}</div>
                    <div className="pro-user-mobile-actions">
                      {!isMainAdmin && (
                        <button className="pro-action-btn promote" onClick={() => handlePromoteToAdmin(user.id, user.email)} disabled={promoting === user.id}>Promote</button>
                      )}
                      <button className="pro-action-btn delete" onClick={() => handleDelete(user.id)} disabled={deleting === user.id}>Delete</button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <table className="pro-manage-users-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Role</th>
                  <th>Joined</th>
                  <th>Login</th>
                  <th>Last Login</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {users.map((user, idx) => {
                  const joined = user.createdAt;
                  const loginMethod = getLoginMethod(user);
                  const isAdmin = user.role === 'admin';
                  const isMainAdmin = user.email === 'admin@bappatravels.com';
                  const initial = user.name ? user.name.charAt(0).toUpperCase() : '?';
                  return (
                    <tr key={user.id}>
                      <td>
                        <div className="pro-user-avatar" data-admin={isAdmin}>
                          {initial}
                        </div>
                        <span className="pro-user-name">{user.name || '-'}</span>
                        {isMainAdmin && <span className="pro-main-admin-badge">MAIN ADMIN</span>}
                      </td>
                      <td>{user.email || '-'}</td>
                      <td>{user.mobile || '-'}</td>
                      <td>
                        <span className={`pro-role-badge ${isAdmin ? 'admin' : 'user'}`}>{isAdmin ? 'Admin' : 'User'}</span>
                      </td>
                      <td>{formatDate12Hour(joined)}</td>
                      <td>
                        <span className={`pro-login-method ${loginMethod === 'Google' ? 'google' : 'manual'}`}>{loginMethod}</span>
                      </td>
                      <td>{formatTime12Hour(user.loginTime)}</td>
                      <td>
                        {!isMainAdmin && (
                          <button className="pro-action-btn promote" onClick={() => handlePromoteToAdmin(user.id, user.email)} disabled={promoting === user.id}>Promote</button>
                        )}
                        <button className="pro-action-btn delete" onClick={() => handleDelete(user.id)} disabled={deleting === user.id}>Delete</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
          </div>
      </div>
    </>
  );
};

export default ManageUsers;

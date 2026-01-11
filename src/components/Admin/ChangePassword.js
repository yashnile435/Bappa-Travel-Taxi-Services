import React, { useState } from "react";
import { getAuth, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";
import AdminNavbar from "./AdminNavbar";

const ChangePassword = () => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setMessage("");
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      setMessage("Please fill in all fields.");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setMessage("New passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      setMessage("Password updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (error) {
      setMessage("Failed to update password: " + (error.message || error.code));
    }
    setLoading(false);
  };

  return (
    <div className="admin-profile-page">
      <AdminNavbar />
      <div className="profile-container">
        <div className="profile-header">
          <h2>Change Password</h2>
        </div>
        {message && <p className="update-message">{message}</p>}
        <form className="profile-form" onSubmit={handleChangePassword} style={{ maxWidth: 400, margin: "0 auto" }}>
          <div className="form-group">
            <label htmlFor="currentPassword">Current Password</label>
            <input
              type="password"
              id="currentPassword"
              name="currentPassword"
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
              disabled={loading}
            />
          </div>
          <div className="form-group">
            <label htmlFor="newPassword">New Password</label>
            <input
              type="password"
              id="newPassword"
              name="newPassword"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              disabled={loading}
            />
          </div>
          <div className="form-group">
            <label htmlFor="confirmNewPassword">Confirm New Password</label>
            <input
              type="password"
              id="confirmNewPassword"
              name="confirmNewPassword"
              value={confirmNewPassword}
              onChange={e => setConfirmNewPassword(e.target.value)}
              placeholder="Confirm new password"
              disabled={loading}
            />
          </div>
          <div className="form-actions">
            <button type="submit" className="save-button" disabled={loading}>
              {loading ? "Updating..." : "Change Password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangePassword; 
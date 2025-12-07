// src/pages/Profile.jsx
import { useState } from 'react';
import { IonContent, IonPage, IonIcon } from '@ionic/react';
import {
  personOutline,
  mailOutline,
  callOutline,
  businessOutline,
  settingsOutline,
  logOutOutline,
  cameraOutline,
  shieldCheckmarkOutline,
  helpCircleOutline,
  chatbubbleOutline,
  chevronForwardOutline,
  closeOutline
} from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { doc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../contexts/AuthContext';
import TabNav from '../components/TabNav';
import './Profile.css';

const Profile = () => {
  const { userProfile, currentUser, logout, fetchUserProfile } = useAuth();
  const history = useHistory();
  const [uploading, setUploading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    fullName: userProfile?.fullName || '',
    phone: userProfile?.phone || '',
    department: userProfile?.department || ''
  });

  const menuItems = [
    {
      icon: personOutline,
      label: 'Edit Profile',
      action: () => setShowEditModal(true),
      color: '#6366f1'
    },
    {
      icon: shieldCheckmarkOutline,
      label: 'Privacy & Security',
      action: () => {},
      color: '#10b981'
    },
    {
      icon: chatbubbleOutline,
      label: 'Help & Support',
      action: () => {},
      color: '#f59e0b'
    },
    {
      icon: settingsOutline,
      label: 'Settings',
      action: () => {},
      color: '#8b5cf6'
    }
  ];

  const handleLogout = async () => {
    try {
      await logout();
      history.push('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const storageRef = ref(storage, `profiles/${currentUser.uid}/${file.name}`);
      await uploadBytes(storageRef, file);
      const photoURL = await getDownloadURL(storageRef);

      await setDoc(doc(db, 'users', currentUser.uid), {
        photoURL
      }, { merge: true });

      await fetchUserProfile(currentUser.uid);
    } catch (error) {
      console.error('Error uploading photo:', error);
      alert('Failed to upload photo. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    
    try {
      await setDoc(doc(db, 'users', currentUser.uid), {
        fullName: editForm.fullName,
        phone: editForm.phone,
        department: editForm.department,
        email: currentUser.email,
        uid: currentUser.uid,
        role: userProfile?.role || 'member',
        photoURL: userProfile?.photoURL || '',
        createdAt: userProfile?.createdAt || new Date().toISOString(),
        churchId: 'default'
      }, { merge: true });
      
      await fetchUserProfile(currentUser.uid);
      setShowEditModal(false);
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert(`Failed to update profile: ${error.message}`);
    }
  };

  const isAdmin = userProfile?.role === 'admin' || userProfile?.role === 'superadmin';

  return (
    <IonPage>
      <IonContent fullscreen>
        <div className="profile-container">
          {/* Header */}
          <div className="profile-header gradient-animated">
            <div className="profile-photo-wrapper animate-scale-in">
              {userProfile?.photoURL ? (
                <img
                  src={userProfile.photoURL}
                  alt="Profile"
                  className="profile-photo"
                />
              ) : (
                <div className="profile-photo-placeholder">
                  <IonIcon icon={personOutline} />
                </div>
              )}
              <label className="photo-upload-btn">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  style={{ display: 'none' }}
                  disabled={uploading}
                />
                <IonIcon icon={cameraOutline} />
              </label>
              {uploading && (
                <div className="uploading-overlay">
                  <div className="spinner"></div>
                </div>
              )}
            </div>

            <h1 className="profile-name animate-fade-in-up">
              {userProfile?.fullName || 'Member'}
            </h1>
            <p className="profile-email animate-fade-in-up">
              {userProfile?.email || currentUser?.email}
            </p>
            {userProfile?.role && (
              <span className="role-badge animate-fade-in-up">
                {userProfile.role.toUpperCase()}
              </span>
            )}

            {/* Wave Effect */}
            <div className="wave-container">
              <svg viewBox="0 0 1440 120" xmlns="http://www.w3.org/2000/svg">
                <path
                  fill="var(--background)"
                  d="M0,64L48,69.3C96,75,192,85,288,80C384,75,480,53,576,48C672,43,768,53,864,58.7C960,64,1056,64,1152,58.7C1248,53,1344,43,1392,37.3L1440,32L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z"
                />
              </svg>
            </div>
          </div>

          {/* Profile Info */}
          <div className="profile-content">
            <div className="info-section animate-fade-in-up">
              <h3 className="section-title">Personal Information</h3>
              <div className="info-grid">
                <div className="info-item">
                  <IonIcon icon={callOutline} className="info-item-icon" />
                  <div>
                    <p className="info-label">Phone</p>
                    <p className="info-value">{userProfile?.phone || 'Not set'}</p>
                  </div>
                </div>

                <div className="info-item">
                  <IonIcon icon={businessOutline} className="info-item-icon" />
                  <div>
                    <p className="info-label">Department</p>
                    <p className="info-value">{userProfile?.department || 'Not assigned'}</p>
                  </div>
                </div>

                <div className="info-item">
                  <IonIcon icon={mailOutline} className="info-item-icon" />
                  <div>
                    <p className="info-label">Email</p>
                    <p className="info-value">{userProfile?.email || currentUser?.email}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Admin Panel Link */}
            {isAdmin && (
              <div className="admin-panel-card animate-fade-in-up hover-lift">
                <div className="admin-card-content">
                  <div className="admin-icon-wrapper">
                    <IonIcon icon={shieldCheckmarkOutline} />
                  </div>
                  <div>
                    <h4 className="admin-card-title">Admin Dashboard</h4>
                    <p className="admin-card-subtitle">Manage church operations</p>
                  </div>
                </div>
                <button
                  className="admin-card-btn"
                  onClick={() => history.push('/admin/dashboard')}
                >
                  <IonIcon icon={chevronForwardOutline} />
                </button>
              </div>
            )}

            {/* Menu Items */}
            <div className="menu-section animate-fade-in-up">
              {menuItems.map((item, index) => (
                <button
                  key={index}
                  className="menu-item stagger-item hover-lift"
                  onClick={item.action}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="menu-item-icon-wrapper" style={{ background: `${item.color}15` }}>
                    <IonIcon icon={item.icon} style={{ color: item.color }} />
                  </div>
                  <span className="menu-item-label">{item.label}</span>
                  <IonIcon icon={chevronForwardOutline} className="menu-item-arrow" />
                </button>
              ))}
            </div>

            {/* Logout Button */}
            <button className="logout-btn animate-fade-in-up" onClick={handleLogout}>
              <IonIcon icon={logOutOutline} />
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* Edit Profile Modal */}
        {showEditModal && (
          <div className="modal-backdrop active" onClick={() => setShowEditModal(false)}>
            <div className="modal-content active" onClick={(e) => e.stopPropagation()}>
              <button className="modal-close-btn" onClick={() => setShowEditModal(false)}>
                <IonIcon icon={closeOutline} />
              </button>

              <div className="modal-header">
                <h2 className="modal-title">Edit Profile</h2>
              </div>

              <form onSubmit={handleUpdateProfile} className="modal-body">
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editForm.fullName}
                    onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input
                    type="tel"
                    className="form-input"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Department</label>
                  <select
                    className="form-input"
                    value={editForm.department}
                    onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                  >
                    <option value="">Select Department</option>
                    <option value="Choir">Choir</option>
                    <option value="Ushering">Ushering</option>
                    <option value="Media">Media</option>
                    <option value="Children">Children</option>
                    <option value="Youth">Youth</option>
                    <option value="Prayer">Prayer</option>
                    <option value="Welfare">Welfare</option>
                    <option value="Protocol">Protocol</option>
                    <option value="Evangelism">Evangelism</option>
                  </select>
                </div>

                <button type="submit" className="btn btn-primary btn-block">
                  Save Changes
                </button>
              </form>
            </div>
          </div>
        )}

        <TabNav />
      </IonContent>
    </IonPage>
  );
};

export default Profile;
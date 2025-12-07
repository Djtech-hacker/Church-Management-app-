// src/pages/PrayerRequests.jsx
import { useState, useEffect } from 'react';
import { IonContent, IonPage, IonIcon, IonRefresher, IonRefresherContent } from '@ionic/react';
import {
  handRightOutline,
  arrowBackOutline,
  addOutline,
  closeOutline,
  heartOutline,
  heart,
  timeOutline
} from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { collection, addDoc, query, orderBy, getDocs, doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../contexts/AuthContext';
import { useAuth } from '../contexts/AuthContext';
import './PrayerRequests.css';

const PrayerRequests = () => {
  const { currentUser, userProfile } = useAuth();
  const history = useHistory();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    isAnonymous: false
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'prayerRequests'),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const requestsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setRequests(requestsData);
    } catch (error) {
      console.error('Error fetching prayer requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async (event) => {
    await fetchRequests();
    event.detail.complete();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title || !formData.description) {
      alert('Please fill in all fields');
      return;
    }

    setSubmitting(true);

    try {
      await addDoc(collection(db, 'prayerRequests'), {
        userId: currentUser.uid,
        userName: formData.isAnonymous ? 'Anonymous' : (userProfile?.fullName || 'Member'),
        title: formData.title,
        description: formData.description,
        isAnonymous: formData.isAnonymous,
        prayers: [],
        prayerCount: 0,
        status: 'pending',
        createdAt: new Date().toISOString()
      });

      setFormData({ title: '', description: '', isAnonymous: false });
      setShowModal(false);
      await fetchRequests();
    } catch (error) {
      console.error('Error submitting prayer request:', error);
      alert('Failed to submit prayer request');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePray = async (requestId, prayers = []) => {
    try {
      const requestRef = doc(db, 'prayerRequests', requestId);
      const hasPrayed = prayers.includes(currentUser.uid);

      if (hasPrayed) {
        await updateDoc(requestRef, {
          prayers: arrayRemove(currentUser.uid),
          prayerCount: Math.max(0, prayers.length - 1)
        });
      } else {
        await updateDoc(requestRef, {
          prayers: arrayUnion(currentUser.uid),
          prayerCount: prayers.length + 1
        });
      }

      await fetchRequests();
    } catch (error) {
      console.error('Error updating prayer:', error);
    }
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <IonPage>
      <IonContent fullscreen>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        <div className="prayer-requests-container">
          {/* Header */}
          <div className="prayer-header gradient-animated">
            <button className="back-button" onClick={() => history.goBack()}>
              <IonIcon icon={arrowBackOutline} />
            </button>
            <div className="header-content">
              <div className="header-icon-wrapper">
                <IonIcon icon={handRightOutline} className="header-icon" />
              </div>
              <h1 className="prayer-title">Prayer Requests</h1>
              <p className="prayer-subtitle">We're praying with you</p>
            </div>

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

          <div className="prayer-content">
            {/* Add Button */}
            <button
              className="add-request-btn animate-fade-in-up"
              onClick={() => setShowModal(true)}
            >
              <IonIcon icon={addOutline} />
              <span>Submit Prayer Request</span>
            </button>

            {/* Requests List */}
            {loading ? (
              <div className="skeleton-container">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="skeleton-request">
                    <div className="skeleton skeleton-title" />
                    <div className="skeleton skeleton-text" />
                    <div className="skeleton skeleton-text" style={{ width: '70%' }} />
                  </div>
                ))}
              </div>
            ) : requests.length > 0 ? (
              <div className="requests-list">
                {requests.map((request, index) => (
                  <div
                    key={request.id}
                    className="request-card stagger-item hover-lift"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="request-header">
                      <div className="user-info">
                        <div className="user-avatar">
                          {request.isAnonymous ? '?' : request.userName.charAt(0)}
                        </div>
                        <div>
                          <h3 className="request-user">{request.userName}</h3>
                          <p className="request-time">
                            <IonIcon icon={timeOutline} />
                            {formatDate(request.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="request-body">
                      <h4 className="request-title">{request.title}</h4>
                      <p className="request-description">{request.description}</p>
                    </div>

                    <div className="request-footer">
                      <button
                        className={`pray-btn ${request.prayers?.includes(currentUser.uid) ? 'active' : ''}`}
                        onClick={() => handlePray(request.id, request.prayers || [])}
                      >
                        <IonIcon icon={request.prayers?.includes(currentUser.uid) ? heart : heartOutline} />
                        <span>
                          {request.prayerCount || 0} {(request.prayerCount || 0) === 1 ? 'Prayer' : 'Prayers'}
                        </span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state animate-fade-in">
                <IonIcon icon={handRightOutline} className="empty-icon" />
                <h3 className="empty-title">No Prayer Requests</h3>
                <p className="empty-text">Be the first to share a prayer request</p>
              </div>
            )}
          </div>
        </div>

        {/* Submit Modal */}
        {showModal && (
          <div className={`modal-backdrop ${showModal ? 'active' : ''}`} onClick={() => setShowModal(false)}>
            <div
              className={`modal-content ${showModal ? 'active' : ''}`}
              onClick={(e) => e.stopPropagation()}
            >
              <button className="modal-close-btn" onClick={() => setShowModal(false)}>
                <IonIcon icon={closeOutline} />
              </button>

              <div className="modal-header">
                <h2 className="modal-title">Submit Prayer Request</h2>
              </div>

              <form onSubmit={handleSubmit} className="modal-body">
                <div className="form-group">
                  <label className="form-label">Title</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="What would you like us to pray for?"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-textarea"
                    placeholder="Share more details..."
                    rows="4"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.isAnonymous}
                      onChange={(e) => setFormData({ ...formData, isAnonymous: e.target.checked })}
                    />
                    <span>Submit anonymously</span>
                  </label>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-block"
                  disabled={submitting}
                >
                  {submitting ? <div className="spinner"></div> : 'Submit Request'}
                </button>
              </form>
            </div>
          </div>
        )}
      </IonContent>
    </IonPage>
  );
};

export default PrayerRequests;
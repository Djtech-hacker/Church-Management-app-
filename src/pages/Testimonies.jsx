// src/pages/Testimonies.jsx
import { useState, useEffect } from 'react';
import { IonContent, IonPage, IonIcon, IonRefresher, IonRefresherContent } from '@ionic/react';
import {
  heartOutline,
  arrowBackOutline,
  addOutline,
  closeOutline,
  timeOutline,
  sparklesOutline
} from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { collection, addDoc, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../contexts/AuthContext';
import { useAuth } from '../contexts/AuthContext';
import './Testimonies.css';

const Testimonies = () => {
  const { currentUser, userProfile } = useAuth();
  const history = useHistory();
  const [testimonies, setTestimonies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    testimony: '',
    category: 'healing'
  });
  const [submitting, setSubmitting] = useState(false);

  const categories = [
    { value: 'healing', label: 'Healing' },
    { value: 'financial', label: 'Financial Breakthrough' },
    { value: 'salvation', label: 'Salvation' },
    { value: 'deliverance', label: 'Deliverance' },
    { value: 'answered_prayer', label: 'Answered Prayer' },
    { value: 'other', label: 'Other' }
  ];

  useEffect(() => {
    fetchTestimonies();
  }, []);

  const fetchTestimonies = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'testimonies'),
        where('status', '==', 'approved'),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const testimoniesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTestimonies(testimoniesData);
    } catch (error) {
      console.error('Error fetching testimonies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async (event) => {
    await fetchTestimonies();
    event.detail.complete();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title || !formData.testimony) {
      alert('Please fill in all fields');
      return;
    }

    setSubmitting(true);

    try {
      await addDoc(collection(db, 'testimonies'), {
        userId: currentUser.uid,
        userName: userProfile?.fullName || 'Member',
        title: formData.title,
        testimony: formData.testimony,
        category: formData.category,
        status: 'pending',
        createdAt: new Date().toISOString()
      });

      setFormData({ title: '', testimony: '', category: 'healing' });
      setShowModal(false);
      alert('Testimony submitted! It will appear after admin approval.');
    } catch (error) {
      console.error('Error submitting testimony:', error);
      alert('Failed to submit testimony');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getCategoryColor = (category) => {
    const colors = {
      healing: '#10b981',
      financial: '#f59e0b',
      salvation: '#6366f1',
      deliverance: '#8b5cf6',
      answered_prayer: '#ec4899',
      other: '#06b6d4'
    };
    return colors[category] || '#6366f1';
  };

  return (
    <IonPage>
      <IonContent fullscreen>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        <div className="testimonies-container">
          {/* Header */}
          <div className="testimonies-header gradient-animated">
            <button className="back-button" onClick={() => history.goBack()}>
              <IonIcon icon={arrowBackOutline} />
            </button>
            <div className="header-content">
              <div className="header-icon-wrapper">
                <IonIcon icon={sparklesOutline} className="header-icon" />
              </div>
              <h1 className="testimonies-title">Testimonies</h1>
              <p className="testimonies-subtitle">Share God's goodness</p>
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

          <div className="testimonies-content">
            {/* Add Button */}
            <button
              className="add-testimony-btn animate-fade-in-up"
              onClick={() => setShowModal(true)}
            >
              <IonIcon icon={addOutline} />
              <span>Share Your Testimony</span>
            </button>

            {/* Testimonies List */}
            {loading ? (
              <div className="skeleton-container">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="skeleton-testimony">
                    <div className="skeleton skeleton-title" />
                    <div className="skeleton skeleton-text" />
                    <div className="skeleton skeleton-text" />
                  </div>
                ))}
              </div>
            ) : testimonies.length > 0 ? (
              <div className="testimonies-list">
                {testimonies.map((testimony, index) => (
                  <div
                    key={testimony.id}
                    className="testimony-card stagger-item hover-lift"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="testimony-header">
                      <div className="user-info">
                        <div
                          className="user-avatar"
                          style={{ background: getCategoryColor(testimony.category) }}
                        >
                          {testimony.userName.charAt(0)}
                        </div>
                        <div>
                          <h3 className="testimony-user">{testimony.userName}</h3>
                          <p className="testimony-time">
                            <IonIcon icon={timeOutline} />
                            {formatDate(testimony.createdAt)}
                          </p>
                        </div>
                      </div>
                      <span
                        className="category-badge"
                        style={{ background: `${getCategoryColor(testimony.category)}20`, color: getCategoryColor(testimony.category) }}
                      >
                        {categories.find(c => c.value === testimony.category)?.label}
                      </span>
                    </div>

                    <div className="testimony-body">
                      <h4 className="testimony-title">{testimony.title}</h4>
                      <p className="testimony-text">{testimony.testimony}</p>
                    </div>

                    <div className="testimony-footer">
                      <IonIcon icon={heartOutline} className="heart-icon" />
                      <span className="glory-text">Glory to God!</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state animate-fade-in">
                <IonIcon icon={sparklesOutline} className="empty-icon" />
                <h3 className="empty-title">No Testimonies Yet</h3>
                <p className="empty-text">Be the first to share your testimony</p>
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
                <h2 className="modal-title">Share Your Testimony</h2>
              </div>

              <form onSubmit={handleSubmit} className="modal-body">
                <div className="form-group">
                  <label className="form-label">Title</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="What did God do?"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select
                    className="form-input"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    {categories.map(cat => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Your Testimony</label>
                  <textarea
                    className="form-textarea"
                    placeholder="Tell us what happened..."
                    rows="6"
                    value={formData.testimony}
                    onChange={(e) => setFormData({ ...formData, testimony: e.target.value })}
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-block"
                  disabled={submitting}
                >
                  {submitting ? <div className="spinner"></div> : 'Submit Testimony'}
                </button>

                <p className="submission-note">
                  Your testimony will be reviewed before it's published
                </p>
              </form>
            </div>
          </div>
        )}
      </IonContent>
    </IonPage>
  );
};

export default Testimonies;
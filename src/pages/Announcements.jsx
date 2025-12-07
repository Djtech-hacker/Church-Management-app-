// src/pages/Announcements.jsx
import { useState, useEffect } from 'react';
import { IonContent, IonPage, IonIcon, IonRefresher, IonRefresherContent } from '@ionic/react';
import { megaphoneOutline, timeOutline, closeOutline } from 'ionicons/icons';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../contexts/AuthContext';
import TabNav from '../components/TabNav';
import './Announcements.css';

const Announcements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'announcements'),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const announcementsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAnnouncements(announcementsData);
    } catch (error) {
      console.error('Error fetching announcements:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async (event) => {
    await fetchAnnouncements();
    event.detail.complete();
  };

  const openModal = (announcement) => {
    setSelectedAnnouncement(announcement);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setTimeout(() => setSelectedAnnouncement(null), 300);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Recently';
    const date = new Date(timestamp);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'var(--danger-color)';
      case 'medium':
        return 'var(--warning-color)';
      default:
        return 'var(--primary-color)';
    }
  };

  return (
    <IonPage>
      <IonContent fullscreen>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        <div className="announcements-container">
          {/* Header */}
          <div className="page-header gradient-animated">
            <div className="header-icon-wrapper">
              <IonIcon icon={megaphoneOutline} className="header-icon" />
            </div>
            <h1 className="page-title">Announcements</h1>
            <p className="page-subtitle">Stay updated with church news</p>

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

          {/* Content */}
          <div className="announcements-content">
            {loading ? (
              <div className="skeleton-container">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="skeleton-announcement">
                    <div className="skeleton skeleton-title" />
                    <div className="skeleton skeleton-text" />
                    <div className="skeleton skeleton-text" style={{ width: '70%' }} />
                  </div>
                ))}
              </div>
            ) : announcements.length > 0 ? (
              <div className="announcements-list">
                {announcements.map((announcement, index) => (
                  <div
                    key={announcement.id}
                    className="announcement-item stagger-item hover-lift"
                    onClick={() => openModal(announcement)}
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div
                      className="announcement-priority-bar"
                      style={{ background: getPriorityColor(announcement.priority) }}
                    />
                    <div className="announcement-content-wrapper">
                      <div className="announcement-header-section">
                        <h3 className="announcement-item-title">{announcement.title}</h3>
                        {announcement.priority === 'high' && (
                          <span className="priority-badge high">Urgent</span>
                        )}
                      </div>
                      <p className="announcement-preview">
                        {announcement.content.substring(0, 120)}
                        {announcement.content.length > 120 ? '...' : ''}
                      </p>
                      <div className="announcement-footer">
                        <div className="announcement-meta">
                          <IonIcon icon={timeOutline} className="meta-icon" />
                          <span className="meta-text">{formatDate(announcement.createdAt)}</span>
                        </div>
                        {announcement.category && (
                          <span className="category-badge">{announcement.category}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state animate-fade-in">
                <IonIcon icon={megaphoneOutline} className="empty-icon" />
                <h3 className="empty-title">No Announcements</h3>
                <p className="empty-text">Check back later for updates</p>
              </div>
            )}
          </div>
        </div>

        {/* Modal */}
        {showModal && selectedAnnouncement && (
          <div className={`modal-backdrop ${showModal ? 'active' : ''}`} onClick={closeModal}>
            <div
              className={`modal-content ${showModal ? 'active' : ''}`}
              onClick={(e) => e.stopPropagation()}
            >
              <button className="modal-close-btn" onClick={closeModal}>
                <IonIcon icon={closeOutline} />
              </button>

              <div className="modal-header">
                {selectedAnnouncement.priority === 'high' && (
                  <span className="priority-badge high">Urgent</span>
                )}
                <h2 className="modal-title">{selectedAnnouncement.title}</h2>
                <div className="modal-meta">
                  <IonIcon icon={timeOutline} className="meta-icon" />
                  <span className="meta-text">{formatDate(selectedAnnouncement.createdAt)}</span>
                </div>
              </div>

              <div className="modal-body">
                <p className="modal-text">{selectedAnnouncement.content}</p>
                
                {selectedAnnouncement.category && (
                  <div className="modal-footer">
                    <span className="category-badge">{selectedAnnouncement.category}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <TabNav />
      </IonContent>
    </IonPage>
  );
};

export default Announcements;
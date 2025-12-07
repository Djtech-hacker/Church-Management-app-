// src/pages/Programs.jsx
import { useState, useEffect } from 'react';
import { IonContent, IonPage, IonIcon, IonRefresher, IonRefresherContent } from '@ionic/react';
import {
  calendarOutline,
  timeOutline,
  locationOutline,
  closeOutline,
  peopleOutline
} from 'ionicons/icons';
import { collection, query, orderBy, getDocs, where } from 'firebase/firestore';
import { db } from '../contexts/AuthContext';
import TabNav from '../components/TabNav';
import './Programs.css';

const Programs = () => {
  const [programs, setPrograms] = useState([]);
  const [filteredPrograms, setFilteredPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState('upcoming');

  useEffect(() => {
    fetchPrograms();
  }, []);

  useEffect(() => {
    filterPrograms();
  }, [programs, filter]);

  const fetchPrograms = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'programs'),
        orderBy('date', 'asc')
      );
      const querySnapshot = await getDocs(q);
      const programsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPrograms(programsData);
    } catch (error) {
      console.error('Error fetching programs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterPrograms = () => {
    const now = new Date();
    let filtered = [];

    if (filter === 'upcoming') {
      filtered = programs.filter(p => new Date(p.date) >= now);
    } else if (filter === 'past') {
      filtered = programs.filter(p => new Date(p.date) < now);
    } else {
      filtered = programs;
    }

    setFilteredPrograms(filtered);
  };

  const handleRefresh = async (event) => {
    await fetchPrograms();
    event.detail.complete();
  };

  const openModal = (program) => {
    setSelectedProgram(program);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setTimeout(() => setSelectedProgram(null), 300);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    return timeString;
  };

  const getMonthDay = (dateString) => {
    const date = new Date(dateString);
    return {
      day: date.getDate(),
      month: date.toLocaleString('default', { month: 'short' })
    };
  };

  return (
    <IonPage>
      <IonContent fullscreen>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        <div className="programs-container">
          {/* Header */}
          <div className="page-header gradient-animated">
            <div className="header-icon-wrapper">
              <IonIcon icon={calendarOutline} className="header-icon" />
            </div>
            <h1 className="page-title">Programs & Events</h1>
            <p className="page-subtitle">Join us in worship and fellowship</p>

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

          {/* Filter Tabs */}
          <div className="filter-tabs">
            <button
              className={`filter-tab ${filter === 'upcoming' ? 'active' : ''}`}
              onClick={() => setFilter('upcoming')}
            >
              Upcoming
            </button>
            <button
              className={`filter-tab ${filter === 'past' ? 'active' : ''}`}
              onClick={() => setFilter('past')}
            >
              Past
            </button>
            <button
              className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All
            </button>
          </div>

          {/* Content */}
          <div className="programs-content">
            {loading ? (
              <div className="skeleton-container">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="skeleton-program">
                    <div className="skeleton skeleton-avatar" />
                    <div style={{ flex: 1 }}>
                      <div className="skeleton skeleton-title" />
                      <div className="skeleton skeleton-text" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredPrograms.length > 0 ? (
              <div className="programs-list">
                {filteredPrograms.map((program, index) => {
                  const { day, month } = getMonthDay(program.date);
                  return (
                    <div
                      key={program.id}
                      className="program-item stagger-item hover-lift"
                      onClick={() => openModal(program)}
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <div className="program-date-badge">
                        <span className="badge-day">{day}</span>
                        <span className="badge-month">{month}</span>
                      </div>
                      <div className="program-details">
                        <h3 className="program-item-title">{program.title}</h3>
                        <div className="program-info">
                          <div className="info-item">
                            <IonIcon icon={timeOutline} className="info-icon" />
                            <span className="info-text">{formatTime(program.time)}</span>
                          </div>
                          <div className="info-item">
                            <IonIcon icon={locationOutline} className="info-icon" />
                            <span className="info-text">{program.location || 'Church'}</span>
                          </div>
                        </div>
                        {program.category && (
                          <span className="program-category-badge">{program.category}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="empty-state animate-fade-in">
                <IonIcon icon={calendarOutline} className="empty-icon" />
                <h3 className="empty-title">No Programs Found</h3>
                <p className="empty-text">
                  {filter === 'upcoming' 
                    ? 'No upcoming programs scheduled'
                    : 'No programs in this category'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Modal */}
        {showModal && selectedProgram && (
          <div className={`modal-backdrop ${showModal ? 'active' : ''}`} onClick={closeModal}>
            <div
              className={`modal-content ${showModal ? 'active' : ''}`}
              onClick={(e) => e.stopPropagation()}
            >
              <button className="modal-close-btn" onClick={closeModal}>
                <IonIcon icon={closeOutline} />
              </button>

              <div className="modal-header-program">
                <div className="modal-date-badge">
                  <span className="badge-day">{getMonthDay(selectedProgram.date).day}</span>
                  <span className="badge-month">{getMonthDay(selectedProgram.date).month}</span>
                </div>
                <div className="modal-header-text">
                  <h2 className="modal-title">{selectedProgram.title}</h2>
                  {selectedProgram.category && (
                    <span className="program-category-badge">{selectedProgram.category}</span>
                  )}
                </div>
              </div>

              <div className="modal-body">
                <div className="program-details-full">
                  <div className="detail-row">
                    <IonIcon icon={calendarOutline} className="detail-icon" />
                    <div>
                      <p className="detail-label">Date</p>
                      <p className="detail-value">{formatDate(selectedProgram.date)}</p>
                    </div>
                  </div>

                  <div className="detail-row">
                    <IonIcon icon={timeOutline} className="detail-icon" />
                    <div>
                      <p className="detail-label">Time</p>
                      <p className="detail-value">{formatTime(selectedProgram.time)}</p>
                    </div>
                  </div>

                  <div className="detail-row">
                    <IonIcon icon={locationOutline} className="detail-icon" />
                    <div>
                      <p className="detail-label">Location</p>
                      <p className="detail-value">{selectedProgram.location || 'Main Church'}</p>
                    </div>
                  </div>

                  {selectedProgram.speaker && (
                    <div className="detail-row">
                      <IonIcon icon={peopleOutline} className="detail-icon" />
                      <div>
                        <p className="detail-label">Speaker</p>
                        <p className="detail-value">{selectedProgram.speaker}</p>
                      </div>
                    </div>
                  )}
                </div>

                {selectedProgram.description && (
                  <div className="program-description">
                    <h3 className="description-title">About This Event</h3>
                    <p className="description-text">{selectedProgram.description}</p>
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

export default Programs;
// src/pages/attendance/AttendanceSystem.jsx
import { useState, useEffect } from 'react';
import { IonContent, IonPage, IonIcon, IonSegment, IonSegmentButton } from '@ionic/react';
import {
  checkmarkCircleOutline,
  arrowBackOutline,
  addOutline,
  closeOutline,
  keyOutline,
  peopleOutline,
  timeOutline,
  copyOutline,
  refreshOutline
} from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  updateDoc,
  doc,
  arrayUnion 
} from 'firebase/firestore';
import { db } from '../../contexts/AuthContext';
import { useAuth } from '../../contexts/AuthContext';
import './AttendanceSystem.css';

const AttendanceSystem = () => {
  const history = useHistory();
  const { userProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('check-in');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [checkInCode, setCheckInCode] = useState('');
  const [checkInLoading, setCheckInLoading] = useState(false);
  const [eventForm, setEventForm] = useState({
    title: '',
    date: '',
    type: 'Sunday Service'
  });

  // ✓ Correctly placed inside component
  const isAdmin = userProfile?.role === 'admin';

  // Debug log
  useEffect(() => {
    console.log('=== ATTENDANCE DEBUG ===');
    console.log('User Profile:', userProfile);
    console.log('User Role:', userProfile?.role);
    console.log('Is Admin:', isAdmin);
    console.log('Current Path:', window.location.pathname);
    console.log('=======================');
  }, [userProfile, isAdmin]);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'attendanceEvents'),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      const eventsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setEvents(eventsData);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  // Generate random 6-digit code
  const generateCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    
    if (!eventForm.title || !eventForm.date) {
      alert('Please fill in all fields');
      return;
    }

    try {
      const code = generateCode();
      
      await addDoc(collection(db, 'attendanceEvents'), {
        title: eventForm.title,
        date: eventForm.date,
        type: eventForm.type,
        code: code,
        attendees: [],
        createdBy: userProfile?.uid,
        createdAt: new Date().toISOString(),
        status: 'active'
      });

      alert(`Event created! Check-in code: ${code}`);
      setShowCreateModal(false);
      setEventForm({ title: '', date: '', type: 'Sunday Service' });
      fetchEvents();
    } catch (error) {
      console.error('Error creating event:', error);
      alert('Failed to create event');
    }
  };

  const handleCheckIn = async () => {
    if (!checkInCode || checkInCode.length !== 6) {
      alert('Please enter a valid 6-digit code');
      return;
    }

    setCheckInLoading(true);

    try {
      // Find event with this code
      const q = query(
        collection(db, 'attendanceEvents'),
        where('code', '==', checkInCode),
        where('status', '==', 'active')
      );
      
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        alert('Invalid code or event has ended');
        setCheckInLoading(false);
        return;
      }

      const eventDoc = snapshot.docs[0];
      const eventData = eventDoc.data();

      // Check if already checked in
      if (eventData.attendees?.some(a => a.uid === userProfile?.uid)) {
        alert('You have already checked in to this event');
        setCheckInLoading(false);
        return;
      }

      // Add user to attendees
      await updateDoc(doc(db, 'attendanceEvents', eventDoc.id), {
        attendees: arrayUnion({
          uid: userProfile?.uid,
          name: userProfile?.fullName || 'Unknown',
          email: userProfile?.email || '',
          checkedInAt: new Date().toISOString()
        })
      });

      alert('Successfully checked in! ✓');
      setShowCheckInModal(false);
      setCheckInCode('');
      fetchEvents();
    } catch (error) {
      console.error('Error checking in:', error);
      alert('Check-in failed. Please try again.');
    } finally {
      setCheckInLoading(false);
    }
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    alert('Code copied to clipboard!');
  };

  const endEvent = async (eventId) => {
    if (!window.confirm('End this event? No more check-ins will be allowed.')) {
      return;
    }

    try {
      await updateDoc(doc(db, 'attendanceEvents', eventId), {
        status: 'ended',
        endedAt: new Date().toISOString()
      });
      alert('Event ended successfully');
      fetchEvents();
    } catch (error) {
      console.error('Error ending event:', error);
      alert('Failed to end event');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <IonPage>
      <IonContent fullscreen>
        <div className="attendance-container">
          {/* Header */}
          <div className="attendance-header">
            <div className="header-top">
              <button className="back-button" onClick={() => history.push('/home')}>
                <IonIcon icon={arrowBackOutline} />
              </button>
              <h1 className="page-title">Attendance</h1>
              {isAdmin && (
                <button className="btn btn-primary-small" onClick={() => setShowCreateModal(true)}>
                  <IonIcon icon={addOutline} />
                </button>
              )}
            </div>

            {/* Tabs */}
            <IonSegment value={activeTab} onIonChange={(e) => setActiveTab(e.detail.value)}>
              <IonSegmentButton value="check-in">
                <IonIcon icon={checkmarkCircleOutline} />
                Check In
              </IonSegmentButton>
              {isAdmin && (
                <IonSegmentButton value="manage">
                  <IonIcon icon={peopleOutline} />
                  Manage
                </IonSegmentButton>
              )}
            </IonSegment>
          </div>

          {/* Content */}
          <div className="attendance-content">
            {/* CHECK-IN TAB (For all users) */}
            {activeTab === 'check-in' && (
              <div className="check-in-section">
                <div className="check-in-card">
                  <div className="check-in-icon">
                    <IonIcon icon={keyOutline} />
                  </div>
                  <h2>Check In to Event</h2>
                  <p>Enter the 6-digit code from your event coordinator</p>
                  <button 
                    className="btn btn-primary btn-large"
                    onClick={() => setShowCheckInModal(true)}
                  >
                    <IonIcon icon={checkmarkCircleOutline} />
                    Enter Code
                  </button>
                </div>

                {/* Recent Events */}
                <div className="recent-events">
                  <h3>Recent Events</h3>
                  {loading ? (
                    <div className="skeleton-list">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="skeleton-card" />
                      ))}
                    </div>
                  ) : events.length > 0 ? (
                    <div className="events-list">
                      {events.slice(0, 5).map(event => {
                        const isCheckedIn = event.attendees?.some(a => a.uid === userProfile?.uid);
                        return (
                          <div key={event.id} className="event-item">
                            <div className="event-info">
                              <h4>{event.title}</h4>
                              <p className="event-meta">
                                <IonIcon icon={timeOutline} />
                                {formatDate(event.date)}
                              </p>
                              <p className="event-meta">
                                <IonIcon icon={peopleOutline} />
                                {event.attendees?.length || 0} checked in
                              </p>
                            </div>
                            <div className="event-status">
                              {isCheckedIn ? (
                                <span className="badge badge-success">
                                  <IonIcon icon={checkmarkCircleOutline} />
                                  Checked In
                                </span>
                              ) : event.status === 'active' ? (
                                <span className="badge badge-warning">Active</span>
                              ) : (
                                <span className="badge badge-secondary">Ended</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="empty-state">
                      <p>No events yet</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* MANAGE TAB (Admin only) */}
            {activeTab === 'manage' && isAdmin && (
              <div className="manage-section">
                {loading ? (
                  <div className="skeleton-list">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="skeleton-card" />
                    ))}
                  </div>
                ) : events.length > 0 ? (
                  <div className="admin-events-list">
                    {events.map(event => (
                      <div key={event.id} className="admin-event-card">
                        <div className="event-header">
                          <div>
                            <h3>{event.title}</h3>
                            <p className="event-type">{event.type}</p>
                          </div>
                          <span className={`status-badge ${event.status}`}>
                            {event.status}
                          </span>
                        </div>

                        <div className="event-details">
                          <div className="detail-item">
                            <IonIcon icon={timeOutline} />
                            <span>{formatDate(event.date)}</span>
                          </div>
                          <div className="detail-item">
                            <IonIcon icon={peopleOutline} />
                            <span>{event.attendees?.length || 0} attendees</span>
                          </div>
                        </div>

                        {event.status === 'active' && (
                          <div className="event-code">
                            <div className="code-display">
                              <IonIcon icon={keyOutline} />
                              <span className="code">{event.code}</span>
                              <button 
                                className="copy-btn"
                                onClick={() => copyCode(event.code)}
                              >
                                <IonIcon icon={copyOutline} />
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Attendees List */}
                        {event.attendees && event.attendees.length > 0 && (
                          <div className="attendees-list">
                            <h4>Attendees ({event.attendees.length})</h4>
                            <div className="attendees-grid">
                              {event.attendees.map((attendee, idx) => (
                                <div key={idx} className="attendee-item">
                                  <div className="attendee-avatar">
                                    {attendee.name.charAt(0).toUpperCase()}
                                  </div>
                                  <div className="attendee-info">
                                    <p className="attendee-name">{attendee.name}</p>
                                    <p className="attendee-time">
                                      {new Date(attendee.checkedInAt).toLocaleTimeString()}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {event.status === 'active' && (
                          <div className="event-actions">
                            <button 
                              className="btn btn-secondary"
                              onClick={() => endEvent(event.id)}
                            >
                              End Event
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">
                    <IonIcon icon={peopleOutline} className="empty-icon" />
                    <h3>No Events Yet</h3>
                    <p>Create your first attendance event</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Create Event Modal (Admin) */}
        {showCreateModal && (
          <div 
            className="modal-backdrop" 
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) {
                setShowCreateModal(false);
              }
            }}
          >
            <div className="modal-content">
              <button className="modal-close" onClick={() => setShowCreateModal(false)}>
                <IonIcon icon={closeOutline} />
              </button>
              
              <h2>Create Attendance Event</h2>
              
              <form onSubmit={handleCreateEvent}>
                <div className="form-group">
                  <label>Event Title *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g., Sunday Service"
                    value={eventForm.title}
                    onChange={(e) => setEventForm({...eventForm, title: e.target.value})}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Event Type</label>
                  <select
                    className="form-input"
                    value={eventForm.type}
                    onChange={(e) => setEventForm({...eventForm, type: e.target.value})}
                  >
                    <option>Sunday Service</option>
                    <option>Bible Study</option>
                    <option>Prayer Meeting</option>
                    <option>Youth Service</option>
                    <option>Special Event</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Date & Time *</label>
                  <input
                    type="datetime-local"
                    className="form-input"
                    value={eventForm.date}
                    onChange={(e) => setEventForm({...eventForm, date: e.target.value})}
                    required
                  />
                </div>

                <div className="modal-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Create Event
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Check-In Modal */}
        {showCheckInModal && (
          <div 
            className="modal-backdrop" 
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) {
                setShowCheckInModal(false);
              }
            }}
          >
            <div className="modal-content check-in-modal">
              <button className="modal-close" onClick={() => setShowCheckInModal(false)}>
                <IonIcon icon={closeOutline} />
              </button>
              
              <div className="check-in-modal-content">
                <div className="check-in-icon large">
                  <IonIcon icon={keyOutline} />
                </div>
                <h2>Enter Check-In Code</h2>
                <p>Ask your event coordinator for the 6-digit code</p>
                
                <input
                  type="text"
                  className="code-input"
                  placeholder="000000"
                  maxLength="6"
                  value={checkInCode}
                  onChange={(e) => setCheckInCode(e.target.value.replace(/\D/g, ''))}
                  autoFocus
                />

                <button 
                  className="btn btn-primary btn-large"
                  onClick={handleCheckIn}
                  disabled={checkInLoading || checkInCode.length !== 6}
                >
                  {checkInLoading ? (
                    <div className="spinner" />
                  ) : (
                    <>
                      <IonIcon icon={checkmarkCircleOutline} />
                      Check In
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </IonContent>
    </IonPage>
  );
};

export default AttendanceSystem;
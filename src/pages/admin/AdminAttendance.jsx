// src/pages/admin/AdminAttendance.jsx
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { IonContent, IonPage, IonIcon } from '@ionic/react';
import {
  arrowBackOutline,
  peopleOutline,
  calendarOutline,
  timeOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
  searchOutline,
  downloadOutline,
  addOutline,
  keyOutline,
  copyOutline,
  trashOutline,
  chevronDownOutline,
  chevronUpOutline
} from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  orderBy,
  updateDoc,
  doc,
  deleteDoc
} from 'firebase/firestore';
import { db, useAuth } from '../../contexts/AuthContext';
import './AdminAttendance.css';

const AdminAttendance = () => {
  const history = useHistory();
  const { userProfile } = useAuth();
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [expandedEvent, setExpandedEvent] = useState(null);
  const [eventForm, setEventForm] = useState({
    title: '',
    date: '',
    type: 'Sunday Service'
  });

  useEffect(() => {
    // Check if user is admin
    if (userProfile && userProfile.role !== 'admin') {
      alert('Access denied. Admin only.');
      history.push('/home');
      return;
    }
    fetchEvents();
  }, [userProfile]);

  // Filter events whenever search or status changes
  useEffect(() => {
    let filtered = events;

    if (statusFilter !== 'all') {
      filtered = filtered.filter(e => e.status === statusFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter(e =>
        e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.attendees?.some(a => a.name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    setFilteredEvents(filtered);
  }, [events, statusFilter, searchTerm]);

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
      alert('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const generateCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const handleCreateEvent = async (e) => {
    if (e) e.preventDefault();
    
    if (!eventForm.title || !eventForm.date) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const code = generateCode();
      const newEvent = {
        title: eventForm.title,
        type: eventForm.type,
        date: eventForm.date,
        code: code,
        status: 'active',
        createdAt: new Date().toISOString(),
        createdBy: userProfile?.uid,
        attendees: []
      };

      await addDoc(collection(db, 'attendanceEvents'), newEvent);
      
      alert(`Event created successfully! Check-in code: ${code}`);
      setShowCreateModal(false);
      setEventForm({ title: '', date: '', type: 'Sunday Service' });
      fetchEvents();
    } catch (error) {
      console.error('Error creating event:', error);
      alert('Failed to create event');
    }
  };

  const endEvent = async (eventId) => {
    if (!window.confirm('End this event? No more check-ins will be allowed.')) return;

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

  const deleteEvent = async (eventId) => {
    if (!window.confirm('Delete this event? This action cannot be undone.')) return;

    try {
      await deleteDoc(doc(db, 'attendanceEvents', eventId));
      alert('Event deleted successfully');
      fetchEvents();
    } catch (error) {
      console.error('Error deleting event:', error);
      alert('Failed to delete event');
    }
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    alert('Code copied to clipboard!');
  };

  const exportAttendees = (event) => {
    const csv = [
      ['Name', 'Email', 'Check-in Time'],
      ...event.attendees.map(a => [
        a.name,
        a.email,
        new Date(a.checkedInAt).toLocaleString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${event.title}-attendance-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
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

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const toggleExpand = (eventId) => {
    setExpandedEvent(expandedEvent === eventId ? null : eventId);
  };

  const totalAttendees = events.reduce((sum, e) => sum + (e.attendees?.length || 0), 0);
  const activeEvents = events.filter(e => e.status === 'active').length;

  return (
    <IonPage>
      <IonContent fullscreen>
        <div className="admin-attendance-container">
          {/* Header */}
          <div className="admin-attendance-header">
            <div className="header-top">
              <button className="back-button" onClick={() => history.push('/admin/dashboard')}>
                <IonIcon icon={arrowBackOutline} />
              </button>
              <h1 className="page-title">Attendance Management</h1>
              <button className="add-button" onClick={() => setShowCreateModal(true)}>
                <IonIcon icon={addOutline} />
              </button>
            </div>

            {/* Stats Summary */}
            <div className="stats-summary">
              <div className="stat-box">
                <IonIcon icon={calendarOutline} />
                <div>
                  <p className="stat-label">Total Events</p>
                  <p className="stat-value">{events.length}</p>
                </div>
              </div>
              <div className="stat-box">
                <IonIcon icon={checkmarkCircleOutline} />
                <div>
                  <p className="stat-label">Active</p>
                  <p className="stat-value">{activeEvents}</p>
                </div>
              </div>
              <div className="stat-box">
                <IonIcon icon={peopleOutline} />
                <div>
                  <p className="stat-label">Total Attendees</p>
                  <p className="stat-value">{totalAttendees}</p>
                </div>
              </div>
            </div>

            {/* Search and Filter */}
            <div className="search-filter">
              <div className="search-box">
                <IonIcon icon={searchOutline} />
                <input
                  type="text"
                  placeholder="Search events or attendees..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="ended">Ended</option>
              </select>
            </div>
          </div>

          {/* Events List */}
          <div className="events-content">
            {loading ? (
              <div className="skeleton-list">
                {[1, 2, 3].map(i => (
                  <div key={i} className="skeleton-card" />
                ))}
              </div>
            ) : filteredEvents.length === 0 ? (
              <div className="empty-state">
                <IonIcon icon={peopleOutline} className="empty-icon" />
                <h3>No Events Found</h3>
                <p>
                  {searchTerm || statusFilter !== 'all'
                    ? 'Try adjusting your filters'
                    : 'Create your first event to get started'}
                </p>
              </div>
            ) : (
              <div className="events-list">
                {filteredEvents.map((event) => (
                  <div key={event.id} className="event-card">
                    {/* Event Header */}
                    <div className="event-header">
                      <div className="event-title-section">
                        <h3>{event.title}</h3>
                        <span className={`status-badge ${event.status}`}>
                          {event.status}
                        </span>
                      </div>
                      <p className="event-type">{event.type}</p>
                      <div className="event-meta">
                        <span>
                          <IonIcon icon={calendarOutline} />
                          {formatDate(event.date)}
                        </span>
                        <span>
                          <IonIcon icon={peopleOutline} />
                          {event.attendees?.length || 0} attendees
                        </span>
                      </div>
                    </div>

                    {/* Active Event Code */}
                    {event.status === 'active' && (
                      <div className="code-section">
                        <div className="code-display">
                          <IonIcon icon={keyOutline} />
                          <div>
                            <p className="code-label">Check-in Code</p>
                            <p className="code-value">{event.code}</p>
                          </div>
                          <button
                            className="copy-code-btn"
                            onClick={() => copyCode(event.code)}
                          >
                            <IonIcon icon={copyOutline} />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Attendees Toggle */}
                    <button
                      className="attendees-toggle"
                      onClick={() => toggleExpand(event.id)}
                    >
                      <div className="toggle-left">
                        <IonIcon icon={peopleOutline} />
                        <span>View All Attendees ({event.attendees?.length || 0})</span>
                      </div>
                      <IonIcon 
                        icon={expandedEvent === event.id ? chevronUpOutline : chevronDownOutline} 
                      />
                    </button>

                    {/* Expanded Attendees */}
                    {expandedEvent === event.id && (
                      <div className="attendees-section">
                        {!event.attendees || event.attendees.length === 0 ? (
                          <p className="no-attendees">No attendees yet</p>
                        ) : (
                          <>
                            <div className="attendees-grid">
                              {event.attendees.map((attendee, idx) => (
                                <div key={idx} className="attendee-card">
                                  <div className="attendee-avatar">
                                    {attendee.name.charAt(0).toUpperCase()}
                                  </div>
                                  <div className="attendee-info">
                                    <p className="attendee-name">{attendee.name}</p>
                                    <p className="attendee-email">{attendee.email}</p>
                                    <p className="attendee-time">
                                      <IonIcon icon={timeOutline} />
                                      {formatTime(attendee.checkedInAt)}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                            <button
                              className="export-btn"
                              onClick={() => exportAttendees(event)}
                            >
                              <IonIcon icon={downloadOutline} />
                              Export to CSV
                            </button>
                          </>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="event-actions">
                      {event.status === 'active' && (
                        <button
                          className="btn btn-warning"
                          onClick={() => endEvent(event.id)}
                        >
                          <IonIcon icon={closeCircleOutline} />
                          End Event
                        </button>
                      )}
                      <button
                        className="btn btn-danger"
                        onClick={() => deleteEvent(event.id)}
                      >
                        <IonIcon icon={trashOutline} />
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Create Event Modal - Using Portal */}
        {showCreateModal && createPortal(
          <div 
            className="modal-backdrop"
            onClick={(e) => {
              if (e.target.className === 'modal-backdrop') {
                setShowCreateModal(false);
              }
            }}
          >
            <div 
              className="modal-content"
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                className="modal-close" 
                onClick={(e) => {
                  e.stopPropagation();
                  setShowCreateModal(false);
                }}
              >
                <IonIcon icon={closeCircleOutline} />
              </button>
              
              <h2>Create Event</h2>
              
              <form onSubmit={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleCreateEvent(e);
              }}>
                <div className="form-group">
                  <label>Event Title *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g., Sunday Service"
                    value={eventForm.title}
                    onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                    onClick={(e) => e.stopPropagation()}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Event Type</label>
                  <select
                    className="form-input"
                    value={eventForm.type}
                    onChange={(e) => setEventForm({ ...eventForm, type: e.target.value })}
                    onClick={(e) => e.stopPropagation()}
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
                    onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })}
                    onClick={(e) => e.stopPropagation()}
                    required
                  />
                </div>

                <div className="modal-actions">
                  <button 
                    type="button"
                    className="btn btn-secondary" 
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowCreateModal(false);
                    }}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Create Event
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}
      </IonContent>
    </IonPage>
  );
};

export default AdminAttendance;
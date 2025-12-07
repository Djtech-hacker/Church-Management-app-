// src/pages/Attendance.jsx
import { useState, useEffect } from 'react';
import { IonContent, IonPage, IonIcon } from '@ionic/react';
import {
  checkmarkCircleOutline,
  calendarOutline,
  timeOutline,
  locationOutline,
  arrowBackOutline
} from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { collection, addDoc, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../contexts/AuthContext';
import { useAuth } from '../contexts/AuthContext';
import './Attendance.css';

const Attendance = () => {
  const { currentUser, userProfile } = useAuth();
  const history = useHistory();
  const [checking, setChecking] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [recentAttendance, setRecentAttendance] = useState([]);
  const [todayAttendance, setTodayAttendance] = useState(null);

  useEffect(() => {
    checkTodayAttendance();
    fetchRecentAttendance();
  }, []);

  const checkTodayAttendance = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const q = query(
        collection(db, 'attendance'),
        where('userId', '==', currentUser.uid),
        where('timestamp', '>=', today.toISOString()),
        limit(1)
      );
      
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        setTodayAttendance(querySnapshot.docs[0].data());
      }
    } catch (error) {
      console.error('Error checking attendance:', error);
    }
  };

  const fetchRecentAttendance = async () => {
    try {
      const q = query(
        collection(db, 'attendance'),
        where('userId', '==', currentUser.uid),
        orderBy('timestamp', 'desc'),
        limit(5)
      );
      
      const querySnapshot = await getDocs(q);
      const records = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setRecentAttendance(records);
    } catch (error) {
      console.error('Error fetching attendance:', error);
    }
  };

  const handleCheckIn = async () => {
    if (todayAttendance) {
      setError('You have already checked in today');
      return;
    }

    setChecking(true);
    setError('');

    try {
      // Get current service (you can modify this logic)
      const currentService = getCurrentService();
      
      await addDoc(collection(db, 'attendance'), {
        userId: currentUser.uid,
        userName: userProfile?.fullName || 'Member',
        serviceId: currentService.id,
        serviceName: currentService.name,
        timestamp: new Date().toISOString(),
        location: 'Main Church', // Can be dynamic
        checkInTime: new Date().toLocaleTimeString()
      });

      setSuccess(true);
      await checkTodayAttendance();
      await fetchRecentAttendance();

      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('Error checking in:', error);
      setError('Failed to check in. Please try again.');
    } finally {
      setChecking(false);
    }
  };

  const getCurrentService = () => {
    const hour = new Date().getHours();
    const day = new Date().getDay();

    if (day === 0) { // Sunday
      if (hour < 10) return { id: 'first-service', name: 'First Service' };
      if (hour < 13) return { id: 'second-service', name: 'Second Service' };
      return { id: 'evening-service', name: 'Evening Service' };
    } else if (day === 3) { // Wednesday
      return { id: 'midweek-service', name: 'Midweek Service' };
    } else if (day === 5) { // Friday
      return { id: 'prayer-meeting', name: 'Prayer Meeting' };
    }

    return { id: 'special-service', name: 'Special Service' };
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <IonPage>
      <IonContent fullscreen>
        <div className="attendance-container">
          {/* Header */}
          <div className="attendance-header">
            <button className="back-button" onClick={() => history.goBack()}>
              <IonIcon icon={arrowBackOutline} />
            </button>
            <h1 className="attendance-title">Attendance</h1>
          </div>

          {success ? (
            // Success State
            <div className="success-container animate-scale-in">
              <div className="success-animation">
                <div className="success-circle">
                  <IonIcon icon={checkmarkCircleOutline} className="success-icon" />
                </div>
                <div className="success-ripple"></div>
                <div className="success-ripple delay-1"></div>
                <div className="success-ripple delay-2"></div>
              </div>
              <h2 className="success-title">Check-In Successful!</h2>
              <p className="success-message">
                Thank you for attending service today
              </p>
              <div className="success-details">
                <div className="detail-item">
                  <IonIcon icon={calendarOutline} />
                  <span>{formatDate(new Date().toISOString())}</span>
                </div>
                <div className="detail-item">
                  <IonIcon icon={timeOutline} />
                  <span>{new Date().toLocaleTimeString()}</span>
                </div>
                <div className="detail-item">
                  <IonIcon icon={locationOutline} />
                  <span>Main Church</span>
                </div>
              </div>
            </div>
          ) : (
            // Check-In Form
            <div className="check-in-container">
              <div className="check-in-card animate-fade-in-up">
                <div className="check-in-icon-wrapper">
                  <IonIcon icon={checkmarkCircleOutline} className="check-in-icon" />
                </div>

                <h2 className="check-in-title">One-Tap Check-In</h2>
                <p className="check-in-subtitle">
                  Mark your attendance for today's service
                </p>

                {error && (
                  <div className="alert alert-danger animate-shake">
                    {error}
                  </div>
                )}

                {todayAttendance ? (
                  <div className="already-checked-in">
                    <IonIcon icon={checkmarkCircleOutline} className="checked-icon" />
                    <p className="checked-text">
                      You've already checked in today at{' '}
                      <strong>{todayAttendance.checkInTime}</strong>
                    </p>
                  </div>
                ) : (
                  <button
                    className="check-in-button ripple"
                    onClick={handleCheckIn}
                    disabled={checking}
                  >
                    {checking ? (
                      <div className="spinner"></div>
                    ) : (
                      <>
                        <IonIcon icon={checkmarkCircleOutline} />
                        <span>Check In Now</span>
                      </>
                    )}
                  </button>
                )}

                <div className="service-info">
                  <h3 className="service-info-title">Today's Service</h3>
                  <p className="service-name">{getCurrentService().name}</p>
                  <p className="service-time">{new Date().toLocaleDateString()}</p>
                </div>
              </div>

              {/* Recent Attendance */}
              {recentAttendance.length > 0 && (
                <div className="recent-attendance animate-fade-in-up">
                  <h3 className="section-title">Recent Check-Ins</h3>
                  <div className="attendance-list">
                    {recentAttendance.map((record, index) => (
                      <div
                        key={record.id}
                        className="attendance-record stagger-item"
                        style={{ animationDelay: `${index * 0.1}s` }}
                      >
                        <div className="record-icon">
                          <IonIcon icon={checkmarkCircleOutline} />
                        </div>
                        <div className="record-details">
                          <p className="record-service">{record.serviceName}</p>
                          <p className="record-date">{formatDate(record.timestamp)}</p>
                        </div>
                        <div className="record-time">
                          <IonIcon icon={timeOutline} />
                          <span>{record.checkInTime}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Attendance;
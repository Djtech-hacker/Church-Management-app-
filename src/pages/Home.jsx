// src/pages/Home.jsx
import { useState, useEffect } from 'react';
import { IonContent, IonPage, IonIcon, IonRefresher, IonRefresherContent } from '@ionic/react';
import {
  moonOutline,
  sunnyOutline,
  notificationsOutline,
  checkmarkCircle,
  peopleOutline,
  bookOutline,
  handRightOutline,
  heartOutline,
  walletOutline,
  playCircleOutline
} from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../contexts/AuthContext';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import TabNav from '../components/TabNav';
import './Home.css';

const Home = () => {
  const { userProfile } = useAuth();
  const { darkMode, toggleTheme } = useTheme();
  const history = useHistory();
  const [recentAnnouncements, setRecentAnnouncements] = useState([]);
  const [upcomingPrograms, setUpcomingPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notificationCount, setNotificationCount] = useState(0);

  const quickActions = [
    {
      icon: checkmarkCircle,
      label: 'Attendance',
      path: '/attendance',
      color: '#10b981',
      gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
    },
    {
      icon: walletOutline,
      label: 'Donate',
      path: '/donations',
      color: '#f59e0b',
      gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
    },
    {
      icon: handRightOutline,
      label: 'Prayer',
      path: '/prayer-requests',
      color: '#8b5cf6',
      gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)'
    },
    {
      icon: heartOutline,
      label: 'Testimony',
      path: '/testimonies',
      color: '#ec4899',
      gradient: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)'
    },
    {
      icon: playCircleOutline,
      label: 'Sermons',
      path: '/sermons',
      color: '#3b82f6',
      gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
    },
    {
      icon: peopleOutline,
      label: 'Groups',
      path: '/groups',
      color: '#06b6d4',
      gradient: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)'
    }
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch recent announcements
      const announcementsQuery = query(
        collection(db, 'announcements'),
        orderBy('createdAt', 'desc'),
        limit(3)
      );
      const announcementsSnap = await getDocs(announcementsQuery);
      const announcements = announcementsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setRecentAnnouncements(announcements);

      // Fetch upcoming programs
      const today = new Date().toISOString();
      const programsQuery = query(
        collection(db, 'programs'),
        orderBy('date', 'asc'),
        limit(3)
      );
      const programsSnap = await getDocs(programsQuery);
      const programs = programsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Filter only future programs
      const upcomingPrograms = programs.filter(p => p.date >= today);
      setUpcomingPrograms(upcomingPrograms);

      // Only show notification badge if there are NEW unread items
      // For now, we'll only show if there are high priority announcements
      const highPriorityCount = announcements.filter(a => a.priority === 'high').length;
      setNotificationCount(highPriorityCount);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async (event) => {
    await fetchData();
    event.detail.complete();
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <IonPage>
      <IonContent fullscreen>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        <div className="home-container">
          {/* Header */}
          <div className="home-header gradient-animated">
            <div className="header-content">
              <div className="greeting-section animate-fade-in-down">
                <h2 className="greeting">{getGreeting()}</h2>
                <h1 className="user-name">{userProfile?.fullName || 'Member'}</h1>
                <p className="user-role">{userProfile?.role || 'Member'}</p>
              </div>
              
              <div className="header-actions animate-fade-in-down">
                <button className="icon-button" onClick={toggleTheme}>
                  <IonIcon icon={darkMode ? sunnyOutline : moonOutline} />
                </button>
                <button className="icon-button">
                  <IonIcon icon={notificationsOutline} />
                  {notificationCount > 0 && (
                    <span className="notification-badge">{notificationCount}</span>
                  )}
                </button>
              </div>
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

          <div className="home-content">
            {/* Quick Actions */}
            <section className="section animate-fade-in-up">
              <h3 className="section-title">Quick Actions</h3>
              <div className="quick-actions-grid">
                {quickActions.map((action, index) => (
                  <button
                    key={index}
                    className="quick-action-card stagger-item hover-lift"
                    onClick={() => history.push(action.path)}
                  >
                    <div
                      className="action-icon-wrapper"
                      style={{ background: action.gradient }}
                    >
                      <IonIcon icon={action.icon} className="action-icon" />
                    </div>
                    <span className="action-label">{action.label}</span>
                  </button>
                ))}
              </div>
            </section>

            {/* Recent Announcements */}
            <section className="section animate-fade-in-up">
              <div className="section-header">
                <h3 className="section-title">Recent Announcements</h3>
                <button
                  className="see-all-btn"
                  onClick={() => history.push('/announcements')}
                >
                  See All
                </button>
              </div>

              {loading ? (
                <div className="skeleton-container">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="skeleton-card">
                      <div className="skeleton skeleton-title" />
                      <div className="skeleton skeleton-text" />
                      <div className="skeleton skeleton-text" style={{ width: '60%' }} />
                    </div>
                  ))}
                </div>
              ) : recentAnnouncements.length > 0 ? (
                <div className="announcement-list">
                  {recentAnnouncements.map((announcement, index) => (
                    <div key={announcement.id} className="announcement-card stagger-item hover-lift">
                      <div className="announcement-header">
                        <h4 className="announcement-title">{announcement.title}</h4>
                        <span className="announcement-date">
                          {new Date(announcement.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="announcement-body">
                        {announcement.content.substring(0, 100)}...
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <IonIcon icon={bookOutline} className="empty-icon" />
                  <p className="empty-text">No announcements yet</p>
                </div>
              )}
            </section>

            {/* Upcoming Programs */}
            <section className="section animate-fade-in-up">
              <div className="section-header">
                <h3 className="section-title">Upcoming Programs</h3>
                <button
                  className="see-all-btn"
                  onClick={() => history.push('/programs')}
                >
                  See All
                </button>
              </div>

              {loading ? (
                <div className="skeleton-container">
                  {[1, 2].map((i) => (
                    <div key={i} className="skeleton-card">
                      <div className="skeleton skeleton-title" />
                      <div className="skeleton skeleton-text" />
                    </div>
                  ))}
                </div>
              ) : upcomingPrograms.length > 0 ? (
                <div className="program-list">
                  {upcomingPrograms.map((program, index) => (
                    <div key={program.id} className="program-card stagger-item hover-lift">
                      <div className="program-date-badge">
                        <span className="badge-day">
                          {new Date(program.date).getDate()}
                        </span>
                        <span className="badge-month">
                          {new Date(program.date).toLocaleString('default', { month: 'short' })}
                        </span>
                      </div>
                      <div className="program-details">
                        <h4 className="program-title">{program.title}</h4>
                        <p className="program-time">{program.time}</p>
                        <p className="program-location">{program.location}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <IonIcon icon={bookOutline} className="empty-icon" />
                  <p className="empty-text">No upcoming programs</p>
                </div>
              )}
            </section>
          </div>
        </div>

        <TabNav />
      </IonContent>
    </IonPage>
  );
};

export default Home;
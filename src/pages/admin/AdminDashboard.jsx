// src/pages/admin/AdminDashboard.jsx
import { useState, useEffect } from 'react';
import { IonContent, IonPage, IonIcon } from '@ionic/react';
import {
  peopleOutline,
  megaphoneOutline,
  calendarOutline,
  walletOutline,
  playCircleOutline,
  checkmarkCircleOutline,
  arrowBackOutline,
  statsChartOutline,
  chevronForwardOutline,
  handRightOutline,
  sparklesOutline
} from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../contexts/AuthContext';
import { useAuth } from '../../contexts/AuthContext';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const history = useHistory();
  const { userProfile } = useAuth();
  const [stats, setStats] = useState({
    totalMembers: 0,
    activeEvents: 0,
    totalDonations: 0,
    todayAttendance: 0,
    pendingTestimonies: 0,
    prayerRequests: 0
  });
  const [loading, setLoading] = useState(true);

  const adminMenuItems = [
    {
      icon: peopleOutline,
      label: 'Manage Members',
      path: '/admin/members',
      color: '#6366f1',
      count: stats.totalMembers
    },
    {
      icon: megaphoneOutline,
      label: 'Announcements',
      path: '/admin/announcements',
      color: '#8b5cf6',
      count: null
    },
    {
      icon: calendarOutline,
      label: 'Programs & Events',
      path: '/admin/programs',
      color: '#ec4899',
      count: stats.activeEvents
    },
    {
      icon: playCircleOutline,
      label: 'Sermons',
      path: '/admin/sermons',
      color: '#3b82f6',
      count: null
    },
    {
      icon: checkmarkCircleOutline,
      label: 'Attendance',
      path: '/admin/attendance',
      color: '#10b981',
      count: stats.todayAttendance
    },
    {
      icon: walletOutline,
      label: 'Donations',
      path: '/admin/donations',
      color: '#f59e0b',
      count: `₦${stats.totalDonations.toLocaleString()}`
    }
  ];

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      // Fetch total members
      const membersSnapshot = await getDocs(collection(db, 'users'));
      const totalMembers = membersSnapshot.size;

      // Fetch active events
      const today = new Date().toISOString();
      const eventsQuery = query(
        collection(db, 'programs'),
        where('date', '>=', today)
      );
      const eventsSnapshot = await getDocs(eventsQuery);
      const activeEvents = eventsSnapshot.size;

      // Fetch total donations
      const donationsSnapshot = await getDocs(collection(db, 'donations'));
      const totalDonations = donationsSnapshot.docs.reduce((sum, doc) => {
        return sum + (doc.data().amount || 0);
      }, 0);

      // Fetch today's attendance
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const attendanceQuery = query(
        collection(db, 'attendance'),
        where('timestamp', '>=', todayStart.toISOString())
      );
      const attendanceSnapshot = await getDocs(attendanceQuery);
      const todayAttendance = attendanceSnapshot.size;

      // Fetch pending testimonies
      const testimoniesQuery = query(
        collection(db, 'testimonies'),
        where('status', '==', 'pending')
      );
      const testimoniesSnapshot = await getDocs(testimoniesQuery);
      const pendingTestimonies = testimoniesSnapshot.size;

      // Fetch prayer requests
      const prayerSnapshot = await getDocs(collection(db, 'prayerRequests'));
      const prayerRequests = prayerSnapshot.size;

      setStats({
        totalMembers,
        activeEvents,
        totalDonations,
        todayAttendance,
        pendingTestimonies,
        prayerRequests
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonPage>
      <IonContent fullscreen>
        <div className="admin-dashboard-container">
          {/* Header */}
          <div className="admin-header gradient-animated">
            <button className="back-button" onClick={() => history.push('/profile')}>
              <IonIcon icon={arrowBackOutline} />
            </button>
            <div className="header-content">
              <div className="header-icon-wrapper">
                <IonIcon icon={statsChartOutline} className="header-icon" />
              </div>
              <h1 className="admin-title">Admin Dashboard</h1>
              <p className="admin-subtitle">Welcome, {userProfile?.fullName}</p>
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

          <div className="admin-content">
            {/* Quick Stats */}
            <div className="stats-grid animate-fade-in-up">
              <div className="stat-card stagger-item" style={{ animationDelay: '0.1s' }}>
                <div className="stat-icon" style={{ background: '#6366f120', color: '#6366f1' }}>
                  <IonIcon icon={peopleOutline} />
                </div>
                <div className="stat-details">
                  <p className="stat-label">Total Members</p>
                  <h3 className="stat-value">{loading ? '...' : stats.totalMembers}</h3>
                </div>
              </div>

              <div className="stat-card stagger-item" style={{ animationDelay: '0.2s' }}>
                <div className="stat-icon" style={{ background: '#10b98120', color: '#10b981' }}>
                  <IonIcon icon={checkmarkCircleOutline} />
                </div>
                <div className="stat-details">
                  <p className="stat-label">Today's Attendance</p>
                  <h3 className="stat-value">{loading ? '...' : stats.todayAttendance}</h3>
                </div>
              </div>

              <div className="stat-card stagger-item" style={{ animationDelay: '0.3s' }}>
                <div className="stat-icon" style={{ background: '#ec489920', color: '#ec4899' }}>
                  <IonIcon icon={calendarOutline} />
                </div>
                <div className="stat-details">
                  <p className="stat-label">Active Events</p>
                  <h3 className="stat-value">{loading ? '...' : stats.activeEvents}</h3>
                </div>
              </div>

              <div className="stat-card stagger-item" style={{ animationDelay: '0.4s' }}>
                <div className="stat-icon" style={{ background: '#f59e0b20', color: '#f59e0b' }}>
                  <IonIcon icon={walletOutline} />
                </div>
                <div className="stat-details">
                  <p className="stat-label">Total Donations</p>
                  <h3 className="stat-value">
                    {loading ? '...' : `₦${stats.totalDonations.toLocaleString()}`}
                  </h3>
                </div>
              </div>
            </div>

            {/* Admin Menu */}
            <div className="admin-menu animate-fade-in-up">
              <h3 className="section-title">Management</h3>
              <div className="admin-menu-grid">
                {adminMenuItems.map((item, index) => (
                  <button
                    key={index}
                    className="admin-menu-item stagger-item hover-lift"
                    onClick={() => history.push(item.path)}
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="menu-item-icon" style={{ background: `${item.color}15`, color: item.color }}>
                      <IonIcon icon={item.icon} />
                    </div>
                    <div className="menu-item-content">
                      <p className="menu-item-label">{item.label}</p>
                      {item.count !== null && (
                        <p className="menu-item-count">{item.count}</p>
                      )}
                    </div>
                    <IonIcon icon={chevronForwardOutline} className="menu-arrow" />
                  </button>
                ))}
              </div>
            </div>

            {/* Pending Actions */}
            {(stats.pendingTestimonies > 0 || stats.prayerRequests > 0) && (
              <div className="pending-actions animate-fade-in-up">
                <h3 className="section-title">Pending Actions</h3>
                <div className="pending-list">
                  {stats.pendingTestimonies > 0 && (
                    <div className="pending-item">
                      <div className="pending-icon">
                        <IonIcon icon={sparklesOutline} />
                      </div>
                      <div className="pending-details">
                        <p className="pending-title">Testimonies to Approve</p>
                        <p className="pending-count">{stats.pendingTestimonies} pending</p>
                      </div>
                    </div>
                  )}

                  {stats.prayerRequests > 0 && (
                    <div className="pending-item">
                      <div className="pending-icon">
                        <IonIcon icon={handRightOutline} />
                      </div>
                      <div className="pending-details">
                        <p className="pending-title">Prayer Requests</p>
                        <p className="pending-count">{stats.prayerRequests} requests</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default AdminDashboard;
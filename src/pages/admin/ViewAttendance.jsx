// src/pages/admin/ViewAttendance.jsx
import { useState, useEffect } from 'react';
import { IonContent, IonPage, IonIcon } from '@ionic/react';
import {
  checkmarkCircleOutline,
  arrowBackOutline,
  downloadOutline,
  searchOutline,
  funnelOutline
} from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../../contexts/AuthContext';
import './ManageAnnouncements.css';

const ViewAttendance = () => {
  const history = useHistory();
  const [attendance, setAttendance] = useState([]);
  const [filteredAttendance, setFilteredAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    byService: {},
    todayCount: 0
  });

  useEffect(() => {
    fetchAttendance();
  }, []);

  useEffect(() => {
    filterAttendance();
  }, [attendance, searchTerm]);

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      let q = query(
        collection(db, 'attendance'),
        orderBy('timestamp', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const attendanceData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setAttendance(attendanceData);
      calculateStats(attendanceData);
    } catch (error) {
      console.error('Error fetching attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayRecords = data.filter(record => {
      const recordDate = new Date(record.timestamp);
      recordDate.setHours(0, 0, 0, 0);
      return recordDate.getTime() === today.getTime();
    });

    const byService = data.reduce((acc, record) => {
      const serviceName = record.serviceName || 'Unknown';
      acc[serviceName] = (acc[serviceName] || 0) + 1;
      return acc;
    }, {});

    setStats({
      total: data.length,
      byService,
      todayCount: todayRecords.length
    });
  };

  const filterAttendance = () => {
    let filtered = [...attendance];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(record =>
        record.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.serviceName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredAttendance(filtered);
  };

  const applyDateFilter = () => {
    let filtered = [...attendance];

    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      filtered = filtered.filter(record => {
        const recordDate = new Date(record.timestamp);
        return recordDate >= start;
      });
    }

    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filtered = filtered.filter(record => {
        const recordDate = new Date(record.timestamp);
        return recordDate <= end;
      });
    }

    setFilteredAttendance(filtered);
    calculateStats(filtered);
  };

  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
    setSearchTerm('');
    setFilteredAttendance(attendance);
    calculateStats(attendance);
  };

  const exportCSV = () => {
    const headers = ['Name', 'Service', 'Date', 'Time', 'Location'];
    const rows = filteredAttendance.map(record => [
      record.userName || 'Unknown',
      record.serviceName || 'Unknown',
      formatDate(record.timestamp),
      record.checkInTime || 'N/A',
      record.location || 'Main Church'
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatDateTime = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
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
        <div className="manage-page-container">
          {/* Header */}
          <div className="manage-header">
            <div className="header-left">
              <button className="back-button" onClick={() => history.push('/admin/dashboard')}>
                <IonIcon icon={arrowBackOutline} />
              </button>
              <div>
                <h1 className="manage-title">Attendance Records</h1>
                <p className="manage-subtitle">{attendance.length} total records</p>
              </div>
            </div>
            <button className="btn btn-primary" onClick={exportCSV}>
              <IonIcon icon={downloadOutline} />
              Export
            </button>
          </div>

          {/* Filters */}
          <div className="manage-controls">
            <div className="search-box">
              <IonIcon icon={searchOutline} className="search-icon" />
              <input
                type="text"
                placeholder="Search by name or service..."
                className="search-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="filter-row">
              <div className="form-group">
                <label className="form-label">Start Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">End Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              <button className="btn btn-primary" onClick={applyDateFilter}>
                <IonIcon icon={funnelOutline} />
                Filter
              </button>
              {(startDate || endDate) && (
                <button className="btn btn-secondary" onClick={clearFilters}>
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Stats Cards */}
          <div className="manage-content">
            <div className="stats-cards">
              <div className="stat-card highlight">
                <h3>Total Records</h3>
                <p className="stat-value">{filteredAttendance.length}</p>
              </div>

              <div className="stat-card">
                <h3>Today's Attendance</h3>
                <p className="stat-value">{stats.todayCount}</p>
              </div>

              {Object.entries(stats.byService).slice(0, 4).map(([service, count]) => (
                <div key={service} className="stat-card">
                  <h3>{service}</h3>
                  <p className="stat-value">{count}</p>
                </div>
              ))}
            </div>

            {/* Records List */}
            {loading ? (
              <div className="skeleton-container">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="skeleton-card">
                    <div className="skeleton skeleton-title" />
                    <div className="skeleton skeleton-text" />
                    <div className="skeleton skeleton-text" />
                  </div>
                ))}
              </div>
            ) : filteredAttendance.length > 0 ? (
              <div className="items-grid">
                {filteredAttendance.map((record, index) => (
                  <div
                    key={record.id}
                    className="item-card stagger-item"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <div className="item-header">
                      <div>
                        <h3 className="item-title">{record.userName || 'Unknown'}</h3>
                        <p className="item-meta">{record.serviceName || 'Service'}</p>
                      </div>
                      <span className="category-badge">
                        ✓ Checked In
                      </span>
                    </div>

                    <p className="item-description">
                      📅 {formatDateTime(record.timestamp)}
                      <br />
                      📍 {record.location || 'Main Church'}
                      {record.checkInTime && <><br />⏰ {record.checkInTime}</>}
                    </p>

                    <div className="item-footer">
                      <span className="item-author">
                        ID: {record.id.substring(0, 8)}...
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state animate-fade-in">
                <IonIcon icon={checkmarkCircleOutline} className="empty-icon" />
                <h3 className="empty-title">No Records Found</h3>
                <p className="empty-text">
                  {searchTerm || startDate || endDate
                    ? 'Try adjusting your filters'
                    : 'No attendance records yet'}
                </p>
              </div>
            )}
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default ViewAttendance;
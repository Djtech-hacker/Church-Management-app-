// src/pages/admin/ManageDonations.jsx
import { useState, useEffect } from 'react';
import { IonContent, IonPage, IonIcon } from '@ionic/react';
import {
  walletOutline,
  arrowBackOutline,
  downloadOutline,
  searchOutline,
  funnelOutline
} from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../../contexts/AuthContext';
import './ManageAnnouncements.css';

const ManageDonations = () => {
  const history = useHistory();
  const [donations, setDonations] = useState([]);
  const [filteredDonations, setFilteredDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    byCategory: {},
    todayTotal: 0
  });

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'tithe', label: 'Tithes' },
    { value: 'offering', label: 'Offerings' },
    { value: 'building', label: 'Building Project' },
    { value: 'welfare', label: 'Welfare' },
    { value: 'mission', label: 'Mission' }
  ];

  useEffect(() => {
    fetchDonations();
  }, []);

  useEffect(() => {
    filterDonations();
  }, [donations, searchTerm, categoryFilter]);

  const fetchDonations = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'donations'),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const donationsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setDonations(donationsData);
      calculateStats(donationsData);
    } catch (error) {
      console.error('Error fetching donations:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayDonations = data.filter(donation => {
      const donationDate = new Date(donation.createdAt);
      donationDate.setHours(0, 0, 0, 0);
      return donationDate.getTime() === today.getTime();
    });

    const todayTotal = todayDonations.reduce((sum, d) => sum + (d.amount || 0), 0);
    const total = data.reduce((sum, d) => sum + (d.amount || 0), 0);

    const byCategory = data.reduce((acc, donation) => {
      const category = donation.category || 'other';
      acc[category] = (acc[category] || 0) + (donation.amount || 0);
      return acc;
    }, {});

    setStats({
      total,
      byCategory,
      todayTotal
    });
  };

  const filterDonations = () => {
    let filtered = [...donations];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(donation =>
        donation.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        donation.category?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(donation => donation.category === categoryFilter);
    }

    setFilteredDonations(filtered);
  };

  const applyDateFilter = () => {
    let filtered = [...donations];

    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      filtered = filtered.filter(donation => {
        const donationDate = new Date(donation.createdAt);
        return donationDate >= start;
      });
    }

    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filtered = filtered.filter(donation => {
        const donationDate = new Date(donation.createdAt);
        return donationDate <= end;
      });
    }

    setFilteredDonations(filtered);
    calculateStats(filtered);
  };

  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
    setSearchTerm('');
    setCategoryFilter('all');
    setFilteredDonations(donations);
    calculateStats(donations);
  };

  const exportCSV = () => {
    const headers = ['Donor', 'Amount', 'Category', 'Date', 'Reference', 'Payment Provider'];
    const rows = filteredDonations.map(donation => [
      donation.userName || 'Anonymous',
      donation.amount || 0,
      donation.category || 'N/A',
      formatDate(donation.createdAt),
      donation.reference || 'N/A',
      donation.paymentProvider || 'N/A'
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `donations-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(amount || 0);
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

  const getCategoryColor = (category) => {
    const colors = {
      tithe: '#6366f1',
      offering: '#10b981',
      building: '#f59e0b',
      welfare: '#ec4899',
      mission: '#8b5cf6'
    };
    return colors[category] || '#6b7280';
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
                <h1 className="manage-title">Donations</h1>
                <p className="manage-subtitle">{donations.length} total donations</p>
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
                placeholder="Search donations..."
                className="search-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="filter-row">
              <div className="form-group">
                <label className="form-label">Category</label>
                <select
                  className="form-input"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

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

              {(startDate || endDate || categoryFilter !== 'all') && (
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
                <h3>Total Donations</h3>
                <p className="stat-value">{formatAmount(stats.total)}</p>
              </div>

              <div className="stat-card">
                <h3>Today's Total</h3>
                <p className="stat-value">{formatAmount(stats.todayTotal)}</p>
              </div>

              {Object.entries(stats.byCategory).slice(0, 4).map(([category, amount]) => (
                <div key={category} className="stat-card">
                  <h3>{category.charAt(0).toUpperCase() + category.slice(1)}</h3>
                  <p className="stat-value">{formatAmount(amount)}</p>
                </div>
              ))}
            </div>

            {/* Donations List */}
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
            ) : filteredDonations.length > 0 ? (
              <div className="items-grid">
                {filteredDonations.map((donation, index) => (
                  <div
                    key={donation.id}
                    className="item-card stagger-item"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <div className="item-header">
                      <div>
                        <h3 className="item-title">{donation.userName || 'Anonymous'}</h3>
                        <p className="item-meta">
                          {formatAmount(donation.amount)}
                        </p>
                      </div>
                      <span
                        className="priority-badge"
                        style={{
                          background: `${getCategoryColor(donation.category)}20`,
                          color: getCategoryColor(donation.category)
                        }}
                      >
                        {donation.category || 'other'}
                      </span>
                    </div>

                    <p className="item-description">
                      📅 {formatDateTime(donation.createdAt)}
                      <br />
                      💳 {donation.paymentProvider || 'N/A'}
                      {donation.reference && <><br />🔖 Ref: {donation.reference.substring(0, 20)}...</>}
                    </p>

                    <div className="item-footer">
                      <span className="item-author">
                        Status: {donation.status || 'completed'}
                      </span>
                      <span
                        className="category-badge"
                        style={{
                          background: donation.status === 'completed' ? '#10b98120' : '#f59e0b20',
                          color: donation.status === 'completed' ? '#10b981' : '#f59e0b'
                        }}
                      >
                        {donation.status === 'completed' ? '✓ Completed' : '⏳ Pending'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state animate-fade-in">
                <IonIcon icon={walletOutline} className="empty-icon" />
                <h3 className="empty-title">No Donations Found</h3>
                <p className="empty-text">
                  {searchTerm || categoryFilter !== 'all' || startDate || endDate
                    ? 'Try adjusting your filters'
                    : 'No donations recorded yet'}
                </p>
              </div>
            )}
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default ManageDonations;
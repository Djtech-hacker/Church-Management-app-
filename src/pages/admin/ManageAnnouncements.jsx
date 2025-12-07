// src/pages/admin/ManageAnnouncements.jsx
import { useState, useEffect } from 'react';
import { IonContent, IonPage, IonIcon } from '@ionic/react';
import {
  megaphoneOutline,
  arrowBackOutline,
  addOutline,
  closeOutline,
  createOutline,
  trashOutline,
  searchOutline
} from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, orderBy, query } from 'firebase/firestore';
import { db } from '../../contexts/AuthContext';
import { useAuth } from '../../contexts/AuthContext';
import './ManageAnnouncements.css';

const ManageAnnouncements = () => {
  const history = useHistory();
  const { userProfile } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [filteredAnnouncements, setFilteredAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    priority: 'normal',
    category: 'general'
  });
  const [submitting, setSubmitting] = useState(false);

  const priorities = ['low', 'normal', 'high'];
  const categories = ['General', 'Service', 'Event', 'Ministry', 'Emergency'];

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  useEffect(() => {
    filterAnnouncements();
  }, [announcements, searchTerm]);

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

  const filterAnnouncements = () => {
    if (!searchTerm) {
      setFilteredAnnouncements(announcements);
      return;
    }

    const filtered = announcements.filter(announcement =>
      announcement.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      announcement.content.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredAnnouncements(filtered);
  };

  const openCreateModal = () => {
    setEditItem(null);
    setFormData({
      title: '',
      content: '',
      priority: 'normal',
      category: 'general'
    });
    setShowModal(true);
  };

  const openEditModal = (announcement) => {
    setEditItem(announcement);
    setFormData({
      title: announcement.title,
      content: announcement.content,
      priority: announcement.priority || 'normal',
      category: announcement.category || 'general'
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditItem(null);
    setFormData({
      title: '',
      content: '',
      priority: 'normal',
      category: 'general'
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title || !formData.content) {
      alert('Please fill in all required fields');
      return;
    }

    setSubmitting(true);

    try {
      const announcementData = {
        title: formData.title,
        content: formData.content,
        priority: formData.priority,
        category: formData.category,
        updatedAt: new Date().toISOString(),
        updatedBy: userProfile?.fullName || 'Admin'
      };

      if (editItem) {
        // Update existing
        await updateDoc(doc(db, 'announcements', editItem.id), announcementData);
        alert('Announcement updated successfully!');
      } else {
        // Create new
        await addDoc(collection(db, 'announcements'), {
          ...announcementData,
          createdAt: new Date().toISOString(),
          createdBy: userProfile?.fullName || 'Admin'
        });
        alert('Announcement created successfully!');
      }

      closeModal();
      await fetchAnnouncements();
    } catch (error) {
      console.error('Error saving announcement:', error);
      alert('Failed to save announcement. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'announcements', id));
      alert('Announcement deleted successfully!');
      await fetchAnnouncements();
    } catch (error) {
      console.error('Error deleting announcement:', error);
      alert('Failed to delete announcement. Please try again.');
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPriorityColor = (priority) => {
    const colors = {
      high: '#ef4444',
      normal: '#6366f1',
      low: '#10b981'
    };
    return colors[priority] || colors.normal;
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
                <h1 className="manage-title">Manage Announcements</h1>
                <p className="manage-subtitle">{announcements.length} total announcements</p>
              </div>
            </div>
            <button className="btn btn-primary" onClick={openCreateModal}>
              <IonIcon icon={addOutline} />
              New
            </button>
          </div>

          {/* Search & Filters */}
          <div className="manage-controls">
            <div className="search-box">
              <IonIcon icon={searchOutline} className="search-icon" />
              <input
                type="text"
                placeholder="Search announcements..."
                className="search-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Content */}
          <div className="manage-content">
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
            ) : filteredAnnouncements.length > 0 ? (
              <div className="items-grid">
                {filteredAnnouncements.map((announcement, index) => (
                  <div
                    key={announcement.id}
                    className="item-card stagger-item hover-lift"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <div className="item-header">
                      <div>
                        <h3 className="item-title">{announcement.title}</h3>
                        <p className="item-meta">
                          {formatDate(announcement.createdAt)}
                        </p>
                      </div>
                      <div className="item-badges">
                        <span
                          className="priority-badge"
                          style={{
                            background: `${getPriorityColor(announcement.priority)}20`,
                            color: getPriorityColor(announcement.priority)
                          }}
                        >
                          {announcement.priority || 'normal'}
                        </span>
                        {announcement.category && (
                          <span className="category-badge">{announcement.category}</span>
                        )}
                      </div>
                    </div>

                    <p className="item-description">
                      {announcement.content.substring(0, 150)}
                      {announcement.content.length > 150 ? '...' : ''}
                    </p>

                    <div className="item-footer">
                      <span className="item-author">By {announcement.createdBy || 'Admin'}</span>
                      <div className="item-actions">
                        <button
                          className="action-btn edit-btn"
                          onClick={() => openEditModal(announcement)}
                        >
                          <IonIcon icon={createOutline} />
                          Edit
                        </button>
                        <button
                          className="action-btn delete-btn"
                          onClick={() => handleDelete(announcement.id, announcement.title)}
                        >
                          <IonIcon icon={trashOutline} />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state animate-fade-in">
                <IonIcon icon={megaphoneOutline} className="empty-icon" />
                <h3 className="empty-title">No Announcements Found</h3>
                <p className="empty-text">
                  {searchTerm
                    ? 'Try adjusting your search'
                    : 'Create your first announcement'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Create/Edit Modal */}
        {showModal && (
          <div className={`modal-backdrop ${showModal ? 'active' : ''}`} onClick={closeModal}>
            <div
              className={`modal-content ${showModal ? 'active' : ''}`}
              onClick={(e) => e.stopPropagation()}
            >
              <button className="modal-close-btn" onClick={closeModal}>
                <IonIcon icon={closeOutline} />
              </button>

              <div className="modal-header">
                <h2 className="modal-title">
                  {editItem ? 'Edit Announcement' : 'Create Announcement'}
                </h2>
              </div>

              <form onSubmit={handleSubmit} className="modal-body">
                <div className="form-group">
                  <label className="form-label">Title *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Announcement title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Content *</label>
                  <textarea
                    className="form-textarea"
                    placeholder="Write your announcement here..."
                    rows="6"
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Priority</label>
                    <select
                      className="form-input"
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    >
                      {priorities.map(priority => (
                        <option key={priority} value={priority}>
                          {priority.charAt(0).toUpperCase() + priority.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <select
                      className="form-input"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    >
                      {categories.map(category => (
                        <option key={category} value={category.toLowerCase()}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="modal-actions">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={closeModal}
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <div className="spinner"></div>
                    ) : (
                      editItem ? 'Update' : 'Create'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </IonContent>
    </IonPage>
  );
};

export default ManageAnnouncements;
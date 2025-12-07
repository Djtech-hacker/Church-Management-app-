// src/pages/admin/ManagePrograms.jsx
import { useState, useEffect } from 'react';
import { IonContent, IonPage, IonIcon } from '@ionic/react';
import {
  calendarOutline,
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

const ManagePrograms = () => {
  const history = useHistory();
  const { userProfile } = useAuth();
  const [programs, setPrograms] = useState([]);
  const [filteredPrograms, setFilteredPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    time: '',
    location: 'Main Church',
    description: '',
    speaker: '',
    category: 'service'
  });
  const [submitting, setSubmitting] = useState(false);

  const categories = [
    'Service',
    'Prayer',
    'Bible Study',
    'Youth',
    'Children',
    'Special Event',
    'Conference'
  ];

  useEffect(() => {
    fetchPrograms();
  }, []);

  useEffect(() => {
    filterPrograms();
  }, [programs, searchTerm]);

  const fetchPrograms = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'programs'),
        orderBy('date', 'desc')
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
    if (!searchTerm) {
      setFilteredPrograms(programs);
      return;
    }

    const filtered = programs.filter(program =>
      program.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      program.speaker?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      program.location?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredPrograms(filtered);
  };

  const openCreateModal = () => {
    setEditItem(null);
    setFormData({
      title: '',
      date: '',
      time: '',
      location: 'Main Church',
      description: '',
      speaker: '',
      category: 'service'
    });
    setShowModal(true);
  };

  const openEditModal = (program) => {
    setEditItem(program);
    setFormData({
      title: program.title || '',
      date: program.date || '',
      time: program.time || '',
      location: program.location || 'Main Church',
      description: program.description || '',
      speaker: program.speaker || '',
      category: program.category || 'service'
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditItem(null);
    setFormData({
      title: '',
      date: '',
      time: '',
      location: 'Main Church',
      description: '',
      speaker: '',
      category: 'service'
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title || !formData.date || !formData.time) {
      alert('Please fill in all required fields');
      return;
    }

    setSubmitting(true);

    try {
      const programData = {
        title: formData.title,
        date: formData.date,
        time: formData.time,
        location: formData.location,
        description: formData.description,
        speaker: formData.speaker,
        category: formData.category,
        updatedAt: new Date().toISOString()
      };

      if (editItem) {
        await updateDoc(doc(db, 'programs', editItem.id), programData);
        alert('Program updated successfully!');
      } else {
        await addDoc(collection(db, 'programs'), {
          ...programData,
          createdAt: new Date().toISOString()
        });
        alert('Program created successfully!');
      }

      closeModal();
      await fetchPrograms();
    } catch (error) {
      console.error('Error saving program:', error);
      alert('Failed to save program. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'programs', id));
      alert('Program deleted successfully!');
      await fetchPrograms();
    } catch (error) {
      console.error('Error deleting program:', error);
      alert('Failed to delete program. Please try again.');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
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
        <div className="manage-page-container">
          {/* Header */}
          <div className="manage-header">
            <div className="header-left">
              <button className="back-button" onClick={() => history.push('/admin/dashboard')}>
                <IonIcon icon={arrowBackOutline} />
              </button>
              <div>
                <h1 className="manage-title">Manage Programs</h1>
                <p className="manage-subtitle">{programs.length} total programs</p>
              </div>
            </div>
            <button className="btn btn-primary" onClick={openCreateModal}>
              <IonIcon icon={addOutline} />
              New
            </button>
          </div>

          {/* Search */}
          <div className="manage-controls">
            <div className="search-box">
              <IonIcon icon={searchOutline} className="search-icon" />
              <input
                type="text"
                placeholder="Search programs..."
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
            ) : filteredPrograms.length > 0 ? (
              <div className="items-grid">
                {filteredPrograms.map((program, index) => (
                  <div
                    key={program.id}
                    className="item-card stagger-item hover-lift"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <div className="item-header">
                      <div>
                        <h3 className="item-title">{program.title}</h3>
                        <p className="item-meta">
                          📅 {formatDate(program.date)} • ⏰ {program.time}
                        </p>
                      </div>
                      <span className="category-badge">{program.category}</span>
                    </div>

                    <p className="item-description">
                      📍 {program.location}
                      {program.speaker && <><br />🎤 Speaker: {program.speaker}</>}
                      {program.description && <><br />{program.description.substring(0, 100)}...</>}
                    </p>

                    <div className="item-footer">
                      <span className="item-author">
                        {new Date(program.date) > new Date() ? '🟢 Upcoming' : '🔴 Past'}
                      </span>
                      <div className="item-actions">
                        <button
                          className="action-btn edit-btn"
                          onClick={() => openEditModal(program)}
                        >
                          <IonIcon icon={createOutline} />
                          Edit
                        </button>
                        <button
                          className="action-btn delete-btn"
                          onClick={() => handleDelete(program.id, program.title)}
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
                <IonIcon icon={calendarOutline} className="empty-icon" />
                <h3 className="empty-title">No Programs Found</h3>
                <p className="empty-text">
                  {searchTerm ? 'Try adjusting your search' : 'Create your first program'}
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
                  {editItem ? 'Edit Program' : 'Create Program'}
                </h2>
              </div>

              <form onSubmit={handleSubmit} className="modal-body">
                <div className="form-group">
                  <label className="form-label">Title *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Sunday Service"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Date *</label>
                    <input
                      type="date"
                      className="form-input"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Time *</label>
                    <input
                      type="time"
                      className="form-input"
                      value={formData.time}
                      onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Location</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Main Church"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Speaker</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Pastor Name"
                    value={formData.speaker}
                    onChange={(e) => setFormData({ ...formData, speaker: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select
                    className="form-input"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat.toLowerCase().replace(' ', '-')}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-textarea"
                    placeholder="Event details..."
                    rows="4"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
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

export default ManagePrograms;
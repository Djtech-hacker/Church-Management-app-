// src/pages/admin/ManageSermons.jsx
import { useState, useEffect } from 'react';
import { IonContent, IonPage, IonIcon } from '@ionic/react';
import {
  playCircleOutline,
  arrowBackOutline,
  addOutline,
  closeOutline,
  createOutline,
  trashOutline,
  searchOutline,
  cloudUploadOutline
} from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, orderBy, query } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../../contexts/AuthContext';
import { useAuth } from '../../contexts/AuthContext';
import './ManageAnnouncements.css';

const ManageSermons = () => {
  const history = useHistory();
  const { userProfile } = useAuth();
  const [sermons, setSermons] = useState([]);
  const [filteredSermons, setFilteredSermons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [formData, setFormData] = useState({
    title: '',
    speaker: '',
    type: 'audio',
    date: '',
    duration: '',
    thumbnail: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchSermons();
  }, []);

  useEffect(() => {
    filterSermons();
  }, [sermons, searchTerm]);

  const fetchSermons = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'sermons'),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const sermonsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSermons(sermonsData);
    } catch (error) {
      console.error('Error fetching sermons:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterSermons = () => {
    if (!searchTerm) {
      setFilteredSermons(sermons);
      return;
    }

    const filtered = sermons.filter(sermon =>
      sermon.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sermon.speaker?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredSermons(filtered);
  };

  const openCreateModal = () => {
    setEditItem(null);
    setFile(null);
    setFormData({
      title: '',
      speaker: '',
      type: 'audio',
      date: '',
      duration: '',
      thumbnail: ''
    });
    setShowModal(true);
  };

  const openEditModal = (sermon) => {
    setEditItem(sermon);
    setFile(null);
    setFormData({
      title: sermon.title || '',
      speaker: sermon.speaker || '',
      type: sermon.type || 'audio',
      date: sermon.date || '',
      duration: sermon.duration || '',
      thumbnail: sermon.thumbnail || ''
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditItem(null);
    setFile(null);
    setUploadProgress(0);
    setFormData({
      title: '',
      speaker: '',
      type: 'audio',
      date: '',
      duration: '',
      thumbnail: ''
    });
  };

  const handleFileUpload = async () => {
    if (!file) {
      throw new Error('No file selected');
    }

    setUploading(true);
    setUploadProgress(0);

    return new Promise((resolve, reject) => {
      try {
        const timestamp = Date.now();
        const fileName = `${timestamp}-${file.name.replace(/\s/g, '_')}`;
        const storageRef = ref(storage, `sermons/${fileName}`);
        
        // Use uploadBytesResumable for progress tracking
        const uploadTask = uploadBytesResumable(storageRef, file);

        uploadTask.on(
          'state_changed',
          (snapshot) => {
            // Track upload progress
            const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
            setUploadProgress(progress);
            console.log('Upload is ' + progress + '% done');
          },
          (error) => {
            // Handle upload errors
            console.error('Upload error:', error);
            setUploading(false);
            setUploadProgress(0);
            reject(error);
          },
          async () => {
            // Upload completed successfully
            try {
              const url = await getDownloadURL(uploadTask.snapshot.ref);
              console.log('File available at:', url);
              setUploading(false);
              resolve(url);
            } catch (error) {
              console.error('Error getting download URL:', error);
              setUploading(false);
              reject(error);
            }
          }
        );
      } catch (error) {
        console.error('Upload initialization error:', error);
        setUploading(false);
        setUploadProgress(0);
        reject(error);
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title || !formData.speaker) {
      alert('Please fill in all required fields');
      return;
    }

    if (!editItem && !file) {
      alert('Please select a file to upload');
      return;
    }

    setSubmitting(true);

    try {
      let fileUrl = editItem?.url || '';

      // Upload new file if provided
      if (file) {
        fileUrl = await handleFileUpload();
      }

      const sermonData = {
        title: formData.title,
        speaker: formData.speaker,
        type: formData.type,
        date: formData.date,
        duration: formData.duration,
        thumbnail: formData.thumbnail,
        url: fileUrl,
        updatedAt: new Date().toISOString()
      };

      if (editItem) {
        await updateDoc(doc(db, 'sermons', editItem.id), sermonData);
        alert('Sermon updated successfully!');
      } else {
        await addDoc(collection(db, 'sermons'), {
          ...sermonData,
          createdAt: new Date().toISOString()
        });
        alert('Sermon uploaded successfully!');
      }

      closeModal();
      await fetchSermons();
    } catch (error) {
      console.error('Error saving sermon:', error);
      alert(`Failed to save sermon: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, title, url) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) {
      return;
    }

    try {
      // Delete from Firestore
      await deleteDoc(doc(db, 'sermons', id));
      
      // Optionally delete from Storage
      // try {
      //   const fileRef = ref(storage, url);
      //   await deleteObject(fileRef);
      // } catch (storageError) {
      //   console.log('Storage file may already be deleted');
      // }

      alert('Sermon deleted successfully!');
      await fetchSermons();
    } catch (error) {
      console.error('Error deleting sermon:', error);
      alert('Failed to delete sermon. Please try again.');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
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
                <h1 className="manage-title">Manage Sermons</h1>
                <p className="manage-subtitle">{sermons.length} total sermons</p>
              </div>
            </div>
            <button className="btn btn-primary" onClick={openCreateModal}>
              <IonIcon icon={addOutline} />
              Upload
            </button>
          </div>

          {/* Search */}
          <div className="manage-controls">
            <div className="search-box">
              <IonIcon icon={searchOutline} className="search-icon" />
              <input
                type="text"
                placeholder="Search sermons..."
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
            ) : filteredSermons.length > 0 ? (
              <div className="items-grid">
                {filteredSermons.map((sermon, index) => (
                  <div
                    key={sermon.id}
                    className="item-card stagger-item hover-lift"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <div className="item-header">
                      <div>
                        <h3 className="item-title">{sermon.title}</h3>
                        <p className="item-meta">🎤 {sermon.speaker}</p>
                      </div>
                      <span
                        className="priority-badge"
                        style={{
                          background: sermon.type === 'video' ? '#3b82f620' : '#8b5cf620',
                          color: sermon.type === 'video' ? '#3b82f6' : '#8b5cf6'
                        }}
                      >
                        {sermon.type}
                      </span>
                    </div>

                    <p className="item-description">
                      📅 {formatDate(sermon.date || sermon.createdAt)}
                      {sermon.duration && <><br />⏱️ Duration: {sermon.duration}</>}
                    </p>

                    <div className="item-footer">
                      <span className="item-author">
                        {formatDate(sermon.createdAt)}
                      </span>
                      <div className="item-actions">
                        <button
                          className="action-btn edit-btn"
                          onClick={() => openEditModal(sermon)}
                        >
                          <IonIcon icon={createOutline} />
                          Edit
                        </button>
                        <button
                          className="action-btn delete-btn"
                          onClick={() => handleDelete(sermon.id, sermon.title, sermon.url)}
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
                <IonIcon icon={playCircleOutline} className="empty-icon" />
                <h3 className="empty-title">No Sermons Found</h3>
                <p className="empty-text">
                  {searchTerm ? 'Try adjusting your search' : 'Upload your first sermon'}
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
                  {editItem ? 'Edit Sermon' : 'Upload Sermon'}
                </h2>
              </div>

              <form onSubmit={handleSubmit} className="modal-body">
                <div className="form-group">
                  <label className="form-label">
                    {editItem ? 'Upload New File (Optional)' : 'Upload File *'}
                  </label>
                  <div className="file-upload-area">
                    <input
                      type="file"
                      accept="audio/*,video/*"
                      id="file-input"
                      className="file-input"
                      onChange={(e) => setFile(e.target.files[0])}
                      style={{ display: 'none' }}
                    />
                    <label htmlFor="file-input" className="file-upload-label">
                      <IonIcon icon={cloudUploadOutline} style={{ fontSize: '32px' }} />
                      <span>{file ? file.name : 'Click to select audio/video file'}</span>
                      {file && (
                        <small style={{ color: 'var(--text-secondary)' }}>
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </small>
                      )}
                    </label>
                  </div>
                  {uploadProgress > 0 && (
                    <div className="upload-progress">
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${uploadProgress}%` }} />
                      </div>
                      <span>{uploadProgress}%</span>
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Title *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Sermon title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Speaker *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Pastor Name"
                      value={formData.speaker}
                      onChange={(e) => setFormData({ ...formData, speaker: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Type</label>
                    <select
                      className="form-input"
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    >
                      <option value="audio">Audio</option>
                      <option value="video">Video</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Date</label>
                    <input
                      type="date"
                      className="form-input"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Duration</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g., 45 mins"
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Thumbnail URL (Optional)</label>
                  <input
                    type="url"
                    className="form-input"
                    placeholder="https://..."
                    value={formData.thumbnail}
                    onChange={(e) => setFormData({ ...formData, thumbnail: e.target.value })}
                  />
                </div>

                <div className="modal-actions">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={closeModal}
                    disabled={submitting || uploading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={submitting || uploading}
                  >
                    {submitting || uploading ? (
                      <div className="spinner"></div>
                    ) : (
                      editItem ? 'Update' : 'Upload'
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

export default ManageSermons;
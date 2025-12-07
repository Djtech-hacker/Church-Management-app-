// src/pages/admin/ManageMembers.jsx
import { useState, useEffect } from 'react';
import { IonContent, IonPage, IonIcon } from '@ionic/react';
import {
  peopleOutline,
  arrowBackOutline,
  addOutline,
  closeOutline,
  createOutline,
  trashOutline,
  searchOutline,
  downloadOutline
} from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, orderBy, query } from 'firebase/firestore';
import { db } from '../../contexts/AuthContext';
import { useAuth } from '../../contexts/AuthContext';
import './ManageAnnouncements.css';

const ManageMembers = () => {
  const history = useHistory();
  const { userProfile } = useAuth();
  const [members, setMembers] = useState([]);
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    department: '',
    role: 'member'
  });
  const [submitting, setSubmitting] = useState(false);

  const departments = [
    'Choir',
    'Ushering',
    'Media',
    'Children',
    'Youth',
    'Prayer',
    'Welfare',
    'Protocol',
    'Evangelism'
  ];

  const roles = [
    { value: 'member', label: 'Member' },
    { value: 'admin', label: 'Admin' },
    { value: 'superadmin', label: 'Super Admin' }
  ];

  useEffect(() => {
    fetchMembers();
  }, []);

  useEffect(() => {
    filterMembers();
  }, [members, searchTerm]);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'users'),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const membersData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMembers(membersData);
    } catch (error) {
      console.error('Error fetching members:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterMembers = () => {
    if (!searchTerm) {
      setFilteredMembers(members);
      return;
    }

    const filtered = members.filter(member =>
      member.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.department?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredMembers(filtered);
  };

  const openCreateModal = () => {
    setEditItem(null);
    setFormData({
      fullName: '',
      email: '',
      phone: '',
      department: '',
      role: 'member'
    });
    setShowModal(true);
  };

  const openEditModal = (member) => {
    setEditItem(member);
    setFormData({
      fullName: member.fullName || '',
      email: member.email || '',
      phone: member.phone || '',
      department: member.department || '',
      role: member.role || 'member'
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditItem(null);
    setFormData({
      fullName: '',
      email: '',
      phone: '',
      department: '',
      role: 'member'
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.fullName || !formData.email) {
      alert('Please fill in all required fields');
      return;
    }

    setSubmitting(true);

    try {
      const memberData = {
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        department: formData.department,
        role: formData.role,
        updatedAt: new Date().toISOString()
      };

      if (editItem) {
        // Update existing
        await updateDoc(doc(db, 'users', editItem.id), memberData);
        alert('Member updated successfully!');
      } else {
        // Create new (Note: In production, use Firebase Auth createUser)
        await addDoc(collection(db, 'users'), {
          ...memberData,
          createdAt: new Date().toISOString()
        });
        alert('Member created successfully! Note: Password setup required.');
      }

      closeModal();
      await fetchMembers();
    } catch (error) {
      console.error('Error saving member:', error);
      alert('Failed to save member. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'users', id));
      alert('Member deleted successfully!');
      await fetchMembers();
    } catch (error) {
      console.error('Error deleting member:', error);
      alert('Failed to delete member. Please try again.');
    }
  };

  const exportCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'Department', 'Role', 'Created'];
    const rows = filteredMembers.map(m => [
      m.fullName || '',
      m.email || '',
      m.phone || 'N/A',
      m.department || 'N/A',
      m.role || 'member',
      formatDate(m.createdAt)
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `members-${new Date().toISOString().split('T')[0]}.csv`;
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

  const getRoleBadgeColor = (role) => {
    const colors = {
      superadmin: '#ef4444',
      admin: '#f59e0b',
      member: '#6366f1'
    };
    return colors[role] || colors.member;
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
                <h1 className="manage-title">Manage Members</h1>
                <p className="manage-subtitle">{members.length} total members</p>
              </div>
            </div>
            <div className="header-actions">
              <button className="btn btn-secondary" onClick={exportCSV}>
                <IonIcon icon={downloadOutline} />
                Export
              </button>
              <button className="btn btn-primary" onClick={openCreateModal}>
                <IonIcon icon={addOutline} />
                New
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="manage-controls">
            <div className="search-box">
              <IonIcon icon={searchOutline} className="search-icon" />
              <input
                type="text"
                placeholder="Search members..."
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
            ) : filteredMembers.length > 0 ? (
              <div className="items-grid">
                {filteredMembers.map((member, index) => (
                  <div
                    key={member.id}
                    className="item-card stagger-item hover-lift"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <div className="item-header">
                      <div>
                        <h3 className="item-title">{member.fullName || 'No Name'}</h3>
                        <p className="item-meta">{member.email}</p>
                      </div>
                      <span
                        className="priority-badge"
                        style={{
                          background: `${getRoleBadgeColor(member.role)}20`,
                          color: getRoleBadgeColor(member.role)
                        }}
                      >
                        {member.role || 'member'}
                      </span>
                    </div>

                    <p className="item-description">
                      📞 {member.phone || 'No phone'} <br />
                      🏛️ {member.department || 'No department'}
                    </p>

                    <div className="item-footer">
                      <span className="item-author">Joined {formatDate(member.createdAt)}</span>
                      <div className="item-actions">
                        <button
                          className="action-btn edit-btn"
                          onClick={() => openEditModal(member)}
                        >
                          <IonIcon icon={createOutline} />
                          Edit
                        </button>
                        <button
                          className="action-btn delete-btn"
                          onClick={() => handleDelete(member.id, member.fullName)}
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
                <IonIcon icon={peopleOutline} className="empty-icon" />
                <h3 className="empty-title">No Members Found</h3>
                <p className="empty-text">
                  {searchTerm ? 'Try adjusting your search' : 'Add your first member'}
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
                  {editItem ? 'Edit Member' : 'Add Member'}
                </h2>
              </div>

              <form onSubmit={handleSubmit} className="modal-body">
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="John Doe"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Email *</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="john@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    disabled={editItem} // Can't change email
                  />
                  {editItem && (
                    <small style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
                      Email cannot be changed
                    </small>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input
                    type="tel"
                    className="form-input"
                    placeholder="+234 800 000 0000"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Department</label>
                    <select
                      className="form-input"
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    >
                      <option value="">Select Department</option>
                      {departments.map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Role</label>
                    <select
                      className="form-input"
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    >
                      {roles.map(role => (
                        <option key={role.value} value={role.value}>
                          {role.label}
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

export default ManageMembers;
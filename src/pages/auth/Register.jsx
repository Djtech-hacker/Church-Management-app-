// src/pages/auth/Register.jsx
import { useState } from 'react';
import { IonContent, IonPage, IonIcon } from '@ionic/react';
import {
  personOutline,
  mailOutline,
  callOutline,
  businessOutline,
  lockClosedOutline,
  eyeOutline,
  eyeOffOutline,
  arrowBackOutline
} from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './Auth.css';

const Register = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    department: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { register } = useAuth();
  const history = useHistory();

  const departments = [
    'Select Department',
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.fullName || !formData.email || !formData.phone || 
        !formData.department || formData.department === 'Select Department' ||
        !formData.password || !formData.confirmPassword) {
      setError('Please fill in all fields');
      return false;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setError('');
    setLoading(true);

    console.log('🚀 Starting registration process...');

    // Failsafe timeout - if stuck for more than 10 seconds, force redirect
    const failsafeTimeout = setTimeout(() => {
      console.log('⚠️ Registration taking too long, forcing redirect...');
      setLoading(false);
      history.replace('/home');
    }, 10000);

    try {
      const userData = {
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        department: formData.department,
        password: formData.password
      };

      console.log('📝 Registering user:', { ...userData, password: '***' });
      
      const user = await register(userData);
      
      console.log('✅ Registration successful! User:', user?.uid);
      console.log('🔄 Redirecting to home...');
      
      // Clear the failsafe timeout
      clearTimeout(failsafeTimeout);
      
      // Force immediate redirect
      setLoading(false);
      window.location.href = '/home';
      
    } catch (err) {
      console.error('❌ Registration error:', err);
      console.error('Error code:', err.code);
      console.error('Error message:', err.message);
      
      // Clear the failsafe timeout
      clearTimeout(failsafeTimeout);
      
      setLoading(false); // Important: Stop loading on error
      
      if (err.code === 'auth/email-already-in-use') {
        setError('Email address is already in use. Please sign in instead.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password is too weak. Please use a stronger password.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Invalid email address');
      } else if (err.message) {
        setError(err.message);
      } else {
        setError('Failed to create account. Please try again.');
      }
    }
  };

  return (
    <IonPage>
      <IonContent fullscreen className="auth-content">
        <div className="auth-container animate-fade-in-up">
          {/* Back Button */}
          <button 
            className="back-button"
            onClick={() => history.push('/login')}
            disabled={loading}
          >
            <IonIcon icon={arrowBackOutline} />
          </button>

          {/* Header */}
          <div className="auth-header">
            <div className="auth-logo">
              <div className="logo-circle gradient-animated">
                <span className="logo-text">CC</span>
              </div>
            </div>
            <h1 className="auth-title">Create Account</h1>
            <p className="auth-subtitle">Join the ChurchConnect family</p>
          </div>

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="auth-form">
            {error && (
              <div className="alert alert-danger animate-shake">
                {error}
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Full Name</label>
              <div className="input-wrapper">
                <IonIcon icon={personOutline} className="input-icon" />
                <input
                  type="text"
                  name="fullName"
                  className="form-input with-icon"
                  placeholder="John Doe"
                  value={formData.fullName}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div className="input-wrapper">
                <IonIcon icon={mailOutline} className="input-icon" />
                <input
                  type="email"
                  name="email"
                  className="form-input with-icon"
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <div className="input-wrapper">
                <IonIcon icon={callOutline} className="input-icon" />
                <input
                  type="tel"
                  name="phone"
                  className="form-input with-icon"
                  placeholder="+234 800 000 0000"
                  value={formData.phone}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Department</label>
              <div className="input-wrapper">
                <IonIcon icon={businessOutline} className="input-icon" />
                <select
                  name="department"
                  className="form-input with-icon"
                  value={formData.department}
                  onChange={handleChange}
                  disabled={loading}
                >
                  {departments.map((dept, index) => (
                    <option key={index} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="input-wrapper">
                <IonIcon icon={lockClosedOutline} className="input-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  className="form-input with-icon"
                  placeholder="Minimum 6 characters"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={loading}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  <IonIcon icon={showPassword ? eyeOffOutline : eyeOutline} />
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <div className="input-wrapper">
                <IonIcon icon={lockClosedOutline} className="input-icon" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  className="form-input with-icon"
                  placeholder="Re-enter password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  disabled={loading}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={loading}
                >
                  <IonIcon icon={showConfirmPassword ? eyeOffOutline : eyeOutline} />
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-gradient btn-block ripple"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="spinner"></div>
                  <span style={{ marginLeft: '10px' }}>Creating account...</span>
                </>
              ) : (
                'Create Account'
              )}
            </button>

            <div className="auth-footer">
              <p className="text-center text-secondary">
                Already have an account?{' '}
                <button
                  type="button"
                  className="link-button"
                  onClick={() => history.push('/login')}
                  disabled={loading}
                >
                  Sign In
                </button>
              </p>
            </div>
          </form>

          {/* Decorative Elements */}
          <div className="auth-decoration">
            <div className="decoration-circle circle-1"></div>
            <div className="decoration-circle circle-2"></div>
            <div className="decoration-circle circle-3"></div>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Register;
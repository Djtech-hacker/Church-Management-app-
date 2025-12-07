// src/pages/auth/ForgotPassword.jsx
import { useState } from 'react';
import { IonContent, IonPage, IonIcon } from '@ionic/react';
import { mailOutline, arrowBackOutline, checkmarkCircleOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './Auth.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const { resetPassword } = useAuth();
  const history = useHistory();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await resetPassword(email);
      setSuccess(true);
    } catch (err) {
      setError('Failed to send reset email. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <IonPage>
        <IonContent fullscreen className="auth-content">
          <div className="auth-container animate-scale-in">
            <div className="success-state">
              <IonIcon icon={checkmarkCircleOutline} className="success-icon animate-bounce" />
              <h2 className="success-title">Check Your Email</h2>
              <p className="success-text">
                We've sent password reset instructions to <strong>{email}</strong>
              </p>
              <button
                className="btn btn-primary btn-block"
                onClick={() => history.push('/login')}
              >
                Back to Login
              </button>
            </div>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonContent fullscreen className="auth-content">
        <div className="auth-container animate-fade-in-up">
          {/* Back Button */}
          <button 
            className="back-button"
            onClick={() => history.push('/login')}
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
            <h1 className="auth-title">Forgot Password?</h1>
            <p className="auth-subtitle">
              Enter your email to receive reset instructions
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="auth-form">
            {error && (
              <div className="alert alert-danger animate-shake">
                {error}
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div className="input-wrapper">
                <IonIcon icon={mailOutline} className="input-icon" />
                <input
                  type="email"
                  className="form-input with-icon"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-gradient btn-block ripple"
              disabled={loading}
            >
              {loading ? (
                <div className="spinner"></div>
              ) : (
                'Send Reset Link'
              )}
            </button>

            <div className="auth-footer">
              <p className="text-center text-secondary">
                Remember your password?{' '}
                <button
                  type="button"
                  className="link-button"
                  onClick={() => history.push('/login')}
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

export default ForgotPassword;
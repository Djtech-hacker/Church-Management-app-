// src/pages/auth/Login.jsx
import { useState } from 'react';
import { IonContent, IonPage, IonIcon } from '@ionic/react';
import { mailOutline, lockClosedOutline, eyeOutline, eyeOffOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './Auth.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login } = useAuth();
  const history = useHistory();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await login(email, password);
      history.push('/home');
    } catch (err) {
      setError('Failed to sign in. Please check your credentials.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonPage>
      <IonContent fullscreen className="auth-content">
        <div className="auth-container animate-fade-in-up">
          {/* Logo/Header Section */}
          <div className="auth-header">
            <div className="auth-logo">
              <div className="logo-circle gradient-animated">
                <span className="logo-text">CC</span>
              </div>
            </div>
            <h1 className="auth-title">Welcome Back</h1>
            <p className="auth-subtitle">Sign in to continue to ChurchConnect</p>
          </div>

          {/* Login Form */}
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

            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="input-wrapper">
                <IonIcon icon={lockClosedOutline} className="input-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-input with-icon"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <IonIcon icon={showPassword ? eyeOffOutline : eyeOutline} />
                </button>
              </div>
            </div>

            <div className="form-footer">
              <button
                type="button"
                className="link-button"
                onClick={() => history.push('/forgot-password')}
              >
                Forgot Password?
              </button>
            </div>

            <button
              type="submit"
              className="btn btn-gradient btn-block ripple"
              disabled={loading}
            >
              {loading ? (
                <div className="spinner"></div>
              ) : (
                'Sign In'
              )}
            </button>

            <div className="auth-divider">
              <span>OR</span>
            </div>

            <button
              type="button"
              className="btn btn-secondary btn-block"
              onClick={() => history.push('/register')}
            >
              Create New Account
            </button>
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

export default Login;
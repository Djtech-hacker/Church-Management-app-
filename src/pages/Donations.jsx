// src/pages/Donations.jsx
import { useState, useEffect } from 'react';
import { IonContent, IonPage, IonIcon } from '@ionic/react';
import {
  walletOutline,
  heartOutline,
  arrowBackOutline,
  checkmarkCircleOutline,
  cardOutline
} from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { collection, addDoc, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../contexts/AuthContext';
import { useAuth } from '../contexts/AuthContext';
import { paymentConfig } from '../firebase/config';
import './Donations.css';

const Donations = () => {
  const { currentUser, userProfile } = useAuth();
  const history = useHistory();
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('tithe');
  const [paymentMethod, setPaymentMethod] = useState('paystack');
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [donationHistory, setDonationHistory] = useState([]);

  const categories = [
    { value: 'tithe', label: 'Tithes', icon: walletOutline },
    { value: 'offering', label: 'Offerings', icon: heartOutline },
    { value: 'building', label: 'Building Project', icon: cardOutline },
    { value: 'welfare', label: 'Welfare', icon: heartOutline },
    { value: 'mission', label: 'Mission', icon: walletOutline }
  ];

  const quickAmounts = [1000, 2000, 5000, 10000, 20000, 50000];

  useEffect(() => {
    fetchDonationHistory();
  }, []);

  const fetchDonationHistory = async () => {
    try {
      const q = query(
        collection(db, 'donations'),
        where('userId', '==', currentUser.uid),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const donations = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setDonationHistory(donations);
    } catch (error) {
      console.error('Error fetching donations:', error);
    }
  };

  const handlePaystackPayment = async () => {
    // Initialize Paystack payment
    const handler = window.PaystackPop?.setup({
      key: paymentConfig.paystack.publicKey,
      email: userProfile?.email || currentUser.email,
      amount: parseFloat(amount) * 100, // Convert to kobo
      currency: 'NGN',
      ref: `${Date.now()}-${currentUser.uid}`,
      metadata: {
        custom_fields: [
          {
            display_name: 'Donor Name',
            variable_name: 'donor_name',
            value: userProfile?.fullName || 'Member'
          },
          {
            display_name: 'Category',
            variable_name: 'category',
            value: category
          }
        ]
      },
      callback: async (response) => {
        await saveDonation(response.reference, 'paystack');
      },
      onClose: () => {
        setProcessing(false);
      }
    });
    
    handler?.openIframe();
  };

  const handleFlutterwavePayment = async () => {
    // Initialize Flutterwave payment
    const payload = {
      public_key: paymentConfig.flutterwave.publicKey,
      tx_ref: `${Date.now()}-${currentUser.uid}`,
      amount: parseFloat(amount),
      currency: 'NGN',
      payment_options: 'card,ussd,banktransfer',
      customer: {
        email: userProfile?.email || currentUser.email,
        name: userProfile?.fullName || 'Member'
      },
      customizations: {
        title: 'Church Donation',
        description: `${category} donation`,
        logo: 'https://your-church-logo.png'
      },
      callback: async (response) => {
        if (response.status === 'successful') {
          await saveDonation(response.tx_ref, 'flutterwave');
        }
      },
      onclose: () => {
        setProcessing(false);
      }
    };

    window.FlutterwaveCheckout?.(payload);
  };

  const saveDonation = async (reference, provider) => {
    try {
      await addDoc(collection(db, 'donations'), {
        userId: currentUser.uid,
        userName: userProfile?.fullName || 'Member',
        amount: parseFloat(amount),
        category,
        paymentProvider: provider,
        reference,
        status: 'completed',
        createdAt: new Date().toISOString()
      });

      setSuccess(true);
      setAmount('');
      await fetchDonationHistory();

      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('Error saving donation:', error);
      alert('Payment successful but failed to save record');
    } finally {
      setProcessing(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!amount || parseFloat(amount) < 100) {
      alert('Please enter a valid amount (minimum ₦100)');
      return;
    }

    setProcessing(true);

    // Load payment scripts dynamically
    if (paymentMethod === 'paystack') {
      if (!window.PaystackPop) {
        const script = document.createElement('script');
        script.src = 'https://js.paystack.co/v1/inline.js';
        script.onload = () => handlePaystackPayment();
        document.body.appendChild(script);
      } else {
        handlePaystackPayment();
      }
    } else {
      if (!window.FlutterwaveCheckout) {
        const script = document.createElement('script');
        script.src = 'https://checkout.flutterwave.com/v3.js';
        script.onload = () => handleFlutterwavePayment();
        document.body.appendChild(script);
      } else {
        handleFlutterwavePayment();
      }
    }
  };

  const formatAmount = (amt) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(amt);
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <IonPage>
      <IonContent fullscreen>
        <div className="donations-container">
          {/* Header */}
          <div className="donations-header gradient-animated">
            <button className="back-button" onClick={() => history.goBack()}>
              <IonIcon icon={arrowBackOutline} />
            </button>
            <div className="header-content">
              <div className="header-icon-wrapper">
                <IonIcon icon={walletOutline} className="header-icon" />
              </div>
              <h1 className="donations-title">Give</h1>
              <p className="donations-subtitle">Support the work of God</p>
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

          <div className="donations-content">
            {success ? (
              // Success State
              <div className="success-card animate-scale-in">
                <IonIcon icon={checkmarkCircleOutline} className="success-icon-large" />
                <h2 className="success-title">Thank You!</h2>
                <p className="success-message">
                  Your donation of <strong>{formatAmount(parseFloat(amount || 0))}</strong> has been received
                </p>
                <button
                  className="btn btn-primary btn-block"
                  onClick={() => setSuccess(false)}
                >
                  Make Another Donation
                </button>
              </div>
            ) : (
              // Donation Form
              <form onSubmit={handleSubmit} className="donation-form animate-fade-in-up">
                {/* Category Selection */}
                <div className="form-section">
                  <h3 className="section-title">Select Category</h3>
                  <div className="categories-grid">
                    {categories.map((cat) => (
                      <button
                        key={cat.value}
                        type="button"
                        className={`category-btn ${category === cat.value ? 'active' : ''}`}
                        onClick={() => setCategory(cat.value)}
                      >
                        <IonIcon icon={cat.icon} />
                        <span>{cat.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Amount Input */}
                <div className="form-section">
                  <h3 className="section-title">Enter Amount</h3>
                  <div className="amount-input-wrapper">
                    <span className="currency-symbol">₦</span>
                    <input
                      type="number"
                      className="amount-input"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      min="100"
                      step="100"
                    />
                  </div>
                  
                  <div className="quick-amounts">
                    {quickAmounts.map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        className="quick-amount-btn"
                        onClick={() => setAmount(amt.toString())}
                      >
                        {formatAmount(amt)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Payment Method */}
                <div className="form-section">
                  <h3 className="section-title">Payment Method</h3>
                  <div className="payment-methods">
                    <button
                      type="button"
                      className={`payment-method-btn ${paymentMethod === 'paystack' ? 'active' : ''}`}
                      onClick={() => setPaymentMethod('paystack')}
                    >
                      <span className="payment-logo">P</span>
                      Paystack
                    </button>
                    <button
                      type="button"
                      className={`payment-method-btn ${paymentMethod === 'flutterwave' ? 'active' : ''}`}
                      onClick={() => setPaymentMethod('flutterwave')}
                    >
                      <span className="payment-logo">F</span>
                      Flutterwave
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-gradient btn-block"
                  disabled={processing}
                >
                  {processing ? (
                    <div className="spinner"></div>
                  ) : (
                    `Donate ${amount ? formatAmount(parseFloat(amount)) : '₦0.00'}`
                  )}
                </button>
              </form>
            )}

            {/* Donation History */}
            {donationHistory.length > 0 && (
              <div className="donation-history animate-fade-in-up">
                <h3 className="section-title">Recent Donations</h3>
                <div className="history-list">
                  {donationHistory.slice(0, 5).map((donation, index) => (
                    <div
                      key={donation.id}
                      className="history-item stagger-item"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <div className="history-icon">
                        <IonIcon icon={checkmarkCircleOutline} />
                      </div>
                      <div className="history-details">
                        <p className="history-category">{donation.category}</p>
                        <p className="history-date">{formatDate(donation.createdAt)}</p>
                      </div>
                      <div className="history-amount">
                        {formatAmount(donation.amount)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Donations;
# ChurchConnect - Mobile Church Management App

A full-featured church management mobile application built with Ionic + React, Firebase, and integrated payments (Paystack & Flutterwave).

## Features

### Member Features
- ✅ Email/Password Authentication
- ✅ Profile Management with Photo Upload
- ✅ One-Tap Attendance Check-in
- ✅ Prayer Request Submission
- ✅ Testimony Sharing
- ✅ View Announcements
- ✅ Browse Programs & Events
- ✅ Listen to Sermons (Audio/Video)
- ✅ Make Donations (Tithes, Offerings, Building Fund)
- ✅ Light/Dark Mode Support

### Admin Features
- ✅ Admin Dashboard with Analytics
- ✅ Member Management (CRUD)
- ✅ Announcement Management
- ✅ Program/Event Creation
- ✅ Sermon Upload & Management
- ✅ Attendance Tracking & Reports
- ✅ Donation Management & Reporting
- ✅ Testimony Moderation
- ✅ Prayer Request Management
- ✅ CSV Export for Reports

### Advanced Features
- ✅ Multi-tenant Support (Super Admin)
- ✅ Push Notifications (FCM)
- ✅ Offline-first Capabilities
- ✅ Payment Integration (Paystack & Flutterwave)
- ✅ Live Streaming Support
- ✅ Animated UI with Modern Design

## Tech Stack

- **Framework**: Ionic 7 + React 18
- **Language**: JavaScript (ES6+)
- **Styling**: Plain CSS with Flexbox/Grid
- **Backend**: Firebase (Auth, Firestore, Storage, FCM)
- **Payments**: Paystack & Flutterwave
- **Routing**: React Router v6
- **State Management**: React Context API
- **Mobile Packaging**: Capacitor

## Installation

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Android Studio (for Android builds)
- Xcode (for iOS builds, macOS only)

### 1. Install Dependencies

```bash
npm install
```

### 2. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project
3. Enable Authentication (Email/Password)
4. Create Firestore Database
5. Enable Storage
6. Enable Cloud Messaging (FCM)
7. Copy your Firebase config

### 3. Configure Firebase

Edit `src/config/firebaseConfig.js` and add your Firebase credentials:

```javascript
export const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

### 4. Firestore Security Rules

Go to Firestore Rules in Firebase Console and paste:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId || 
                      get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'superadmin'];
    }
    
    match /announcements/{announcementId} {
      allow read: if request.auth != null;
      allow create, update, delete: if request.auth != null && 
                                        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'superadmin'];
    }
    
    match /programs/{programId} {
      allow read: if request.auth != null;
      allow create, update, delete: if request.auth != null && 
                                        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'superadmin'];
    }
    
    match /sermons/{sermonId} {
      allow read: if request.auth != null;
      allow create, update, delete: if request.auth != null && 
                                        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'superadmin'];
    }
    
    match /attendance/{attendanceId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
      allow update, delete: if request.auth != null && 
                               get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'superadmin'];
    }
    
    match /prayerRequests/{requestId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && 
                               (request.auth.uid == resource.data.userId || 
                                get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'superadmin']);
    }
    
    match /testimonies/{testimonyId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && 
                               (request.auth.uid == resource.data.userId || 
                                get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'superadmin']);
    }
    
    match /donations/{donationId} {
      allow read: if request.auth != null && 
                     (request.auth.uid == resource.data.userId || 
                      get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'superadmin']);
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && 
                               get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'superadmin'];
    }
  }
}
```

### 5. Storage Security Rules

Go to Storage Rules and paste:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /sermons/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    match /profiles/{userId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    match /bulletins/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
```

### 6. Payment Setup

#### Paystack
1. Sign up at [Paystack](https://paystack.com)
2. Get your Public Key from Settings
3. Add to `src/config/firebaseConfig.js`:

```javascript
export const paymentConfig = {
  paystack: {
    publicKey: "pk_test_YOUR_PAYSTACK_KEY"
  }
};
```

#### Flutterwave
1. Sign up at [Flutterwave](https://flutterwave.com)
2. Get your Public Key
3. Add to config:

```javascript
export const paymentConfig = {
  flutterwave: {
    publicKey: "FLWPUBK_TEST-YOUR_FLUTTERWAVE_KEY"
  }
};
```

## Development

### Run in Browser

```bash
npm run dev
# or
ionic serve
```

### Run on Device

#### Android
```bash
# Add Android platform
npx cap add android

# Build web assets
npm run build

# Sync with Capacitor
npx cap sync

# Open in Android Studio
npx cap open android
```

#### iOS (macOS only)
```bash
# Add iOS platform
npx cap add ios

# Build web assets
npm run build

# Sync with Capacitor
npx cap sync

# Open in Xcode
npx cap open ios
```

## Building for Production

### Android APK/AAB

```bash
# Build production assets
npm run build

# Sync with Capacitor
npx cap sync android

# Open Android Studio
npx cap open android

# In Android Studio:
# Build > Generate Signed Bundle / APK
# Follow the wizard to create your release APK/AAB
```

### iOS App Store

```bash
# Build production assets
npm run build

# Sync with Capacitor
npx cap sync ios

# Open Xcode
npx cap open ios

# In Xcode:
# Product > Archive
# Follow the wizard to upload to App Store
```

## Project Structure

```
src/
├── components/          # Reusable components
│   ├── TabNav.jsx      # Bottom navigation
│   ├── ProtectedRoute.jsx
│   └── AdminRoute.jsx
├── contexts/           # React Context
│   ├── AuthContext.jsx
│   └── ThemeContext.jsx
├── pages/              # Page components
│   ├── auth/
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   └── ForgotPassword.jsx
│   ├── admin/
│   │   ├── AdminDashboard.jsx
│   │   ├── ManageMembers.jsx
│   │   ├── ManageAnnouncements.jsx
│   │   └── ...
│   ├── Home.jsx
│   ├── Announcements.jsx
│   ├── Programs.jsx
│   ├── Profile.jsx
│   ├── Sermons.jsx
│   ├── Attendance.jsx
│   ├── Donations.jsx
│   ├── PrayerRequests.jsx
│   └── Testimonies.jsx
├── styles/             # CSS files
│   ├── global.css
│   └── animations.css
├── config/             # Configuration
│   └── firebaseConfig.js
└── App.jsx             # Main app component
```

## Admin Access

To create an admin user:

1. Register a new account in the app
2. Go to Firebase Console > Firestore
3. Find the user document in the `users` collection
4. Edit the document and change `role` field to `"admin"` or `"superadmin"`

## Testing Payments

Use test cards from:
- **Paystack**: https://paystack.com/docs/payments/test-payments
- **Flutterwave**: https://developer.flutterwave.com/docs/integration-guides/testing-helpers

## Features to Customize

- Change church logo in `/public` folder
- Update app colors in `src/styles/global.css` (CSS variables)
- Modify service times in `Attendance.jsx` > `getCurrentService()`
- Add more departments in `Register.jsx`
- Customize donation categories in `Donations.jsx`

## Troubleshooting

### Build Errors
- Clear cache: `rm -rf node_modules package-lock.json && npm install`
- Rebuild: `ionic build --prod`

### Firebase Errors
- Check Firebase config is correct
- Verify Security Rules are applied
- Check Firebase project quotas

### Android Build Issues
- Update Android Studio to latest version
- Sync Gradle files
- Check `android/app/build.gradle` for version conflicts

### iOS Build Issues
- Update Xcode to latest version
- Run `pod install` in `ios/App` directory
- Check signing certificates

## Performance Tips

1. **Image Optimization**: Compress images before uploading to Firebase Storage
2. **Lazy Loading**: Use React.lazy() for code splitting on larger components
3. **Firestore Indexes**: Create indexes for complex queries in Firebase Console
4. **Caching**: Enable offline persistence in Firestore for better offline experience

## Support & Community

- **Issues**: Report bugs on GitHub Issues
- **Discussions**: Join our community forum
- **Email**: support@churchconnect.com

## License

MIT License - feel free to use this project for your church!

## Contributors

Built with ❤️ by ChurchConnect Team

---

**Note**: This is a production-ready template. Always test thoroughly before deploying to production and ensure you comply with your region's data protection laws.#   C h u r c h - M a n a g e m e n t - a p p -  
 
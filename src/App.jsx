// src/App.jsx
import { IonApp, IonRouterOutlet, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { Route, Redirect } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';

// Main Pages
import Home from './pages/Home';
import Announcements from './pages/Announcements';
import Programs from './pages/Programs';
import Profile from './pages/Profile';
import Sermons from './pages/Sermons';
import AttendanceSystem from './pages/attendance/AttendanceSystem';
import Donations from './pages/Donations';
import PrayerRequests from './pages/PrayerRequests';
import Testimonies from './pages/Testimonies';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageMembers from './pages/admin/ManageMembers';
import ManageAnnouncements from './pages/admin/ManageAnnouncements';
import ManagePrograms from './pages/admin/ManagePrograms';
import ManageSermons from './pages/admin/ManageSermons';
import ManageDonations from './pages/admin/ManageDonations';
import AdminAttendance from './pages/admin/AdminAttendance';

// Protected Route Components
import ProtectedRoute from './components/ProtectedRoute';

// Ionic CSS
import '@ionic/react/css/core.css';
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

// Global Styles
import './styles/global.css';
import './styles/animations.css';

setupIonicReact({
  mode: 'ios',
  animated: true
});

function App() {
  return (
    <IonApp>
      <ThemeProvider>
        <AuthProvider>
          <IonReactRouter>
            <IonRouterOutlet>
              {/* Public Routes */}
              <Route exact path="/login" component={Login} />
              <Route exact path="/register" component={Register} />
              <Route exact path="/forgot-password" component={ForgotPassword} />
              
              {/* Protected Routes */}
              <ProtectedRoute exact path="/home" component={Home} />
              <ProtectedRoute exact path="/announcements" component={Announcements} />
              <ProtectedRoute exact path="/programs" component={Programs} />
              <ProtectedRoute exact path="/sermons" component={Sermons} />
              <ProtectedRoute exact path="/profile" component={Profile} />
              <ProtectedRoute exact path="/attendance" component={AttendanceSystem} />
              <ProtectedRoute exact path="/donations" component={Donations} />
              <ProtectedRoute exact path="/prayer-requests" component={PrayerRequests} />
              <ProtectedRoute exact path="/testimonies" component={Testimonies} />
              
              {/* Admin Routes - Now using ProtectedRoute */}
              <ProtectedRoute exact path="/admin/dashboard" component={AdminDashboard} />
              <ProtectedRoute exact path="/admin/members" component={ManageMembers} />
              <ProtectedRoute exact path="/admin/announcements" component={ManageAnnouncements} />
              <ProtectedRoute exact path="/admin/programs" component={ManagePrograms} />
              <ProtectedRoute exact path="/admin/sermons" component={ManageSermons} />
              <ProtectedRoute exact path="/admin/attendance" component={AdminAttendance} />
              <ProtectedRoute exact path="/admin/donations" component={ManageDonations} />
              
              {/* Default Redirect */}
              <Route exact path="/">
                <Redirect to="/login" />
              </Route>
            </IonRouterOutlet>
          </IonReactRouter>
        </AuthProvider>
      </ThemeProvider>
    </IonApp>
  );
}

export default App;
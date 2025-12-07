// src/components/TabNav.jsx
import { IonIcon } from '@ionic/react';
import {
  homeOutline,
  home,
  megaphoneOutline,
  megaphone,
  calendarOutline,
  calendar,
  personOutline,
  person
} from 'ionicons/icons';
import { useLocation, useHistory } from 'react-router-dom';
import './TabNav.css';

const TabNav = () => {
  const location = useLocation();
  const history = useHistory();

  const tabs = [
    {
      path: '/home',
      label: 'Home',
      iconOutline: homeOutline,
      iconFilled: home
    },
    {
      path: '/announcements',
      label: 'Announcements',
      iconOutline: megaphoneOutline,
      iconFilled: megaphone
    },
    {
      path: '/programs',
      label: 'Programs',
      iconOutline: calendarOutline,
      iconFilled: calendar
    },
    {
      path: '/profile',
      label: 'Profile',
      iconOutline: personOutline,
      iconFilled: person
    }
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="tab-nav">
      <div className="tab-nav-container">
        {tabs.map((tab, index) => (
          <button
            key={index}
            className={`tab-button ${isActive(tab.path) ? 'active' : ''}`}
            onClick={() => history.push(tab.path)}
          >
            <div className="tab-icon-wrapper">
              <IonIcon
                icon={isActive(tab.path) ? tab.iconFilled : tab.iconOutline}
                className="tab-icon"
              />
              {isActive(tab.path) && <div className="tab-indicator" />}
            </div>
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default TabNav;
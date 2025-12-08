// src/components/TabNav.jsx - FIXED VERSION
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

  // ✅ FIXED: Properly check if current path matches tab path
  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <div className="tab-nav">
      <div className="tab-nav-container">
        {tabs.map((tab, index) => {
          const active = isActive(tab.path);
          return (
            <button
              key={index}
              className={`tab-button ${active ? 'active' : ''}`}
              onClick={() => history.push(tab.path)}
            >
              <div className="tab-icon-wrapper">
                <IonIcon
                  icon={active ? tab.iconFilled : tab.iconOutline}
                  className="tab-icon"
                />
                {active && <div className="tab-indicator" />}
              </div>
              <span className="tab-label">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default TabNav;
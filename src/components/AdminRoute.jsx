// src/components/AdminRoute.jsx
import { Route, Redirect } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const AdminRoute = ({ component: Component, ...rest }) => {
  const { currentUser, userProfile } = useAuth();

  const isAdmin = userProfile?.role === 'admin' || userProfile?.role === 'superadmin';

  return (
    <Route
      {...rest}
      render={(props) =>
        currentUser && isAdmin ? (
          <Component {...props} />
        ) : (
          <Redirect to="/home" />
        )
      }
    />
  );
};

export default AdminRoute;
import React from 'react';
import { Redirect, Route } from 'react-router-dom';
import {
  IonApp,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton,
  IonTabs,
  IonIcon,
  IonLabel,
  setupIonicReact,
} from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import {
  homeOutline,
  personAddOutline,
  checkmarkCircleOutline,
  personOutline,
} from 'ionicons/icons';

import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import HostHome from './pages/HostHome';
import InviteVisitor from './pages/InviteVisitor';
import ApprovalStatus from './pages/ApprovalStatus';
import VisitorDetails from './pages/VisitorDetails';
import ActiveVisitors from './pages/ActiveVisitors';
import PastVisitors from './pages/PastVisitors';
import ProfileSettings from './pages/ProfileSettings';

setupIonicReact();

function ProtectedRoute({ component: Component, exact, path }) {
  const { user, isAuthenticated, loading } = useAuth();

  return (
    <Route
      exact={exact}
      path={path}
      render={(props) => {
        if (!loading && (!isAuthenticated || !user)) {
          return <Redirect to="/login" />;
        }
        return <Component {...props} />;
      }}
    />
  );
}

function MainLayout() {
  const { user, isAuthenticated } = useAuth();
  const showTabs = isAuthenticated && !!user;

  return (
    <IonTabs>
      <IonRouterOutlet>
        <Route
          exact
          path="/login"
          render={(props) => {
            if (isAuthenticated && user) {
              return <Redirect to="/home" />;
            }
            return <Login {...props} />;
          }}
        />

        <ProtectedRoute exact path="/home" component={HostHome} />
        <ProtectedRoute exact path="/invite-visitor" component={InviteVisitor} />
        <ProtectedRoute exact path="/approval-status" component={ApprovalStatus} />
        <ProtectedRoute exact path="/visitor-details/:codeOrId" component={VisitorDetails} />
        <ProtectedRoute exact path="/active-visitors" component={ActiveVisitors} />
        <ProtectedRoute exact path="/past-visitors" component={PastVisitors} />
        <ProtectedRoute exact path="/profile" component={ProfileSettings} />

        <Route exact path="/">
          <Redirect to={isAuthenticated && user ? "/home" : "/login"} />
        </Route>
      </IonRouterOutlet>

      {/* Bottom Tab Bar only visible for authenticated hosts */}
      <IonTabBar
        slot="bottom"
        style={{
          '--background': '#ffffff',
          borderTop: '1.5px solid #f0e6da',
          height: '62px',
          display: showTabs ? 'flex' : 'none',
        }}
      >
        <IonTabButton tab="home" href="/home">
          <IonIcon icon={homeOutline} />
          <IonLabel>Home</IonLabel>
        </IonTabButton>

        <IonTabButton tab="invite" href="/invite-visitor">
          <IonIcon icon={personAddOutline} />
          <IonLabel>Invite</IonLabel>
        </IonTabButton>

        <IonTabButton tab="approvals" href="/approval-status">
          <IonIcon icon={checkmarkCircleOutline} />
          <IonLabel>Approvals</IonLabel>
        </IonTabButton>

        <IonTabButton tab="profile" href="/profile">
          <IonIcon icon={personOutline} />
          <IonLabel>Profile</IonLabel>
        </IonTabButton>
      </IonTabBar>
    </IonTabs>
  );
}

export default function App() {
  return (
    <IonApp>
      <AuthProvider>
        <IonReactRouter>
          <MainLayout />
        </IonReactRouter>
      </AuthProvider>
    </IonApp>
  );
}

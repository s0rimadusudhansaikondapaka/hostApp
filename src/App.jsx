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

import { AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import HostHome from './pages/HostHome';
import InviteVisitor from './pages/InviteVisitor';
import ApprovalStatus from './pages/ApprovalStatus';
import VisitorDetails from './pages/VisitorDetails';
import ActiveVisitors from './pages/ActiveVisitors';
import PastVisitors from './pages/PastVisitors';
import ProfileSettings from './pages/ProfileSettings';

setupIonicReact();

export default function App() {
  return (
    <IonApp>
      <AuthProvider>
        <IonReactRouter>
          <IonTabs>
            <IonRouterOutlet>
              <Route exact path="/login" component={Login} />
              <Route exact path="/home" component={HostHome} />
              <Route exact path="/invite-visitor" component={InviteVisitor} />
              <Route exact path="/approval-status" component={ApprovalStatus} />
              <Route exact path="/visitor-details/:codeOrId" component={VisitorDetails} />
              <Route exact path="/active-visitors" component={ActiveVisitors} />
              <Route exact path="/past-visitors" component={PastVisitors} />
              <Route exact path="/profile" component={ProfileSettings} />
              <Route exact path="/">
                <Redirect to="/home" />
              </Route>
            </IonRouterOutlet>

            {/* Bottom Tab Bar matching Seva / Host Mobile Design */}
            <IonTabBar slot="bottom" style={{ '--background': '#ffffff', borderTop: '1.5px solid #f0e6da', height: '62px' }}>
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
        </IonReactRouter>
      </AuthProvider>
    </IonApp>
  );
}

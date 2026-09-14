import React, { useState, useEffect } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton,
  IonRefresher,
  IonRefresherContent,
} from '@ionic/react';
import { getVisitHistory, getHostRegistrations } from '../services/api';
import { History, Calendar, CheckCircle2 } from 'lucide-react';

export default function PastVisitors({ history }) {
  const [historyList, setHistoryList] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    try {
      const res = await getVisitHistory();
      if (res?.history && res.history.length > 0) {
        setHistoryList(res.history);
      } else {
        // Fallback to checked-out or older registrations
        const hostRes = await getHostRegistrations();
        if (hostRes?.registrations) {
          const past = hostRes.registrations.filter((r) => r.status === 'CHECKED_OUT' || r.status === 'REJECTED');
          setHistoryList(past);
        }
      }
    } catch (e) {
      console.warn('Error fetching past visitors:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleRefresh = async (e) => {
    await fetchHistory();
    e.detail.complete();
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return `${d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}`;
  };

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar style={{ '--background': '#ffffff', borderBottom: '1px solid #e2e8f0' }}>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/home" text="" />
          </IonButtons>
          <IonTitle style={{ fontSize: '1.05rem', fontWeight: '800', color: '#0f172a' }}>Past Visitors</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="ion-padding" style={{ '--background': '#f8fafc' }}>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '0.5rem 0 1rem 0' }}>
          Archived records of past visits to your flat or department.
        </p>

        {historyList.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748b' }}>
            <History size={40} color="#cbd5e1" style={{ marginBottom: '0.5rem' }} />
            <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 'bold' }}>No past visitor records</p>
            <span style={{ fontSize: '0.78rem' }}>When visitors complete their visit and check out, their history will appear here.</span>
          </div>
        ) : (
          historyList.map((r, i) => (
            <div
              key={r.id || i}
              className="host-action-card"
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '800', color: '#0f172a' }}>
                  {r.visitor_name}
                </h4>
                <span className="host-badge" style={{ background: '#f1f5f9', color: '#475569' }}>
                  {r.status || 'CHECKED_OUT'}
                </span>
              </div>
              <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                <div>{r.visitor_phone} • {r.purpose || 'Ashram Visit'}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.2rem' }}>
                  <Calendar size={13} color="#64748b" />
                  <span>Visited on: {formatDate(r.valid_from || r.created_at)}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </IonContent>
    </IonPage>
  );
}

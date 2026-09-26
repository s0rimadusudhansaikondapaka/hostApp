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
import { getHostRegistrations } from '../services/api';
import { Users, Calendar, Car, ChevronRight, ShieldCheck } from 'lucide-react';

export default function ActiveVisitors({ history }) {
  const [activeList, setActiveList] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchActive = async () => {
    try {
      const res = await getHostRegistrations();
      if (res?.registrations) {
        const active = res.registrations.filter(
          (r) => r.status === 'INSIDE_CAMPUS' || r.status === 'APPROVED'
        );
        setActiveList(active);
      }
    } catch (e) {
      console.warn('Error fetching active visitors:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActive();
  }, []);

  const handleRefresh = async (e) => {
    await fetchActive();
    e.detail.complete();
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })}, ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar style={{ '--background': '#faf6f0', borderBottom: '1px solid #ebdccc' }}>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/home" text="" color="dark" />
          </IonButtons>
          <IonTitle style={{ fontSize: '1.05rem', fontWeight: '800', color: '#1c1917' }}>Active Visitors</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="ion-padding" style={{ '--background': '#faf6f0' }}>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        {/* Section Header matching Attachment 1 */}
        <div className="host-section-header" style={{ marginTop: '0.2rem', marginBottom: '0.9rem' }}>
          <div className="host-section-title-wrap">
            <h3 className="host-section-title">Active Inside Campus</h3>
            <div className="host-section-underline"></div>
          </div>
          <div className="host-section-count">
            {activeList.length} Active
          </div>
        </div>

        <p style={{ fontSize: '0.8rem', color: '#78716c', margin: '0 0 1rem 0', fontWeight: '500' }}>
          Visitors currently inside campus or approved and expected to arrive today.
        </p>

        {activeList.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', background: '#ffffff', borderRadius: '22px', border: '1.5px dashed #ebdccc', color: '#78716c' }}>
            <Users size={36} color="#d6c7b2" style={{ marginBottom: '0.5rem' }} />
            <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: '800', color: '#1c1917' }}>No active visitors currently</p>
            <span style={{ fontSize: '0.78rem', color: '#78716c' }}>When your invited visitors are approved or enter the gate, they will appear here.</span>
          </div>
        ) : (
          activeList.map((r) => {
            const isInside = r.status === 'INSIDE_CAMPUS';

            return (
              <div
                key={r.id}
                className="host-visitor-card"
                onClick={() => history.push(`/visitor-details/${r.pass_code || r.id}`)}
                style={{ marginBottom: '0.85rem' }}
              >
                {/* Top Bar with pastel sky-blue tint matching attachment */}
                <div className="host-visitor-card-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{ 
                      background: '#ffffff', 
                      border: '1px solid #dbeafe', 
                      color: '#1e40af', 
                      borderRadius: '9999px', 
                      padding: '2px 9px', 
                      fontSize: '0.7rem', 
                      fontWeight: '700'
                    }}>
                      👤 {r.visitor_category === 'FAMILY_MEMBER' ? 'Family Member' : r.visitor_category === 'VIP' ? 'VIP Guest' : 'General Visitor'}
                    </span>

                    <span style={{ 
                      background: isInside ? '#dcfce7' : '#e0f2fe', 
                      color: isInside ? '#15803d' : '#0369a1', 
                      borderRadius: '9999px', 
                      padding: '2px 9px', 
                      fontSize: '0.7rem', 
                      fontWeight: '700'
                    }}>
                      • {isInside ? 'SERVING' : 'APPROVED'}
                    </span>
                  </div>

                  <div style={{ 
                    width: '26px', 
                    height: '26px', 
                    borderRadius: '50%', 
                    background: '#ffffff', 
                    border: '1px solid #e2e8f0', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    color: '#64748b'
                  }}>
                    <ChevronRight size={14} />
                  </div>
                </div>

                {/* Body matching Attachment 1 */}
                <div className="host-visitor-card-body">
                  <h3 style={{ margin: '0 0 0.2rem 0', fontSize: '1.05rem', fontWeight: '800', color: '#1c1917' }}>
                    {r.visitor_name}
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.76rem', color: '#78716c' }}>
                    Pass: <strong>{r.pass_code || `#${r.id}`}</strong> • {r.visitor_phone}
                  </p>
                  <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.76rem', color: '#57534e' }}>
                    <strong>Purpose:</strong> {r.purpose || 'Ashram Visit'}
                  </p>

                  <div style={{ 
                    borderTop: '1px solid #f5eee6', 
                    marginTop: '0.65rem', 
                    paddingTop: '0.55rem', 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    fontSize: '0.74rem', 
                    color: '#57534e' 
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Calendar size={13} color="#b84018" />
                      <span>Valid until: {formatDate(r.valid_until)}</span>
                    </div>
                    <div style={{ fontWeight: '700', color: '#1c1917' }}>
                      {r.person_count || 1} Guests
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </IonContent>
    </IonPage>
  );
}


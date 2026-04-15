import React from 'react';

const ParticipantList = ({ participants }) => {
  return (
    <div className="participants-panel">
      <h2 className="panel-title">
        Live ({participants.length})
      </h2>
      
      <div className="participant-list">
        {participants.map((p) => (
          <div key={p.id} className="participant-item">
            <div className="participant-info">
              <div className="avatar">
                {p.username.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="participant-name">{p.username}</div>
                <div className={`participant-role role-${p.role}`}>
                  {p.role}
                </div>
              </div>
            </div>
            
            {/* Here we could add Kick/Promote buttons for Host later */}
          </div>
        ))}
        {participants.length === 0 && (
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Nobody is here yet.</p>
        )}
      </div>
    </div>
  );
};

export default ParticipantList;

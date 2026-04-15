import React from 'react';
import { useRoom } from '../../context/RoomContext';
import RoleManager from '../RoleManager/RoleManager';
import { ROLES } from '../../constants';

const Participants = () => {
  const { participants, role, username } = useRoom();

  const getBadgeColor = (userRole) => {
    switch(userRole) {
      case ROLES.HOST: return 'bg-red-500/20 text-red-400 border border-red-500/30';
      case ROLES.MODERATOR: return 'bg-blue-500/20 text-blue-400 border border-blue-500/30';
      default: return 'bg-gray-600/50 text-gray-400 border border-gray-600/30';
    }
  };

  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center justify-between">
        Live Participants 
        <span className="bg-gray-700 text-gray-300 text-xs px-2 py-1 rounded-full">{participants.length}</span>
      </h3>
      <div className="space-y-3">
        {participants.map((p) => {
          const isMe = p.username === username;
          return (
            <div key={p.id} className={`bg-gray-900/50 p-3 rounded-xl border ${isMe ? 'border-indigo-500/50' : 'border-gray-700/50'} flex flex-col gap-2 transition-colors hover:border-gray-600`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-sm font-bold text-white shadow-inner">
                    {p.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-200">
                      {p.username} {isMe && <span className="text-xs text-gray-500">(You)</span>}
                    </span>
                  </div>
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${getBadgeColor(p.role)}`}>
                  {p.role}
                </span>
              </div>
              
              {/* Show Role Manager if we are Host and modifying someone else */}
              {role === ROLES.HOST && p.role !== ROLES.HOST && (
                <RoleManager targetSocketId={p.id} currentRole={p.role} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Participants;

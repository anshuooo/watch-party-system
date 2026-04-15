import React from 'react';
import { socket } from '../../socket/socket';
import { EVENTS, ROLES } from '../../constants';
import { useRoom } from '../../context/RoomContext';

const RoleManager = ({ targetSocketId, currentRole }) => {
  const { roomId } = useRoom();

  const handleRoleChange = (e) => {
    const newRole = e.target.value;
    socket.emit(EVENTS.ASSIGN_ROLE, { roomId, targetSocketId, newRole });
  };

  const handleRemove = () => {
    if (window.confirm("Are you sure you want to remove this participant?")) {
      socket.emit(EVENTS.REMOVE_PARTICIPANT, { roomId, targetSocketId });
    }
  };

  return (
    <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-700/50">
      <select 
        value={currentRole} 
        onChange={handleRoleChange}
        className="bg-gray-800 text-xs text-gray-300 border border-gray-600 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 hover:border-gray-500 transition-colors"
      >
        <option value={ROLES.PARTICIPANT}>Participant</option>
        <option value={ROLES.MODERATOR}>Moderator</option>
      </select>
      
      <button 
        onClick={handleRemove}
        className="text-xs text-red-400 hover:text-red-300 transition-colors px-2 py-1 rounded border border-transparent hover:border-red-400/30 hover:bg-red-400/10"
      >
        Remove
      </button>
    </div>
  );
};

export default RoleManager;

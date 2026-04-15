import React from 'react';
import { useRoom } from '../../context/RoomContext';
import { useNavigate } from 'react-router-dom';

const RoomHeader = () => {
  const { roomId } = useRoom();
  const navigate = useNavigate();

  const handleCopy = () => {
    navigator.clipboard.writeText(roomId);
    alert('Room ID copied to clipboard!');
  };

  return (
    <div className="bg-gray-800 border-b border-gray-700 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <h2 className="text-xl font-bold text-white">Watch Party</h2>
        <div className="flex items-center bg-gray-700 rounded-md px-3 py-1">
          <span className="text-gray-400 text-sm mr-2">ID:</span>
          <span className="text-indigo-300 font-mono text-sm tracking-widest font-medium">{roomId}</span>
          <button onClick={handleCopy} className="ml-3 text-gray-400 hover:text-white transition-colors" title="Copy Room ID">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
        </div>
      </div>
      <button 
        onClick={() => navigate('/')} 
        className="px-4 py-2 bg-red-600/20 text-red-500 hover:bg-red-600 hover:text-white border border-red-500/30 rounded-lg text-sm font-medium transition-all"
      >
        Leave Room
      </button>
    </div>
  );
};

export default RoomHeader;

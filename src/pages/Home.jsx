import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const [user, setUser] = useState('');
  const [room, setRoom] = useState('');
  const navigate = useNavigate();

  const handleJoin = (e) => {
    e.preventDefault();
    if (user.trim() && room.trim()) {
      navigate(`/room/${room}`, { state: { username: user } });
    }
  };

  const handleCreate = () => {
    if (user.trim()) {
      const newRoom = Math.random().toString(36).substring(2, 8).toUpperCase();
      navigate(`/room/${newRoom}`, { state: { username: user } });
    } else {
      alert("Please enter a username.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 p-4">
      <div className="max-w-md w-full bg-gray-800 rounded-xl shadow-2xl p-8 border border-gray-700">
        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 mb-2 text-center">
          Watch Party
        </h1>
        <p className="text-gray-400 text-center mb-8">Sync videos perfectly with friends</p>

        <form onSubmit={handleJoin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Your Username</label>
            <input 
              type="text" 
              required
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
              placeholder="Enter your name"
              value={user}
              onChange={(e) => setUser(e.target.value)}
            />
          </div>

          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-300 mb-1">Room ID</label>
              <input 
                type="text" 
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                placeholder="Paste Room ID"
                value={room}
                onChange={(e) => setRoom(e.target.value)}
              />
            </div>
            <button type="submit" className="px-6 py-2 border border-gray-600 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors">
              Join
            </button>
          </div>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-gray-600"></div>
            <span className="flex-shrink-0 mx-4 text-gray-500 text-sm">OR</span>
            <div className="flex-grow border-t border-gray-600"></div>
          </div>

          <button 
            type="button" 
            onClick={handleCreate}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold shadow-lg shadow-indigo-600/30 transition-all"
          >
            Create New Room
          </button>
        </form>
      </div>
    </div>
  );
};

export default Home;

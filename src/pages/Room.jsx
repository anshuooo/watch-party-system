import React, { useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useRoom } from '../context/RoomContext';
import { socket } from '../socket/socket';
import { EVENTS } from '../constants';
import Player from '../components/Player/Player';
import Participants from '../components/Participants/Participants';
import RoomHeader from '../components/RoomHeader/RoomHeader';

const Room = () => {
  const { roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { joinRoom } = useRoom();

  const username = location.state?.username || `Guest_${Math.floor(Math.random() * 1000)}`;

  useEffect(() => {
    // Initiate joining logic to populate RoomContext and socket events
    joinRoom(roomId, username);

    const onRemoved = () => {
      alert("You have been removed from the room.");
      navigate('/');
    };

    socket.on(EVENTS.PARTICIPANT_REMOVED, onRemoved);

    return () => {
      // Disconnect socket context properly
      socket.off(EVENTS.PARTICIPANT_REMOVED, onRemoved);
      socket.emit(EVENTS.LEAVE_ROOM);
    };
  }, [roomId, username, joinRoom, navigate]);

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-gray-100">
      <RoomHeader />
      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
        {/* Main Content (Player) */}
        <div className="w-full lg:w-3/4 flex flex-col p-4 bg-gray-950 overflow-y-auto">
          <Player />
        </div>
        
        {/* Sidebar (Participants) */}
        <div className="w-full lg:w-1/4 bg-gray-800 border-l border-gray-700 overflow-y-auto">
          <Participants />
        </div>
      </div>
    </div>
  );
};

export default Room;

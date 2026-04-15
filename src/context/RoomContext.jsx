import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { socket } from '../socket/socket';
import { EVENTS } from '../constants';

const RoomContext = createContext(null);

export const useRoom = () => {
  return useContext(RoomContext);
};

export const RoomProvider = ({ children }) => {
  const [username, setUsername] = useState('');
  const [roomId, setRoomId] = useState('');
  const [role, setRole] = useState('Participant');
  const [participants, setParticipants] = useState([]);
  const [videoState, setVideoState] = useState({
    videoId: 'NpEaa2P7qZI',
    currentTime: 0,
    playState: 'paused'
  });

  const joinRoom = useCallback((room, user) => {
    setRoomId(room);
    setUsername(user);
    if (!socket.connected) socket.connect();
    socket.emit(EVENTS.JOIN_ROOM, { roomId: room, username: user });
  }, []);

  useEffect(() => {
    const onSyncState = (state) => {
      setParticipants(state.participants);
      setVideoState({
        videoId: state.currentVideoId || 'NpEaa2P7qZI',
        currentTime: state.currentTime,
        playState: state.playState
      });
      const me = state.participants.find(p => p.id === socket.id);
      if (me) setRole(me.role);
    };

    const onUserJoined = (participant) => setParticipants(prev => [...prev, participant]);
    const onUserLeft = ({ id }) => setParticipants(prev => prev.filter(p => p.id !== id));
    const onRoleAssigned = ({ id, role: newRole }) => {
      setParticipants(prev => prev.map(p => p.id === id ? { ...p, role: newRole } : p));
      if (id === socket.id) setRole(newRole);
    };
    
    // Playback sync listeners
    const onPlay = ({ time }) => setVideoState(prev => ({ ...prev, currentTime: time, playState: 'playing' }));
    const onPause = ({ time }) => setVideoState(prev => ({ ...prev, currentTime: time, playState: 'paused' }));
    const onSeek = ({ time }) => setVideoState(prev => ({ ...prev, currentTime: time }));
    const onVideoChanged = ({ videoId }) => setVideoState(prev => ({ ...prev, videoId, currentTime: 0, playState: 'paused' }));

    socket.on(EVENTS.SYNC_STATE, onSyncState);
    socket.on(EVENTS.USER_JOINED, onUserJoined);
    socket.on(EVENTS.USER_LEFT, onUserLeft);
    socket.on(EVENTS.ROLE_ASSIGNED, onRoleAssigned);
    socket.on(EVENTS.PLAY, onPlay);
    socket.on(EVENTS.PAUSE, onPause);
    socket.on(EVENTS.SEEK, onSeek);
    socket.on(EVENTS.VIDEO_CHANGED, onVideoChanged);

    return () => {
      socket.off(EVENTS.SYNC_STATE, onSyncState);
      socket.off(EVENTS.USER_JOINED, onUserJoined);
      socket.off(EVENTS.USER_LEFT, onUserLeft);
      socket.off(EVENTS.ROLE_ASSIGNED, onRoleAssigned);
      socket.off(EVENTS.PLAY, onPlay);
      socket.off(EVENTS.PAUSE, onPause);
      socket.off(EVENTS.SEEK, onSeek);
      socket.off(EVENTS.VIDEO_CHANGED, onVideoChanged);
    };
  }, []);

  const value = {
    username,
    roomId,
    role,
    participants,
    videoState,
    joinRoom,
    setVideoState
  };

  return (
    <RoomContext.Provider value={value}>
      {children}
    </RoomContext.Provider>
  );
};

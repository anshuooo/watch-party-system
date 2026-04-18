import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';

// YouTube IFrame API types are declared in src/types/youtube.d.ts

// TypeScript interfaces
interface WatchRoomProps {}

interface User {
  id: string;
  username: string;
  role: 'host' | 'moderator' | 'participant' | 'viewer';
  isOnline: boolean;
}

interface ChatMessage {
  id: string;
  username: string;
  message: string;
  timestamp: Date;
}

interface SyncState {
  playState: 'playing' | 'paused';
  currentTime: number;
  videoId: string;
}

interface RoomData {
  roomName: string;
  roomCode: string;
  hostId: string;
  participants: User[];
  currentVideo?: {
    id: string;
    title: string;
    url: string;
  };
}

const WatchRoom: React.FC<WatchRoomProps> = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const socket = useSocket();
  
  // Refs
  const playerRef = useRef<YT.Player | null>(null);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const playerInitialized = useRef(false);
  const scriptLoaded = useRef(false);
  
  
  // State
  const [roomData, setRoomData] = useState<RoomData | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [syncState, setSyncState] = useState<SyncState>({
    playState: 'paused',
    currentTime: 0,
    videoId: ''
  });
  const [isLocalAction, setIsLocalAction] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<'moderator' | 'participant' | 'viewer'>('participant');
  const [playerReady, setPlayerReady] = useState(false);

  // Load YouTube IFrame API
  useEffect(() => {
    const loadYouTubeAPI = () => {
      if (window.YT && scriptLoaded.current) {
        if (!playerInitialized.current) {
          initializePlayer();
        }
        return;
      }

      if (scriptLoaded.current) return;

      scriptLoaded.current = true;

      // Define the callback before loading script
      window.onYouTubeIframeAPIReady = () => {
        if (!playerInitialized.current) {
          initializePlayer();
        }
      };

      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    };

    loadYouTubeAPI();

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
        playerInitialized.current = false;
      }
    };
  }, []);

  // Initialize YouTube player
  const initializePlayer = useCallback(() => {
    if (!window.YT || !roomId || playerInitialized.current) return;

    const element = document.getElementById('youtube-player');
    if (!element) return;

    playerInitialized.current = true;

    playerRef.current = new window.YT.Player('youtube-player', {
      height: '400',
      width: '100%',
      videoId: syncState.videoId || 'dQw4w9WgXcQ', // Default video
      playerVars: {
        autoplay: 0,
        controls: 0,
        disablekb: 1,
        enablejsapi: 1,
        origin: window.location.origin,
        iv_load_policy: 3,
        modestbranding: 1,
        rel: 0,
        showinfo: 0
      },
      events: {
        onReady: (event: { target: YT.Player }) => {
          setPlayerReady(true);
          console.log('YouTube player ready');
        },
        onStateChange: (event: { target: YT.Player; data: number }) => {
          if (isLocalAction) return;
          
          const playerState = event.data;
          const currentTime = playerRef.current?.getCurrentTime() || 0;
          
          if (playerState === window.YT.PlayerState.PLAYING) {
            emitSyncState('playing', currentTime);
          } else if (playerState === window.YT.PlayerState.PAUSED) {
            emitSyncState('paused', currentTime);
          }
        }
      }
    });
  }, [roomId, syncState.videoId, isLocalAction]);

  // Load video when videoId changes
  useEffect(() => {
    if (playerRef.current && playerReady && syncState.videoId) {
      const currentVideoId = playerRef.current.getVideoData().video_id;
      if (currentVideoId !== syncState.videoId) {
        playerRef.current.loadVideoById(syncState.videoId);
      }
    }
  }, [syncState.videoId, playerReady]);

  // Extract video ID from URL
  const extractVideoId = (url: string): string | null => {
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[7].length === 11) ? match[7] : null;
  };

  // Format time
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Emit sync state
  const emitSyncState = useCallback((playState: 'playing' | 'paused', currentTime: number) => {
    if (!socket || !currentUser || !canControl()) return;
    
    setIsLocalAction(true);
    socket.emit('sync_state', {
      playState,
      currentTime,
      videoId: syncState.videoId
    });
    
    setTimeout(() => setIsLocalAction(false), 1000);
  }, [socket, currentUser, syncState.videoId]);

  // Check if user can control
  const canControl = (): boolean => {
    if (!currentUser) return false;
    return currentUser.role === 'host' || currentUser.role === 'moderator';
  };

  // Check if user is host
  const isHost = (): boolean => {
    return currentUser?.role === 'host';
  };

  // YouTube player controls
  const handlePlay = () => {
    if (!playerRef.current || !canControl()) return;
    playerRef.current.playVideo();
  };

  const handlePause = () => {
    if (!playerRef.current || !canControl()) return;
    playerRef.current.pauseVideo();
  };

  const handleSeek = (seconds: number) => {
    if (!playerRef.current || !canControl()) return;
    playerRef.current.seekTo(seconds, true);
  };

  const handleSeekBackward = () => {
    const currentTime = playerRef.current?.getCurrentTime() || 0;
    handleSeek(Math.max(0, currentTime - 10));
  };

  const handleSeekForward = () => {
    const currentTime = playerRef.current?.getCurrentTime() || 0;
    const duration = playerRef.current?.getDuration() || 0;
    handleSeek(Math.min(duration, currentTime + 10));
  };

  const handleChangeVideo = () => {
    const videoId = extractVideoId(newVideoUrl);
    if (!videoId || !playerRef.current || !canControl()) return;
    
    socket?.emit('change_video', { videoId });
    setNewVideoUrl('');
  };

  // Socket.IO event handlers
  useEffect(() => {
    if (!socket || !roomId) return;

    // Join room
    socket.emit('join_watch_room', { roomId });

    // Listen for sync state
    socket.on('sync_state', (data: SyncState) => {
      if (isLocalAction) return;
      
      setIsSyncing(true);
      setSyncState(data);
      
      if (playerRef.current && playerReady) {
        if (data.videoId !== playerRef.current.getVideoData().video_id) {
          playerRef.current.loadVideoById(data.videoId);
        }
        
        if (data.playState === 'playing') {
          playerRef.current.playVideo();
        } else {
          playerRef.current.pauseVideo();
        }
        
        playerRef.current.seekTo(data.currentTime, true);
      }
      
      setTimeout(() => setIsSyncing(false), 500);
    });

    // Listen for user joined
    socket.on('user_joined', (data: { user: User; participants: User[] }) => {
      if (data.user.id === socket.id) {
        setCurrentUser(data.user);
      }
      setRoomData(prev => prev ? { ...prev, participants: data.participants } : null);
    });

    // Listen for user left
    socket.on('user_left', (data: { userId: string; participants: User[] }) => {
      setRoomData(prev => prev ? { ...prev, participants: data.participants } : null);
    });

    // Listen for role assignment
    socket.on('role_assigned', (data: { userId: string; role: string; participants: User[] }) => {
      if (data.userId === socket.id) {
        setCurrentUser(prev => prev ? { ...prev, role: data.role as any } : null);
      }
      setRoomData(prev => prev ? { ...prev, participants: data.participants } : null);
    });

    // Listen for participant removal
    socket.on('participant_removed', (data: { userId: string; participants: User[] }) => {
      if (data.userId === socket.id) {
        navigate('/');
      }
      setRoomData(prev => prev ? { ...prev, participants: data.participants } : null);
    });

    // Listen for new messages
    socket.on('new_message', (data: ChatMessage) => {
      setChatMessages(prev => [...prev, data]);
    });

    // Listen for room data
    socket.on('room_data', (data: RoomData) => {
      setRoomData(data);
      const user = data.participants.find(p => p.id === socket.id);
      if (user) {
        setCurrentUser(user);
      }
    });

    return () => {
      socket.off('sync_state');
      socket.off('user_joined');
      socket.off('user_left');
      socket.off('role_assigned');
      socket.off('participant_removed');
      socket.off('new_message');
      socket.off('room_data');
    };
  }, [socket, roomId, isLocalAction, playerReady]);

  // Handle exit
  const handleExit = () => {
    socket?.emit('leave_room', { roomId });
    localStorage.clear();
    navigate('/');
  };

  // Handle role assignment
  const handleAssignRole = () => {
    if (!selectedUserId || !socket || !isHost()) return;
    socket.emit('assign_role', { userId: selectedUserId, role: selectedRole });
    setSelectedUserId('');
  };

  // Handle remove participant
  const handleRemoveParticipant = (userId: string) => {
    if (!socket || !isHost()) return;
    socket.emit('remove_participant', { userId });
  };

  // Handle chat message
  const handleSendMessage = () => {
    if (!chatInput.trim() || !socket) return;
    socket.emit('chat_message', { message: chatInput.trim() });
    setChatInput('');
  };

  // Copy invite link
  const handleCopyInviteLink = () => {
    const inviteLink = window.location.href;
    navigator.clipboard.writeText(inviteLink);
  };

  // Get role badge
  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'host': return '??';
      case 'moderator': return '??';
      default: return '??';
    }
  };

  // Get role color
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'host': return 'text-yellow-400';
      case 'moderator': return 'text-blue-400';
      default: return 'text-gray-400';
    }
  };

  if (!roomData || !currentUser) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading room...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold">{roomData.roomName}</h1>
            <button
              onClick={handleCopyInviteLink}
              className="flex items-center space-x-2 px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
            >
              <span className="font-mono text-sm">{roomData.roomCode}</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
            <div className="flex items-center space-x-1">
              <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="text-sm">{roomData.participants.length}</span>
            </div>
          </div>
          <button
            onClick={() => setShowExitModal(true)}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded transition-colors"
          >
            Exit Room
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row h-screen pt-16">
        {/* Main Video Section */}
        <div className="flex-1 p-4">
          <div className="bg-gray-800 rounded-lg p-4">
            {/* YouTube Player */}
            <div id="youtube-player" className="w-full rounded-lg overflow-hidden mb-4"></div>
            
            {/* Playback Controls */}
            <div className="flex items-center justify-center space-x-4 mb-4">
              <button
                onClick={handleSeekBackward}
                disabled={!canControl()}
                className="p-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 rounded transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.333 4zM4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z" />
                </svg>
              </button>
              
              <button
                onClick={handlePlay}
                disabled={!canControl()}
                className="p-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-800 disabled:text-gray-500 rounded-full transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
              
              <button
                onClick={handlePause}
                disabled={!canControl()}
                className="p-3 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-800 disabled:text-gray-500 rounded-full transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
              
              <button
                onClick={handleSeekForward}
                disabled={!canControl()}
                className="p-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 rounded transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.933 12.8a1 1 0 000-1.6L6.6 7.2A1 1 0 005 8v8a1 1 0 001.6.8l5.333-4zM19.933 12.8a1 1 0 000-1.6l-5.333-4A1 1 0 0013 8v8a1 1 0 001.6.8l5.333-4z" />
                </svg>
              </button>
            </div>
            
            {/* Change Video */}
            {canControl() && (
              <div className="flex space-x-2">
                <input
                  type="url"
                  value={newVideoUrl}
                  onChange={(e) => setNewVideoUrl(e.target.value)}
                  placeholder="Enter YouTube URL"
                  className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                />
                <button
                  onClick={handleChangeVideo}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors"
                >
                  Change Video
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-full lg:w-96 p-4 space-y-4">
          {/* Participants List */}
          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4">Participants</h3>
            <div className="space-y-2">
              {roomData.participants.map((participant) => (
                <div
                  key={participant.id}
                  className={`flex items-center justify-between p-2 rounded ${participant.id === currentUser.id ? 'bg-gray-700' : ''}`}
                >
                  <div className="flex items-center space-x-2">
                    <span className={getRoleColor(participant.role)}>
                      {getRoleBadge(participant.role)}
                    </span>
                    <span>{participant.username}</span>
                    {participant.id === currentUser.id && (
                      <span className="text-xs text-gray-400">(You)</span>
                    )}
                  </div>
                  {isHost() && participant.id !== currentUser.id && (
                    <button
                      onClick={() => handleRemoveParticipant(participant.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Host Controls (Host only) */}
          {isHost() && (
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4">Host Controls</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Assign Role</label>
                  <div className="flex space-x-2">
                    <select
                      value={selectedUserId}
                      onChange={(e) => setSelectedUserId(e.target.value)}
                      className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                    >
                      <option value="">Select user...</option>
                      {roomData.participants
                        .filter(p => p.id !== currentUser.id)
                        .map(p => (
                          <option key={p.id} value={p.id}>{p.username}</option>
                        ))}
                    </select>
                    <select
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value as any)}
                      className="px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                    >
                      <option value="moderator">Moderator</option>
                      <option value="participant">Participant</option>
                      <option value="viewer">Viewer</option>
                    </select>
                    <button
                      onClick={handleAssignRole}
                      disabled={!selectedUserId}
                      className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 rounded transition-colors"
                    >
                      Assign
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Status */}
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="flex items-center">
                <div className={`w-2 h-2 rounded-full mr-2 ${isSyncing ? 'bg-yellow-400' : 'bg-green-400'}`}></div>
                {isSyncing ? 'Syncing...' : 'Synced'}
              </span>
              <span className="text-sm text-gray-400">
                {formatTime(syncState.currentTime)} / {formatTime(playerRef.current?.getDuration() || 0)}
              </span>
            </div>
          </div>

          {/* Chat (Bonus) */}
          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4">Chat</h3>
            <div className="h-64 overflow-y-auto mb-4 space-y-2">
              {chatMessages.map((msg) => (
                <div key={msg.id} className="text-sm">
                  <span className="font-semibold text-blue-400">{msg.username}:</span>
                  <span className="ml-2">{msg.message}</span>
                </div>
              ))}
            </div>
            <div className="flex space-x-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Type a message..."
                className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={handleSendMessage}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Exit Modal */}
      {showExitModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-sm">
            <h3 className="text-lg font-semibold mb-4">Exit Room?</h3>
            <p className="text-gray-400 mb-6">Are you sure you want to leave the watch party?</p>
            <div className="flex space-x-4">
              <button
                onClick={() => setShowExitModal(false)}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleExit}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 rounded transition-colors"
              >
                Exit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WatchRoom;

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';

interface JoinRoomProps {}

interface JoinRoomData {
  username: string;
  roomCode: string;
}

interface RoomResponse {
  roomId: string;
  roomData: {
    roomName: string;
    hostName: string;
    participantCount: number;
    videoUrl?: string;
  };
  role: 'participant';
}

const JoinRoom: React.FC<JoinRoomProps> = () => {
  const navigate = useNavigate();
  const socket = useSocket();
  
  // Form state
  const [formData, setFormData] = useState<JoinRoomData>({
    username: '',
    roomCode: ''
  });
  
  // UI state
  const [errors, setErrors] = useState<{ username?: string; roomCode?: string; general?: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Animated background component
  const AnimatedBackground = () => (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900">
        <div className="absolute inset-0 bg-black opacity-50"></div>
      </div>
      
      {/* Animated particles */}
      <div className="absolute inset-0">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white opacity-10 animate-pulse"
            style={{
              width: Math.random() * 4 + 2 + 'px',
              height: Math.random() * 4 + 2 + 'px',
              top: Math.random() * 100 + '%',
              left: Math.random() * 100 + '%',
              animationDelay: Math.random() * 5 + 's',
              animationDuration: Math.random() * 3 + 2 + 's'
            }}
          />
        ))}
      </div>
      
      {/* Gradient overlay animation */}
      <div className="absolute inset-0 bg-gradient-to-tr from-purple-600/20 via-transparent to-blue-600/20 animate-pulse"></div>
    </div>
  );

  // Validation functions
  const validateForm = (): boolean => {
    const newErrors: { username?: string; roomCode?: string } = {};
    
    if (!formData.username.trim()) {
      newErrors.username = 'Display name is required';
    } else if (formData.username.trim().length < 2) {
      newErrors.username = 'Display name must be at least 2 characters';
    } else if (formData.username.trim().length > 20) {
      newErrors.username = 'Display name must be less than 20 characters';
    }
    
    if (!formData.roomCode.trim()) {
      newErrors.roomCode = 'Room code is required';
    } else if (!/^[A-Z0-9]{6}$/.test(formData.roomCode.trim().toUpperCase())) {
      newErrors.roomCode = 'Room code must be 6 alphanumeric characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Show toast notification
  const showToastNotification = (message: string, type: 'error' | 'success' = 'error') => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'roomCode') {
      // Auto convert to uppercase and limit to 6 characters
      const upperValue = value.toUpperCase().slice(0, 6);
      setFormData(prev => ({
        ...prev,
        [name]: upperValue
      }));
      
      // Clear room code error when user starts typing
      if (errors.roomCode) {
        setErrors(prev => ({
          ...prev,
          roomCode: undefined
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
      
      // Clear username error when user starts typing
      if (errors.username) {
        setErrors(prev => ({
          ...prev,
          username: undefined
        }));
      }
    }
  };

  // Handle paste from clipboard
  const handlePasteRoomCode = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const cleanedCode = text.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
      
      if (cleanedCode) {
        setFormData(prev => ({
          ...prev,
          roomCode: cleanedCode
        }));
        
        if (errors.roomCode) {
          setErrors(prev => ({
            ...prev,
            roomCode: undefined
          }));
        }
      }
    } catch (error) {
      showToastNotification('Failed to paste from clipboard');
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    if (!socket) {
      showToastNotification('Connection error. Please refresh the page.');
      return;
    }
    
    setIsLoading(true);
    setErrors({});
    
    try {
      const roomCodeUpper = formData.roomCode.trim().toUpperCase();
      
      // Emit join_room event
      socket.emit('join_room', {
        username: formData.username.trim(),
        roomCode: roomCodeUpper
      });
      
      // Listen for room joined response
      socket.once('room_joined', (response: RoomResponse) => {
        // Store data in localStorage
        localStorage.setItem('username', formData.username.trim());
        localStorage.setItem('roomId', response.roomId);
        localStorage.setItem('roomCode', roomCodeUpper);
        localStorage.setItem('roomName', response.roomData.roomName);
        localStorage.setItem('role', response.role);
        localStorage.setItem('hostName', response.roomData.hostName);
        localStorage.setItem('participantCount', response.roomData.participantCount.toString());
        
        if (response.roomData.videoUrl) {
          localStorage.setItem('videoUrl', response.roomData.videoUrl);
        }
        
        // Navigate to watch room
        navigate(`/watch/${response.roomId}`);
        setIsLoading(false);
      });
      
      // Handle specific errors from server
      socket.once('room_not_found', () => {
        setErrors({ roomCode: 'Room not found. Please check the code and try again.' });
        showToastNotification('Room not found. Please check the code and try again.');
        setIsLoading(false);
      });
      
      socket.once('room_full', () => {
        setErrors({ roomCode: 'Room is full. Please try another room or contact the host.' });
        showToastNotification('Room is full. Please try another room or contact the host.');
        setIsLoading(false);
      });
      
      socket.once('username_taken', () => {
        setErrors({ username: 'Username already taken in this room. Please choose another.' });
        showToastNotification('Username already taken in this room. Please choose another.');
        setIsLoading(false);
      });
      
      // Handle general errors
      socket.once('error', (error: { message: string }) => {
        setErrors({ general: error.message });
        showToastNotification(error.message);
        setIsLoading(false);
      });
      
      // Timeout handling
      setTimeout(() => {
        if (isLoading) {
          setErrors({ general: 'Request timeout. Please try again.' });
          showToastNotification('Request timeout. Please try again.');
          setIsLoading(false);
        }
      }, 10000);
      
    } catch (error) {
      setErrors({ general: 'Failed to join room. Please try again.' });
      showToastNotification('Failed to join room. Please try again.');
      setIsLoading(false);
    }
  };

  // Handle back navigation
  const handleBack = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      <AnimatedBackground />
      
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-4 right-4 z-50 animate-pulse">
          <div className="bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg border border-red-700 max-w-sm">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{toastMessage}</span>
            </div>
          </div>
        </div>
      )}
      
      <div className="w-full max-w-md">
        {/* Back Button */}
        <button
          onClick={handleBack}
          className="mb-6 flex items-center text-gray-300 hover:text-white transition-colors group"
        >
          <svg className="w-5 h-5 mr-2 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Back to Home</span>
        </button>

        {/* Main Card */}
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
          <div className="relative bg-gray-900/90 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-8 shadow-2xl">
            
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">Join Room</h1>
              <p className="text-gray-400">Enter room code to join the party</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Display Name */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Display Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 bg-gray-800/50 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all ${
                    errors.username ? 'border-red-500' : 'border-gray-600'
                  }`}
                  placeholder="Enter your name"
                  disabled={isLoading}
                />
                {errors.username && (
                  <p className="mt-1 text-sm text-red-400 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {errors.username}
                  </p>
                )}
              </div>

              {/* Room Code */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Room Code <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="roomCode"
                    value={formData.roomCode}
                    onChange={handleInputChange}
                    maxLength={6}
                    className={`w-full px-4 py-3 pr-24 bg-gray-800/50 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all font-mono text-center text-lg tracking-widest ${
                      errors.roomCode ? 'border-red-500' : 'border-gray-600'
                    }`}
                    placeholder="ABC123"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={handlePasteRoomCode}
                    disabled={isLoading}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 px-3 py-1 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 text-sm rounded border border-purple-600/50 transition-colors disabled:opacity-50"
                  >
                    Paste
                  </button>
                </div>
                {errors.roomCode && (
                  <p className="mt-1 text-sm text-red-400 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {errors.roomCode}
                  </p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Enter 6-character room code from your host
                </p>
              </div>

              {/* General Error */}
              {errors.general && (
                <div className="bg-red-600/20 border border-red-600/50 rounded-lg p-3">
                  <p className="text-sm text-red-400 flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {errors.general}
                  </p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 text-white rounded-lg font-semibold shadow-lg shadow-purple-600/30 transition-all transform hover:scale-[1.02] disabled:scale-100 flex items-center justify-center"
              >
                {isLoading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Joining Room...
                  </span>
                ) : (
                  <>
                    Join Room
                    <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </>
                )}
              </button>
            </form>

            {/* Help Text */}
            <div className="mt-6 text-center">
              <p className="text-gray-400 text-sm">
                Don't have a room code?{' '}
                <button
                  onClick={() => navigate('/create')}
                  className="text-purple-400 hover:text-purple-300 font-medium transition-colors"
                >
                  Create a new room
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JoinRoom;

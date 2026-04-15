import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';

interface CreateRoomProps {}

interface CreateRoomData {
  username: string;
  roomName: string;
  videoUrl: string;
}

interface RoomResponse {
  roomId: string;
  roomCode: string;
  role: 'host';
}

const CreateRoom: React.FC<CreateRoomProps> = () => {
  const navigate = useNavigate();
  const socket = useSocket();
  
  // Form state
  const [formData, setFormData] = useState<CreateRoomData>({
    username: '',
    roomName: '',
    videoUrl: ''
  });
  
  // UI state
  const [errors, setErrors] = useState<{ username?: string; roomName?: string; general?: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Animated background component
  const AnimatedBackground = () => (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-green-900 via-blue-900 to-indigo-900">
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
      <div className="absolute inset-0 bg-gradient-to-tr from-green-600/20 via-transparent to-blue-600/20 animate-pulse"></div>
    </div>
  );

  // Validation functions
  const validateForm = (): boolean => {
    const newErrors: { username?: string; roomName?: string } = {};
    
    if (!formData.username.trim()) {
      newErrors.username = 'Display name is required';
    } else if (formData.username.trim().length < 2) {
      newErrors.username = 'Display name must be at least 2 characters';
    } else if (formData.username.trim().length > 20) {
      newErrors.username = 'Display name must be less than 20 characters';
    }
    
    if (!formData.roomName.trim()) {
      newErrors.roomName = 'Room name is required';
    } else if (formData.roomName.trim().length < 3) {
      newErrors.roomName = 'Room name must be at least 3 characters';
    } else if (formData.roomName.trim().length > 50) {
      newErrors.roomName = 'Room name must be less than 50 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Show toast notification
  const showToastNotification = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear specific error when user starts typing
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
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
      // Emit create_room event
      socket.emit('create_room', {
        username: formData.username.trim(),
        roomName: formData.roomName.trim(),
        videoUrl: formData.videoUrl.trim() || null
      });
      
      // Listen for room created response
      socket.once('room_created', (response: RoomResponse) => {
        // Store data in localStorage
        localStorage.setItem('username', formData.username.trim());
        localStorage.setItem('roomId', response.roomId);
        localStorage.setItem('roomCode', response.roomCode);
        localStorage.setItem('roomName', formData.roomName.trim());
        localStorage.setItem('role', response.role);
        
        // Navigate to watch room
        navigate(`/watch/${response.roomId}`);
        setIsLoading(false);
      });
      
      // Handle errors from server
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
      setErrors({ general: 'Failed to create room. Please try again.' });
      showToastNotification('Failed to create room. Please try again.');
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
          <div className="absolute -inset-1 bg-gradient-to-r from-green-600 to-blue-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
          <div className="relative bg-gray-900/90 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-8 shadow-2xl">
            
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">Create New Room</h1>
              <p className="text-gray-400">Start your own watch party</p>
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
                  className={`w-full px-4 py-3 bg-gray-800/50 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all ${
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

              {/* Room Name */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Room Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  name="roomName"
                  value={formData.roomName}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 bg-gray-800/50 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all ${
                    errors.roomName ? 'border-red-500' : 'border-gray-600'
                  }`}
                  placeholder="e.g., Movie Night with Friends"
                  disabled={isLoading}
                />
                {errors.roomName && (
                  <p className="mt-1 text-sm text-red-400 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {errors.roomName}
                  </p>
                )}
              </div>

              {/* YouTube Video URL */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  YouTube Video URL <span className="text-gray-500">(optional)</span>
                </label>
                <input
                  type="url"
                  name="videoUrl"
                  value={formData.videoUrl}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  placeholder="https://youtu.be/... or leave empty"
                  disabled={isLoading}
                />
                <p className="mt-1 text-xs text-gray-500">
                  Add a video to start watching immediately, or add one later
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
                className="w-full py-3 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 text-white rounded-lg font-semibold shadow-lg shadow-green-600/30 transition-all transform hover:scale-[1.02] disabled:scale-100 flex items-center justify-center"
              >
                {isLoading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating Room...
                  </span>
                ) : (
                  <>
                    Create Room
                    <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateRoom;

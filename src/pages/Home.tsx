import React from 'react';
import { useNavigate } from 'react-router-dom';

interface HomeProps {}

const Home: React.FC<HomeProps> = () => {
  const navigate = useNavigate();

  // Animated background component
  const AnimatedBackground = () => (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-indigo-900 to-gray-900">
        <div className="absolute inset-0 bg-black opacity-50"></div>
      </div>
      
      {/* Animated particles */}
      <div className="absolute inset-0">
        {[...Array(20)].map((_, i) => (
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
      <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/20 via-transparent to-purple-600/20 animate-pulse"></div>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      <AnimatedBackground />
      
      <div className="w-full max-w-6xl">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 mb-6 animate-pulse">
            Watch Party
          </h1>
          <p className="text-2xl text-gray-300 font-light max-w-2xl mx-auto">
            Watch YouTube videos together in perfect sync with friends, anywhere in the world
          </p>
        </div>

        {/* Cards Container */}
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-16">
          
          {/* CREATE NEW PARTY CARD */}
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-green-600 to-blue-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
            <div className="relative bg-gray-900/80 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-10 shadow-2xl transform transition-all duration-300 hover:scale-105">
              <div className="flex items-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center mr-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-white mb-2">CREATE NEW PARTY</h2>
                  <p className="text-gray-400 text-lg">Become the HOST, start your own watch party</p>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex items-center text-gray-300">
                  <svg className="w-5 h-5 mr-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Generate unique room code</span>
                </div>
                <div className="flex items-center text-gray-300">
                  <svg className="w-5 h-5 mr-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Full host controls</span>
                </div>
                <div className="flex items-center text-gray-300">
                  <svg className="w-5 h-5 mr-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Share code with friends</span>
                </div>
              </div>

              <button
                onClick={() => navigate('/create')}
                className="w-full py-4 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white rounded-xl font-bold text-lg shadow-lg shadow-green-600/30 transition-all transform hover:scale-[1.02] flex items-center justify-center group"
              >
                CREATE ROOM
                <svg className="w-5 h-5 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            </div>
          </div>

          {/* JOIN EXISTING PARTY CARD */}
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-orange-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
            <div className="relative bg-gray-900/80 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-10 shadow-2xl transform transition-all duration-300 hover:scale-105">
              <div className="flex items-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-orange-500 rounded-full flex items-center justify-center mr-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-white mb-2">JOIN EXISTING PARTY</h2>
                  <p className="text-gray-400 text-lg">Enter room code to join and watch with others</p>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex items-center text-gray-300">
                  <svg className="w-5 h-5 mr-3 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Enter 6-digit room code</span>
                </div>
                <div className="flex items-center text-gray-300">
                  <svg className="w-5 h-5 mr-3 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Instant sync with host</span>
                </div>
                <div className="flex items-center text-gray-300">
                  <svg className="w-5 h-5 mr-3 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Watch together in real-time</span>
                </div>
              </div>

              <button
                onClick={() => navigate('/join')}
                className="w-full py-4 bg-gradient-to-r from-purple-600 to-orange-600 hover:from-purple-700 hover:to-orange-700 text-white rounded-xl font-bold text-lg shadow-lg shadow-purple-600/30 transition-all transform hover:scale-[1.02] flex items-center justify-center group"
              >
                JOIN ROOM
                <svg className="w-5 h-5 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="text-center">
          <div className="inline-flex items-center space-x-8 text-gray-300 text-lg">
            <div className="flex items-center group">
              <span className="text-2xl mr-2 group-hover:scale-110 transition-transform"></span>
              <span className="font-medium">Real-time Sync</span>
            </div>
            <div className="w-px h-6 bg-gray-600"></div>
            <div className="flex items-center group">
              <span className="text-2xl mr-2 group-hover:scale-110 transition-transform">?</span>
              <span className="font-medium">Multi-user</span>
            </div>
            <div className="w-px h-6 bg-gray-600"></div>
            <div className="flex items-center group">
              <span className="text-2xl mr-2 group-hover:scale-110 transition-transform">?</span>
              <span className="font-medium">Role-based Controls</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-16">
          <p className="text-gray-400 text-sm">
            Powered by YouTube API Real-time sync No downloads required
          </p>
        </div>
      </div>
    </div>
  );
};

export default Home;

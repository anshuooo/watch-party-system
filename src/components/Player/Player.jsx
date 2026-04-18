import React, { useRef, useEffect } from 'react';
import YouTube from 'react-youtube';
import { useRoom } from '../../context/RoomContext';
import { socket } from '../../socket/socket';
import { EVENTS, ROLES } from '../../constants';
import Controls from '../Controls/Controls';

const Player = () => {
  const { videoState, role, roomId } = useRoom();
  const playerRef = useRef(null);
  const isHandlingRemote = useRef(false);

  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;

    isHandlingRemote.current = true;

    // Sync time
    if (Math.abs(player.getCurrentTime() - videoState.currentTime) > 2) {
      player.seekTo(videoState.currentTime);
    }

    // Sync play state
    if (videoState.playState === 'playing') {
      player.playVideo();
    } else {
      player.pauseVideo();
    }
  }, [videoState.playState, videoState.currentTime]);

  const onReady = (event) => {
    playerRef.current = event.target;
  };

  const onStateChange = (event) => {
    // If state change was triggered by our useEffect (socket), don't emit back
    if (isHandlingRemote.current) {
      isHandlingRemote.current = false;
      return;
    }

    if (role === ROLES.PARTICIPANT) return;

    const playerState = event.data;
    const time = playerRef.current.getCurrentTime();

    if (playerState === 1) { // Playing
      socket.emit(EVENTS.PLAY, { roomId, time });
    } else if (playerState === 2) { // Paused
      socket.emit(EVENTS.PAUSE, { roomId, time });
    }
  };

  const canControl = role === ROLES.HOST || role === ROLES.MODERATOR;

  return (
    <div className="flex flex-col bg-gray-800 rounded-xl border border-gray-700 shadow-xl overflow-hidden mt-4 mx-auto w-full max-w-5xl">
      <div className="relative w-full pt-[56.25%] bg-black">
        <YouTube
          videoId={videoState.videoId}
          onReady={onReady}
          onStateChange={onStateChange}
          className="absolute top-0 left-0 w-full h-full"
          opts={{
            width: '100%',
            height: '100%',
            playerVars: {
              autoplay: 1,
              controls: canControl ? 1 : 0, 
              disablekb: canControl ? 0 : 1,
            },
          }}
        />
      </div>

      <div className="p-4 bg-gray-800">
        {canControl ? (
          <Controls />
        ) : (
          <div className="flex items-center justify-center p-3 bg-gray-700/30 rounded-lg border border-gray-700">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span className="text-gray-400 font-medium">View Only Mode (Participant) - Sit back and enjoy!</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default Player;

import React, { useEffect, useState, useRef } from 'react';
import YouTube from 'react-youtube';
import { useSocket } from '../context/SocketContext';

// Helper to extract Youtube ID from URL or return the string if it's already an ID
const extractVideoId = (url) => {
  const regExp =
    /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : url;
};

const VideoPlayer = ({ roomId, role }) => {
  const socket = useSocket();
  const playerRef = useRef(null);

  const [videoId, setVideoId] = useState('NpEaa2P7qZI');
  const [inputUrl, setInputUrl] = useState('');

  const isHandlingRemoteEvent = useRef(false);

  useEffect(() => {
    // SYNC STATE
    socket.on('sync_state', (state) => {
      if (!playerRef.current || !playerRef.current.getCurrentTime) return;

      if (state.currentVideoId) setVideoId(state.currentVideoId);

      const player = playerRef.current;

      if (state.currentTime) {
        player.seekTo(state.currentTime, true);
      }

      if (state.playState === 'playing') {
        isHandlingRemoteEvent.current = true;
        player.playVideo();
      } else {
        isHandlingRemoteEvent.current = true;
        player.pauseVideo();
      }
    });

    // PLAY EVENT
    socket.on('play', ({ time }) => {
      if (!playerRef.current) return;

      const player = playerRef.current;

      isHandlingRemoteEvent.current = true;

      if (Math.abs(player.getCurrentTime() - time) > 2) {
        player.seekTo(time, true);
      }

      player.playVideo();
    });

    // PAUSE EVENT
    socket.on('pause', ({ time }) => {
      if (!playerRef.current) return;

      const player = playerRef.current;

      isHandlingRemoteEvent.current = true;
      player.seekTo(time, true);
      player.pauseVideo();
    });

    // SEEK EVENT
    socket.on('seek', ({ time }) => {
      if (!playerRef.current) return;

      const player = playerRef.current;

      isHandlingRemoteEvent.current = true;
      player.seekTo(time, true);
    });

    // VIDEO CHANGE EVENT
    socket.on('video_changed', ({ videoId: newId }) => {
      setVideoId(newId);
      setInputUrl(`https://www.youtube.com/watch?v=${newId}`);
    });

    return () => {
      socket.off('sync_state');
      socket.off('play');
      socket.off('pause');
      socket.off('seek');
      socket.off('video_changed');
    };
  }, [socket]);

  // PLAYER READY
  const onReady = (event) => {
    playerRef.current = event.target;
  };

  // PLAYER STATE CHANGE
  const onStateChange = (event) => {
    if (!playerRef.current) return;

    const playerState = event.data;
    const time = playerRef.current.getCurrentTime();

    if (isHandlingRemoteEvent.current) {
      isHandlingRemoteEvent.current = false;
      return;
    }

    if (role === 'Participant') return;

    if (playerState === 1) {
      socket.emit('play', { roomId, time });
    } else if (playerState === 2) {
      socket.emit('pause', { roomId, time });
    }
  };

  const handleVideoChange = (e) => {
    e.preventDefault();

    if (role === 'Participant') {
      return alert(
        'Only Hosts and Moderators can change the video.'
      );
    }

    const parsedId = extractVideoId(inputUrl);

    if (parsedId && parsedId.length === 11) {
      socket.emit('change_video', {
        roomId,
        videoId: parsedId,
      });
    } else {
      alert('Invalid YouTube URL or Video ID');
    }
  };

  const canControl =
    role === 'Host' || role === 'Moderator';

  return (
    <div className="video-container">
      <div className="video-wrapper">
        <YouTube
          videoId={videoId}
          onReady={onReady}
          onStateChange={onStateChange}
          opts={{
            width: '100%',
            height: '100%',
            playerVars: {
              autoplay: 0,
              controls: canControl ? 1 : 0,
              disablekb: canControl ? 0 : 1,
              enablejsapi: 1,
              origin: window.location.hostname + ':' + window.location.port,
              rel: 0,
              fs: 0,
              modestbranding: 1,
              iv_load_policy: 3,
              playsinline: 1, // FIX FOR MOBILE + IFRAME MESSAGE ISSUE
            },
          }}
        />
      </div>

      <div className="controls">
        <form
          onSubmit={handleVideoChange}
          style={{
            display: 'flex',
            width: '100%',
            gap: '1rem',
          }}
        >
          <input
            type="text"
            className="premium-input video-input"
            placeholder="Paste YouTube URL or ID"
            value={inputUrl}
            onChange={(e) =>
              setInputUrl(e.target.value)
            }
            disabled={!canControl}
          />

          <button
            type="submit"
            className={`btn ${
              canControl
                ? 'btn-primary'
                : 'btn-secondary'
            }`}
            disabled={!canControl}
            style={{ width: 'auto' }}
          >
            Change Video
          </button>
        </form>
      </div>

      {!canControl && (
        <p
          style={{
            marginTop: '1rem',
            fontSize: '0.85rem',
            color: 'var(--text-secondary)',
          }}
        >
          * You are a Participant. Only Hosts and
          Moderators can control playback and change
          videos.
        </p>
      )}
    </div>
  );
};

export default VideoPlayer;
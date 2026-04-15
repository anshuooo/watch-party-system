import React, { useState } from 'react';
import { socket } from '../../socket/socket';
import { EVENTS } from '../../constants';
import { useRoom } from '../../context/RoomContext';

const Controls = () => {
  const { roomId, videoState } = useRoom();
  const [inputUrl, setInputUrl] = useState('');

  const extractVideoId = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : url;
  };

  const handleChangeVideo = (e) => {
    e.preventDefault();
    const vidId = extractVideoId(inputUrl);
    if (vidId) {
      socket.emit(EVENTS.CHANGE_VIDEO, { roomId, videoId: vidId });
      setInputUrl('');
    }
  };

  const notifyChangeVideoClick = () => {
    const vidId = extractVideoId(inputUrl);
     if (vidId) {
      socket.emit(EVENTS.CHANGE_VIDEO, { roomId, videoId: vidId });
      setInputUrl('');
    }
  }

  const isPlaying = videoState.playState === 'playing';

  return (
    <div className="flex flex-col md:flex-row gap-4 items-center w-full">
      <form onSubmit={handleChangeVideo} className="flex w-full">
        <input 
          type="text" 
          value={inputUrl}
          onChange={(e) => setInputUrl(e.target.value)}
          placeholder="Paste YouTube Link or ID to change video"
          className="flex-1 bg-gray-900 border border-gray-600 rounded-l-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500 placeholder-gray-500"
        />
        <button 
          onClick={notifyChangeVideoClick}
          type="submit"
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-r-lg font-medium transition-colors border border-indigo-600 hover:border-indigo-700"
        >
          Change Video
        </button>
      </form>
    </div>
  );
};

export default Controls;

// YouTube IFrame API TypeScript declarations

declare global {
  interface Window {
    YT: {
      Player: new (elementId: string, config: YT.PlayerConfig) => YT.Player;
      PlayerState: {
        UNSTARTED: number;
        ENDED: number;
        PLAYING: number;
        PAUSED: number;
        BUFFERING: number;
        CUED: number;
      };
    };
    onYouTubeIframeAPIReady: () => void;
  }

  namespace YT {
    interface PlayerConfig {
      height?: string | number;
      width?: string | number;
      videoId?: string;
      playerVars?: PlayerVars;
      events?: PlayerEvents;
    }

    interface PlayerVars {
      autoplay?: number;
      controls?: number;
      disablekb?: number;
      enablejsapi?: number;
      iv_load_policy?: number;
      modestbranding?: number;
      rel?: number;
      showinfo?: number;
      start?: number;
      end?: number;
      [key: string]: any;
    }

    interface PlayerEvents {
      onReady?: (event: { target: Player }) => void;
      onStateChange?: (event: { target: Player; data: number }) => void;
      onError?: (event: { target: Player; data: number }) => void;
    }

    class Player {
      constructor(elementId: string, config: PlayerConfig);
      
      playVideo(): void;
      pauseVideo(): void;
      stopVideo(): void;
      seekTo(seconds: number, allowSeekAhead: boolean): void;
      getCurrentTime(): number;
      getDuration(): number;
      getVideoData(): {
        video_id: string;
        title: string;
      };
      loadVideoById(videoId: string, startSeconds?: number, suggestedQuality?: string): void;
      cueVideoById(videoId: string, startSeconds?: number, suggestedQuality?: string): void;
      destroy(): void;
    }

    const PlayerState: {
      UNSTARTED: number;
      ENDED: number;
      PLAYING: number;
      PAUSED: number;
      BUFFERING: number;
      CUED: number;
    };
  }
}

export {};

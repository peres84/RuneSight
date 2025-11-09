import { useEffect, useRef } from 'react';

interface VideoBackgroundProps {
  videoId?: string;
  videoSrc?: string;
  className?: string;
  overlay?: boolean;
  fallbackImage?: string;
}

export function VideoBackground({
  videoId,
  videoSrc,
  className = '',
  overlay = true,
  fallbackImage = '/background-hero.png'
}: VideoBackgroundProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    console.log('VideoBackground mounted with props:', { videoId, videoSrc, fallbackImage });
    console.log('Browser info:', {
      userAgent: navigator.userAgent,
      onLine: navigator.onLine,
      cookieEnabled: navigator.cookieEnabled
    });

    // Check video format support
    const video = document.createElement('video');
    console.log('Video format support:', {
      mp4: video.canPlayType('video/mp4'),
      webm: video.canPlayType('video/webm'),
      ogg: video.canPlayType('video/ogg')
    });

    if (videoId && iframeRef.current) {
      // Create YouTube embed URL with autoplay parameters
      const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0&showinfo=0&rel=0&iv_load_policy=3&modestbranding=1&playsinline=1&enablejsapi=1`;
      console.log('Setting YouTube embed URL:', embedUrl);
      iframeRef.current.src = embedUrl;
    }

    if (videoSrc) {
      console.log('Setting up local video with src:', videoSrc);

      // Test if video file exists
      fetch(videoSrc, { method: 'HEAD' })
        .then(response => {
          console.log('Video file HEAD request response:', {
            status: response.status,
            statusText: response.statusText,
            ok: response.ok,
            url: response.url,
            headers: Object.fromEntries(response.headers.entries())
          });
          if (!response.ok) {
            console.error('Video file not accessible via HEAD request');
          }
        })
        .catch(error => {
          console.error('Error checking video file with HEAD request:', error);
        });

      if (videoRef.current) {
        const video = videoRef.current;

        // Add more event listeners for debugging
        video.addEventListener('loadstart', () => console.log('Video: loadstart'));
        video.addEventListener('loadedmetadata', () => console.log('Video: loadedmetadata'));
        video.addEventListener('loadeddata', () => console.log('Video: loadeddata'));
        video.addEventListener('canplay', () => console.log('Video: canplay'));
        video.addEventListener('canplaythrough', () => console.log('Video: canplaythrough'));
        video.addEventListener('play', () => console.log('Video: play'));
        video.addEventListener('playing', () => console.log('Video: playing'));
        video.addEventListener('pause', () => console.log('Video: pause'));
        video.addEventListener('ended', () => console.log('Video: ended'));
        video.addEventListener('error', (e) => {
          console.error('Video addEventListener error:', e);
          if (video.error) {
            console.error('Video.error details:', {
              code: video.error.code,
              message: video.error.message,
              MEDIA_ERR_ABORTED: video.error.MEDIA_ERR_ABORTED,
              MEDIA_ERR_NETWORK: video.error.MEDIA_ERR_NETWORK,
              MEDIA_ERR_DECODE: video.error.MEDIA_ERR_DECODE,
              MEDIA_ERR_SRC_NOT_SUPPORTED: video.error.MEDIA_ERR_SRC_NOT_SUPPORTED
            });
          }
        });
        video.addEventListener('stalled', () => console.warn('Video: stalled'));
        video.addEventListener('waiting', () => console.warn('Video: waiting'));
      }
    }
  }, [videoId, videoSrc]);

  // If using local video file
  if (videoSrc) {
    console.log('Rendering VideoBackground with local video:', videoSrc);

    return (
      <div className={`overflow-hidden ${className}`}>
        {/* Fallback background image - always show first */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat z-0"
          style={{ backgroundImage: `url(${fallbackImage})` }}
          onLoad={() => console.log('Fallback image loaded successfully')}
          onError={() => console.error('Fallback image failed to load')}
        />

        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          onLoadedData={() => {
            console.log('Video: loaded and ready to play');
          }}
          onPlaying={() => {
            console.log('Video: playing successfully');
          }}
          onError={(e) => {
            console.error('Video: error occurred', e);
            if (videoRef.current) {
              videoRef.current.style.display = 'none';
            }
          }}
          style={{
            opacity: 1,
            zIndex: 5 // Higher z-index to ensure visibility
          }}
        >
          <source src={videoSrc} type={videoSrc.endsWith('.webm') ? 'video/webm' : 'video/mp4'} />
          Your browser does not support the video tag.
        </video>

        {overlay && (
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/70 dark:from-black/70 dark:via-black/50 dark:to-black/80 pointer-events-none"
            style={{ zIndex: 10 }} />
        )}
      </div>
    );
  }

  // YouTube video fallback
  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Fallback background image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${fallbackImage})` }}
      />

      {/* YouTube iframe (if videoId provided) */}
      {videoId && (
        <iframe
          ref={iframeRef}
          className="absolute top-1/2 left-1/2 w-[177.77777778vh] h-[56.25vw] min-w-full min-h-full -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          title="Background Video"
          style={{ border: 'none' }}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          onError={() => {
            // Hide iframe if it fails to load
            if (iframeRef.current) {
              iframeRef.current.style.display = 'none';
            }
          }}
        />
      )}

      {overlay && (
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/70 dark:from-black/70 dark:via-black/50 dark:to-black/80" />
      )}
    </div>
  );
}
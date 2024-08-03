import React, { useEffect, useRef } from "react";

// icons
import { ReactComponent as PlayIcon } from "../assets/icons/play.svg";
import { ReactComponent as PauseIcon } from "../assets/icons/pause.svg";
import { ReactComponent as CaptionsIcon } from "../assets/icons/captions.svg";
import { ReactComponent as FullscreenCloseIcon } from "../assets/icons/fullscreen-close.svg";
import { ReactComponent as FullscreenOpenIcon } from "../assets/icons/fullscreen-open.svg";
import { ReactComponent as MiniPlayerIcon } from "../assets/icons/mini-player.svg";
import { ReactComponent as TheaterTallIcon } from "../assets/icons/theater-tall.svg";
import { ReactComponent as TheaterWideIcon } from "../assets/icons/theater-wide.svg";
import { ReactComponent as VolumeHighIcon } from "../assets/icons/volume-high.svg";
import { ReactComponent as VolumeLowIcon } from "../assets/icons/volume-low.svg";
import { ReactComponent as VolumeMutedIcon } from "../assets/icons/volume-muted.svg";

const VideoPlayer = () => {
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const videoPlayerRef = useRef<HTMLVideoElement>(null);
  const volumeSliderRef = useRef<HTMLInputElement>(null);
  const currentTimeRef = useRef<HTMLDivElement>(null);
  const totalTimeRef = useRef<HTMLDivElement>(null);
  const speedTextRef = useRef<HTMLParagraphElement>(null);
  const timelineContainerRef = useRef<HTMLDivElement>(null);
  const previewImgRef = useRef<HTMLImageElement>(null);
  const thumbnailImgRef = useRef<HTMLImageElement>(null);

  // const [isScrubbing, setIsScrubbing] = useState(false);

  let isScrubbing = false;
  let wasPaused: Boolean;

  // helper functions
  const leadingZeroFormatter = new Intl.NumberFormat(undefined, {
    minimumIntegerDigits: 2,
  });
  function formatDuration(time: number) {
    const seconds = Math.floor(time % 60);
    const minutes = Math.floor(time / 60) % 60;
    const hours = Math.floor(time / 3600);
    if (hours === 0) {
      return `${minutes}:${leadingZeroFormatter.format(seconds)}`;
    } else {
      return `${hours}:${leadingZeroFormatter.format(
        minutes
      )}:${leadingZeroFormatter.format(seconds)}`;
    }
  }

  // duration
  const handleLoadedVideoData = () => {
    if (videoPlayerRef.current) {
      totalTimeRef.current!.textContent = formatDuration(
        videoPlayerRef.current.duration
      );
    }
  };
  const handleTimeUpdate = () => {
    if (videoPlayerRef.current) {
      currentTimeRef.current!.textContent = formatDuration(
        videoPlayerRef.current.currentTime
      );

      const percent =
        videoPlayerRef.current.currentTime / videoPlayerRef.current.duration;
      timelineContainerRef.current?.style.setProperty(
        "--progress-position",
        percent.toString()
      );
    }
  };
  const skip = (duration: number) => {
    if (videoPlayerRef.current) {
      videoPlayerRef.current.currentTime += duration;
    }
  };

  // captions
  function toggleCaptions() {
    if (videoPlayerRef.current) {
      const captions = videoPlayerRef.current.textTracks[0];
      const isHidden = captions.mode === "hidden";
      captions.mode = isHidden ? "showing" : "hidden";
      videoContainerRef.current?.classList.toggle("captions", isHidden);
    }
  }

  // play pause
  const togglePlay = () => {
    if (videoPlayerRef.current?.paused) {
      videoPlayerRef.current.play();
      videoContainerRef.current?.classList.remove("paused");
    } else {
      videoPlayerRef.current?.pause();
      videoContainerRef.current?.classList.add("paused");
    }
  };

  // playback speed
  const changePlaybackSpeed = () => {
    if (videoPlayerRef.current) {
      let newPlaybackRate = videoPlayerRef.current.playbackRate + 0.25;
      if (newPlaybackRate > 2) newPlaybackRate = 0.25;
      videoPlayerRef.current.playbackRate = newPlaybackRate;
      speedTextRef.current!.textContent = `${newPlaybackRate}x`;
    }
  };

  // theater mode
  const toggleTheaterMode = () => {
    videoContainerRef.current?.classList.toggle("theater");
  };

  // fullscreen mode
  const toggleFullScreenMode = () => {
    if (document.fullscreenElement == null) {
      videoContainerRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  // mini player mode
  const toggleMiniPlayerMode = () => {
    if (videoContainerRef.current?.classList.contains("mini-player")) {
      document.exitPictureInPicture();
    } else {
      videoPlayerRef.current?.requestPictureInPicture();
    }
  };

  // volume
  const toggleMute = () => {
    videoPlayerRef.current!.muted = !videoPlayerRef.current!.muted;
  };
  const handleVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    videoPlayerRef.current!.volume = Number(
      (e.target as HTMLInputElement).value
    );
    videoPlayerRef.current!.muted =
      Number((e.target as HTMLInputElement).value) === 0;
  };
  const handleVolumeChangeByVideo = () => {
    volumeSliderRef.current!.value =
      videoPlayerRef.current?.volume.toString() || "0";
    let volumeLevel;
    let videoPlayerVolume =
      videoPlayerRef.current?.volume !== undefined
        ? videoPlayerRef.current?.volume
        : 0;

    if (videoPlayerRef.current?.muted || videoPlayerVolume === 0) {
      volumeSliderRef.current!.value = "0";
      volumeLevel = "muted";
    } else if (videoPlayerVolume >= 0.5) {
      volumeLevel = "high";
    } else {
      volumeLevel = "low";
    }

    videoContainerRef.current!.dataset.volumeLevel = volumeLevel;
  };

  // timeline update
  const toggleScrubbing = (
    e: React.MouseEvent<HTMLDivElement> | MouseEvent
  ) => {
    if (timelineContainerRef.current) {
      const rect = timelineContainerRef.current.getBoundingClientRect();
      const percent =
        Math.min(Math.max(0, e.clientX - rect.x), rect.width) / rect.width;
      isScrubbing = (e.buttons & 1) === 1;
      videoContainerRef.current?.classList.toggle("scrubbing", isScrubbing);

      let video = videoPlayerRef.current as HTMLVideoElement;
      if (isScrubbing) {
        wasPaused = video.paused;
        video.pause();
      } else {
        video.currentTime = percent * video.duration;
        if (!wasPaused) video.play();
      }

      handleTimelineUpdate(e);
    }
  };

  const handleTimelineUpdate = (
    e: React.MouseEvent<HTMLDivElement> | MouseEvent
  ) => {
    if (timelineContainerRef.current) {
      const rect = timelineContainerRef.current.getBoundingClientRect();
      const percent =
        Math.min(Math.max(0, e.clientX - rect.x), rect.width) / rect.width;
      const previewImgNumber = Math.max(
        1,
        Math.floor((percent * videoPlayerRef.current!.duration) / 10)
      );
      const previewImgSrc = `/previewImgs/preview${previewImgNumber}.jpg`;
      previewImgRef.current!.src = previewImgSrc;
      timelineContainerRef.current.style.setProperty(
        "--preview-position",
        percent.toString()
      );

      if (isScrubbing) {
        e.preventDefault();
        thumbnailImgRef.current!.src = previewImgSrc;
        timelineContainerRef.current?.style.setProperty(
          "--progress-position",
          percent.toString()
        );
      }
    }
  };

  useEffect(() => {
    // disable hover
    let global = 3;
    const noMovement = () => {
      if (global === 0) {
        videoContainerRef.current?.classList.remove("hover");
      } else {
        global--;
      }
    };
    const resetGlobal = () => {
      global = 3;
      videoContainerRef.current?.classList.add("hover");
    };
    document.addEventListener("mousemove", resetGlobal);
    document.addEventListener("keydown", resetGlobal);
    const interval = setInterval(() => {
      noMovement();
    }, 1000);

    // mini player
    videoPlayerRef.current?.addEventListener("enterpictureinpicture", () => {
      videoContainerRef.current?.classList.add("mini-player");
    });
    videoPlayerRef.current?.addEventListener("leavepictureinpicture", () => {
      videoContainerRef.current?.classList.remove("mini-player");
    });

    if (videoPlayerRef.current) {
      const captions = videoPlayerRef.current?.textTracks[0];
      captions.mode = "hidden";
    }

    return () => {
      clearInterval(interval);
    };
  }, []);

  document.addEventListener("mouseup", (e) => {
    if (isScrubbing) toggleScrubbing(e);
  });
  document.addEventListener("mousemove", (e) => {
    if (isScrubbing) handleTimelineUpdate(e);
  });
  document.addEventListener("keydown", (e) => {
    const tagName = document.activeElement?.tagName.toLowerCase();
    if (tagName === "input") return;
    switch (e.key.toLowerCase()) {
      case " ":
      case "k":
        if (tagName === "button") return;
        togglePlay();
        break;
      case "f":
        toggleFullScreenMode();
        break;
      case "t":
        toggleTheaterMode();
        break;
      case "i":
        toggleMiniPlayerMode();
        break;
      case "m":
        toggleMute();
        break;
      case "arrowleft":
      case "j":
        skip(-5);
        break;
      case "arrowright":
      case "l":
        skip(5);
        break;
      case "c":
        toggleCaptions();
        break;
    }
  });

  return (
    <div
      ref={videoContainerRef}
      className="video-container paused hover"
      data-volume-level="high"
    >
      <img
        ref={thumbnailImgRef}
        className="thumbnail-img"
        alt="thumbnail-img"
      ></img>
      <div className="video-controls-container">
        <div
          ref={timelineContainerRef}
          className="timeline-container"
          onMouseMove={(e) => handleTimelineUpdate(e)}
          onMouseDown={(e) => toggleScrubbing(e)}
        >
          <div className="timeline">
            <img
              ref={previewImgRef}
              className="preview-img"
              alt="preview-img"
            />
            <div className="thumb-indicator"></div>
          </div>
        </div>
        <div className="controls">
          <button onClick={togglePlay}>
            <PlayIcon className="play-icon" />
            <PauseIcon className="pause-icon" />
          </button>
          <div className="volume-container">
            <button onClick={toggleMute}>
              <VolumeHighIcon className="volume-high-icon" />
              <VolumeLowIcon className="volume-low-icon" />
              <VolumeMutedIcon className="volume-muted-icon" />
            </button>
            <input
              ref={volumeSliderRef}
              className="volume-slider"
              type="range"
              min="0"
              max="1"
              step="any"
              onChange={(e) => handleVolume(e)}
            />
          </div>
          <div className="duration-container">
            <div ref={currentTimeRef}>0:00</div>/<div ref={totalTimeRef}></div>
          </div>
          <button onClick={toggleCaptions}>
            <CaptionsIcon className="captions-btn" />
          </button>
          <button className="wide-btn" onClick={changePlaybackSpeed}>
            <p ref={speedTextRef}>1x</p>
          </button>
          <button onClick={toggleMiniPlayerMode}>
            <MiniPlayerIcon />
          </button>
          <button onClick={toggleTheaterMode}>
            <TheaterTallIcon className="tall" />
            <TheaterWideIcon className="wide" />
          </button>
          <button onClick={toggleFullScreenMode}>
            <FullscreenOpenIcon className="open" />
            <FullscreenCloseIcon className="close" />
          </button>
        </div>
      </div>
      <video
        src="/Video.mp4"
        ref={videoPlayerRef}
        autoPlay={true}
        onClick={togglePlay}
        onVolumeChange={handleVolumeChangeByVideo}
        onLoadedData={handleLoadedVideoData}
        onTimeUpdate={handleTimeUpdate}
      >
        <track kind="captions" srcLang="en" src="/subtitles.vtt"></track>
      </video>
    </div>
  );
};

export default VideoPlayer;

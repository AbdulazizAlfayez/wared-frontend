"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Play, Pause, Volume2, VolumeX, Sparkles, Copy, Check, AlertCircle, Upload, ExternalLink } from "lucide-react";

// THE VIDEO PROMPT - Use this with AI video generators
const VIDEO_PROMPT = `Cinematic 8-second looping video of modern cars driving on a wide highway in Saudi Arabia at sunset. Desert landscape with sand dunes, Riyadh skyline faint in the distance, luxury SUVs and sedans (Land Cruiser, Camry-style silhouettes), smooth drone shot, warm golden lighting, realistic, 4K quality, no text, no logos, slow motion, designed as website hero background.`;

// Placeholder videos until custom video is added
const SAMPLE_VIDEOS = [
  {
    name: "Desert Highway Sunset",
    desc: "Closest match - highway at golden hour",
    url: "https://assets.mixkit.co/videos/preview/mixkit-highway-in-the-middle-of-a-mountain-range-4633-large.mp4",
  },
  {
    name: "Aerial Mountain Road",
    desc: "Drone shot of winding road",
    url: "https://assets.mixkit.co/videos/preview/mixkit-aerial-shot-of-a-curvy-road-in-the-mountains-43553-large.mp4",
  },
  {
    name: "Rural Road Drive",
    desc: "Car driving through landscape",
    url: "https://assets.mixkit.co/videos/preview/mixkit-car-driving-on-a-rural-road-4527-large.mp4",
  },
];

export default function VideoPreviewPage() {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [copied, setCopied] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  
  // Use a placeholder video until custom one is provided
  const [videoUrl, setVideoUrl] = useState(SAMPLE_VIDEOS[0].url);
  const [customUrl, setCustomUrl] = useState("");

  // Reset error state when video URL changes
  useEffect(() => {
    setVideoError(false);
    setVideoLoaded(false);
  }, [videoUrl]);

  const copyPrompt = () => {
    navigator.clipboard.writeText(VIDEO_PROMPT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const togglePlay = () => {
    const video = document.getElementById("hero-video") as HTMLVideoElement;
    if (video) {
      if (isPlaying) {
        video.pause();
      } else {
        video.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    const video = document.getElementById("hero-video") as HTMLVideoElement;
    if (video) {
      video.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleCustomUrl = () => {
    if (customUrl.trim()) {
      setVideoUrl(customUrl.trim());
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Instructions Overlay */}
      {showInstructions && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 border border-slate-200 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <Sparkles className="w-8 h-8 text-amber-500" />
              <h2 className="text-2xl font-bold text-slate-900">Generate Your Custom Video</h2>
            </div>

            <p className="text-slate-600 mb-4">
              To get the exact Saudi Arabia highway video you want, you need to generate it using an AI video tool.
              Here&apos;s how:
            </p>

            <div className="bg-amber-50 rounded-xl p-4 mb-4 border border-amber-200">
              <p className="text-sm text-amber-700 mb-2 font-medium">Copy this prompt:</p>
              <p className="text-slate-700 text-sm leading-relaxed mb-3">{VIDEO_PROMPT}</p>
              <button
                onClick={copyPrompt}
                className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black rounded-lg font-medium text-sm"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? "Copied!" : "Copy Prompt"}
              </button>
            </div>

            <p className="text-white/70 mb-4 text-sm">Then use one of these AI video generators:</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
              <a href="https://runwayml.com" target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 p-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium">
                <ExternalLink className="w-4 h-4" />
                Runway Gen-3
              </a>
              <a href="https://pika.art" target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium">
                <ExternalLink className="w-4 h-4" />
                Pika Labs
              </a>
              <a href="https://openai.com/sora" target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 p-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium">
                <ExternalLink className="w-4 h-4" />
                OpenAI Sora
              </a>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowInstructions(false)}
                className="flex-1 py-3 bg-accent hover:bg-accent-600 text-white rounded-xl font-semibold"
              >
                Preview with Placeholder Video
              </button>
            </div>
            
            <p className="text-white/40 text-xs mt-4 text-center">
              Once you have your video, paste the URL below to preview it
            </p>
          </div>
        </div>
      )}

      {/* Back to Home */}
      <div className="fixed top-4 left-4 z-50">
        <Link
          href="/"
          className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm text-white rounded-lg hover:bg-white/20 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>
      </div>

      {/* Video Controls */}
      <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
        <button
          onClick={() => setShowInstructions(true)}
          className="p-3 bg-amber-500/80 backdrop-blur-sm text-white rounded-lg hover:bg-amber-500 transition-colors"
          title="How to get custom video"
        >
          <Sparkles className="w-5 h-5" />
        </button>
        <button
          onClick={togglePlay}
          className="p-3 bg-white/10 backdrop-blur-sm text-white rounded-lg hover:bg-white/20 transition-colors"
          title={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
        </button>
        <button
          onClick={toggleMute}
          className="p-3 bg-white/10 backdrop-blur-sm text-white rounded-lg hover:bg-white/20 transition-colors"
          title={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>
      </div>

      {/* Hero Section with Video Background */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Fallback Background Image (shows while video loads or on error) */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=1920&q=80')`,
          }}
        />

        {/* Video Background */}
        {!videoError && (
          <video
            id="hero-video"
            key={videoUrl}
            autoPlay
            loop
            muted
            playsInline
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${videoLoaded ? 'opacity-100' : 'opacity-0'}`}
            onLoadedData={() => setVideoLoaded(true)}
            onError={() => setVideoError(true)}
          >
            <source src={videoUrl} type="video/mp4" />
          </video>
        )}

        {/* Video Error Indicator */}
        {videoError && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2 bg-red-500/80 backdrop-blur-sm text-white rounded-lg">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">Video failed to load - showing fallback image</span>
          </div>
        )}

        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/70 via-slate-900/50 to-slate-900/80" />

        {/* Content */}
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <p className="text-accent font-medium mb-4 tracking-wide">SAUDI ARABIA&apos;S #1 CAR MARKETPLACE</p>
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
            Find Your Perfect
            <span className="text-accent block mt-2">Dream Car</span>
          </h1>
          <p className="text-lg sm:text-xl text-white/80 mb-8 max-w-2xl mx-auto">
            From Land Cruisers to luxury sedans — discover the best deals on 
            new and used cars across the Kingdom. Buy, sell, and explore with confidence.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-8 py-4 bg-accent hover:bg-accent-600 text-white rounded-xl font-semibold text-lg transition-all transform hover:scale-105 shadow-lg shadow-accent/25">
              Browse Cars
            </button>
            <button className="px-8 py-4 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white rounded-xl font-semibold text-lg transition-all border border-white/20">
              Sell Your Car
            </button>
          </div>
          
          {/* Quick Stats */}
          <div className="mt-12 flex flex-wrap justify-center gap-8 text-white/70">
            <div>
              <p className="text-3xl font-bold text-white">50K+</p>
              <p className="text-sm">Cars Listed</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-white">500+</p>
              <p className="text-sm">Trusted Dealers</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-white">14</p>
              <p className="text-sm">Cities Covered</p>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center pt-2">
            <div className="w-1 h-3 bg-white/50 rounded-full" />
          </div>
        </div>
      </section>

      {/* URL Input Section - PROMINENT */}
      <section className="py-12 px-4 bg-gradient-to-b from-amber-900/30 to-slate-800 border-t-2 border-amber-500/50">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Upload className="w-6 h-6 text-amber-400" />
            <h2 className="text-2xl font-bold text-white">
              Paste Your Generated Video URL
            </h2>
          </div>
          <p className="text-white/60 text-center mb-6">
            After generating your video with Runway/Pika/Sora, paste the direct video URL here
          </p>
          <div className="flex gap-3">
            <input
              type="url"
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              placeholder="https://your-generated-video.mp4"
              className="flex-1 px-4 py-4 bg-slate-700 border-2 border-amber-500/50 rounded-xl text-white placeholder-slate-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30 text-lg"
            />
            <button
              onClick={handleCustomUrl}
              className="px-8 py-4 bg-amber-500 hover:bg-amber-600 text-black rounded-xl font-bold transition-colors"
            >
              Load Video
            </button>
          </div>
          <p className="text-slate-400 text-sm mt-4 text-center">
            Currently showing: {videoUrl.includes("mixkit") ? "Placeholder video" : "Custom video"}
          </p>
        </div>
      </section>

      {/* Quick Prompt Copy Section */}
      <section className="py-8 px-4 bg-white border-b border-slate-100">
        <div className="max-w-4xl mx-auto">
          <div className="bg-amber-50 rounded-xl p-4 border border-amber-200 flex flex-col sm:flex-row items-center gap-4">
            <Sparkles className="w-6 h-6 text-amber-500 shrink-0" />
            <p className="text-slate-600 text-sm flex-1 text-center sm:text-left">
              Need the video prompt? Click the button or the sparkle icon in the top-right corner.
            </p>
            <button
              onClick={() => setShowInstructions(true)}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black rounded-lg font-medium text-sm shrink-0"
            >
              Show Instructions
            </button>
          </div>
        </div>
      </section>

      {/* Sample Videos Section */}
      <section className="py-12 px-4 bg-slate-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-2 text-center">
            Preview Stock Videos
          </h2>
          <p className="text-slate-500 text-center mb-6">
            Reliable video sources from Mixkit (free commercial use)
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {SAMPLE_VIDEOS.map((sample) => (
              <button
                key={sample.name}
                onClick={() => setVideoUrl(sample.url)}
                className={`p-4 rounded-xl text-left transition-all ${
                  videoUrl === sample.url
                    ? "bg-accent text-white ring-2 ring-accent ring-offset-2 ring-offset-slate-50"
                    : "bg-white border border-slate-100 text-slate-700 hover:border-slate-200 hover:shadow-sm"
                }`}
              >
                <p className="font-medium">{sample.name}</p>
                <p className="text-sm opacity-60">{sample.desc}</p>
              </button>
            ))}
          </div>

          {/* Video Status */}
          <div className="mt-6 text-center">
            <p className="text-slate-400 text-sm">
              Status: {videoLoaded ? "✓ Video loaded" : videoError ? "✗ Failed to load" : "Loading..."}
            </p>
          </div>
        </div>
      </section>

      {/* Notes Section */}
      <section className="py-12 px-4 bg-white border-t border-slate-100">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-xl font-bold text-slate-900 mb-6 text-center">Video Requirements</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-5">
              <h3 className="font-semibold text-slate-900 mb-3">Technical Specs</h3>
              <ul className="text-slate-500 text-sm space-y-2">
                <li>• Format: MP4 (H.264 codec)</li>
                <li>• Resolution: 4K (3840x2160) or 1080p</li>
                <li>• Duration: 6-10 seconds (seamless loop)</li>
                <li>• File size: Under 15MB for web</li>
                <li>• Frame rate: 24-30fps (cinematic feel)</li>
              </ul>
            </div>
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-5">
              <h3 className="font-semibold text-slate-900 mb-3">Content Guidelines</h3>
              <ul className="text-slate-500 text-sm space-y-2">
                <li>• Saudi desert/highway setting</li>
                <li>• Sunset/golden hour lighting</li>
                <li>• Popular cars: Land Cruiser, Camry, etc.</li>
                <li>• Drone or tracking shot preferred</li>
                <li>• No text, logos, or watermarks</li>
              </ul>
            </div>
          </div>
          <p className="text-slate-400 text-xs mt-6 text-center">
            Tip: For the best custom video, use Runway Gen-3 Alpha or commission a local videographer in Riyadh
          </p>
        </div>
      </section>
    </div>
  );
}

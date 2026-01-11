import React, { useEffect, useState } from "react";
import "./Loading.css";

const RightFacingCar = () => (
  <svg
    className="car-svg"
    width="44"
    height="22"
    viewBox="0 0 88 44"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    focusable="false"
  >
    <defs>
      <linearGradient id="carBody" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#4caf50" />
        <stop offset="50%" stopColor="#43a047" />
        <stop offset="100%" stopColor="#388e3c" />
      </linearGradient>
      <linearGradient id="carGlass" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#e8f5e9" />
        <stop offset="100%" stopColor="#c8e6c9" />
      </linearGradient>
    </defs>
    <g filter="url(#shadow)">
      <path
        d="M8 26 L22 14 C24 12 27 10 30 10 L56 10 C60 10 70 16 74 20 L82 26 C85 28 86 30 86 32 C86 34 84 36 82 36 L10 36 C7 36 6 34 6 32 C6 30 6 28 8 26 Z"
        fill="url(#carBody)"
      />
      <path
        d="M32 12 H54 C58 12 66 18 70 22 L38 22 C34 22 30 18 30 16 C30 14 31 12 32 12 Z"
        fill="url(#carGlass)"
      />
      <circle cx="26" cy="36" r="6" fill="#263238" />
      <circle cx="26" cy="36" r="3" fill="#90a4ae" />
      <circle cx="68" cy="36" r="6" fill="#263238" />
      <circle cx="68" cy="36" r="3" fill="#90a4ae" />
      <rect x="76" y="28" width="4" height="4" rx="1" fill="#ffc107" />
      <rect x="10" y="28" width="4" height="4" rx="1" fill="#e0e0e0" />
    </g>
    <filter
      id="shadow"
      x="-10"
      y="0"
      width="120"
      height="80"
      filterUnits="userSpaceOnUse"
    >
      <feDropShadow
        dx="0"
        dy="2"
        stdDeviation="2"
        floodColor="rgba(0,0,0,0.25)"
      />
    </filter>
  </svg>
);

const Loading = () => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let start = Date.now();
    let frame;
    const duration = 1500; // Reduced from 3 seconds to 1.5 seconds for faster loading
    const animate = () => {
      const elapsed = Date.now() - start;
      const percent = Math.min((elapsed / duration) * 100, 100);
      setProgress(percent);
      if (percent < 100) {
        frame = requestAnimationFrame(animate);
      }
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div className="loading-container">
      <div className="loading-content">
        <img
          src={require("../images/logo.jpg")}
          alt="Bappa travels taxi services Logo"
          className="loading-logo"
          loading="eager"
        />
        <div className="company-name">Bappa Travels</div>
        <div className="loading-subtitle">
          Loading your travel experience...
        </div>

        {/* Loading bar with animated car */}
        <div className="loading-bar-container">
          <div className="loading-bar">
            <div
              className="loading-car"
              style={{
                left: `${progress}%`,
                transform: `translateX(-50%)`,
              }}
            >
              <RightFacingCar />
              <div className="car-trail"></div>
            </div>
          </div>
          <div
            className="loading-bar-fill"
            style={{ width: `${progress}%` }}
          ></div>
        </div>

        <div className="loading-progress">{Math.round(progress)}%</div>
      </div>
    </div>
  );
};

// Minimal loading spinner for non-homepage routes
export const MinimalLoading = () => (
  <div
    style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      height: "100vh",
      background: "rgba(255,255,255,0.7)",
      zIndex: 9999,
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    }}
  >
    <div
      style={{
        width: 48,
        height: 48,
        border: "5px solid #eee",
        borderTop: "5px solid #388e3c",
        borderRadius: "50%",
        animation: "spin 1s linear infinite",
      }}
    />
    <style>{`
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `}</style>
  </div>
);

export default Loading;

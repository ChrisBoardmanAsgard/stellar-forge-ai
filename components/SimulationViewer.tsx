import React from 'react';
import type { PropulsionPhase } from '../App';
import { SpaceshipIcon } from './Icons';

interface SimulationViewerProps {
  propulsionPhases: PropulsionPhase[];
  imageUrl: string | null;
}

export const SimulationViewer: React.FC<SimulationViewerProps> = ({ propulsionPhases, imageUrl }) => {
  if (!propulsionPhases || propulsionPhases.length < 2) {
    return null;
  }

  const maxSpeed = Math.max(...propulsionPhases.map(p => p.speed_c), 0);
  const totalTime = Math.max(...propulsionPhases.map(p => p.time_days));
  
  const animationDuration = 12 + (1 - Math.min(maxSpeed, 1)) * 8; // 12s to 20s

  const animationStyle = {
    '--animation-duration': `${animationDuration}s`,
  } as React.CSSProperties;
  
  const stars = Array.from({ length: 100 }).map((_, i) => {
    const style = {
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      animationDelay: `${Math.random() * 2}s`,
      animationDuration: `${2 + Math.random() * 3}s`,
      transform: `scale(${Math.random() * 1.5})`,
    };
    return <div key={i} className="star" style={style}></div>;
  });

  const phasesWithPosition = propulsionPhases.map(phase => ({
    ...phase,
    position: totalTime > 0 ? (phase.time_days / totalTime) * 100 : 0,
  }));

  const trailKeyframes = phasesWithPosition.map(phase => {
    const trailLength = phase.speed_c * 120; // max length 120px
    const glowRadius = phase.speed_c * 15;
    const glowSpread = phase.speed_c * 30;
    const opacity = Math.min(phase.speed_c * 2, 1);
    return `
      ${phase.position}% {
        width: ${trailLength}px;
        opacity: ${opacity};
        box-shadow: 0 0 ${glowRadius}px ${glowSpread}px rgba(77, 228, 255, 0.3);
      }
    `;
  }).join('');

  const keyframesStyle = `
    @keyframes travel {
      from { left: -150px; }
      to { left: calc(100% + 150px); }
    }
    @keyframes trail-fx {
      ${trailKeyframes}
    }
    @keyframes twinkle {
      0% { opacity: 0; }
      50% { opacity: 1; }
      100% { opacity: 0; }
    }
  `;

  return (
    <div className="print:hidden">
      <style>{keyframesStyle}</style>
      <div style={animationStyle} className="simulation-container relative w-full h-64 bg-black rounded-lg overflow-hidden border border-cyan-500/20 p-4 flex flex-col justify-center">
        
        <div className="stars-background absolute inset-0">{stars}</div>
        
        <div className="ship-animation-wrapper">
          <div className="ship-and-effects">
            <div className="plasma-trail"></div>
            {imageUrl ? (
              <img src={imageUrl} alt="Invention concept" className="ship-image" />
            ) : (
              <SpaceshipIcon className="ship-icon text-gray-300" />
            )}
          </div>
        </div>
        
        <div className="absolute bottom-4 left-0 right-0 h-10 px-8">
          <div className="relative w-full h-full">
            <div className="absolute top-1/2 left-0 w-full h-px bg-repeat-x bg-[length:8px_1px] bg-[image:linear-gradient(to_right,rgba(8,145,178,0.7)_50%,transparent_0)]"></div>
            {phasesWithPosition.map((phase, index) => (
              <div key={index} className="phase-marker" style={{ left: `${phase.position}%` }}>
                <div className="marker-dot"></div>
                <div className="marker-text">
                  <span>{phase.phase}</span>
                  <span className="text-cyan-400 font-semibold">{phase.speed_c.toFixed(2)}c</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="absolute top-2 left-3 text-white font-orbitron text-sm bg-black/50 px-2 py-1 rounded z-20">
          Max Speed: {maxSpeed.toFixed(2)}c
        </div>
        <div className="absolute top-2 right-3 text-white font-orbitron text-sm bg-black/50 px-2 py-1 rounded z-20">
          Journey Time: {totalTime} days
        </div>
      </div>
      <style>{`
        .simulation-container .star {
          position: absolute;
          width: 2px;
          height: 2px;
          border-radius: 50%;
          background-color: white;
          opacity: 0;
          animation: twinkle linear infinite;
        }

        .ship-animation-wrapper {
            position: absolute;
            top: 50%;
            left: -150px;
            transform: translateY(-50%);
            margin-top: -30px;
            animation: travel var(--animation-duration) linear infinite;
            will-change: left;
        }
        
        .ship-and-effects {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .ship-image {
          height: 60px;
          width: auto;
          object-fit: contain;
          position: relative;
          z-index: 10;
          filter: drop-shadow(0 0 10px rgba(173, 216, 230, 0.8));
          transform: rotate(90deg);
        }

        .ship-icon {
          height: 60px;
          width: 60px;
          position: relative;
          z-index: 10;
          filter: drop-shadow(0 0 8px rgba(209, 213, 219, 0.7));
        }

        .plasma-trail {
            position: absolute;
            left: -10px;
            top: 50%;
            transform: translateY(-50%) translateX(-100%);
            height: 8px;
            background: linear-gradient(to left, rgba(77, 228, 255, 1), rgba(167, 243, 252, 0.5), transparent);
            border-radius: 4px;
            animation: trail-fx var(--animation-duration) linear infinite;
            transform-origin: right;
            will-change: width, opacity, box-shadow;
        }

        .phase-marker {
            position: absolute;
            top: 50%;
            transform: translate(-50%, -50%);
            text-align: center;
            display: flex;
            flex-direction: column;
            align-items: center;
        }

        .marker-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background-color: #0891b2;
            border: 2px solid #67e8f9;
        }
        
        .marker-text {
            font-family: 'Roboto', sans-serif;
            font-size: 11px;
            color: #d1d5db;
            white-space: nowrap;
            display: flex;
            flex-direction: column;
            background: rgba(17, 24, 39, 0.7);
            padding: 2px 4px;
            border-radius: 3px;
            margin-top: 8px;
        }
      `}</style>
    </div>
  );
};

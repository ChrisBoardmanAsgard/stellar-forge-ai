
import React from 'react';
import type { PropulsionPhase } from '../App';
import { SpaceshipIcon } from './Icons';

interface StaticSimulationViewerProps {
  propulsionPhases: PropulsionPhase[];
  imageUrl: string | null;
}

export const StaticSimulationViewer: React.FC<StaticSimulationViewerProps> = ({ propulsionPhases, imageUrl }) => {
  if (!propulsionPhases || propulsionPhases.length < 2) {
    return null;
  }

  const maxSpeed = Math.max(...propulsionPhases.map(p => p.speed_c), 0);
  const totalTime = Math.max(...propulsionPhases.map(p => p.time_days));

  const phasesWithPosition = propulsionPhases.map(phase => ({
    ...phase,
    position: totalTime > 0 ? (phase.time_days / totalTime) * 100 : 0,
  }));

  return (
    <div className="my-8 print-simulation-view">
      <h3 className="text-2xl font-bold font-orbitron text-cyan-300 border-b-2 border-cyan-500/30 pb-2 mb-6">Mission Simulation</h3>
      <div className="relative w-full bg-gray-900 rounded-lg border border-cyan-500/20 p-6">
        <div className="flex justify-between text-white font-orbitron text-sm mb-8">
          <span>Max Speed: <span className="text-cyan-400">{maxSpeed.toFixed(2)}c</span></span>
          <span>Journey Time: <span className="text-cyan-400">{totalTime} days</span></span>
        </div>
        
        <div className="relative w-full h-12">
          {/* Timeline bar */}
          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-cyan-700/50"></div>
          
          {/* Spaceship icon at the end */}
          <div className="absolute top-1/2 right-0 transform -translate-y-1/2 translate-x-1/2">
             {imageUrl ? (
              <img src={imageUrl} alt="Invention concept" className="h-10 w-auto transform rotate-90" style={{filter: 'drop-shadow(0 0 5px rgba(173, 216, 230, 0.7))'}} />
            ) : (
              <SpaceshipIcon className="h-10 w-10 text-cyan-300" style={{filter: 'drop-shadow(0 0 5px rgba(173, 216, 230, 0.7))'}} />
            )}
          </div>

          {/* Phase markers */}
          {phasesWithPosition.map((phase, index) => (
            <div key={index} className="absolute top-1/2" style={{ left: `${phase.position}%`, transform: `translateX(-50%)` }}>
              <div className="w-3 h-3 bg-cyan-400 rounded-full border-2 border-gray-900 transform -translate-y-1/2 z-10 relative"></div>
              <div className="absolute top-full mt-2 text-center w-24 transform -translate-x-1/2">
                <span className="block text-xs text-gray-300 font-semibold">{phase.phase}</span>
                <span className="block text-xs text-cyan-400">{phase.speed_c.toFixed(2)}c at {phase.time_days} days</span>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-12 flex justify-between text-xs text-gray-400">
          <span>Start (0 days)</span>
          <span>End ({totalTime} days)</span>
        </div>
      </div>
    </div>
  );
};

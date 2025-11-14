import React from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { ChartData } from '../App';

interface InventionChartsProps {
  data: ChartData;
}

// Custom Tooltip for Energy chart for better styling and formatting
const EnergyTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-2 bg-gray-900/80 border border-cyan-500/50 rounded-md shadow-lg backdrop-blur-sm">
        <p className="label text-cyan-300 font-orbitron">{`Speed: ${label} c`}</p>
        <p className="intro" style={{ color: payload[0].color }}>{`Energy: ${payload[0].value.toExponential(2)} J`}</p>
      </div>
    );
  }
  return null;
};

// Custom Tooltip for Speed chart
const SpeedTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="p-2 bg-gray-900/80 border border-cyan-500/50 rounded-md shadow-lg backdrop-blur-sm">
          <p className="label text-cyan-300 font-orbitron">{`${data.phase}`}</p>
          <p className="intro text-gray-300">{`Time: ${label} days`}</p>
          <p className="intro" style={{color: payload[0].color}}>{`Speed: ${data.speed_c} c`}</p>
        </div>
      );
    }
    return null;
  };


export const InventionCharts: React.FC<InventionChartsProps> = ({ data }) => {
  const { propulsionPhases, energyRequirements } = data;

  if (!propulsionPhases?.length && !energyRequirements?.length) {
    return null;
  }

  return (
    <div className="my-8 space-y-12">
      <hr className="border-cyan-500/20" />
      
      {propulsionPhases && propulsionPhases.length > 0 && (
        <div>
          <h3 className="text-2xl font-bold font-orbitron text-cyan-300 border-b-2 border-cyan-500/30 pb-2 mb-6">Propulsion Phases</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={propulsionPhases} margin={{ top: 5, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#0891b2" strokeOpacity={0.2} />
              <XAxis dataKey="time_days" stroke="#9ca3af" tick={{ fontFamily: 'Roboto', fontSize: 12 }} label={{ value: 'Mission Time (days)', position: 'insideBottom', offset: -15, fill: '#9ca3af' }} />
              <YAxis stroke="#9ca3af" tick={{ fontFamily: 'Roboto', fontSize: 12 }} label={{ value: 'Speed (c)', angle: -90, position: 'insideLeft', offset: -5, fill: '#9ca3af' }} domain={[0, 'dataMax + 0.05']} />
              <Tooltip content={<SpeedTooltip />} />
              <Legend wrapperStyle={{fontFamily: 'Orbitron'}} />
              <Line type="monotone" dataKey="speed_c" name="Effective Speed" stroke="#22d3ee" strokeWidth={2} dot={{ r: 4, fill: '#22d3ee' }} activeDot={{ r: 8 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {energyRequirements && energyRequirements.length > 0 && (
        <div>
          <h3 className="text-2xl font-bold font-orbitron text-cyan-300 border-b-2 border-cyan-500/30 pb-2 mb-6">Energy Requirements</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={energyRequirements} margin={{ top: 5, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#0891b2" strokeOpacity={0.2} />
              <XAxis dataKey="speed_c" stroke="#9ca3af" tick={{ fontFamily: 'Roboto', fontSize: 12 }} label={{ value: 'Speed (c)', position: 'insideBottom', offset: -15, fill: '#9ca3af' }} unit=" c" />
              <YAxis stroke="#9ca3af" tick={{ fontFamily: 'Roboto', fontSize: 12 }} tickFormatter={(tick) => tick.toExponential(0)} label={{ value: 'Energy (Joules)', angle: -90, position: 'insideLeft', offset: 0, fill: '#9ca3af' }} scale="log" domain={['auto', 'auto']} />
              <Tooltip content={<EnergyTooltip />} cursor={{fill: 'rgba(34, 211, 238, 0.1)'}}/>
              <Legend wrapperStyle={{fontFamily: 'Orbitron'}} />
              <Bar dataKey="energy_j" name="Total Energy" fill="#22d3ee" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
      <hr className="border-cyan-500/20" />
    </div>
  );
};
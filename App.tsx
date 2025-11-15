import React, { useState, useCallback } from 'react';
import { Header } from './components/Header';
import { InputForm } from './components/InputForm';
import { OutputDisplay } from './components/OutputDisplay';
import { generateInvention } from './services/geminiService';

export interface PropulsionPhase {
  phase: string;
  time_days: number;
  speed_c: number;
}

export interface EnergyRequirement {
  speed_c: number;
  energy_j: number;
}

export interface ChartData {
  propulsionPhases: PropulsionPhase[];
  energyRequirements: EnergyRequirement[];
}

export interface ModelParams {
  components: {
    shape: 'box' | 'sphere' | 'cylinder' | 'cone';
    scale: [number, number, number];
    position: [number, number, number];
    rotation: [number, number, number];
  }[];
  primaryColor: string;
  secondaryColor: string;
}

export interface InventionOutput {
  text: string;
  imageUrl: string | null;
  chartData: ChartData | null;
  modelParams: ModelParams | null;
}

const App: React.FC = () => {
  const [userInput, setUserInput] = useState<string>('');
  const [inventionOutput, setInventionOutput] = useState<InventionOutput | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = useCallback(async (prompt: string) => {
    if (isLoading || !prompt.trim()) return;

    setIsLoading(true);
    setError(null);
    setInventionOutput(null);

    try {
      const result = await generateInvention(prompt);
      setInventionOutput(result);
    } catch (e) {
      console.error(e);
      if (e instanceof Error) {
        setError(e.message);
      } else {
        setError('An unknown error occurred. Please try again later.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  const handleExampleClick = (prompt: string) => {
    setUserInput(prompt);
    handleGenerate(prompt);
  };
  

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 bg-gradient-to-br from-gray-900 via-blue-900/20 to-gray-900">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start print:block">
          <div className="flex flex-col gap-6 p-6 bg-gray-800/50 rounded-lg border border-cyan-500/20 shadow-xl shadow-cyan-500/10 print:hidden">
            <h2 className="text-2xl font-bold font-orbitron text-cyan-300">Invention Prompt</h2>
            <p className="text-gray-400">
              Provide a concept, question, or goal related to interstellar travel. The AI will use research papers on <a href="https://zenodo.org/records/17551801" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">RHPWP</a>, <a href="https://zenodo.org/records/17609190" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">RTPD</a>, and <a href="https://zenodo.org/records/17614345" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">TECAR</a> to invent a new technology based on your input.
            </p>
            <InputForm 
              onSubmit={handleGenerate} 
              isLoading={isLoading}
              userInput={userInput}
              setUserInput={setUserInput}
            />
            <div className="mt-4">
              <h3 className="text-lg font-semibold font-orbitron text-gray-300 mb-3">Or try an example:</h3>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => handleExampleClick('Design a small probe for exploring the Oort cloud using RHPWP principles.')} disabled={isLoading} className="text-sm bg-gray-700/70 hover:bg-cyan-800/80 disabled:opacity-50 text-cyan-300 px-3 py-1 rounded-full transition-colors">Probe for Oort Cloud</button>
                <button onClick={() => handleExampleClick('How can we improve the deceleration phase of the RHPWP drive?')} disabled={isLoading} className="text-sm bg-gray-700/70 hover:bg-cyan-800/80 disabled:opacity-50 text-cyan-300 px-3 py-1 rounded-full transition-colors">Improve Deceleration</button>
                <button onClick={() => handleExampleClick('Invent a defense system for an RHPWP-powered ship against interstellar dust.')} disabled={isLoading} className="text-sm bg-gray-700/70 hover:bg-cyan-800/80 disabled:opacity-50 text-cyan-300 px-3 py-1 rounded-full transition-colors">Ship Defense System</button>
              </div>
            </div>
          </div>
          <div className="lg:sticky lg:top-8">
             <OutputDisplay
              isLoading={isLoading}
              error={error}
              output={inventionOutput}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
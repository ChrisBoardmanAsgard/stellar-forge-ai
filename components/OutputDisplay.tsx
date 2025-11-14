import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import html2pdf from 'html2pdf.js';
import { RocketIcon, DownloadIcon, WarningIcon, PlayIcon, XIcon, CubeIcon } from './Icons';
import { InventionCharts } from './InventionCharts';
import { SimulationViewer } from './SimulationViewer';
import { StaticSimulationViewer } from './StaticSimulationViewer';
import ModelViewer from './ModelViewer';
import type { InventionOutput } from '../App';

interface OutputDisplayProps {
  isLoading: boolean;
  error: string | null;
  output: InventionOutput | null;
}

const FormattedContent: React.FC<{ content: string }> = ({ content }) => {
  // Un-escape newlines and filter empty lines
  const lines = content.replace(/\\n/g, '\n').split('\n').filter(line => line.trim() !== '');

  const elements: React.ReactNode[] = [];
  let currentListItems: string[] = [];

  const parseInlineMarkdown = (text: string): string => {
    // Replace **text** with <strong class="text-cyan-400">text</strong>
    return text.replace(/\*\*(.*?)\*\*/g, '<strong class="text-cyan-400">$1</strong>');
  };

  const flushList = () => {
    if (currentListItems.length > 0) {
      elements.push(
        <ul key={`ul-${elements.length}`} className="list-disc pl-5 space-y-1">
          {currentListItems.map((item, idx) => (
            <li key={idx} dangerouslySetInnerHTML={{ __html: item }} />
          ))}
        </ul>
      );
      currentListItems = [];
    }
  };

  lines.forEach((line, index) => {
    if (line.startsWith('* ')) {
      currentListItems.push(parseInlineMarkdown(line.substring(2)));
    } else {
      flushList(); // A non-list item line ends the current list
      if (line.startsWith('### ')) {
        elements.push(<h3 key={index} className="text-xl font-semibold font-orbitron text-cyan-400 mt-4">{line.substring(4)}</h3>);
      } else if (line.startsWith('## ')) {
        elements.push(<h2 key={index} className="text-2xl font-bold font-orbitron text-cyan-300 border-b-2 border-cyan-500/30 pb-2">{line.substring(3)}</h2>);
      } else {
        elements.push(<p key={index} className="leading-relaxed" dangerouslySetInnerHTML={{ __html: parseInlineMarkdown(line) }} />);
      }
    }
  });

  flushList(); // Ensure the last list in the content is rendered

  return <div className="space-y-4">{elements}</div>;
};

export const OutputDisplay: React.FC<OutputDisplayProps> = ({ isLoading, error, output }) => {
  const [isSavingPdf, setIsSavingPdf] = useState(false);
  const [showSimulation, setShowSimulation] = useState(false);
  const [showModelViewer, setShowModelViewer] = useState(false);
  
  const handleSavePdf = async () => {
    if (!output?.text) return;

    setIsSavingPdf(true);

    const inventionName = output.text.split('\n')[0].substring(3).trim().replace(/\s+/g, '_') || 'Stellar_Forge_Invention';

    // 1. Create a temporary, off-screen container for rendering the printable content
    const printContainer = document.createElement('div');
    printContainer.id = 'temp-print-container';
    printContainer.style.position = 'absolute';
    printContainer.style.left = '-9999px';
    printContainer.style.width = '8.5in'; // A fixed width helps with layout (Letter size)
    printContainer.style.padding = '0.5in'; // Standard margins
    printContainer.classList.add('bg-gray-800', 'text-gray-200'); // Use app's theme for rendering
    document.body.appendChild(printContainer);

    // 2. Define the full printable component
    const PrintableContent = () => (
      <div className="prose prose-invert max-w-none">
        <FormattedContent content={output.text} />
        {output.chartData?.propulsionPhases && (
          <StaticSimulationViewer 
            propulsionPhases={output.chartData.propulsionPhases}
            imageUrl={output.imageUrl}
          />
        )}
        {output.chartData && <InventionCharts data={output.chartData} />}
        {output.imageUrl && (
          <div className="mt-8">
            <h3 className="text-2xl font-bold font-orbitron text-cyan-300 border-b-2 border-cyan-500/30 pb-2 mb-4">Conceptual Blueprint</h3>
            <div className="p-2 border border-cyan-500/20 rounded-lg bg-gray-900">
              <img src={output.imageUrl} alt="Conceptual Blueprint of the invention" className="rounded-md w-full" />
            </div>
          </div>
        )}
      </div>
    );
    
    // 3. Render the component into the off-screen container using React
    const root = ReactDOM.createRoot(printContainer);
    root.render(<PrintableContent />);

    // 4. Give React a moment to render everything, especially the charts
    await new Promise(resolve => setTimeout(resolve, 1000));

    const opt = {
      margin: 0.5,
      filename: `${inventionName}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#1f2937', // bg-gray-800 from tailwind config
      },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };

    // 5. Generate the PDF and clean up
    try {
      await html2pdf(printContainer, opt);
    } catch (e) {
      console.error("PDF generation failed:", e);
      alert("Sorry, there was an error creating the PDF. Please try again. If the problem persists, it could be due to a network issue or ad blocker interfering with the PDF generation library.");
    } finally {
      root.unmount();
      document.body.removeChild(printContainer);
      setIsSavingPdf(false);
    }
  };


  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center gap-4 text-cyan-400">
           <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-cyan-500"></div>
          <p className="text-lg font-semibold font-orbitron">AI is inventing...</p>
          <p className="text-sm text-gray-400">Analyzing quantum foam and generating blueprints.</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center text-red-400 p-4 border border-red-500/50 bg-red-900/20 rounded-lg">
            <WarningIcon className="w-12 h-12 mx-auto mb-4 text-red-500" />
            <h2 className="text-2xl font-bold font-orbitron mb-2 text-red-400">API Configuration Error</h2>
            <p className="text-red-300 whitespace-pre-wrap">{error}</p>
            <a href="https://ai.google.dev/gemini-api/docs/rate-limits" target="_blank" rel="noopener noreferrer" className="mt-4 inline-block text-cyan-400 hover:text-cyan-300 underline">
                Learn more about API quotas & billing
            </a>
        </div>
      );
    }

    if (output?.text) {
      return (
        <>
          <div id="output-content-for-display">
            <FormattedContent content={output.text} />

            {output.modelParams && (
              <div className="my-8 text-center print:hidden">
                <hr className="border-cyan-500/20 mb-8" />
                <button
                  onClick={() => setShowModelViewer(true)}
                  className="inline-flex items-center justify-center gap-3 bg-cyan-700 hover:bg-cyan-600 text-white font-bold py-3 px-6 rounded-md transition-all duration-300 ease-in-out transform hover:scale-105 shadow-lg shadow-cyan-500/20 font-orbitron text-lg"
                >
                  <CubeIcon className="w-6 h-6" />
                  View 3D Model
                </button>
              </div>
            )}

            {showModelViewer && output?.modelParams && (
              <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in print:hidden" onClick={() => setShowModelViewer(false)}>
                  <div className="relative bg-gray-900 border border-cyan-500/30 rounded-lg shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-between items-center p-4 border-b border-cyan-500/20 flex-shrink-0">
                         <h3 className="text-2xl font-bold font-orbitron text-cyan-300">3D Model Viewer</h3>
                         <button onClick={() => setShowModelViewer(false)} className="text-gray-400 hover:text-white z-10 p-1 rounded-full hover:bg-gray-700 transition-colors" aria-label="Close 3D Model Viewer">
                            <XIcon className="w-6 h-6" />
                         </button>
                      </div>
                      <div className="p-1 sm:p-2 flex-grow h-full min-h-[500px]">
                        <ModelViewer 
                            modelParams={output.modelParams}
                            imageUrl={output.imageUrl}
                        />
                      </div>
                  </div>
              </div>
            )}
            
            {output.chartData?.propulsionPhases && (
              <div id="simulation-button-wrapper" className="my-8 text-center print:hidden">
                <hr className="border-cyan-500/20 mb-8" />
                <button
                  onClick={() => setShowSimulation(true)}
                  className="inline-flex items-center justify-center gap-3 bg-cyan-700 hover:bg-cyan-600 text-white font-bold py-3 px-6 rounded-md transition-all duration-300 ease-in-out transform hover:scale-105 shadow-lg shadow-cyan-500/20 font-orbitron text-lg"
                >
                  <PlayIcon className="w-6 h-6" />
                  View Mission Simulation
                </button>
              </div>
            )}

            {showSimulation && output?.chartData?.propulsionPhases && (
              <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in print:hidden" onClick={() => setShowSimulation(false)}>
                  <div className="relative bg-gray-900 border border-cyan-500/30 rounded-lg shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-between items-center p-4 border-b border-cyan-500/20 flex-shrink-0">
                         <h3 className="text-2xl font-bold font-orbitron text-cyan-300">Mission Simulation</h3>
                         <button onClick={() => setShowSimulation(false)} className="text-gray-400 hover:text-white z-10 p-1 rounded-full hover:bg-gray-700 transition-colors" aria-label="Close Mission Simulation">
                            <XIcon className="w-6 h-6" />
                         </button>
                      </div>
                      <div className="overflow-auto p-4 sm:p-6 flex-grow">
                        <SimulationViewer 
                            propulsionPhases={output.chartData.propulsionPhases} 
                            imageUrl={output.imageUrl}
                        />
                      </div>
                  </div>
              </div>
            )}

            {output.chartData && <InventionCharts data={output.chartData} />}
            
            {output.imageUrl && (
              <div className="mt-8">
                <h3 className="text-2xl font-bold font-orbitron text-cyan-300 border-b-2 border-cyan-500/30 pb-2 mb-4">Conceptual Blueprint</h3>
                <div className="p-2 border border-cyan-500/20 rounded-lg bg-gray-900">
                  <img src={output.imageUrl} alt="Conceptual Blueprint of the invention" className="rounded-md w-full" />
                </div>
              </div>
            )}
          </div>
           <div id="pdf-button-wrapper" className="mt-8 text-center print:hidden">
            <button
              onClick={handleSavePdf}
              disabled={isSavingPdf}
              className="inline-flex items-center justify-center gap-2 bg-cyan-700 hover:bg-cyan-600 disabled:bg-cyan-900 disabled:cursor-wait text-white font-bold py-2 px-6 rounded-md transition-colors duration-300 ease-in-out transform hover:scale-105 disabled:scale-100 shadow-lg shadow-cyan-500/20"
            >
              {isSavingPdf ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving PDF...
                </>
              ) : (
                <>
                  <DownloadIcon className="w-5 h-5" />
                  Save as PDF
                </>
              )}
            </button>
          </div>
        </>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center gap-4 text-center">
        <RocketIcon className="w-20 h-20 text-cyan-600" />
        <h2 className="text-2xl font-bold font-orbitron text-gray-400">Awaiting Your Spark</h2>
        <p className="text-gray-500 max-w-sm">Your next great idea for interstellar travel is waiting to be forged. Enter a prompt to begin the invention process.</p>
      </div>
    );
  };

  return (
    <div id="output-container" className="p-6 bg-gray-800/50 rounded-lg border border-cyan-500/20 shadow-xl shadow-cyan-500/10 min-h-[400px] flex items-center justify-center transition-all duration-300 print-container">
      <div className="w-full prose prose-invert max-w-none">
        {renderContent()}
      </div>
    </div>
  );
};
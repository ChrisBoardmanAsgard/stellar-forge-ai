
import React from 'react';
import { SparklesIcon } from './Icons';

interface InputFormProps {
  onSubmit: (prompt: string) => void;
  isLoading: boolean;
  userInput: string;
  setUserInput: React.Dispatch<React.SetStateAction<string>>;
}

export const InputForm: React.FC<InputFormProps> = ({ onSubmit, isLoading, userInput, setUserInput }) => {
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(userInput);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <textarea
        value={userInput}
        onChange={(e) => setUserInput(e.target.value)}
        placeholder="e.g., Invent a method to navigate through dense asteroid fields..."
        rows={5}
        className="w-full p-3 bg-gray-900/70 border border-gray-600 rounded-md focus:ring-2 focus:ring-cyan-500 focus:outline-none text-gray-200 placeholder-gray-500 transition-shadow"
        disabled={isLoading}
        aria-label="Invention Prompt"
      />
      <button
        type="submit"
        disabled={isLoading || !userInput.trim()}
        className="w-full flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-md transition-all duration-300 ease-in-out transform hover:scale-105 disabled:scale-100 shadow-lg shadow-cyan-500/20"
      >
        {isLoading ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Forging Idea...
          </>
        ) : (
          <>
            <SparklesIcon className="w-5 h-5" />
            Generate Invention
          </>
        )}
      </button>
    </form>
  );
};
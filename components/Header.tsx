import React from 'react';
import { FlaskConical, Atom } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-science-600 p-2 rounded-lg text-white">
            <FlaskConical size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              ChemDepth <span className="text-science-600">Evaluator</span>
            </h1>
            <p className="text-xs text-slate-500 font-medium">Higher Order Thinking Portfolio Tool</p>
          </div>
        </div>
        <div className="hidden md:flex items-center text-sm text-slate-500 gap-1">
          <Atom size={16} />
          <span>Powered by Gemini 2.5</span>
        </div>
      </div>
    </header>
  );
};

export default Header;

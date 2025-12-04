import React from 'react';
import { AnalysisResult, BloomLevel } from '../types';
import { 
  CheckCircle, 
  AlertCircle, 
  ArrowRight, 
  Lightbulb, 
  TrendingUp, 
  BrainCircuit 
} from 'lucide-react';

interface AnalysisResultProps {
  result: AnalysisResult | null;
  isLoading: boolean;
}

const AnalysisResultView: React.FC<AnalysisResultProps> = ({ result, isLoading }) => {
  if (isLoading) {
    return (
      <div className="h-full min-h-[400px] flex flex-col items-center justify-center bg-slate-50 rounded-2xl border border-slate-200 border-dashed animate-pulse">
        <div className="bg-white p-4 rounded-full shadow-sm mb-4">
          <BrainCircuit className="text-science-500 animate-spin" size={32} />
        </div>
        <p className="text-slate-500 font-medium">Analyzing pedagogical depth...</p>
        <p className="text-slate-400 text-sm mt-2">Checking against Bloom's Taxonomy</p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="h-full min-h-[400px] flex flex-col items-center justify-center bg-slate-50 rounded-2xl border border-slate-200 border-dashed text-center p-8">
        <div className="bg-white p-4 rounded-full shadow-sm mb-4">
          <Lightbulb className="text-slate-300" size={32} />
        </div>
        <h3 className="text-lg font-medium text-slate-700 mb-2">Ready to Analyze</h3>
        <p className="text-slate-500 max-w-sm">
          Paste your chemistry question on the left to see if it meets the Higher Order Thinking requirements.
        </p>
      </div>
    );
  }

  const isHighScore = result.score >= 7;
  const scoreColor = isHighScore ? 'text-green-600 bg-green-50' : (result.score >= 5 ? 'text-yellow-600 bg-yellow-50' : 'text-red-600 bg-red-50');
  const borderColor = isHighScore ? 'border-green-200' : (result.score >= 5 ? 'border-yellow-200' : 'border-red-200');

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Score Card */}
      <div className={`rounded-xl border ${borderColor} bg-white p-6 shadow-sm`}>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${result.isHigherOrder ? 'bg-science-100 text-science-700' : 'bg-slate-100 text-slate-600'}`}>
                {result.bloomLevel} Level
              </span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900">
              {result.isHigherOrder ? 'Higher Order Thinking Verified' : 'Needs More Depth'}
            </h2>
          </div>
          <div className={`flex flex-col items-center justify-center w-16 h-16 rounded-full ${scoreColor} font-bold text-xl border-4 border-white shadow-sm ring-1 ring-slate-100`}>
            {result.score}<span className="text-[10px] font-normal opacity-70">/10</span>
          </div>
        </div>
        <p className="mt-4 text-slate-600 leading-relaxed">
          {result.feedback}
        </p>
      </div>

      {/* Suggestions */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
          <TrendingUp size={16} className="text-science-500" />
          Areas for Improvement
        </h3>
        <ul className="space-y-3">
          {result.improvementSuggestions.map((suggestion, idx) => (
            <li key={idx} className="flex items-start gap-3 text-slate-600 text-sm">
              <ArrowRight className="text-science-400 mt-0.5 shrink-0" size={16} />
              <span>{suggestion}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Better Version */}
      <div className="bg-gradient-to-br from-science-50 to-white rounded-xl border border-science-100 p-6 shadow-sm relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-24 h-24 bg-science-100 rounded-full -mr-12 -mt-12 opacity-50 group-hover:scale-110 transition-transform"></div>
        
        <h3 className="text-sm font-bold text-science-800 uppercase tracking-wider mb-4 flex items-center gap-2 relative z-10">
          <Lightbulb size={16} className="text-science-600" />
          AI Suggested Rewrite
        </h3>
        
        <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-science-100 relative z-10">
          <p className="text-slate-800 font-medium italic">
            "{result.betterQuestionExample}"
          </p>
        </div>
        
        <div className="mt-3 flex items-center gap-2 text-xs text-science-600 font-medium relative z-10">
          <CheckCircle size={14} />
          <span>Promotes Deep Thinking</span>
          <span className="w-1 h-1 bg-science-300 rounded-full mx-1"></span>
          <span>Encourages Inquiry</span>
        </div>
      </div>

    </div>
  );
};

export default AnalysisResultView;

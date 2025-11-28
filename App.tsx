import React, { useState, useRef } from 'react';
import Header from './components/Header';
import RubricPanel from './components/RubricPanel';
import AnalysisResultView from './components/AnalysisResult';
import { analyzeQuestion, processFile } from './services/geminiService';
import { Rubric, AnalysisResult, Example } from './types';
import { DEFAULT_RUBRIC, SAMPLE_QUESTION, DEFAULT_EXAMPLES } from './constants';
import { Sparkles, Eraser, Play, Upload, FileText, X, FileType } from 'lucide-react';

const App: React.FC = () => {
  const [rubric, setRubric] = useState<Rubric>(DEFAULT_RUBRIC);
  const [examples, setExamples] = useState<Example[]>(DEFAULT_EXAMPLES);
  const [inputMode, setInputMode] = useState<'text' | 'file'>('text');
  
  // Text Input State
  const [questionText, setQuestionText] = useState<string>('');
  
  // File Input State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRubricOpen, setIsRubricOpen] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Basic validation based on extension
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (['pdf', 'doc', 'docx', 'txt', 'jpg', 'jpeg', 'png', 'webp'].includes(ext || '')) {
         setSelectedFile(file);
         setError(null);
      } else {
         setError('Unsupported file type.');
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const ext = file.name.split('.').pop()?.toLowerCase();
      const validExtensions = ['pdf', 'doc', 'docx', 'txt', 'jpg', 'jpeg', 'png', 'webp'];
      
      if (validExtensions.includes(ext || '')) {
        setSelectedFile(file);
        setError(null);
      } else {
        setError('Unsupported file type. Please upload DOCX, PDF, TXT, or Image files.');
      }
    }
  };

  const handleAnalyze = async () => {
    if (inputMode === 'text' && !questionText.trim()) return;
    if (inputMode === 'file' && !selectedFile) return;
    
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      let data;
      if (inputMode === 'text') {
        data = await analyzeQuestion(questionText, rubric, examples);
      } else if (selectedFile) {
        // Process file (Extract text from docx, base64 from pdf/img)
        const processedContent = await processFile(selectedFile);
        data = await analyzeQuestion(processedContent, rubric, examples);
      }

      if (data) {
        setResult(data);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Something went wrong during analysis.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setQuestionText('');
    setSelectedFile(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const loadSample = () => {
    setInputMode('text');
    setQuestionText(SAMPLE_QUESTION);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        <div className="mb-8">
          <div className="flex justify-between items-end mb-6">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 mb-2">Question Validator</h2>
              <p className="text-slate-500">Check if your chemistry questions meet the Higher Order Thinking (HOT) criteria.</p>
            </div>
            <div className="hidden sm:block">
               <RubricPanel 
                  rubric={rubric} 
                  onRubricChange={setRubric} 
                  examples={examples}
                  onExamplesChange={setExamples}
                  isOpen={isRubricOpen} 
                  setIsOpen={setIsRubricOpen}
                />
            </div>
          </div>

          <div className="sm:hidden mb-6">
             <RubricPanel 
                rubric={rubric} 
                onRubricChange={setRubric} 
                examples={examples}
                onExamplesChange={setExamples}
                isOpen={isRubricOpen} 
                setIsOpen={setIsRubricOpen}
              />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            
            {/* Left Column: Input */}
            <div className="flex flex-col space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                
                {/* Tabs */}
                <div className="flex border-b border-slate-100">
                  <button
                    onClick={() => setInputMode('text')}
                    className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                      inputMode === 'text' 
                        ? 'bg-white text-science-600 border-b-2 border-science-600' 
                        : 'bg-slate-50 text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    <FileText size={16} />
                    Paste Text
                  </button>
                  <button
                    onClick={() => setInputMode('file')}
                    className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                      inputMode === 'file' 
                        ? 'bg-white text-science-600 border-b-2 border-science-600' 
                        : 'bg-slate-50 text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    <Upload size={16} />
                    Upload File
                  </button>
                </div>

                {/* Content Area */}
                <div className="p-1">
                  
                  {inputMode === 'text' ? (
                    <>
                      <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                          Question Text
                        </label>
                        <button 
                          onClick={loadSample}
                          className="text-xs font-medium text-science-600 hover:text-science-700 px-2 py-1 rounded hover:bg-science-50 transition-colors"
                        >
                          Load Sample
                        </button>
                      </div>
                      <textarea
                        value={questionText}
                        onChange={(e) => setQuestionText(e.target.value)}
                        placeholder="e.g., Explain why the boiling point of water is higher than that of methane... (Supports English, Simplified & Traditional Chinese)"
                        className="w-full h-64 p-4 text-base text-slate-800 placeholder:text-slate-400 focus:outline-none resize-none bg-transparent"
                      />
                    </>
                  ) : (
                    <div className="h-80 p-6 flex flex-col">
                      {!selectedFile ? (
                        <div 
                          className="flex-1 border-2 border-dashed border-slate-300 rounded-lg bg-slate-50 flex flex-col items-center justify-center text-slate-500 hover:border-science-400 hover:bg-science-50 transition-all cursor-pointer"
                          onDragOver={handleDragOver}
                          onDrop={handleDrop}
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                            <Upload className="text-science-500" size={32} />
                          </div>
                          <p className="font-medium text-slate-700">Click to upload or drag & drop</p>
                          <p className="text-xs text-slate-400 mt-2">DOCX, PDF, TXT, JPG (Max 10MB)</p>
                          <input 
                            type="file" 
                            ref={fileInputRef}
                            className="hidden" 
                            accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.webp"
                            onChange={handleFileSelect}
                          />
                        </div>
                      ) : (
                        <div className="flex-1 flex flex-col items-center justify-center border border-slate-200 rounded-lg bg-slate-50/50">
                          <FileType className="text-science-600 mb-4" size={48} />
                          <p className="font-semibold text-slate-800 text-lg max-w-xs truncate px-4">
                            {selectedFile.name}
                          </p>
                          <p className="text-sm text-slate-500 mb-6">
                            {(selectedFile.size / 1024).toFixed(1)} KB
                          </p>
                          <button 
                            onClick={() => { setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                            className="text-red-500 text-sm font-medium hover:bg-red-50 px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                          >
                            <X size={16} />
                            Remove File
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="p-3 border-t border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-b-lg">
                    <button
                      onClick={handleClear}
                      className="flex items-center gap-2 text-slate-500 hover:text-red-500 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      <Eraser size={16} />
                      Clear
                    </button>
                    <button
                      onClick={handleAnalyze}
                      disabled={isLoading || (inputMode === 'text' ? !questionText.trim() : !selectedFile)}
                      className={`
                        flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold shadow-sm transition-all
                        ${(isLoading || (inputMode === 'text' ? !questionText.trim() : !selectedFile))
                          ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                          : 'bg-science-600 text-white hover:bg-science-700 hover:shadow-md active:transform active:scale-95'}
                      `}
                    >
                      {isLoading ? (
                        <>Reading & Analyzing...</>
                      ) : (
                        <>
                          <Sparkles size={16} />
                          Analyze Depth
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Instructions / Tips */}
              <div className="bg-science-50 rounded-xl p-6 border border-science-100">
                <h4 className="text-science-900 font-semibold mb-2 flex items-center gap-2">
                  <Play size={16} className="fill-science-900" />
                  Quick Tips
                </h4>
                <ul className="text-sm text-science-800 space-y-2 ml-1">
                  <li className="flex gap-2">
                    <span className="font-bold">•</span>
                    <span>Click "Configure AI Training" to add your own example questions.</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold">•</span>
                    <span>Upload worksheets, exam papers (PDF/Word), or handwritten notes (Images).</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold">•</span>
                    <span>For files with multiple questions, the AI will pick the most complex one.</span>
                  </li>
                  <li className="flex gap-2">
                     <span className="font-bold">•</span>
                     <span>Supports Chinese questions (Simplified & Traditional / 简体 & 繁體).</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Right Column: Results */}
            <div className="relative">
              {error && (
                 <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm flex items-center gap-2 animate-pulse">
                    <span className="font-bold">Error:</span> {error}
                 </div>
              )}
              <AnalysisResultView result={result} isLoading={isLoading} />
              
              {/* Show analyzed content snippet if file was uploaded */}
              {result && result.analyzedContent && (
                <div className="mt-4 p-4 bg-slate-100 rounded-lg border border-slate-200 text-sm text-slate-600">
                   <p className="font-semibold text-slate-700 mb-1 flex items-center gap-2">
                     <FileText size={14} />
                     Identified Question Content:
                   </p>
                   <p className="italic">"{result.analyzedContent}"</p>
                </div>
              )}
            </div>

          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
import React, { useState, useRef } from 'react';
import { Rubric, Example } from '../types';
import { Settings, CheckCircle2, GraduationCap, Plus, Trash2, BookOpen, Upload, Loader2, Sparkles, FileText } from 'lucide-react';
import { extractAndClassifyQuestions, processFile, extractRubricCriteria } from '../services/geminiService';

interface RubricPanelProps {
  rubric: Rubric;
  onRubricChange: (newRubric: Rubric) => void;
  examples: Example[];
  onExamplesChange: (newExamples: Example[]) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const RubricPanel: React.FC<RubricPanelProps> = ({ 
  rubric, 
  onRubricChange, 
  examples, 
  onExamplesChange,
  isOpen, 
  setIsOpen 
}) => {
  const [activeTab, setActiveTab] = useState<'rubric' | 'examples'>('rubric');
  const [newExample, setNewExample] = useState<Partial<Example>>({ type: 'Higher Order' });
  const [isExtracting, setIsExtracting] = useState(false);
  const [isExtractingRubric, setIsExtractingRubric] = useState(false);
  const [extractionMsg, setExtractionMsg] = useState<string | null>(null);
  const [rubricMsg, setRubricMsg] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const rubricFileInputRef = useRef<HTMLInputElement>(null);

  const handleAddExample = () => {
    if (newExample.content && newExample.explanation) {
      onExamplesChange([
        ...examples, 
        { 
          id: Date.now().toString(), 
          content: newExample.content,
          type: newExample.type as 'Higher Order' | 'Lower Order',
          explanation: newExample.explanation
        } as Example
      ]);
      setNewExample({ type: 'Higher Order', content: '', explanation: '' });
    }
  };

  const removeExample = (id: string) => {
    onExamplesChange(examples.filter(ex => ex.id !== id));
  };

  const handleImportRubric = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setIsExtractingRubric(true);
      setRubricMsg(null);

      try {
        const processedContent = await processFile(file);
        const criteriaText = await extractRubricCriteria(processedContent);
        
        if (criteriaText) {
          onRubricChange({ ...rubric, criteria: criteriaText });
          setRubricMsg("Criteria imported successfully!");
          setTimeout(() => setRubricMsg(null), 3000);
        } else {
          setRubricMsg("Could not identify criteria in the file.");
        }
      } catch (error) {
        console.error("Failed to import rubric:", error);
        setRubricMsg("Failed to process file.");
      } finally {
        setIsExtractingRubric(false);
        if (rubricFileInputRef.current) {
          rubricFileInputRef.current.value = '';
        }
      }
    }
  };

  const handleExtractFromFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setIsExtracting(true);
      setExtractionMsg(null);
      
      try {
        const processedContent = await processFile(file);
        // Batch extract and classify
        const extractedQuestions = await extractAndClassifyQuestions(processedContent, rubric);
        
        if (extractedQuestions.length > 0) {
          const newExamples: Example[] = extractedQuestions.map((ex, idx) => ({
            ...ex,
            id: Date.now().toString() + idx, // Unique ID generation
            type: ex.type as 'Higher Order' | 'Lower Order'
          }));
          
          onExamplesChange([...examples, ...newExamples]);
          setExtractionMsg(`Successfully imported ${newExamples.length} questions!`);
          setTimeout(() => setExtractionMsg(null), 4000);
        } else {
          setExtractionMsg("No chemistry questions found to import.");
          setTimeout(() => setExtractionMsg(null), 4000);
        }

      } catch (error) {
        console.error("Failed to extract text:", error);
        setExtractionMsg("Failed to process file. Please try again.");
        setTimeout(() => setExtractionMsg(null), 4000);
      } finally {
        setIsExtracting(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    }
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="text-sm text-science-700 font-medium flex items-center gap-2 hover:text-science-800 transition-colors"
      >
        <Settings size={16} />
        Configure AI Training
      </button>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-0 mb-6 animate-in fade-in slide-in-from-top-4 duration-300 overflow-hidden">
      
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b border-slate-100">
        <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
          <CheckCircle2 className="text-science-600" size={20} />
          Evaluation Configuration
        </h3>
        <button 
          onClick={() => setIsOpen(false)}
          className="text-sm text-slate-400 hover:text-slate-600"
        >
          Close
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-100 bg-slate-50/50">
        <button
          onClick={() => setActiveTab('rubric')}
          className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
            activeTab === 'rubric' 
              ? 'bg-white text-science-600 border-t-2 border-t-science-600 border-x border-slate-100 -mb-px rounded-t' 
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <BookOpen size={16} />
          Rubric Criteria
        </button>
        <button
          onClick={() => setActiveTab('examples')}
          className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
            activeTab === 'examples' 
              ? 'bg-white text-science-600 border-t-2 border-t-science-600 border-x border-slate-100 -mb-px rounded-t' 
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <GraduationCap size={16} />
          Train with Examples ({examples.length})
        </button>
      </div>
      
      <div className="p-6">
        {activeTab === 'rubric' ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Rubric Name</label>
              <input
                type="text"
                value={rubric.name}
                onChange={(e) => onRubricChange({ ...rubric, name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-science-500 focus:border-science-500 outline-none transition-all"
              />
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium text-slate-700">Evaluation Criteria</label>
                <button
                    onClick={() => rubricFileInputRef.current?.click()}
                    disabled={isExtractingRubric}
                    className="text-xs flex items-center gap-1.5 text-science-600 hover:text-science-700 font-medium disabled:opacity-50 px-2 py-1 rounded-md hover:bg-science-50 transition-colors border border-science-100 bg-white shadow-sm"
                    title="Upload file containing rubric table to auto-extract criteria"
                 >
                    {isExtractingRubric ? <Loader2 className="animate-spin" size={14}/> : <FileText size={14}/>}
                    {isExtractingRubric ? 'Extracting...' : 'Import Criteria from File'}
                 </button>
                 <input
                    type="file"
                    ref={rubricFileInputRef}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.txt"
                    onChange={handleImportRubric}
                 />
              </div>
              
              <p className="text-xs text-slate-500 mb-2">Define what constitutes a "Higher Order Thinking" question.</p>
              
              {rubricMsg && (
                <div className={`mb-2 text-xs px-2 py-1.5 rounded flex items-center gap-1.5 animate-in fade-in ${rubricMsg.includes('Success') ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
                    <Sparkles size={12} />
                    {rubricMsg}
                </div>
              )}

              <textarea
                value={rubric.criteria}
                onChange={(e) => onRubricChange({ ...rubric, criteria: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-science-500 focus:border-science-500 outline-none transition-all h-64 text-sm leading-relaxed"
                placeholder="Enter your rubric criteria here..."
                disabled={isExtractingRubric}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-science-50 p-4 rounded-lg border border-science-100 text-sm text-science-800">
               <strong>Few-Shot Training:</strong> Provide examples below to teach the AI exactly what you consider "Higher Order" vs "Lower Order" questions in your specific context.
            </div>

            {/* Existing Examples List */}
            <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
              {examples.map(ex => (
                <div key={ex.id} className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm relative group">
                  <div className="flex justify-between items-start mb-1">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${ex.type === 'Higher Order' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                      {ex.type}
                    </span>
                    <button onClick={() => removeExample(ex.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <p className="text-slate-800 font-medium text-sm mb-1">"{ex.content}"</p>
                  <p className="text-slate-500 text-xs italic">{ex.explanation}</p>
                </div>
              ))}
            </div>

            {/* Import Status Message */}
            {extractionMsg && (
                <div className={`text-sm px-3 py-2 rounded-lg flex items-center gap-2 animate-in fade-in ${extractionMsg.includes('Success') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    <Sparkles size={14} />
                    {extractionMsg}
                </div>
            )}

            {/* Add New Example Form */}
            <div className="border-t border-slate-100 pt-4 mt-4">
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-sm font-semibold text-slate-700">Add Training Example</h4>
                <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isExtracting}
                    className="text-xs flex items-center gap-1.5 text-science-600 hover:text-science-700 font-medium disabled:opacity-50 px-2 py-1 rounded-md hover:bg-science-50 transition-colors border border-science-100 bg-white shadow-sm"
                    title="Upload document to auto-generate multiple examples"
                 >
                    {isExtracting ? <Loader2 className="animate-spin" size={14}/> : <Upload size={14}/>}
                    {isExtracting ? 'Analyzing...' : 'Batch Import from File'}
                 </button>
                 <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.webp"
                    onChange={handleExtractFromFile}
                 />
              </div>
              <div className="space-y-3">
                <textarea 
                  placeholder="Question text..."
                  value={newExample.content || ''}
                  onChange={e => setNewExample({...newExample, content: e.target.value})}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-science-500 outline-none"
                  rows={2}
                  disabled={isExtracting}
                />
                <input 
                  type="text"
                  placeholder="Reasoning (e.g. 'Too simple because...')"
                  value={newExample.explanation || ''}
                  onChange={e => setNewExample({...newExample, explanation: e.target.value})}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-science-500 outline-none"
                  disabled={isExtracting}
                />
                <div className="flex gap-2">
                  <select 
                    value={newExample.type}
                    onChange={e => setNewExample({...newExample, type: e.target.value as any})}
                    className="px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-science-500 outline-none bg-white"
                    disabled={isExtracting}
                  >
                    <option value="Higher Order">Higher Order</option>
                    <option value="Lower Order">Lower Order</option>
                  </select>
                  <button 
                    onClick={handleAddExample}
                    disabled={!newExample.content || !newExample.explanation || isExtracting}
                    className="flex-1 bg-science-600 text-white rounded-lg text-sm font-medium hover:bg-science-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus size={16} />
                    Add Example
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RubricPanel;
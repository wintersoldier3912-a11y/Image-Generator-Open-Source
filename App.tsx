import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from './components/Button';
import { HistoryDrawer } from './components/HistoryDrawer';
import { generateImage } from './services/geminiService';
import { AspectRatio, StylePreset, GenerationSettings, HistoryItem, GeneratedImage } from './types';
import { SAMPLE_PROMPTS, STORAGE_KEY_HISTORY, MODELS, DEFAULT_MODEL_ID } from './constants';

const App: React.FC = () => {
  // State
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(AspectRatio.SQUARE);
  const [stylePreset, setStylePreset] = useState<StylePreset>(StylePreset.NONE);
  const [modelId, setModelId] = useState<string>(DEFAULT_MODEL_ID);
  
  // Advanced Settings State
  const [steps, setSteps] = useState<number>(30);
  const [guidanceScale, setGuidanceScale] = useState<number>(7.0);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0); // Progress percentage (0-100)
  const [error, setError] = useState<string | null>(null);
  
  // Model Dropdown State
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const modelDropdownRef = useRef<HTMLDivElement>(null);
  
  // Prompt Input Ref
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // History & Display
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [currentImage, setCurrentImage] = useState<GeneratedImage | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Load history on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY_HISTORY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setHistory(parsed);
        if (parsed.length > 0) {
          setCurrentImage(parsed[0]);
        }
      } catch (e) {
        console.error("Failed to load history", e);
      }
    }
  }, []);

  // Save history on change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(history));
  }, [history]);

  // Close model dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(event.target as Node)) {
        setIsModelDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    setIsGenerating(true);
    setProgress(0);
    setError(null);

    const settings: GenerationSettings = {
      prompt,
      negativePrompt,
      aspectRatio,
      stylePreset,
      modelId,
      steps,
      guidanceScale
    };

    try {
      // Pass the progress callback to the service
      const result = await generateImage(settings, (p) => setProgress(p));
      
      const newItem: HistoryItem = { ...result };
      const newHistory = [newItem, ...history];
      
      setHistory(newHistory);
      setCurrentImage(newItem);
    } catch (err: any) {
      setError(err.message || "An unknown error occurred");
      setProgress(0);
    } finally {
      setIsGenerating(false);
      // Small delay to let user see 100% before potentially resetting visually if needed
      // (though we usually just hide the progress bar when isGenerating is false)
    }
  };

  const handleDownload = (img: GeneratedImage) => {
    const link = document.createElement('a');
    link.href = `data:image/png;base64,${img.base64Data}`;
    link.download = `text2image-${img.id.slice(0, 8)}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSelectHistory = (item: HistoryItem) => {
    setCurrentImage(item);
    // Restore settings from history for easy remixing
    setPrompt(item.settings.prompt);
    setNegativePrompt(item.settings.negativePrompt);
    setAspectRatio(item.settings.aspectRatio);
    setStylePreset(item.settings.stylePreset);
    if (item.settings.modelId) {
      setModelId(item.settings.modelId);
    }
    // Restore advanced settings if available, otherwise defaults
    setSteps(item.settings.steps || 30);
    setGuidanceScale(item.settings.guidanceScale || 7.0);
    
    // On mobile, close drawer after selection
    if (window.innerWidth < 768) setIsHistoryOpen(false);
  };

  const handleDeleteHistory = (id: string) => {
    const newHistory = history.filter(h => h.id !== id);
    setHistory(newHistory);
    if (currentImage?.id === id) {
      setCurrentImage(newHistory.length > 0 ? newHistory[0] : null);
    }
  };

  const fillSamplePrompt = () => {
    const random = SAMPLE_PROMPTS[Math.floor(Math.random() * SAMPLE_PROMPTS.length)];
    setPrompt(random);
  };

  // Helper to insert special syntax at cursor position
  const insertSyntax = (type: 'blend' | 'strong' | 'weak') => {
    if (!textareaRef.current) return;
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selected = text.substring(start, end);

    let newText = '';
    let newCursorPos = 0;

    if (type === 'blend') {
      // Insert " | "
      const insertion = " | ";
      newText = text.substring(0, start) + insertion + text.substring(end);
      newCursorPos = start + insertion.length;
    } else if (type === 'strong') {
      // Wrap in ( :1.5)
      const content = selected || 'keyword';
      const insertion = `(${content}:1.5)`;
      newText = text.substring(0, start) + insertion + text.substring(end);
      newCursorPos = start + insertion.length;
    } else if (type === 'weak') {
      // Wrap in ( :0.8)
      const content = selected || 'keyword';
      const insertion = `(${content}:0.8)`;
      newText = text.substring(0, start) + insertion + text.substring(end);
      newCursorPos = start + insertion.length;
    }

    setPrompt(newText);
    
    // Reset focus and cursor
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const isBlending = prompt.includes('|');

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 font-sans flex flex-col md:flex-row">
      
      {/* Sidebar Controls */}
      <aside className="w-full md:w-96 bg-slate-800 border-r border-slate-700 flex flex-col h-auto md:h-screen overflow-y-auto z-10">
        <div className="p-6 space-y-6">
          <div className="flex items-center space-x-2 mb-2">
            <div className="h-8 w-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
              </svg>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white">text2image-open</h1>
          </div>

          {/* Custom Model Selection */}
          <div className="space-y-2" ref={modelDropdownRef}>
            <label className="text-sm font-medium text-slate-300">Model</label>
            <div className="relative">
              <button
                type="button"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-left flex justify-between items-center transition-colors hover:bg-slate-800"
                onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
              >
                <span>{MODELS.find(m => m.id === modelId)?.name || 'Select Model'}</span>
                <svg 
                  className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${isModelDropdownOpen ? 'rotate-180' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </button>
              
              {/* Dropdown Menu */}
              {isModelDropdownOpen && (
                <div className="absolute z-50 w-full mt-1 bg-slate-800 border border-slate-600 rounded-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                  {MODELS.map((m) => (
                    <div
                      key={m.id}
                      className="group px-3 py-3 hover:bg-slate-700 cursor-pointer border-b border-slate-700 last:border-0 transition-colors"
                      onClick={() => {
                        setModelId(m.id);
                        setIsModelDropdownOpen(false);
                      }}
                      title={m.description} // Native tooltip fallback
                    >
                      <div className="flex justify-between items-center">
                        <span className={`text-sm font-medium ${m.id === modelId ? 'text-indigo-400' : 'text-slate-200'}`}>
                          {m.name}
                        </span>
                        {m.id === modelId && (
                          <svg className="h-4 w-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      
                      {/* Description Tooltip/Area - visible on hover/group-hover */}
                      <div className="text-xs text-slate-400 mt-1 transition-all max-h-0 opacity-0 group-hover:max-h-20 group-hover:opacity-100 overflow-hidden">
                         {m.description}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {/* Persist selected description below for accessibility/visibility when closed */}
            {!isModelDropdownOpen && (
               <p className="text-xs text-slate-500 px-1 min-h-[1.5em]">
                 {MODELS.find(m => m.id === modelId)?.description}
               </p>
            )}
          </div>

          {/* Prompt Section */}
          <div className="space-y-2">
            <div className="flex justify-between items-center flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-slate-300">Prompt</label>
                {/* Visual Cue for Blending */}
                {isBlending && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-purple-900/40 text-purple-300 border border-purple-500/30 animate-pulse shadow-[0_0_10px_rgba(168,85,247,0.2)]">
                    <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                    BLENDING ACTIVE
                  </span>
                )}
              </div>
              
              <div className="flex space-x-3 items-center ml-auto">
                 {/* Syntax Guide Tooltip */}
                 <div className="group relative">
                    <button className="flex items-center justify-center w-5 h-5 rounded-full bg-slate-700 hover:bg-indigo-600 text-slate-300 hover:text-white transition-colors cursor-help">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                      </svg>
                    </button>
                    
                    {/* Tooltip Content */}
                    <div className="absolute right-0 bottom-full mb-3 w-80 p-4 bg-slate-800 border border-indigo-500/30 rounded-xl shadow-2xl text-xs text-slate-300 invisible group-hover:visible z-50 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none">
                      <h3 className="font-bold text-white mb-3 flex items-center gap-2 text-sm border-b border-slate-700 pb-2">
                         Prompt Engineering Syntax
                      </h3>
                      
                      <div className="space-y-4">
                        {/* Weighting Section */}
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-semibold text-indigo-400">Weighting</span>
                            <span className="font-mono text-[10px] bg-slate-900 px-1.5 py-0.5 rounded text-slate-400">(word:val)</span>
                          </div>
                          <p className="text-slate-400 mb-2 leading-relaxed">
                            Control specific keyword influence. Default is 1.0. <br/>
                            <span className="text-slate-500">Values &gt; 1 boost, &lt; 1 reduce.</span>
                          </p>
                          <div className="grid grid-cols-1 gap-2">
                            <div className="flex items-center justify-between bg-slate-900/50 p-2 rounded border border-slate-700/50">
                               <div className="flex flex-col">
                                 <code className="font-mono text-pink-300">(keyword:1.5)</code>
                                 <span className="text-[9px] text-slate-500">Strong emphasis (1.5x)</span>
                               </div>
                            </div>
                            <div className="flex items-center justify-between bg-slate-900/50 p-2 rounded border border-slate-700/50">
                               <div className="flex flex-col">
                                 <code className="font-mono text-blue-300">(keyword:0.8)</code>
                                 <span className="text-[9px] text-slate-500">Subtle/Reduced (0.8x)</span>
                               </div>
                            </div>
                          </div>
                        </div>

                        {/* Blending Section */}
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-semibold text-indigo-400">Blending</span>
                            <span className="font-mono text-[10px] bg-slate-900 px-1.5 py-0.5 rounded text-slate-400">A | B</span>
                          </div>
                          <p className="text-slate-400 mb-2">Combine multiple concepts evenly.</p>
                          <div className="bg-slate-900/50 p-2 rounded border border-slate-700/50 flex flex-col gap-1">
                            <code className="font-mono text-purple-300">cat | dog</code>
                            <span className="text-slate-500 text-[10px]">Result: A hybrid of a cat and a dog</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Tooltip arrow */}
                      <div className="absolute bottom-[-6px] right-1 w-3 h-3 bg-slate-800 border-b border-r border-indigo-500/30 transform rotate-45"></div>
                    </div>
                 </div>
                 
                 <button 
                  onClick={fillSamplePrompt} 
                  className="text-xs text-indigo-400 hover:text-indigo-300 underline decoration-indigo-400/30 underline-offset-2"
                >
                  Surprise Me
                </button>
              </div>
            </div>

            {/* Prompt Toolbar */}
            <div className="flex space-x-2 mb-1 p-1 bg-slate-900/50 rounded-lg border border-slate-700/50">
              <button 
                onClick={() => insertSyntax('blend')}
                className={`px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 border rounded text-xs text-slate-200 transition-all flex items-center gap-1.5 group ${
                  isBlending 
                    ? 'border-purple-500/50 text-purple-100 bg-purple-900/20' 
                    : 'border-slate-600 hover:border-purple-500'
                }`}
                title="Insert blend separator"
              >
                <span className="text-purple-400 font-bold group-hover:text-purple-300">|</span> 
                Blend
              </button>
              <div className="w-px bg-slate-700 mx-1"></div>
              <button 
                onClick={() => insertSyntax('strong')}
                className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded text-xs text-slate-300 transition-colors flex items-center gap-1"
                title="Emphasize selection (1.5)"
              >
                <span className="text-pink-400 font-bold">++</span> Strong
              </button>
              <button 
                onClick={() => insertSyntax('weak')}
                className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded text-xs text-slate-300 transition-colors flex items-center gap-1"
                title="De-emphasize selection (0.8)"
              >
                <span className="text-blue-400 font-bold">--</span> Weak
              </button>
            </div>

            <textarea
              ref={textareaRef}
              className={`w-full h-32 bg-slate-900 border rounded-lg p-3 text-sm focus:ring-2 outline-none resize-none font-mono transition-all duration-300 ${
                isBlending 
                  ? 'border-purple-500/60 shadow-[0_0_15px_rgba(168,85,247,0.1)] focus:ring-purple-500' 
                  : 'border-slate-700 focus:ring-indigo-500'
              }`}
              placeholder="Example: (cyberpunk:1.2) city | jungle ruins"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
          </div>

          {/* Negative Prompt */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Negative Prompt</label>
            <input
              type="text"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="blurry, bad anatomy, text, watermark..."
              value={negativePrompt}
              onChange={(e) => setNegativePrompt(e.target.value)}
            />
          </div>

          {/* Settings Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Aspect Ratio</label>
              <select
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                value={aspectRatio}
                onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}
              >
                {Object.values(AspectRatio).map((ratio) => (
                  <option key={ratio} value={ratio}>{ratio}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Style Preset</label>
              <select
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                value={stylePreset}
                onChange={(e) => setStylePreset(e.target.value as StylePreset)}
              >
                {Object.values(StylePreset).map((style) => (
                  <option key={style} value={style}>{style}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Advanced Settings Grid - Sliders */}
          <div className="grid grid-cols-2 gap-4">
             {/* Steps Slider */}
             <div className="space-y-2">
               <div className="flex justify-between items-center">
                 <label className="text-xs font-medium text-slate-400">Steps</label>
                 <span className="text-xs font-mono text-indigo-400">{steps}</span>
               </div>
               <input 
                 type="range" 
                 min="10" 
                 max="50" 
                 step="1"
                 value={steps}
                 onChange={(e) => setSteps(Number(e.target.value))}
                 className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
               />
             </div>

             {/* Guidance Scale Slider */}
             <div className="space-y-2">
               <div className="flex justify-between items-center">
                 <label className="text-xs font-medium text-slate-400">Guidance</label>
                 <span className="text-xs font-mono text-indigo-400">{guidanceScale.toFixed(1)}</span>
               </div>
               <input 
                 type="range" 
                 min="1" 
                 max="20" 
                 step="0.5"
                 value={guidanceScale}
                 onChange={(e) => setGuidanceScale(Number(e.target.value))}
                 className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
               />
             </div>
          </div>

          {/* Generate Button */}
          <Button 
            onClick={handleGenerate} 
            disabled={!prompt.trim()} 
            isLoading={isGenerating}
            className="w-full py-3 text-lg shadow-lg shadow-indigo-500/20"
          >
            {isGenerating ? `Generating ${progress}%` : 'Generate Image'}
          </Button>

          {error && (
            <div className="p-3 bg-red-900/50 border border-red-700 rounded-lg text-xs text-red-200">
              {error}
            </div>
          )}
          
          <div className="pt-4 border-t border-slate-700">
             <Button variant="secondary" className="w-full" onClick={() => setIsHistoryOpen(true)}>
                View History ({history.length})
             </Button>
          </div>
        </div>
        
        <div className="mt-auto p-4 text-xs text-slate-500 text-center">
          Open-source React Interface • Powered by Gemini
        </div>
      </aside>

      {/* Main Canvas Area */}
      <main className="flex-1 bg-slate-950 relative flex flex-col h-[60vh] md:h-screen">
        
        {/* Progress Bar Overlay - Visible during generation */}
        {isGenerating && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="w-64 space-y-3">
              <div className="flex justify-between text-xs font-mono text-indigo-300">
                <span>GENERATING</span>
                <span>{progress}%</span>
              </div>
              <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                <div 
                  className="h-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)] transition-all duration-300 ease-out relative"
                  style={{ width: `${progress}%` }}
                >
                  <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                </div>
              </div>
              <p className="text-center text-slate-400 text-xs mt-2">
                Creating your masterpiece...
              </p>
            </div>
          </div>
        )}

        <div className="flex-1 flex items-center justify-center p-4 md:p-8 overflow-auto">
          {currentImage ? (
            <div className="relative group max-w-full max-h-full flex flex-col items-center">
               <img 
                 src={`data:image/png;base64,${currentImage.base64Data}`}
                 alt={currentImage.settings.prompt}
                 className="max-w-full max-h-[85vh] rounded-lg shadow-2xl border border-slate-800"
               />
               {/* Overlay Controls */}
               <div className="absolute top-4 right-4 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                 <Button size="sm" variant="secondary" onClick={() => handleDownload(currentImage)}>
                   Download PNG
                 </Button>
               </div>
               {/* Metadata display */}
               <div className="absolute bottom-0 left-0 right-0 bg-black/70 backdrop-blur-sm p-4 text-white rounded-b-lg opacity-0 group-hover:opacity-100 transition-opacity text-left">
                  <p className="text-sm font-medium truncate">{currentImage.settings.prompt}</p>
                  <p className="text-xs text-slate-400 mt-1">
                    {currentImage.settings.stylePreset} • {currentImage.settings.aspectRatio} • {MODELS.find(m => m.id === currentImage.model)?.name || currentImage.model}
                  </p>
               </div>
            </div>
          ) : (
            <div className="text-center text-slate-600">
              <div className="inline-block p-6 rounded-full bg-slate-900 mb-4 border border-slate-800 border-dashed">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-lg font-medium">Ready to Create</p>
              <p className="text-sm mt-1">Enter a prompt in the sidebar to begin</p>
            </div>
          )}
        </div>
      </main>

      {/* History Drawer */}
      <HistoryDrawer 
        history={history}
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        onSelect={handleSelectHistory}
        onDelete={handleDeleteHistory}
      />
    </div>
  );
};

export default App;
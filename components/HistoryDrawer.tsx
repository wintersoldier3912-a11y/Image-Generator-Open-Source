import React from 'react';
import { HistoryItem } from '../types';

interface HistoryDrawerProps {
  history: HistoryItem[];
  isOpen: boolean;
  onSelect: (item: HistoryItem) => void;
  onClose: () => void;
  onDelete: (id: string) => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({ 
  history, 
  isOpen, 
  onSelect,
  onClose,
  onDelete
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-80 bg-slate-900 border-l border-slate-700 transform transition-transform duration-300 ease-in-out shadow-2xl flex flex-col">
      <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800">
        <h2 className="text-lg font-semibold text-white">History ({history.length})</h2>
        <button onClick={onClose} className="text-slate-400 hover:text-white">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {history.length === 0 ? (
          <div className="text-center text-slate-500 mt-10">
            <p>No generations yet.</p>
          </div>
        ) : (
          history.map((item) => (
            <div key={item.id} className="group relative bg-slate-800 rounded-lg overflow-hidden border border-slate-700 hover:border-indigo-500 transition-colors">
              <div 
                className="aspect-square w-full cursor-pointer bg-slate-900"
                onClick={() => onSelect(item)}
              >
                <img 
                  src={`data:image/png;base64,${item.base64Data}`} 
                  alt={item.settings.prompt}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-2 text-xs text-slate-400">
                <p className="truncate font-medium text-slate-300">{item.settings.prompt}</p>
                <div className="flex justify-between items-center mt-1">
                  <span>{new Date(item.timestamp).toLocaleTimeString()}</span>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(item.id);
                    }}
                    className="text-red-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Delete"
                  >
                   Trash
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
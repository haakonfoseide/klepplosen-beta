
import React, { createContext, useContext, useState, useCallback } from 'react';
import { ToastMessage } from '../types';
import { X, Check, AlertCircle, Info, AlertTriangle } from 'lucide-react';

interface ToastContextType {
  addToast: (message: string, type?: ToastMessage['type']) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((message: string, type: ToastMessage['type'] = 'info') => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
    
    // Auto-remove after 4 seconds
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-2 pointer-events-none items-end">
        {toasts.map((toast) => (
          <div 
            key={toast.id}
            className={`pointer-events-auto flex items-center gap-3 pl-4 pr-3 py-3 rounded-[1.2rem] shadow-[0_8px_30px_rgb(0,0,0,0.12)] border animate-in slide-in-from-right-10 fade-in zoom-in-95 duration-300 max-w-sm backdrop-blur-md transition-all ${
              toast.type === 'success' ? 'bg-white/95 border-emerald-100 text-slate-800' :
              toast.type === 'error' ? 'bg-white/95 border-red-100 text-slate-800' :
              toast.type === 'warning' ? 'bg-white/95 border-amber-100 text-slate-800' :
              'bg-slate-900/95 border-slate-800 text-white'
            }`}
          >
            <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                toast.type === 'success' ? 'bg-emerald-500 text-white' :
                toast.type === 'error' ? 'bg-red-500 text-white' :
                toast.type === 'warning' ? 'bg-amber-500 text-white' :
                'bg-slate-700 text-slate-300'
            }`}>
                {toast.type === 'success' ? <Check size={14} strokeWidth={3} /> :
                 toast.type === 'error' ? <AlertCircle size={14} strokeWidth={3} /> :
                 toast.type === 'warning' ? <AlertTriangle size={14} strokeWidth={3} /> :
                 <Info size={14} strokeWidth={3} />}
            </div>
            
            <p className="text-xs font-bold leading-tight mr-2">{toast.message}</p>
            
            <button 
                onClick={() => removeToast(toast.id)} 
                className={`p-1 rounded-full transition-colors ${
                    toast.type === 'info' ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-slate-100 text-slate-400'
                }`}
            >
                <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

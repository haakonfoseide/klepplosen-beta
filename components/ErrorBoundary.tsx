import React, { ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 text-center">
          <div className="bg-white p-10 rounded-[3rem] shadow-2xl border-4 border-red-50 max-w-md w-full">
            <div className="w-20 h-20 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle size={40} />
            </div>
            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-2">Oisann!</h1>
            <p className="text-slate-500 font-medium mb-6">Noe gikk galt i maskinrommet. Kai jobber med saken.</p>
            
            {this.state.error && (
                <div className="bg-red-50 p-4 rounded-xl text-left mb-6 overflow-hidden">
                    <p className="text-[10px] font-mono text-red-800 break-words">{this.state.error.toString()}</p>
                </div>
            )}

            <button 
              onClick={() => window.location.reload()} 
              className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-indigo-600 transition-all active:scale-95"
            >
              <RefreshCw size={16} /> Last på nytt
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

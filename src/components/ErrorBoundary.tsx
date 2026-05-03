import { Component, ErrorInfo, ReactNode } from 'react';
import { ShieldAlert } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      let errorMessage = this.state.error?.message || 'Unknown error';
      try {
        const parsed = JSON.parse(errorMessage);
        if (parsed.error) {
          errorMessage = parsed.error;
        }
      } catch (e) {
        // Not JSON, keep as is
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-cp-darker text-cp-cyan p-4 font-display">
          <div className="cp-border p-8 max-w-2xl w-full bg-black/80">
            <div className="flex items-center gap-4 mb-6 text-cp-red">
              <ShieldAlert className="w-12 h-12" />
              <h1 className="text-3xl font-bold uppercase tracking-widest">System Failure</h1>
            </div>
            <div className="bg-cp-red/10 border border-cp-red p-4 mb-6 font-mono text-sm text-cp-red whitespace-pre-wrap">
              {errorMessage}
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="cp-button px-6 py-3 w-full font-bold uppercase tracking-wider"
            >
              Reboot System
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

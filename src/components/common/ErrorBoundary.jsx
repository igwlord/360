import React, { Component } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4">
          <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
            <div className="mx-auto w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
              <AlertTriangle className="text-red-500 w-8 h-8" />
            </div>
            
            <h2 className="text-2xl font-bold text-white mb-2">Algo salió mal</h2>
            <p className="text-white/60 mb-6">
              Ha ocurrido un error inesperado en la aplicación. Hemos registrado el incidente.
            </p>

            {this.state.error && (
                <div className="bg-black/50 p-4 rounded-lg mb-6 text-left overflow-auto max-h-40">
                    <code className="text-red-400 text-xs font-mono">
                        {this.state.error.toString()}
                    </code>
                </div>
            )}

            <button 
              onClick={this.handleReload}
              className="w-full py-3 px-4 bg-[#E8A631] hover:bg-[#d69625] text-black font-bold rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <RefreshCw size={18} />
              Recargar Aplicación
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

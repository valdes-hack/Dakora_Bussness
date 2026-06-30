import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an uncaught exception:", error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 dark:bg-neutral-950 flex items-center justify-center p-6 transition-colors duration-300">
          <div className="max-w-md w-full bg-white dark:bg-neutral-900 border border-black/5 dark:border-white/5 shadow-2xl rounded-[2.5rem] p-8 text-center space-y-6 animate-in zoom-in-95 duration-300">
            <div className="w-20 h-20 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto text-4xl animate-bounce">
              ⚠️
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase italic tracking-tighter">
                Une petite erreur est survenue
              </h2>
              <p className="text-gray-500 dark:text-gray-400 text-xs font-medium leading-relaxed">
                Pas de panique ! L'application a rencontré un problème inattendu lors de cette action. Nous avons sécurisé la page pour éviter un écran blanc.
              </p>
            </div>

            {this.state.error && (
              <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-black/5 dark:border-white/5 text-left overflow-x-auto max-h-32 custom-scrollbar">
                <p className="text-[10px] font-mono text-red-500 dark:text-red-400 font-bold whitespace-pre-wrap">
                  {this.state.error.toString()}
                </p>
              </div>
            )}

            <div className="flex gap-4">
              <button 
                onClick={() => { window.location.href = '/'; }}
                className="flex-1 py-3 bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 font-bold uppercase tracking-wider text-[10px] md:text-xs rounded-2xl hover:bg-gray-200 dark:hover:bg-white/20 transition-all active:scale-95"
              >
                Accueil
              </button>
              <button 
                onClick={this.handleReload}
                className="flex-1 py-3 bg-dakora-green text-white font-black uppercase tracking-wider text-[10px] md:text-xs rounded-2xl hover:bg-green-700 shadow-lg shadow-dakora-green/20 transition-all active:scale-95"
              >
                Recharger la page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

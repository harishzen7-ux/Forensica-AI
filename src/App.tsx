import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowLeft, Moon, Sun } from 'lucide-react';
import { LaunchAnimation } from './components/LaunchAnimation';
import { useForensica } from './hooks/useForensica';
import { DetectView } from './views/DetectView';
import { EvolutionView } from './views/EvolutionView';
import { HomeView } from './views/HomeView';
import { SelectionView } from './views/SelectionView';
import { SpecsView } from './views/SpecsView';

export default function App() {
  const {
    currentPage,
    selectedModality,
    result,
    isAnalyzing,
    file,
    previewUrl,
    textInput,
    stats,
    history,
    feedbackSubmitted,
    analysisError,
    backendConnected,
    navigate,
    handleFileChange,
    handleAnalyze,
    handleFeedback,
    handleClearHistory,
    resetAnalysis,
    setFile,
    setPreviewUrl,
    setTextInput,
  } = useForensica();

  const [showLaunch, setShowLaunch] = React.useState(true);
  const [theme, setTheme] = React.useState<'dark' | 'light'>('dark');

  React.useEffect(() => {
    document.documentElement.className = theme;
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <div className={`min-h-screen flex flex-col ${theme}`}>
      <AnimatePresence>
        {showLaunch ? (
          <LaunchAnimation key="launch" onComplete={() => setShowLaunch(false)} />
        ) : (
          <motion.div
            key="main-content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.2, ease: 'easeInOut' }}
            className="flex-1 flex flex-col"
          >
            <div
              className={`h-12 border-b border-white/5 flex items-center justify-between px-6 text-[10px] font-display uppercase tracking-[0.2em] ${theme === 'light' ? 'bg-black text-white' : 'bg-black/40 text-cloud/30'
                }`}
            >
              <div className="flex items-center gap-4">
                <motion.div
                  className="flex items-center gap-3 cursor-pointer group relative px-3 py-1 rounded-lg transition-colors hover:bg-white/5"
                  onClick={() => navigate('home')}
                  whileHover="hover"
                  initial="initial"
                >
                  <div className="flex items-center overflow-hidden whitespace-nowrap relative z-10">
                    <span className="text-sm font-bold tracking-tight text-white normal-case font-display hidden sm:inline">
                      Forensica AI
                    </span>
                    {currentPage === 'home' && (
                      <motion.span
                        initial={{ opacity: 0, x: -5 }}
                        animate={{ opacity: 0.4, x: 0 }}
                        className="text-[9px] font-display tracking-widest uppercase hidden sm:inline-block ml-3"
                      >
                        • Verified Truth
                      </motion.span>
                    )}
                  </div>
                </motion.div>

                {currentPage !== 'home' && (
                  <motion.button
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    whileHover={{ x: -4 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate('home')}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all group relative overflow-hidden"
                    title="Back to Home"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-accent/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <ArrowLeft className="w-3.5 h-3.5 relative z-10" />
                    <span className="text-[10px] font-display font-bold uppercase tracking-[0.2em] relative z-10">Return</span>
                  </motion.button>
                )}
              </div>

              <div className="flex items-center gap-6 font-display">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase tracking-wider">Status:</span>
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${backendConnected ? 'text-success' : 'text-error'}`}>
                    {backendConnected ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <button
                  onClick={toggleTheme}
                  className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-white/60 hover:text-white"
                  title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                >
                  {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                </button>
                <span className="hidden sm:inline">Core: Neural engine v4</span>
                <span>{new Date().toLocaleDateString()}</span>
              </div>
            </div>

            <header className="p-6 flex justify-end items-center h-20" />

            <main className="flex-1 flex flex-col items-center justify-center px-6 max-w-6xl mx-auto w-full">
              <AnimatePresence mode="wait">
                {currentPage === 'home' && (
                  <HomeView onNavigate={navigate} stats={stats} history={history} onClearHistory={handleClearHistory} />
                )}

                {currentPage === 'specs' && <SpecsView onNavigate={navigate} />}

                {currentPage === 'selection' && <SelectionView onNavigate={navigate} />}

                {currentPage === 'evolution' && <EvolutionView onNavigate={navigate} stats={stats} />}

                {currentPage === 'detect' && selectedModality && (
                  <DetectView
                    selectedModality={selectedModality}
                    onNavigate={navigate}
                    isAnalyzing={isAnalyzing}
                    result={result}
                    textInput={textInput}
                    setTextInput={setTextInput}
                    file={file}
                    setFile={setFile}
                    previewUrl={previewUrl}
                    setPreviewUrl={setPreviewUrl}
                    handleFileChange={handleFileChange}
                    handleAnalyze={handleAnalyze}
                    handleFeedback={handleFeedback}
                    feedbackSubmitted={feedbackSubmitted}
                    resetAnalysis={resetAnalysis}
                    analysisError={analysisError}
                  />
                )}
              </AnimatePresence>
            </main>

            <footer className="p-8 text-center text-text-muted text-xs font-display tracking-widest uppercase">
              © 2026 Verified Truth • Version 4.2
              <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 pointer-events-none opacity-85">
                Author: Harish
              </div>
            </footer>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

import { createContext, useContext, useState, ReactNode } from 'react';
import type { Module, SubView } from '@/types/qms';

interface ModuleContextType {
  activeModule: Module;
  setActiveModule: (module: Module) => void;
  activeView: SubView;
  setActiveView: (view: SubView) => void;
  showRNCForm: boolean;
  setShowRNCForm: (show: boolean) => void;
  showRiskForm: boolean;
  setShowRiskForm: (show: boolean) => void;
}

const ModuleContext = createContext<ModuleContextType | null>(null);

export function ModuleProvider({ children }: { children: ReactNode }) {
  const [activeModule, setActiveModule] = useState<Module>('rnc');
  const [activeView, setActiveView] = useState<SubView>('inicio');
  const [showRNCForm, setShowRNCForm] = useState(false);
  const [showRiskForm, setShowRiskForm] = useState(false);

  return (
    <ModuleContext.Provider value={{
      activeModule, setActiveModule,
      activeView, setActiveView,
      showRNCForm, setShowRNCForm,
      showRiskForm, setShowRiskForm,
    }}>
      {children}
    </ModuleContext.Provider>
  );
}

export function useModule() {
  const ctx = useContext(ModuleContext);
  if (!ctx) throw new Error('useModule must be used within ModuleProvider');
  return ctx;
}

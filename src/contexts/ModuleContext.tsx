import { createContext, useContext, useState, ReactNode } from 'react';
import type { FilterValues } from '@/components/filters/FilterSidebar';

export type Module = 'rnc' | 'risk';
export type SubView = 'inicio' | 'consultas' | 'visao-geral';

export interface RNCPreFill {
  occurrence_type?: 'real' | 'oportunidade';
  origin?: string;
  subject?: string;
  description?: string;
  sourceRiskId?: string;
  sourceRNCId?: string;
}

interface ModuleContextType {
  activeModule: Module;
  setActiveModule: (module: Module) => void;
  activeView: SubView;
  setActiveView: (view: SubView) => void;
  showRNCForm: boolean;
  setShowRNCForm: (show: boolean) => void;
  showRiskForm: boolean;
  setShowRiskForm: (show: boolean) => void;
  selectedRNCId: string | null;
  setSelectedRNCId: (id: string | null) => void;
  selectedRiskId: string | null;
  setSelectedRiskId: (id: string | null) => void;
  showAdminPanel: boolean;
  setShowAdminPanel: (show: boolean) => void;
  rncPreFill: RNCPreFill | null;
  setRncPreFill: (preFill: RNCPreFill | null) => void;
  
  // Persistent filter states for Consultas screens
  rncFilters: FilterValues;
  setRncFilters: (filters: FilterValues | ((prev: FilterValues) => FilterValues)) => void;
  rncSearch: string;
  setRncSearch: (search: string) => void;
  riskFilters: FilterValues;
  setRiskFilters: (filters: FilterValues | ((prev: FilterValues) => FilterValues)) => void;
  riskSearch: string;
  setRiskSearch: (search: string) => void;
}

const ModuleContext = createContext<ModuleContextType | null>(null);

export function ModuleProvider({ children }: { children: ReactNode }) {
  const [activeModule, setActiveModule] = useState<Module>('rnc');
  const [activeView, setActiveView] = useState<SubView>('inicio');
  const [showRNCForm, setShowRNCForm] = useState(false);
  const [showRiskForm, setShowRiskForm] = useState(false);
  const [selectedRNCId, setSelectedRNCId] = useState<string | null>(null);
  const [selectedRiskId, setSelectedRiskId] = useState<string | null>(null);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [rncPreFill, setRncPreFill] = useState<RNCPreFill | null>(null);

  // Default persistent filter values
  const [rncFilters, setRncFilters] = useState<FilterValues>({
    dateFrom: '',
    dateTo: '',
    company: 'all',
    companyType: 'all',
    sector: 'all',
    status: 'all',
    deadlineStatus: 'all',
    occurrenceCategory: 'all',
    origin: 'all',
  });
  const [rncSearch, setRncSearch] = useState('');

  const [riskFilters, setRiskFilters] = useState<FilterValues>({
    dateFrom: '',
    dateTo: '',
    company: 'all',
    companyType: 'all',
    sector: 'all',
    status: 'all',
  });
  const [riskSearch, setRiskSearch] = useState('');

  return (
    <ModuleContext.Provider value={{
      activeModule, setActiveModule,
      activeView, setActiveView,
      showRNCForm, setShowRNCForm,
      showRiskForm, setShowRiskForm,
      selectedRNCId, setSelectedRNCId,
      selectedRiskId, setSelectedRiskId,
      showAdminPanel, setShowAdminPanel,
      rncPreFill, setRncPreFill,
      
      rncFilters, setRncFilters,
      rncSearch, setRncSearch,
      riskFilters, setRiskFilters,
      riskSearch, setRiskSearch,
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

import { Home, Search, BarChart3, Plus } from 'lucide-react';
import { useModule, SubView } from '@/contexts/ModuleContext';
import { Button } from '@/components/ui/button';

const views: { key: SubView; label: string; icon: typeof Home }[] = [
  { key: 'inicio', label: 'Início', icon: Home },
  { key: 'consultas', label: 'Consultas', icon: Search },
  { key: 'visao-geral', label: 'Visão Geral', icon: BarChart3 },
];

export default function SubNav() {
  const { activeModule, activeView, setActiveView, setShowRNCForm, setShowRiskForm, showAdminPanel, setSelectedRNCId, setShowAdminPanel } = useModule();

  if (showAdminPanel) return null;

  const handleViewChange = (view: SubView) => {
    setActiveView(view);
    setSelectedRNCId(null);
    setShowAdminPanel(false);
  };

  const handleNew = () => {
    if (activeModule === 'rnc') setShowRNCForm(true);
    else setShowRiskForm(true);
  };

  return (
    <div className={`border-b ${activeModule === 'rnc' ? 'border-rnc/20' : 'border-risk/20'}`}>
      <div className="flex items-center justify-between px-6 h-12">
        <nav className="flex gap-1">
          {views.map((v) => {
            const Icon = v.icon;
            return (
              <button
                key={v.key}
                onClick={() => handleViewChange(v.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  activeView === v.key
                    ? 'bg-accent text-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                }`}
              >
                <Icon className="h-4 w-4" />
                {v.label}
              </button>
            );
          })}
        </nav>
        <Button size="sm" onClick={handleNew} className="gap-1.5">
          <Plus className="h-4 w-4" />
          {activeModule === 'rnc' ? 'Nova Ocorrência' : 'Novo Risco'}
        </Button>
      </div>
    </div>
  );
}

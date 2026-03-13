import { Bell, User, Shield } from 'lucide-react';
import { useModule } from '@/contexts/ModuleContext';
import { Button } from '@/components/ui/button';
import type { Module } from '@/types/qms';

const modules: { key: Module; label: string }[] = [
  { key: 'rnc', label: 'RNC' },
  { key: 'risk', label: 'Gestão de Riscos' },
];

export default function TopNav() {
  const { activeModule, setActiveModule, setActiveView } = useModule();

  const handleModuleChange = (mod: Module) => {
    setActiveModule(mod);
    setActiveView('inicio');
  };

  return (
    <header className="border-b bg-card">
      <div className="flex items-center justify-between px-6 h-14">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <span className="font-semibold text-lg text-foreground">SGQ</span>
          </div>
          <nav className="flex gap-1">
            {modules.map((mod) => (
              <button
                key={mod.key}
                onClick={() => handleModuleChange(mod.key)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeModule === mod.key
                    ? mod.key === 'rnc'
                      ? 'bg-rnc text-rnc-foreground'
                      : 'bg-risk text-risk-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                }`}
              >
                {mod.label}
              </button>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-destructive text-destructive-foreground text-[10px] flex items-center justify-center font-medium">3</span>
          </Button>
          <Button variant="ghost" size="icon">
            <User className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}

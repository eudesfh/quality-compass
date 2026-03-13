import { Bell, User, Shield, Settings, LogOut } from 'lucide-react';
import { useModule, Module } from '@/contexts/ModuleContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const modules: { key: Module; label: string }[] = [
  { key: 'rnc', label: 'RNC' },
  { key: 'risk', label: 'Gestão de Riscos' },
];

export default function TopNav() {
  const { activeModule, setActiveModule, setActiveView, setShowAdminPanel } = useModule();
  const { profile, isAdmin, signOut } = useAuth();

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['notifications-count'],
    queryFn: async () => {
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('is_read', false);
      return count || 0;
    },
    refetchInterval: 30000,
  });

  const handleModuleChange = (mod: Module) => {
    setActiveModule(mod);
    setActiveView('inicio');
  };

  return (
    <header className="border-b bg-card">
      <div className="flex items-center justify-between px-6 h-14">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => { setActiveView('inicio'); setShowAdminPanel(false); }}>
            <Shield className="h-6 w-6 text-primary" />
            <span className="font-semibold text-lg text-foreground">SGQ</span>
          </div>
          <nav className="flex gap-1">
            {modules.map((mod) => (
              <button
                key={mod.key}
                onClick={() => { handleModuleChange(mod.key); setShowAdminPanel(false); }}
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
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-destructive text-destructive-foreground text-[10px] flex items-center justify-center font-medium">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <User className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-3 py-2">
                <p className="text-sm font-medium">{profile?.full_name}</p>
                <p className="text-xs text-muted-foreground">{profile?.email}</p>
              </div>
              <DropdownMenuSeparator />
              {isAdmin && (
                <DropdownMenuItem onClick={() => setShowAdminPanel(true)}>
                  <Settings className="h-4 w-4 mr-2" />
                  Administração
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={signOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

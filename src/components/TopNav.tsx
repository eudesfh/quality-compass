import { Bell, User, Shield, Settings, LogOut, KeyRound } from 'lucide-react';
import { useModule, Module } from '@/contexts/ModuleContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useState } from 'react';
import ChangePasswordDialog from '@/components/auth/ChangePasswordDialog';

const modules: { key: Module; label: string }[] = [
  { key: 'rnc', label: 'RNC' },
  { key: 'risk', label: 'Gestão de Riscos' },
];

export default function TopNav() {
  const { activeModule, setActiveModule, setActiveView, setShowAdminPanel, setSelectedRNCId, setSelectedRiskId } = useModule();
  const { user, profile, isAdmin, signOut } = useAuth();
  const queryClient = useQueryClient();
  const [notifOpen, setNotifOpen] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);
      return data || [];
    },
    refetchInterval: 30000,
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handleModuleChange = (mod: Module) => {
    setActiveModule(mod);
    setActiveView('inicio');
    setSelectedRNCId(null);
    setSelectedRiskId(null);
    setShowAdminPanel(false);
  };

  const handleNavClick = (view: 'inicio') => {
    setActiveView(view);
    setSelectedRNCId(null);
    setSelectedRiskId(null);
    setShowAdminPanel(false);
  };

  const markAsRead = async (id: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
  };

  const markAllRead = async () => {
    const unread = notifications.filter(n => !n.is_read);
    if (unread.length === 0) return;
    await Promise.all(unread.map(n => supabase.from('notifications').update({ is_read: true }).eq('id', n.id)));
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
  };

  const handleNotificationClick = async (n: any) => {
    await markAsRead(n.id);
    setNotifOpen(false);
    if (n.reference_type === 'rnc' && n.reference_id) {
      setActiveModule('rnc');
      setActiveView('inicio');
      setShowAdminPanel(false);
      setSelectedRiskId(null);
      setSelectedRNCId(n.reference_id);
    } else if (n.reference_type === 'risk' && n.reference_id) {
      setActiveModule('risk');
      setActiveView('inicio');
      setShowAdminPanel(false);
      setSelectedRNCId(null);
      setSelectedRiskId(n.reference_id);
    }
  };

  return (
    <header className="border-b bg-card">
      <div className="flex items-center justify-between px-6 h-14">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => handleNavClick('inicio')}>
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
          <Popover open={notifOpen} onOpenChange={setNotifOpen}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-destructive text-destructive-foreground text-[10px] flex items-center justify-center font-medium">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 p-0">
              <div className="flex items-center justify-between px-4 py-3 border-b">
                <h3 className="text-sm font-semibold">Notificações</h3>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="text-xs text-primary hover:underline">Marcar todas como lidas</button>
                )}
              </div>
              <ScrollArea className="h-96">
                {notifications.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">Nenhuma notificação</p>
                ) : (
                  <div className="divide-y">
                    {notifications.map(n => (
                      <button
                        key={n.id}
                        onClick={() => handleNotificationClick(n)}
                        className={`w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors ${
                          !n.is_read
                            ? 'bg-primary/5 border-l-2 border-l-primary'
                            : 'opacity-60'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          {!n.is_read && (
                            <span className="mt-1.5 h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm ${!n.is_read ? 'font-semibold text-foreground' : 'font-normal text-muted-foreground'}`}>{n.title}</p>
                            <p className={`text-xs mt-0.5 line-clamp-2 ${!n.is_read ? 'text-foreground/80' : 'text-muted-foreground'}`}>{n.message}</p>
                            <p className="text-xs text-muted-foreground mt-1">{new Date(n.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </PopoverContent>
          </Popover>
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
              <DropdownMenuItem onSelect={(event) => { event.preventDefault(); setChangePasswordOpen(true); }}>
                <KeyRound className="h-4 w-4 mr-2" />
                Alterar senha
              </DropdownMenuItem>
              {isAdmin && (
                <DropdownMenuItem onClick={() => { setShowAdminPanel(true); setSelectedRNCId(null); setSelectedRiskId(null); }}>
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
          <ChangePasswordDialog
            open={changePasswordOpen}
            onOpenChange={setChangePasswordOpen}
            userEmail={profile?.email || user?.email}
          />
        </div>
      </div>
    </header>
  );
}

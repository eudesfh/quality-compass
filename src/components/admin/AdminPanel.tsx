import { useState } from 'react';
import { ArrowLeft, Users, Building2, Layers, Shield } from 'lucide-react';
import { useModule } from '@/contexts/ModuleContext';
import UsersTab from './UsersTab';
import CompaniesTab from './CompaniesTab';
import SectorsTab from './SectorsTab';
import ProfilesTab from './ProfilesTab';

type Tab = 'users' | 'companies' | 'sectors' | 'profiles';

export default function AdminPanel() {
  const { setShowAdminPanel } = useModule();
  const [tab, setTab] = useState<Tab>('users');

  const tabs: { key: Tab; label: string; icon: any }[] = [
    { key: 'users', label: 'Usuários', icon: Users },
    { key: 'companies', label: 'Empresas', icon: Building2 },
    { key: 'sectors', label: 'Setores', icon: Layers },
    { key: 'profiles', label: 'Perfis', icon: Shield },
  ];

  return (
    <div className="p-6 animate-fade-in">
      <button onClick={() => setShowAdminPanel(false)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4" /> Voltar
      </button>
      <h1 className="text-xl font-semibold text-foreground mb-6">Administração</h1>
      <div className="flex gap-2 mb-6">
        {tabs.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-md transition-colors ${tab === t.key ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'}`}>
              <Icon className="h-4 w-4" />{t.label}
            </button>
          );
        })}
      </div>
      {tab === 'users' && <UsersTab />}
      {tab === 'companies' && <CompaniesTab />}
      {tab === 'sectors' && <SectorsTab />}
      {tab === 'profiles' && <ProfilesTab />}
    </div>
  );
}

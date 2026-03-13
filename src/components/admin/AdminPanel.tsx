import { useState } from 'react';
import { ArrowLeft, Plus, Users, Building2, Layers, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useModule } from '@/contexts/ModuleContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

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

function UsersTab() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [sectorId, setSectorId] = useState('');
  const [profileId, setProfileId] = useState('');
  const [isAdminRole, setIsAdminRole] = useState(false);
  const [loading, setLoading] = useState(false);

  const { data: users = [] } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('*, companies(name), sectors(name), permission_profiles(name)');
      return data || [];
    },
  });
  const { data: companies = [] } = useQuery({ queryKey: ['companies'], queryFn: async () => { const { data } = await supabase.from('companies').select('*'); return data || []; } });
  const { data: sectors = [] } = useQuery({ queryKey: ['sectors'], queryFn: async () => { const { data } = await supabase.from('sectors').select('*'); return data || []; } });
  const { data: permProfiles = [] } = useQuery({ queryKey: ['permission-profiles'], queryFn: async () => { const { data } = await supabase.from('permission_profiles').select('*'); return data || []; } });

  const handleCreate = async () => {
    if (!email || !fullName) { toast.error('Preencha nome e e-mail'); return; }
    setLoading(true);
    try {
      // Create user via admin invite (sends email with password reset)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email, password: Math.random().toString(36).slice(-12) + 'A1!',
        options: { data: { full_name: fullName }, emailRedirectTo: window.location.origin },
      });
      if (authError) throw authError;
      if (authData.user) {
        // Update profile
        await supabase.from('profiles').update({
          full_name: fullName, company_id: companyId || null,
          sector_id: sectorId || null, permission_profile_id: profileId || null,
        }).eq('user_id', authData.user.id);
        if (isAdminRole) {
          await supabase.from('user_roles').insert({ user_id: authData.user.id, role: 'admin' });
        }
      }
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Usuário criado! Um e-mail foi enviado para definir a senha.');
      setShowForm(false);
      setEmail(''); setFullName(''); setCompanyId(''); setSectorId(''); setProfileId(''); setIsAdminRole(false);
    } catch (error: any) {
      toast.error(error.message);
    } finally { setLoading(false); }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-medium">Usuários Cadastrados</h2>
        <Button size="sm" onClick={() => setShowForm(!showForm)}><Plus className="h-4 w-4 mr-1" />Novo Usuário</Button>
      </div>
      {showForm && (
        <Card className="mb-4">
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Nome Completo *</Label><Input value={fullName} onChange={e => setFullName(e.target.value)} /></div>
              <div className="space-y-2"><Label>E-mail *</Label><Input type="email" value={email} onChange={e => setEmail(e.target.value)} /></div>
              <div className="space-y-2"><Label>Empresa</Label>
                <Select value={companyId} onValueChange={setCompanyId}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{companies.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label>Setor</Label>
                <Select value={sectorId} onValueChange={setSectorId}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{sectors.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label>Perfil de Permissão</Label>
                <Select value={profileId} onValueChange={setProfileId}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{permProfiles.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent></Select></div>
              <div className="flex items-center gap-2 pt-6"><Checkbox checked={isAdminRole} onCheckedChange={c => setIsAdminRole(!!c)} /><Label>Admin do Sistema</Label></div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button onClick={handleCreate} disabled={loading}>{loading ? 'Criando...' : 'Criar Usuário'}</Button>
            </div>
          </CardContent>
        </Card>
      )}
      <div className="bg-card border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b bg-muted/50">
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Nome</th>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">E-mail</th>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Empresa</th>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Setor</th>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Perfil</th>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
          </tr></thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="border-b last:border-0 hover:bg-muted/30">
                <td className="px-4 py-3 font-medium">{u.full_name}</td>
                <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                <td className="px-4 py-3 text-muted-foreground">{(u.companies as any)?.name || '—'}</td>
                <td className="px-4 py-3 text-muted-foreground">{(u.sectors as any)?.name || '—'}</td>
                <td className="px-4 py-3 text-muted-foreground">{(u.permission_profiles as any)?.name || '—'}</td>
                <td className="px-4 py-3"><Badge variant={u.is_active ? 'secondary' : 'outline'} className="text-xs">{u.is_active ? 'Ativo' : 'Inativo'}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CompaniesTab() {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [type, setType] = useState<'obra' | 'escritorio'>('escritorio');
  const { data: companies = [] } = useQuery({ queryKey: ['companies'], queryFn: async () => { const { data } = await supabase.from('companies').select('*'); return data || []; } });

  const handleAdd = async () => {
    if (!name) return;
    const { error } = await supabase.from('companies').insert({ name, type });
    if (error) { toast.error(error.message); return; }
    queryClient.invalidateQueries({ queryKey: ['companies'] });
    toast.success('Empresa adicionada'); setName('');
  };

  return (
    <div>
      <div className="flex gap-3 mb-4">
        <Input value={name} onChange={e => setName(e.target.value)} placeholder="Nome da empresa" className="max-w-xs" />
        <Select value={type} onValueChange={v => setType(v as any)}><SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="escritorio">Escritório</SelectItem><SelectItem value="obra">Obra</SelectItem></SelectContent></Select>
        <Button onClick={handleAdd}><Plus className="h-4 w-4 mr-1" />Adicionar</Button>
      </div>
      <div className="bg-card border rounded-lg">
        {companies.map(c => (
          <div key={c.id} className="flex items-center justify-between px-4 py-3 border-b last:border-0">
            <span className="font-medium">{c.name}</span>
            <Badge variant="secondary" className="text-xs">{c.type === 'obra' ? 'Obra' : 'Escritório'}</Badge>
          </div>
        ))}
      </div>
    </div>
  );
}

function SectorsTab() {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const { data: sectors = [] } = useQuery({ queryKey: ['sectors'], queryFn: async () => { const { data } = await supabase.from('sectors').select('*'); return data || []; } });

  const handleAdd = async () => {
    if (!name) return;
    const { error } = await supabase.from('sectors').insert({ name });
    if (error) { toast.error(error.message); return; }
    queryClient.invalidateQueries({ queryKey: ['sectors'] });
    toast.success('Setor adicionado'); setName('');
  };

  return (
    <div>
      <div className="flex gap-3 mb-4">
        <Input value={name} onChange={e => setName(e.target.value)} placeholder="Nome do setor" className="max-w-xs" />
        <Button onClick={handleAdd}><Plus className="h-4 w-4 mr-1" />Adicionar</Button>
      </div>
      <div className="bg-card border rounded-lg">
        {sectors.map(s => (
          <div key={s.id} className="px-4 py-3 border-b last:border-0 font-medium">{s.name}</div>
        ))}
      </div>
    </div>
  );
}

function ProfilesTab() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [perms, setPerms] = useState({ can_create_rnc: true, can_approve_rnc: false, can_manage_risks: true, can_validate: false, can_manage_users: false, can_manage_settings: false });

  const { data: profiles = [] } = useQuery({ queryKey: ['permission-profiles'], queryFn: async () => { const { data } = await supabase.from('permission_profiles').select('*'); return data || []; } });

  const handleAdd = async () => {
    if (!name) return;
    const { error } = await supabase.from('permission_profiles').insert({ name, description: desc, ...perms });
    if (error) { toast.error(error.message); return; }
    queryClient.invalidateQueries({ queryKey: ['permission-profiles'] });
    toast.success('Perfil criado'); setShowForm(false); setName(''); setDesc('');
  };

  const permLabels: Record<string, string> = {
    can_create_rnc: 'Criar RNC', can_approve_rnc: 'Aprovar RNC', can_manage_risks: 'Gerenciar Riscos',
    can_validate: 'Validar', can_manage_users: 'Gerenciar Usuários', can_manage_settings: 'Gerenciar Configurações',
  };

  return (
    <div>
      <div className="flex justify-between mb-4">
        <h2 className="font-medium">Perfis de Permissão</h2>
        <Button size="sm" onClick={() => setShowForm(!showForm)}><Plus className="h-4 w-4 mr-1" />Novo Perfil</Button>
      </div>
      {showForm && (
        <Card className="mb-4"><CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Nome *</Label><Input value={name} onChange={e => setName(e.target.value)} /></div>
            <div className="space-y-2"><Label>Descrição</Label><Input value={desc} onChange={e => setDesc(e.target.value)} /></div>
          </div>
          <div className="space-y-2">
            <Label>Permissões</Label>
            <div className="grid grid-cols-3 gap-3">
              {Object.entries(permLabels).map(([k, v]) => (
                <label key={k} className="flex items-center gap-2 text-sm">
                  <Checkbox checked={(perms as any)[k]} onCheckedChange={c => setPerms({ ...perms, [k]: !!c })} />{v}
                </label>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
            <Button onClick={handleAdd}>Criar Perfil</Button>
          </div>
        </CardContent></Card>
      )}
      <div className="grid grid-cols-2 gap-4">
        {profiles.map(p => (
          <Card key={p.id}>
            <CardHeader><CardTitle className="text-base">{p.name}</CardTitle></CardHeader>
            <CardContent>
              {p.description && <p className="text-sm text-muted-foreground mb-2">{p.description}</p>}
              <div className="flex flex-wrap gap-1">
                {Object.entries(permLabels).map(([k, v]) => (p as any)[k] && <Badge key={k} variant="secondary" className="text-xs">{v}</Badge>)}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

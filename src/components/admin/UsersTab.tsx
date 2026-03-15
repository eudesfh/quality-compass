import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export default function UsersTab() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [sectorId, setSectorId] = useState('');
  const [profileId, setProfileId] = useState('');
  const [isAdminRole, setIsAdminRole] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

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
  const { data: adminRoles = [] } = useQuery({
    queryKey: ['admin-roles'],
    queryFn: async () => {
      const { data } = await supabase.from('user_roles').select('*').eq('role', 'admin');
      return data || [];
    },
  });

  const resetForm = () => {
    setEmail(''); setFullName(''); setCompanyId(''); setSectorId(''); setProfileId('');
    setIsAdminRole(false); setIsActive(true); setEditingUser(null); setShowForm(false);
  };

  const startEdit = (u: any) => {
    setEditingUser(u);
    setFullName(u.full_name || '');
    setEmail(u.email || '');
    setCompanyId(u.company_id || '');
    setSectorId(u.sector_id || '');
    setProfileId(u.permission_profile_id || '');
    setIsActive(u.is_active);
    setIsAdminRole(adminRoles.some((r: any) => r.user_id === u.user_id));
    setShowForm(true);
  };

  const handleCreate = async () => {
    if (!email || !fullName) { toast.error('Preencha nome e e-mail'); return; }
    setLoading(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email, password: Math.random().toString(36).slice(-12) + 'A1!',
        options: { data: { full_name: fullName }, emailRedirectTo: window.location.origin },
      });
      if (authError) throw authError;
      if (authData.user) {
        await supabase.from('profiles').update({
          full_name: fullName, company_id: companyId || null,
          sector_id: sectorId || null, permission_profile_id: profileId || null,
        }).eq('user_id', authData.user.id);
        if (isAdminRole) {
          await supabase.from('user_roles').insert({ user_id: authData.user.id, role: 'admin' });
        }
      }
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-roles'] });
      toast.success('Usuário criado! Um e-mail foi enviado para definir a senha.');
      resetForm();
    } catch (error: any) {
      toast.error(error.message);
    } finally { setLoading(false); }
  };

  const handleUpdate = async () => {
    if (!editingUser || !fullName) { toast.error('Preencha o nome'); return; }
    setLoading(true);
    try {
      const { error } = await supabase.from('profiles').update({
        full_name: fullName, company_id: companyId || null,
        sector_id: sectorId || null, permission_profile_id: profileId || null, is_active: isActive,
      }).eq('user_id', editingUser.user_id);
      if (error) throw error;
      const wasAdmin = adminRoles.some((r: any) => r.user_id === editingUser.user_id);
      if (isAdminRole && !wasAdmin) {
        await supabase.from('user_roles').insert({ user_id: editingUser.user_id, role: 'admin' });
      } else if (!isAdminRole && wasAdmin) {
        await supabase.from('user_roles').delete().eq('user_id', editingUser.user_id).eq('role', 'admin');
      }
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-roles'] });
      toast.success('Usuário atualizado!');
      resetForm();
    } catch (error: any) {
      toast.error(error.message);
    } finally { setLoading(false); }
  };

  const handleDeactivate = async (userId: string) => {
    try {
      const { error } = await supabase.from('profiles').update({ is_active: false }).eq('user_id', userId);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Usuário desativado.');
      setConfirmDelete(null);
    } catch (error: any) { toast.error(error.message); }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-medium">Usuários Cadastrados</h2>
        <Button size="sm" onClick={() => { resetForm(); setShowForm(true); }}><Plus className="h-4 w-4 mr-1" />Novo Usuário</Button>
      </div>
      {showForm && (
        <Card className="mb-4">
          <CardHeader className="pb-2"><CardTitle className="text-base">{editingUser ? 'Editar Usuário' : 'Novo Usuário'}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Nome Completo *</Label><Input value={fullName} onChange={e => setFullName(e.target.value)} /></div>
              <div className="space-y-2"><Label>E-mail *</Label><Input type="email" value={email} onChange={e => setEmail(e.target.value)} disabled={!!editingUser} /></div>
              <div className="space-y-2"><Label>Empresa</Label>
                <Select value={companyId} onValueChange={setCompanyId}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{companies.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label>Setor</Label>
                <Select value={sectorId} onValueChange={setSectorId}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{sectors.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label>Perfil de Permissão</Label>
                <Select value={profileId} onValueChange={setProfileId}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{permProfiles.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-3 pt-4">
                <label className="flex items-center gap-2"><Checkbox checked={isAdminRole} onCheckedChange={c => setIsAdminRole(!!c)} /><span className="text-sm">Admin do Sistema</span></label>
                {editingUser && <label className="flex items-center gap-2"><Checkbox checked={isActive} onCheckedChange={c => setIsActive(!!c)} /><span className="text-sm">Usuário Ativo</span></label>}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={resetForm}>Cancelar</Button>
              <Button onClick={editingUser ? handleUpdate : handleCreate} disabled={loading}>
                {loading ? 'Salvando...' : editingUser ? 'Salvar Alterações' : 'Criar Usuário'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      {confirmDelete && (
        <Card className="mb-4 border-destructive">
          <CardContent className="pt-4 flex items-center justify-between">
            <p className="text-sm text-destructive font-medium">Deseja realmente desativar este usuário?</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setConfirmDelete(null)}>Cancelar</Button>
              <Button variant="destructive" size="sm" onClick={() => handleDeactivate(confirmDelete)}>Desativar</Button>
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
            <th className="text-right px-4 py-3 font-medium text-muted-foreground">Ações</th>
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
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEdit(u)} title="Editar"><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setConfirmDelete(u.user_id)} title="Desativar"><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

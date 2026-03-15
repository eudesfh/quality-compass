import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const PERM_LABELS: Record<string, string> = {
  can_create_rnc: 'Criar RNC', can_approve_rnc: 'Aprovar RNC', can_manage_risks: 'Gerenciar Riscos',
  can_validate: 'Validar', can_manage_users: 'Gerenciar Usuários', can_manage_settings: 'Gerenciar Configurações',
};

const DEFAULT_PERMS = { can_create_rnc: true, can_approve_rnc: false, can_manage_risks: true, can_validate: false, can_manage_users: false, can_manage_settings: false };

export default function ProfilesTab() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [perms, setPerms] = useState(DEFAULT_PERMS);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const { data: profiles = [] } = useQuery({
    queryKey: ['permission-profiles'],
    queryFn: async () => { const { data } = await supabase.from('permission_profiles').select('*'); return data || []; },
  });

  const resetForm = () => {
    setShowForm(false); setEditingId(null); setName(''); setDesc(''); setPerms(DEFAULT_PERMS);
  };

  const startEdit = (p: any) => {
    setEditingId(p.id);
    setName(p.name);
    setDesc(p.description || '');
    setPerms({
      can_create_rnc: p.can_create_rnc,
      can_approve_rnc: p.can_approve_rnc,
      can_manage_risks: p.can_manage_risks,
      can_validate: p.can_validate,
      can_manage_users: p.can_manage_users,
      can_manage_settings: p.can_manage_settings,
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!name) { toast.error('Informe o nome do perfil'); return; }
    const payload = { name, description: desc || null, ...perms };

    if (editingId) {
      const { error } = await supabase.from('permission_profiles').update(payload).eq('id', editingId);
      if (error) { toast.error(error.message); return; }
      toast.success('Perfil atualizado');
    } else {
      const { error } = await supabase.from('permission_profiles').insert(payload);
      if (error) { toast.error(error.message); return; }
      toast.success('Perfil criado');
    }
    queryClient.invalidateQueries({ queryKey: ['permission-profiles'] });
    resetForm();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('permission_profiles').delete().eq('id', id);
    if (error) { toast.error('Não é possível excluir: perfil em uso'); setConfirmDelete(null); return; }
    queryClient.invalidateQueries({ queryKey: ['permission-profiles'] });
    toast.success('Perfil removido'); setConfirmDelete(null);
  };

  return (
    <div>
      <div className="flex justify-between mb-4">
        <h2 className="font-medium">Perfis de Permissão</h2>
        <Button size="sm" onClick={() => { resetForm(); setShowForm(true); }}><Plus className="h-4 w-4 mr-1" />Novo Perfil</Button>
      </div>
      {showForm && (
        <Card className="mb-4">
          <CardHeader className="pb-2"><CardTitle className="text-base">{editingId ? 'Editar Perfil' : 'Novo Perfil'}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Nome *</Label><Input value={name} onChange={e => setName(e.target.value)} /></div>
              <div className="space-y-2"><Label>Descrição</Label><Input value={desc} onChange={e => setDesc(e.target.value)} /></div>
            </div>
            <div className="space-y-2">
              <Label>Permissões</Label>
              <div className="grid grid-cols-3 gap-3">
                {Object.entries(PERM_LABELS).map(([k, v]) => (
                  <label key={k} className="flex items-center gap-2 text-sm">
                    <Checkbox checked={(perms as any)[k]} onCheckedChange={c => setPerms({ ...perms, [k]: !!c })} />{v}
                  </label>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={resetForm}>Cancelar</Button>
              <Button onClick={handleSave}>{editingId ? 'Salvar Alterações' : 'Criar Perfil'}</Button>
            </div>
          </CardContent>
        </Card>
      )}
      {confirmDelete && (
        <Card className="mb-4 border-destructive">
          <CardContent className="pt-4 flex items-center justify-between">
            <p className="text-sm text-destructive font-medium">Deseja realmente excluir este perfil?</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setConfirmDelete(null)}>Cancelar</Button>
              <Button variant="destructive" size="sm" onClick={() => handleDelete(confirmDelete)}>Excluir</Button>
            </div>
          </CardContent>
        </Card>
      )}
      <div className="grid grid-cols-2 gap-4">
        {profiles.map(p => (
          <Card key={p.id}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{p.name}</CardTitle>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEdit(p)}><Pencil className="h-3.5 w-3.5" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setConfirmDelete(p.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {p.description && <p className="text-sm text-muted-foreground mb-2">{p.description}</p>}
              <div className="flex flex-wrap gap-1">
                {Object.entries(PERM_LABELS).map(([k, v]) => (p as any)[k] && <Badge key={k} variant="secondary" className="text-xs">{v}</Badge>)}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

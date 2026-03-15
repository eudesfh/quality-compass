import { useState } from 'react';
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export default function CompaniesTab() {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [type, setType] = useState<'obra' | 'escritorio'>('escritorio');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editType, setEditType] = useState<'obra' | 'escritorio'>('escritorio');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: async () => { const { data } = await supabase.from('companies').select('*').order('name'); return data || []; },
  });

  const handleAdd = async () => {
    if (!name) return;
    const { error } = await supabase.from('companies').insert({ name, type });
    if (error) { toast.error(error.message); return; }
    queryClient.invalidateQueries({ queryKey: ['companies'] });
    toast.success('Empresa adicionada'); setName('');
  };

  const startEdit = (c: any) => {
    setEditingId(c.id); setEditName(c.name); setEditType(c.type);
  };

  const handleUpdate = async () => {
    if (!editingId || !editName) return;
    const { error } = await supabase.from('companies').update({ name: editName, type: editType }).eq('id', editingId);
    if (error) { toast.error(error.message); return; }
    queryClient.invalidateQueries({ queryKey: ['companies'] });
    toast.success('Empresa atualizada'); setEditingId(null);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('companies').delete().eq('id', id);
    if (error) { toast.error('Não é possível excluir: empresa em uso'); setConfirmDelete(null); return; }
    queryClient.invalidateQueries({ queryKey: ['companies'] });
    toast.success('Empresa removida'); setConfirmDelete(null);
  };

  return (
    <div>
      <h2 className="font-medium mb-4">Empresas</h2>
      <div className="flex gap-3 mb-4">
        <Input value={name} onChange={e => setName(e.target.value)} placeholder="Nome da empresa" className="max-w-xs" />
        <Select value={type} onValueChange={v => setType(v as any)}>
          <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="escritorio">Escritório</SelectItem><SelectItem value="obra">Obra</SelectItem></SelectContent>
        </Select>
        <Button onClick={handleAdd}><Plus className="h-4 w-4 mr-1" />Adicionar</Button>
      </div>
      {confirmDelete && (
        <Card className="mb-4 border-destructive">
          <CardContent className="pt-4 flex items-center justify-between">
            <p className="text-sm text-destructive font-medium">Deseja realmente excluir esta empresa?</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setConfirmDelete(null)}>Cancelar</Button>
              <Button variant="destructive" size="sm" onClick={() => handleDelete(confirmDelete)}>Excluir</Button>
            </div>
          </CardContent>
        </Card>
      )}
      <div className="bg-card border rounded-lg">
        {companies.map(c => (
          <div key={c.id} className="flex items-center justify-between px-4 py-3 border-b last:border-0">
            {editingId === c.id ? (
              <div className="flex items-center gap-2 flex-1">
                <Input value={editName} onChange={e => setEditName(e.target.value)} className="max-w-xs" />
                <Select value={editType} onValueChange={v => setEditType(v as any)}>
                  <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="escritorio">Escritório</SelectItem><SelectItem value="obra">Obra</SelectItem></SelectContent>
                </Select>
                <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600" onClick={handleUpdate}><Check className="h-4 w-4" /></Button>
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditingId(null)}><X className="h-4 w-4" /></Button>
              </div>
            ) : (
              <>
                <span className="font-medium">{c.name}</span>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">{c.type === 'obra' ? 'Obra' : 'Escritório'}</Badge>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEdit(c)}><Pencil className="h-3.5 w-3.5" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setConfirmDelete(c.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

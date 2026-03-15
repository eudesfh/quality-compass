import { useState } from 'react';
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export default function SectorsTab() {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const { data: sectors = [] } = useQuery({
    queryKey: ['sectors'],
    queryFn: async () => { const { data } = await supabase.from('sectors').select('*').order('name'); return data || []; },
  });

  const handleAdd = async () => {
    if (!name) return;
    const { error } = await supabase.from('sectors').insert({ name });
    if (error) { toast.error(error.message); return; }
    queryClient.invalidateQueries({ queryKey: ['sectors'] });
    toast.success('Setor adicionado'); setName('');
  };

  const handleUpdate = async () => {
    if (!editingId || !editName) return;
    const { error } = await supabase.from('sectors').update({ name: editName }).eq('id', editingId);
    if (error) { toast.error(error.message); return; }
    queryClient.invalidateQueries({ queryKey: ['sectors'] });
    toast.success('Setor atualizado'); setEditingId(null);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('sectors').delete().eq('id', id);
    if (error) { toast.error('Não é possível excluir: setor em uso'); setConfirmDelete(null); return; }
    queryClient.invalidateQueries({ queryKey: ['sectors'] });
    toast.success('Setor removido'); setConfirmDelete(null);
  };

  return (
    <div>
      <h2 className="font-medium mb-4">Setores</h2>
      <div className="flex gap-3 mb-4">
        <Input value={name} onChange={e => setName(e.target.value)} placeholder="Nome do setor" className="max-w-xs" />
        <Button onClick={handleAdd}><Plus className="h-4 w-4 mr-1" />Adicionar</Button>
      </div>
      {confirmDelete && (
        <Card className="mb-4 border-destructive">
          <CardContent className="pt-4 flex items-center justify-between">
            <p className="text-sm text-destructive font-medium">Deseja realmente excluir este setor?</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setConfirmDelete(null)}>Cancelar</Button>
              <Button variant="destructive" size="sm" onClick={() => handleDelete(confirmDelete)}>Excluir</Button>
            </div>
          </CardContent>
        </Card>
      )}
      <div className="bg-card border rounded-lg">
        {sectors.map(s => (
          <div key={s.id} className="flex items-center justify-between px-4 py-3 border-b last:border-0">
            {editingId === s.id ? (
              <div className="flex items-center gap-2 flex-1">
                <Input value={editName} onChange={e => setEditName(e.target.value)} className="max-w-xs" />
                <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600" onClick={handleUpdate}><Check className="h-4 w-4" /></Button>
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditingId(null)}><X className="h-4 w-4" /></Button>
              </div>
            ) : (
              <>
                <span className="font-medium">{s.name}</span>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingId(s.id); setEditName(s.name); }}><Pencil className="h-3.5 w-3.5" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setConfirmDelete(s.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

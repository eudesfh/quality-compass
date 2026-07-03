import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  rnc: any;
  profiles: any[];
  sectors: any[];
  queryClient: any;
}

export default function AdminEditRNCDialog({ open, onOpenChange, rnc, profiles, sectors, queryClient }: Props) {
  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: async () => { const { data } = await supabase.from('companies').select('*'); return data || []; },
  });

  const [subject, setSubject] = useState(rnc.subject || '');
  const [description, setDescription] = useState(rnc.description || '');
  const [origin, setOrigin] = useState(rnc.origin || '');
  const [occurrenceDate, setOccurrenceDate] = useState(rnc.occurrence_date || '');
  const [criticality, setCriticality] = useState(rnc.criticality || 'baixa');
  const [companyId, setCompanyId] = useState(rnc.company_id || '');
  const [sectorId, setSectorId] = useState(rnc.sector_id || '');
  const [approverId, setApproverId] = useState(rnc.approver_id || '');
  const [occurrenceType, setOccurrenceType] = useState(rnc.occurrence_type || 'real');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.from('rnc_occurrences').update({
        subject, description: description || null, origin,
        occurrence_date: occurrenceDate, criticality,
        company_id: companyId, sector_id: sectorId,
        approver_id: approverId, occurrence_type: occurrenceType,
      }).eq('id', rnc.id);
      if (error) throw error;
      toast.success('Ocorrência atualizada com sucesso');
      queryClient.invalidateQueries({ queryKey: ['rnc-detail'] });
      queryClient.invalidateQueries({ queryKey: ['rnc-list'] });
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message || 'Erro ao atualizar');
    } finally { setLoading(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Ocorrência (Admin) — {rnc.code}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-2">
          <div className="col-span-2 space-y-1">
            <Label>Assunto</Label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
          </div>
          <div className="col-span-2 space-y-1">
            <Label>Descrição</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
          </div>
          <div className="space-y-1">
            <Label>Tipo de Ocorrência</Label>
            <Select value={occurrenceType} onValueChange={setOccurrenceType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="real">Real (NC)</SelectItem>
                <SelectItem value="oportunidade">Oportunidade de Melhoria</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Criticidade</Label>
            <Select value={criticality} onValueChange={setCriticality}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="baixa">Baixa</SelectItem>
                <SelectItem value="media">Média</SelectItem>
                <SelectItem value="alta">Alta</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Empresa</Label>
            <Select value={companyId} onValueChange={setCompanyId}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {companies.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Setor Receptor</Label>
            <Select value={sectorId} onValueChange={setSectorId}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {sectors.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Origem</Label>
            <Input value={origin} onChange={(e) => setOrigin(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Data</Label>
            <Input type="date" value={occurrenceDate} onChange={(e) => setOccurrenceDate(e.target.value)} />
          </div>
          <div className="col-span-2 space-y-1">
            <Label>Aprovador</Label>
            <Select value={approverId} onValueChange={setApproverId}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {profiles.filter((p: any) => p?.user_id).map((p: any) => (
                  <SelectItem key={p.user_id} value={p.user_id}>{p.full_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancelar</Button>
          <Button onClick={handleSave} disabled={loading}>{loading ? 'Salvando...' : 'Salvar Alterações'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

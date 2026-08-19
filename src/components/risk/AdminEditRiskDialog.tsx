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
import { computeRiskDeadline, riskDeadlineDays, formatDateBR } from '@/lib/utils';

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  risk: any;
  queryClient: any;
}

export default function AdminEditRiskDialog({ open, onOpenChange, risk, queryClient }: Props) {
  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: async () => { const { data } = await supabase.from('companies').select('*'); return data || []; },
  });
  const { data: sectors = [] } = useQuery({
    queryKey: ['sectors'],
    queryFn: async () => { const { data } = await supabase.from('sectors').select('*'); return data || []; },
  });

  const [riskDescription, setRiskDescription] = useState(risk.risk_description || '');
  const [cause, setCause] = useState(risk.cause || '');
  const [causeSource, setCauseSource] = useState(risk.cause_source || '');
  const [consequence, setConsequence] = useState(risk.consequence || '');
  const [probability, setProbability] = useState<number>(risk.probability || 1);
  const [severity, setSeverity] = useState<number>(risk.severity || 1);
  const [response, setResponse] = useState(risk.response || 'aceitar');
  const [frequency, setFrequency] = useState(risk.frequency || '');
  const [treatment, setTreatment] = useState(risk.treatment || '');
  const [status, setStatus] = useState(risk.status || 'iniciar');
  const [companyId, setCompanyId] = useState(risk.company_id || '');
  const [companyType, setCompanyType] = useState(risk.company_type || '');
  const [sectorId, setSectorId] = useState(risk.sector_id || '');
  const [riskType, setRiskType] = useState<'com_prazo' | 'continuo'>(risk.risk_type === 'continuo' ? 'continuo' : 'com_prazo');
  const [loading, setLoading] = useState(false);

  const riskLevel = probability * severity;
  const deadlineDays = riskDeadlineDays(riskLevel);
  const deadline = riskType === 'continuo'
    ? ''
    : computeRiskDeadline(risk.opened_at || risk.created_at || new Date(), riskLevel);

  const handleSave = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.from('risks').update({
        risk_description: riskDescription,
        cause,
        cause_source: causeSource || null,
        consequence: consequence || null,
        probability, severity,
        response: response as any,
        frequency: (frequency || null) as any,
        treatment: treatment || null,
        deadline: deadline || null,
        status: status as any,
        company_id: companyId || null,
        company_type: (companyType || null) as any,
        sector_id: sectorId || null,
      }).eq('id', risk.id);
      if (error) throw error;
      toast.success('Risco atualizado com sucesso');
      queryClient.invalidateQueries({ queryKey: ['risk-detail'] });
      queryClient.invalidateQueries({ queryKey: ['risk-list'] });
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message || 'Erro ao atualizar');
    } finally { setLoading(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Risco (Admin) — {risk.code}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-2">
          <div className="col-span-2 space-y-1">
            <Label>Descrição do Risco</Label>
            <Textarea value={riskDescription} onChange={(e) => setRiskDescription(e.target.value)} rows={3} />
          </div>
          <div className="col-span-2 space-y-1">
            <Label>Causa</Label>
            <Textarea value={cause} onChange={(e) => setCause(e.target.value)} rows={2} />
          </div>
          <div className="space-y-1">
            <Label>Fonte da Causa</Label>
            <Input value={causeSource} onChange={(e) => setCauseSource(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Consequência</Label>
            <Input value={consequence} onChange={(e) => setConsequence(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Probabilidade (1-3)</Label>
            <Select value={String(probability)} onValueChange={(v) => setProbability(Number(v))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 - Baixa</SelectItem>
                <SelectItem value="2">2 - Média</SelectItem>
                <SelectItem value="3">3 - Alta</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Severidade (1-3)</Label>
            <Select value={String(severity)} onValueChange={(v) => setSeverity(Number(v))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 - Baixa</SelectItem>
                <SelectItem value="2">2 - Média</SelectItem>
                <SelectItem value="3">3 - Alta</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Resposta</Label>
            <Select value={response} onValueChange={setResponse}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="aceitar">Aceitar</SelectItem>
                <SelectItem value="compartilhar">Compartilhar</SelectItem>
                <SelectItem value="eliminar">Eliminar</SelectItem>
                <SelectItem value="minimizar">Minimizar</SelectItem>
                <SelectItem value="evitar">Evitar</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Frequência</Label>
            <Select value={frequency} onValueChange={setFrequency}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="por_evento">Por evento</SelectItem>
                <SelectItem value="diario">Diário</SelectItem>
                <SelectItem value="semanal">Semanal</SelectItem>
                <SelectItem value="mensal">Mensal</SelectItem>
                <SelectItem value="trimestral">Trimestral</SelectItem>
                <SelectItem value="anual">Anual</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="iniciar">Iniciar</SelectItem>
                <SelectItem value="em_andamento">Em Andamento</SelectItem>
                <SelectItem value="concluido">Concluído</SelectItem>
                <SelectItem value="sem_previsao">Sem Previsão</SelectItem>
                <SelectItem value="acao_constante">Ação Constante</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Prazo (automático)</Label>
            <Input value={`${formatDateBR(deadline)} (${deadlineDays} dias corridos)`} readOnly className="bg-muted" />
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
            <Label>Tipo</Label>
            <Select value={companyType} onValueChange={setCompanyType}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="propria">Própria</SelectItem>
                <SelectItem value="terceirizada">Terceirizada</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Setor</Label>
            <Select value={sectorId} onValueChange={setSectorId}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {sectors.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-2 space-y-1">
            <Label>Tratativa</Label>
            <Textarea value={treatment} onChange={(e) => setTreatment(e.target.value)} rows={3} />
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

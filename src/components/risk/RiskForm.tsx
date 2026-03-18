import { useState, useMemo } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useModule } from '@/contexts/ModuleContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

type RiskResponse = Database['public']['Enums']['risk_response'];
type RiskFrequency = Database['public']['Enums']['risk_frequency'];
type RiskStatus = Database['public']['Enums']['risk_status'];

const probLabels: Record<number, string> = { 1: 'Remota', 2: 'Provável', 3: 'Frequente' };
const sevLabels: Record<number, string> = { 1: 'Desprezível', 2: 'Aceitável', 3: 'Crítica' };

const responseOptions: { value: RiskResponse; label: string }[] = [
  { value: 'aceitar', label: 'Aceitar' }, { value: 'compartilhar', label: 'Compartilhar' },
  { value: 'eliminar', label: 'Eliminar' }, { value: 'minimizar', label: 'Minimizar' }, { value: 'evitar', label: 'Evitar' },
];
const frequencyOptions: { value: RiskFrequency; label: string }[] = [
  { value: 'por_evento', label: 'Por evento' }, { value: 'diario', label: 'Diário' },
  { value: 'semanal', label: 'Semanal' }, { value: 'mensal', label: 'Mensal' },
  { value: 'trimestral', label: 'Trimestral' }, { value: 'anual', label: 'Anual' },
];
const statusOptions: { value: RiskStatus; label: string }[] = [
  { value: 'iniciar', label: 'Iniciar' }, { value: 'em_andamento', label: 'Em Andamento' },
  { value: 'concluido', label: 'Concluído' }, { value: 'sem_previsao', label: 'Sem Previsão de Início' },
  { value: 'acao_constante', label: 'Ação Executada Constante' },
];

export default function RiskForm() {
  const { setShowRiskForm } = useModule();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [risk, setRisk] = useState('');
  const [cause, setCause] = useState('');
  const [causeSource, setCauseSource] = useState('');
  const [consequence, setConsequence] = useState('');
  const [probability, setProbability] = useState<number>(0);
  const [severity, setSeverity] = useState<number>(0);
  const [response, setResponse] = useState<RiskResponse | ''>('');
  const [frequency, setFrequency] = useState<RiskFrequency | ''>('');
  const [treatment, setTreatment] = useState('');
  const [deadline, setDeadline] = useState('');
  const [status, setStatus] = useState<RiskStatus | ''>('');
  const [sectorId, setSectorId] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [companyType, setCompanyType] = useState('');
  const [loading, setLoading] = useState(false);

  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: async () => { const { data } = await supabase.from('companies').select('*').eq('is_active', true); return data || []; },
  });
  const { data: sectors = [] } = useQuery({
    queryKey: ['sectors'],
    queryFn: async () => { const { data } = await supabase.from('sectors').select('*').eq('is_active', true); return data || []; },
  });

  const riskLevel = useMemo(() => probability * severity, [probability, severity]);
  const riskClass = useMemo(() => {
    if (riskLevel === 0) return null;
    if (riskLevel <= 2) return { label: 'Baixo Risco', className: 'bg-risk-low-light text-risk-low' };
    if (riskLevel <= 5) return { label: 'Médio Risco', className: 'bg-risk-medium-light text-risk-medium' };
    return { label: 'Alto Risco', className: 'bg-risk-high-light text-risk-high' };
  }, [riskLevel]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!risk || !cause || !probability || !severity || !response || !status || !user) {
      toast.error('Preencha todos os campos obrigatórios.');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.from('risks').insert({
        code: 'TEMP-' + Date.now(),
        risk_description: risk, cause, cause_source: causeSource || null,
        consequence: consequence || null, probability, severity,
        response: response as any, frequency: (frequency || null) as any,
        treatment: treatment || null, deadline: deadline || null,
        status: status as any, sector_id: sectorId || null, company_id: companyId || null,
        company_type: (companyType || null) as any,
        created_by: user.id,
      });
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['risk-list'] });
      toast.success('Risco cadastrado com sucesso!');
      setShowRiskForm(false);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50 flex items-start justify-center pt-8 overflow-y-auto pb-8">
      <div className="bg-card rounded-lg shadow-lg w-full max-w-2xl animate-fade-in border">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold text-foreground">Cadastrar Risco</h2>
          <Button variant="ghost" size="icon" onClick={() => setShowRiskForm(false)}><X className="h-4 w-4" /></Button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="space-y-2">
            <Label>Risco *</Label>
            <Textarea value={risk} onChange={(e) => setRisk(e.target.value)} placeholder="Descreva o risco..." rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Causa do Risco *</Label>
              <Input value={cause} onChange={(e) => setCause(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Fonte da Causa</Label>
              <Input value={causeSource} onChange={(e) => setCauseSource(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Consequência do Risco</Label>
            <Input value={consequence} onChange={(e) => setConsequence(e.target.value)} />
          </div>
          {/* Risk Matrix */}
          <div className="p-4 bg-muted rounded-lg space-y-4">
            <Label className="text-sm font-semibold">Matriz de Risco</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Probabilidade *</Label>
                <Select value={probability ? String(probability) : ''} onValueChange={(v) => setProbability(Number(v))}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3].map(n => <SelectItem key={n} value={String(n)}>{n} — {probLabels[n]}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Agravante (Severidade) *</Label>
                <Select value={severity ? String(severity) : ''} onValueChange={(v) => setSeverity(Number(v))}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3].map(n => <SelectItem key={n} value={String(n)}>{n} — {sevLabels[n]}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {riskClass && (
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">Nível: <strong>{riskLevel}</strong></span>
                <Badge className={riskClass.className + ' border-0'}>{riskClass.label}</Badge>
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Resposta ao Risco *</Label>
              <Select value={response} onValueChange={(v) => setResponse(v as RiskResponse)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{responseOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Frequência</Label>
              <Select value={frequency} onValueChange={(v) => setFrequency(v as RiskFrequency)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{frequencyOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Tratativa da Causa do Risco</Label>
            <Textarea value={treatment} onChange={(e) => setTreatment(e.target.value)} rows={3} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Empresa</Label>
              <Select value={companyId} onValueChange={setCompanyId}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{companies.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tipo Empresa</Label>
              <Select value={companyType} onValueChange={setCompanyType}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="obra">Obra</SelectItem>
                  <SelectItem value="escritorio">Escritório</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Setor</Label>
              <Select value={sectorId} onValueChange={setSectorId}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{sectors.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Prazo</Label>
              <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Status *</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as RiskStatus)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{statusOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setShowRiskForm(false)}>Cancelar</Button>
            <Button type="submit" disabled={loading}>{loading ? 'Salvando...' : 'Cadastrar Risco'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

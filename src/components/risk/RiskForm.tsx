import { useState, useMemo } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useModule } from '@/contexts/ModuleContext';
import type { RiskResponse, RiskFrequency, RiskStatus } from '@/types/qms';
import { toast } from 'sonner';

const probLabels: Record<number, string> = { 1: 'Remota', 2: 'Provável', 3: 'Frequente' };
const sevLabels: Record<number, string> = { 1: 'Desprezível', 2: 'Aceitável', 3: 'Crítica' };

const responseOptions: { value: RiskResponse; label: string }[] = [
  { value: 'aceitar', label: 'Aceitar' },
  { value: 'compartilhar', label: 'Compartilhar' },
  { value: 'eliminar', label: 'Eliminar' },
  { value: 'minimizar', label: 'Minimizar' },
  { value: 'evitar', label: 'Evitar' },
];

const frequencyOptions: { value: RiskFrequency; label: string }[] = [
  { value: 'por-evento', label: 'Por evento' },
  { value: 'diario', label: 'Diário' },
  { value: 'semanal', label: 'Semanal' },
  { value: 'mensal', label: 'Mensal' },
  { value: 'trimestral', label: 'Trimestral' },
  { value: 'anual', label: 'Anual' },
];

const statusOptions: { value: RiskStatus; label: string }[] = [
  { value: 'iniciar', label: 'Iniciar' },
  { value: 'em-andamento', label: 'Em Andamento' },
  { value: 'concluido', label: 'Concluído' },
  { value: 'sem-previsao', label: 'Sem Previsão de Início' },
  { value: 'acao-constante', label: 'Ação Executada Constante' },
];

export default function RiskForm() {
  const { setShowRiskForm } = useModule();
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

  const riskLevel = useMemo(() => probability * severity, [probability, severity]);
  const riskClass = useMemo(() => {
    if (riskLevel === 0) return null;
    if (riskLevel <= 2) return { label: 'Baixo Risco', className: 'bg-risk-low-light text-risk-low' };
    if (riskLevel <= 5) return { label: 'Médio Risco', className: 'bg-risk-medium-light text-risk-medium' };
    return { label: 'Alto Risco', className: 'bg-risk-high-light text-risk-high' };
  }, [riskLevel]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!risk || !cause || !probability || !severity || !response || !status) {
      toast.error('Preencha todos os campos obrigatórios.');
      return;
    }
    toast.success('Risco cadastrado com sucesso!');
    setShowRiskForm(false);
  };

  return (
    <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50 flex items-start justify-center pt-8 overflow-y-auto pb-8">
      <div className="bg-card rounded-lg shadow-lg w-full max-w-2xl animate-fade-in border">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold text-foreground">Cadastrar Risco</h2>
          <Button variant="ghost" size="icon" onClick={() => setShowRiskForm(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="space-y-2">
            <Label>Risco *</Label>
            <Textarea value={risk} onChange={(e) => setRisk(e.target.value)} placeholder="Descreva o risco..." rows={2} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Causa do Risco *</Label>
              <Input value={cause} onChange={(e) => setCause(e.target.value)} placeholder="Causa..." />
            </div>
            <div className="space-y-2">
              <Label>Fonte da Causa</Label>
              <Input value={causeSource} onChange={(e) => setCauseSource(e.target.value)} placeholder="Fonte..." />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Consequência do Risco</Label>
            <Input value={consequence} onChange={(e) => setConsequence(e.target.value)} placeholder="Consequência..." />
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
                    {[1, 2, 3].map(n => (
                      <SelectItem key={n} value={String(n)}>{n} — {probLabels[n]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Agravante (Severidade) *</Label>
                <Select value={severity ? String(severity) : ''} onValueChange={(v) => setSeverity(Number(v))}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3].map(n => (
                      <SelectItem key={n} value={String(n)}>{n} — {sevLabels[n]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {riskClass && (
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">Nível do Risco: <strong>{riskLevel}</strong></span>
                <Badge className={riskClass.className + ' border-0'}>{riskClass.label}</Badge>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Resposta ao Risco *</Label>
              <Select value={response} onValueChange={(v) => setResponse(v as RiskResponse)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {responseOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Frequência</Label>
              <Select value={frequency} onValueChange={(v) => setFrequency(v as RiskFrequency)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {frequencyOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Tratativa da Causa do Risco</Label>
            <Textarea value={treatment} onChange={(e) => setTreatment(e.target.value)} placeholder="Plano de ação..." rows={3} />
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
                <SelectContent>
                  {statusOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setShowRiskForm(false)}>Cancelar</Button>
            <Button type="submit">Cadastrar Risco</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

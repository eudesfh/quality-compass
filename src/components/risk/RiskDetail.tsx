import { useState } from 'react';
import { ArrowLeft, Edit2, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useModule } from '@/contexts/ModuleContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

type RiskStatus = Database['public']['Enums']['risk_status'];
type RiskResponse = Database['public']['Enums']['risk_response'];
type RiskFrequency = Database['public']['Enums']['risk_frequency'];

const statusLabels: Record<RiskStatus, string> = {
  em_andamento: 'Em Andamento', concluido: 'Concluído', iniciar: 'Iniciar',
  sem_previsao: 'Sem Previsão', acao_constante: 'Ação Constante',
};
const statusOptions: { value: RiskStatus; label: string }[] = [
  { value: 'iniciar', label: 'Iniciar' }, { value: 'em_andamento', label: 'Em Andamento' },
  { value: 'concluido', label: 'Concluído' }, { value: 'sem_previsao', label: 'Sem Previsão de Início' },
  { value: 'acao_constante', label: 'Ação Executada Constante' },
];
const responseLabels: Record<RiskResponse, string> = {
  aceitar: 'Aceitar', compartilhar: 'Compartilhar', eliminar: 'Eliminar', minimizar: 'Minimizar', evitar: 'Evitar',
};
const frequencyLabels: Record<RiskFrequency, string> = {
  por_evento: 'Por evento', diario: 'Diário', semanal: 'Semanal', mensal: 'Mensal', trimestral: 'Trimestral', anual: 'Anual',
};

const getRiskClass = (level: number) => {
  if (level <= 2) return { label: 'Baixo Risco', className: 'bg-risk-low-light text-risk-low' };
  if (level <= 5) return { label: 'Médio Risco', className: 'bg-risk-medium-light text-risk-medium' };
  return { label: 'Alto Risco', className: 'bg-risk-high-light text-risk-high' };
};

export default function RiskDetail() {
  const { selectedRiskId, setSelectedRiskId, setActiveModule, setShowRNCForm, setRncPreFill } = useModule();
  const { user, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  const { data: risk } = useQuery({
    queryKey: ['risk-detail', selectedRiskId],
    queryFn: async () => {
      const { data } = await supabase.from('risks')
        .select('*, companies(name), sectors(name)')
        .eq('id', selectedRiskId!).single();
      return data;
    },
    enabled: !!selectedRiskId,
  });

  const { data: companies = [] } = useQuery({ queryKey: ['companies'], queryFn: async () => { const { data } = await supabase.from('companies').select('*'); return data || []; } });
  const { data: sectors = [] } = useQuery({ queryKey: ['sectors'], queryFn: async () => { const { data } = await supabase.from('sectors').select('*'); return data || []; } });

  const [editStatus, setEditStatus] = useState<RiskStatus | ''>('');
  const [editTreatment, setEditTreatment] = useState('');
  const [editDeadline, setEditDeadline] = useState('');

  const startEditing = () => {
    if (!risk) return;
    setEditStatus(risk.status);
    setEditTreatment(risk.treatment || '');
    setEditDeadline(risk.deadline || '');
    setEditing(true);
  };

  const handleSave = async () => {
    if (!risk || !editStatus) return;
    setLoading(true);
    try {
      await supabase.from('risks').update({
        status: editStatus as any,
        treatment: editTreatment || null,
        deadline: editDeadline || null,
      }).eq('id', risk.id);
      queryClient.invalidateQueries({ queryKey: ['risk-detail'] });
      queryClient.invalidateQueries({ queryKey: ['risk-list'] });
      setEditing(false);
      toast.success('Risco atualizado');
    } catch (error: any) { toast.error(error.message); } finally { setLoading(false); }
  };

  const handleCreateOportunidade = () => {
    if (!risk) return;
    setRncPreFill({
      occurrence_type: 'oportunidade',
      origin: 'Gestão de Riscos',
      subject: risk.cause,
      description: risk.risk_description,
      sourceRiskId: risk.id,
    });
    setActiveModule('rnc');
    setSelectedRiskId(null);
    setShowRNCForm(true);
  };

  if (!risk) return <div className="p-6">Carregando...</div>;

  const level = risk.risk_level || (risk.probability * risk.severity);
  const cls = getRiskClass(level);

  return (
    <div className="p-6 animate-fade-in max-w-4xl mx-auto">
      <Button variant="ghost" size="sm" onClick={() => setSelectedRiskId(null)} className="mb-4 gap-1">
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Button>

      <div className="bg-card border rounded-lg p-6 mb-4">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-lg font-semibold text-foreground">{risk.code}</h1>
              <Badge variant="secondary">{statusLabels[risk.status]}</Badge>
              <Badge variant="outline" className={cls.className + ' border-0'}>{cls.label} ({level})</Badge>
            </div>
            <p className="text-foreground">{risk.risk_description}</p>
          </div>
          <div className="flex gap-2">
            {(risk.created_by === user?.id || isAdmin) && !editing && (
              <Button variant="outline" size="sm" onClick={startEditing} className="gap-1">
                <Edit2 className="h-3.5 w-3.5" /> Editar
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={handleCreateOportunidade} className="gap-1">
              Criar Oportunidade de Melhoria
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <div><span className="text-muted-foreground">Causa:</span> <span className="font-medium">{risk.cause}</span></div>
          {risk.cause_source && <div><span className="text-muted-foreground">Fonte:</span> <span className="font-medium">{risk.cause_source}</span></div>}
          {risk.consequence && <div><span className="text-muted-foreground">Consequência:</span> <span className="font-medium">{risk.consequence}</span></div>}
          <div><span className="text-muted-foreground">Resposta:</span> <span className="font-medium capitalize">{responseLabels[risk.response]}</span></div>
          {risk.frequency && <div><span className="text-muted-foreground">Frequência:</span> <span className="font-medium">{frequencyLabels[risk.frequency]}</span></div>}
          <div><span className="text-muted-foreground">Probabilidade:</span> <span className="font-medium">{risk.probability}</span></div>
          <div><span className="text-muted-foreground">Severidade:</span> <span className="font-medium">{risk.severity}</span></div>
          {(risk as any).companies?.name && <div><span className="text-muted-foreground">Empresa:</span> <span className="font-medium">{(risk as any).companies.name}</span></div>}
          {risk.company_type && <div><span className="text-muted-foreground">Tipo:</span> <span className="font-medium capitalize">{risk.company_type}</span></div>}
          {(risk as any).sectors?.name && <div><span className="text-muted-foreground">Setor:</span> <span className="font-medium">{(risk as any).sectors.name}</span></div>}
          {risk.deadline && <div><span className="text-muted-foreground">Prazo:</span> <span className="font-medium">{new Date(risk.deadline).toLocaleDateString('pt-BR')}</span></div>}
          <div><span className="text-muted-foreground">Criado em:</span> <span className="font-medium">{new Date(risk.created_at).toLocaleDateString('pt-BR')}</span></div>
        </div>

        {risk.treatment && !editing && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-sm text-muted-foreground">Tratativa:</p>
            <p className="text-sm mt-1">{risk.treatment}</p>
          </div>
        )}
      </div>

      {editing && (
        <div className="bg-card border rounded-lg p-6 space-y-4">
          <h3 className="font-semibold text-foreground">Editar Risco</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={editStatus} onValueChange={(v) => setEditStatus(v as RiskStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{statusOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Prazo</Label>
              <Input type="date" value={editDeadline} onChange={(e) => setEditDeadline(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Tratativa</Label>
            <Textarea value={editTreatment} onChange={(e) => setEditTreatment(e.target.value)} rows={3} />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditing(false)} className="gap-1"><X className="h-3.5 w-3.5" /> Cancelar</Button>
            <Button onClick={handleSave} disabled={loading} className="gap-1"><Save className="h-3.5 w-3.5" /> Salvar</Button>
          </div>
        </div>
      )}
    </div>
  );
}

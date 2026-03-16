import { useState } from 'react';
import { ArrowLeft, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useModule } from '@/contexts/ModuleContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

type RNCStatus = Database['public']['Enums']['rnc_status'];
type OccurrenceType = Database['public']['Enums']['occurrence_type'];

const statusLabels: Record<RNCStatus, string> = {
  aberta: 'Aberta', triagem: 'Triagem', analise_causa: 'Análise de Causa',
  plano_acao: 'Plano de Ação', validacao: 'Validação', implementacao: 'Implementação',
  eficacia: 'Eficácia', concluida: 'Concluída', recusada: 'Recusada',
};

const typeLabels: Record<OccurrenceType, string> = {
  real: 'Real (NC)', potencial: 'Potencial', oportunidade: 'Oportunidade de Melhoria',
};

/*
  STAGES:
  1 - Análise de Causa (5 Porquês + causa raiz)
  2 - Plano de Ação (5W2H)
  3 - Validação do setor especializado
  4 - Implementação (+ selecionar setor e prazo para validação)
  5 - Análise de Eficácia do setor especializado
*/

export default function RNCDetail() {
  const { selectedRNCId, setSelectedRNCId } = useModule();
  const { user, isAdmin } = useAuth();
  const queryClient = useQueryClient();

  const { data: rnc } = useQuery({
    queryKey: ['rnc-detail', selectedRNCId],
    queryFn: async () => {
      const { data } = await supabase.from('rnc_occurrences')
        .select('*, companies(name), sectors(name)')
        .eq('id', selectedRNCId!).single();
      return data;
    },
    enabled: !!selectedRNCId,
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ['profiles-map'],
    queryFn: async () => { const { data } = await supabase.from('profiles').select('user_id, full_name, sector_id'); return data || []; },
  });

  const { data: sectors = [] } = useQuery({
    queryKey: ['sectors'],
    queryFn: async () => { const { data } = await supabase.from('sectors').select('*'); return data || []; },
  });

  const { data: stages = [] } = useQuery({
    queryKey: ['rnc-stages', selectedRNCId],
    queryFn: async () => {
      const { data } = await supabase.from('rnc_stages').select('*').eq('rnc_id', selectedRNCId!).order('stage_number');
      return data || [];
    },
    enabled: !!selectedRNCId,
  });

  const { data: causeAnalysis } = useQuery({
    queryKey: ['rnc-cause', selectedRNCId],
    queryFn: async () => {
      const { data } = await supabase.from('rnc_cause_analysis').select('*').eq('rnc_id', selectedRNCId!).maybeSingle();
      return data;
    },
    enabled: !!selectedRNCId,
  });

  const { data: actions = [] } = useQuery({
    queryKey: ['rnc-actions', selectedRNCId],
    queryFn: async () => {
      const { data } = await supabase.from('rnc_actions').select('*').eq('rnc_id', selectedRNCId!);
      return data || [];
    },
    enabled: !!selectedRNCId,
  });

  const { data: efficacy } = useQuery({
    queryKey: ['rnc-efficacy', selectedRNCId],
    queryFn: async () => {
      const { data } = await supabase.from('rnc_efficacy').select('*').eq('rnc_id', selectedRNCId!).maybeSingle();
      return data;
    },
    enabled: !!selectedRNCId,
  });

  const getProfileName = (userId: string) => profiles.find(p => p.user_id === userId)?.full_name || 'N/A';
  const isApprover = rnc?.approver_id === user?.id;

  if (!rnc) return <div className="p-6">Carregando...</div>;

  return (
    <div className="p-6 animate-fade-in max-w-4xl mx-auto">
      <button onClick={() => setSelectedRNCId(null)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4" /> Voltar
      </button>

      {/* Header */}
      <div className="bg-card border rounded-lg p-6 mb-4">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-lg font-semibold text-foreground">{rnc.code}</h1>
              <Badge variant="secondary">{statusLabels[rnc.status]}</Badge>
              <Badge variant="outline" className="text-xs">
                {typeLabels[rnc.reclassified_type || rnc.occurrence_type]}
              </Badge>
            </div>
            <p className="text-foreground">{rnc.subject}</p>
            {rnc.description && <p className="text-sm text-muted-foreground mt-1">{rnc.description}</p>}
          </div>
        </div>
        <div className="grid grid-cols-4 gap-4 text-sm">
          <div><span className="text-muted-foreground">Empresa:</span> <span className="font-medium">{(rnc.companies as any)?.name}</span></div>
          <div><span className="text-muted-foreground">Setor:</span> <span className="font-medium">{(rnc.sectors as any)?.name}</span></div>
          <div><span className="text-muted-foreground">Origem:</span> <span className="font-medium">{rnc.origin}</span></div>
          <div><span className="text-muted-foreground">Data:</span> <span className="font-medium">{new Date(rnc.occurrence_date).toLocaleDateString('pt-BR')}</span></div>
          <div><span className="text-muted-foreground">Criado por:</span> <span className="font-medium">{getProfileName(rnc.created_by)}</span></div>
          <div><span className="text-muted-foreground">Aprovador:</span> <span className="font-medium">{getProfileName(rnc.approver_id)}</span></div>
        </div>
      </div>

      {/* Triage */}
      {rnc.status === 'aberta' && (isApprover || isAdmin) && (
        <TriageSection rncId={rnc.id} rnc={rnc} profiles={profiles} sectors={sectors} queryClient={queryClient} user={user} />
      )}

      {rnc.status === 'recusada' && rnc.rejection_reason && (
        <div className="bg-card border border-destructive/30 rounded-lg p-4 mb-4">
          <h3 className="font-medium text-destructive flex items-center gap-2"><XCircle className="h-4 w-4" /> RNC Recusada</h3>
          <p className="text-sm text-muted-foreground mt-1">{rnc.rejection_reason}</p>
        </div>
      )}

      {/* Workflow Steps */}
      {stages.length > 0 && (
        <div className="space-y-4">
          {stages.map((stage) => (
            <StageCard key={stage.id} stage={stage} rnc={rnc} causeAnalysis={causeAnalysis}
              actions={actions} efficacy={efficacy} profiles={profiles} sectors={sectors}
              user={user} isAdmin={isAdmin} queryClient={queryClient} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ======================== TRIAGE ======================== */
function TriageSection({ rncId, rnc, profiles, sectors, queryClient, user }: any) {
  const [reclassifiedType, setReclassifiedType] = useState<OccurrenceType>(rnc.occurrence_type);
  const [reject, setReject] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [notify, setNotify] = useState(true);
  const [loading, setLoading] = useState(false);

  const [stage1Sector, setStage1Sector] = useState('');
  const [stage1User, setStage1User] = useState('');
  const [stage1Deadline, setStage1Deadline] = useState('');
  const [stage3Sector, setStage3Sector] = useState('');
  const [stage5Sector, setStage5Sector] = useState('');

  const sectorUsers = profiles.filter((p: any) => p.sector_id === stage1Sector);

  const handleApprove = async () => {
    setLoading(true);
    try {
      if (reject) {
        await supabase.from('rnc_occurrences').update({
          status: 'recusada', rejection_reason: rejectionReason,
        }).eq('id', rncId);
        toast.success('RNC recusada');
      } else {
        await supabase.from('rnc_occurrences').update({
          status: 'analise_causa', reclassified_type: reclassifiedType, notify_participants: notify,
        }).eq('id', rncId);

        const stageData = [
          { rnc_id: rncId, stage_number: 1, stage_name: 'Análise de Causa', responsible_user_id: stage1User || null, responsible_sector_id: stage1Sector || null, deadline: stage1Deadline || null, status: 'em_andamento' as const },
          { rnc_id: rncId, stage_number: 2, stage_name: 'Plano de Ação', responsible_user_id: stage1User || null, responsible_sector_id: stage1Sector || null, status: 'pendente' as const },
          { rnc_id: rncId, stage_number: 3, stage_name: 'Validação do Setor Especializado', responsible_sector_id: stage3Sector || null, status: 'pendente' as const },
          { rnc_id: rncId, stage_number: 4, stage_name: 'Implementação', responsible_sector_id: stage1Sector || null, status: 'pendente' as const },
          { rnc_id: rncId, stage_number: 5, stage_name: 'Análise de Eficácia', responsible_sector_id: stage5Sector || null, status: 'pendente' as const },
        ];
        await supabase.from('rnc_stages').insert(stageData);

        if (stage1User) {
          await supabase.from('rnc_participants').insert({ rnc_id: rncId, user_id: stage1User, role: 'analyst' });
        }
        toast.success('RNC aprovada e etapas criadas');
      }
      queryClient.invalidateQueries({ queryKey: ['rnc-detail'] });
      queryClient.invalidateQueries({ queryKey: ['rnc-stages'] });
      queryClient.invalidateQueries({ queryKey: ['rnc-list'] });
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-card border rounded-lg p-6 mb-4">
      <h3 className="font-semibold text-foreground mb-4">Triagem da Ocorrência</h3>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Classificação do Tipo de Ocorrência</Label>
          <Select value={reclassifiedType} onValueChange={(v) => setReclassifiedType(v as OccurrenceType)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="real">Real (NC)</SelectItem>
              <SelectItem value="potencial">Potencial</SelectItem>
              <SelectItem value="oportunidade">Oportunidade de Melhoria</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Checkbox checked={reject} onCheckedChange={(c) => setReject(!!c)} />
          <Label className="text-sm">Recusar esta ocorrência</Label>
        </div>

        {reject ? (
          <div className="space-y-2">
            <Label>Motivo da recusa *</Label>
            <Textarea value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} placeholder="Justifique..." />
          </div>
        ) : (
          <div className="space-y-4 border-t pt-4">
            <h4 className="font-medium text-sm text-foreground">Definir Responsáveis das Etapas</h4>

            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <p className="text-sm font-medium">Etapas 1 e 2 — Análise de Causa e Plano de Ação</p>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Setor</Label>
                  <Select value={stage1Sector} onValueChange={setStage1Sector}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="Setor" /></SelectTrigger>
                    <SelectContent>{sectors.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Responsável</Label>
                  <Select value={stage1User} onValueChange={setStage1User}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="Pessoa" /></SelectTrigger>
                    <SelectContent>{sectorUsers.map((u: any) => <SelectItem key={u.user_id} value={u.user_id}>{u.full_name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Prazo</Label>
                  <Input type="date" value={stage1Deadline} onChange={(e) => setStage1Deadline(e.target.value)} className="h-9" />
                </div>
              </div>
            </div>

            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <p className="text-sm font-medium">Etapa 3 — Validação do Setor Especializado</p>
              <div className="space-y-1">
                <Label className="text-xs">Setor Especialista</Label>
                <Select value={stage3Sector} onValueChange={setStage3Sector}>
                  <SelectTrigger className="h-9"><SelectValue placeholder="Setor" /></SelectTrigger>
                  <SelectContent>{sectors.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>

            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <p className="text-sm font-medium">Etapa 5 — Análise de Eficácia</p>
              <div className="space-y-1">
                <Label className="text-xs">Setor Especialista</Label>
                <Select value={stage5Sector} onValueChange={setStage5Sector}>
                  <SelectTrigger className="h-9"><SelectValue placeholder="Setor" /></SelectTrigger>
                  <SelectContent>{sectors.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox checked={notify} onCheckedChange={(c) => setNotify(!!c)} />
              <Label className="text-sm">Notificar responsáveis</Label>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <Button variant={reject ? 'destructive' : 'default'} onClick={handleApprove} disabled={loading || (reject && !rejectionReason)}>
            {loading ? 'Processando...' : reject ? 'Recusar RNC' : 'Aprovar e Criar Etapas'}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ======================== STAGE CARD ======================== */
function StageCard({ stage, rnc, causeAnalysis, actions, efficacy, profiles, sectors, user, isAdmin, queryClient }: any) {
  const stageIcons: Record<string, any> = {
    em_andamento: <Clock className="h-4 w-4 text-primary" />,
    pendente: <Clock className="h-4 w-4 text-muted-foreground" />,
    aprovado: <CheckCircle className="h-4 w-4 text-risk-low" />,
    concluido: <CheckCircle className="h-4 w-4 text-risk-low" />,
    reprovado: <XCircle className="h-4 w-4 text-destructive" />,
  };

  const isActive = stage.status === 'em_andamento';
  const getSectorName = (id: string) => sectors.find((s: any) => s.id === id)?.name || '';

  return (
    <div className={`bg-card border rounded-lg p-4 ${isActive ? 'border-primary/30 ring-1 ring-primary/10' : ''}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {stageIcons[stage.status]}
          <span className="font-medium text-sm">Etapa {stage.stage_number} — {stage.stage_name}</span>
          <Badge variant={isActive ? 'default' : 'secondary'} className="text-xs">
            {stage.status === 'em_andamento' ? 'Em andamento' : stage.status === 'pendente' ? 'Pendente' : stage.status === 'aprovado' ? 'Aprovado' : stage.status === 'concluido' ? 'Concluído' : 'Reprovado'}
          </Badge>
        </div>
        <div className="text-xs text-muted-foreground">
          {stage.responsible_sector_id && <span>Setor: {getSectorName(stage.responsible_sector_id)}</span>}
          {stage.deadline && <span className="ml-3">Prazo: {new Date(stage.deadline).toLocaleDateString('pt-BR')}</span>}
        </div>
      </div>

      {stage.rejection_reason && (
        <div className="bg-destructive/5 border border-destructive/20 rounded p-3 mb-3">
          <p className="text-sm text-destructive"><strong>Motivo da reprovação:</strong> {stage.rejection_reason}</p>
        </div>
      )}

      {/* Stage 1: Análise de Causa */}
      {stage.stage_number === 1 && isActive && (
        <CauseAnalysisForm rncId={rnc.id} stageId={stage.id} existing={causeAnalysis}
          user={user} queryClient={queryClient} />
      )}
      {stage.stage_number === 1 && !isActive && causeAnalysis && (
        <CauseAnalysisReadonly causeAnalysis={causeAnalysis} />
      )}

      {/* Stage 2: Plano de Ação */}
      {stage.stage_number === 2 && isActive && (
        <ActionPlanForm rncId={rnc.id} stageId={stage.id} existing={actions}
          user={user} queryClient={queryClient} profiles={profiles} />
      )}
      {stage.stage_number === 2 && !isActive && actions.length > 0 && (
        <ActionPlanReadonly actions={actions} profiles={profiles} />
      )}

      {/* Stage 3: Validação do Setor Especializado */}
      {stage.stage_number === 3 && isActive && (
        <ValidationForm stageId={stage.id} rncId={rnc.id} queryClient={queryClient} stageName="Validação" />
      )}

      {/* Stage 4: Implementação */}
      {stage.stage_number === 4 && isActive && (
        <ImplementationForm actions={actions} user={user} queryClient={queryClient} rncId={rnc.id} stageId={stage.id} sectors={sectors} />
      )}
      {stage.stage_number === 4 && !isActive && actions.length > 0 && (
        <ActionPlanReadonly actions={actions} profiles={profiles} showImplementation />
      )}

      {/* Stage 5: Análise de Eficácia */}
      {stage.stage_number === 5 && isActive && (
        <EfficacyForm rncId={rnc.id} stageId={stage.id} existing={efficacy}
          user={user} queryClient={queryClient} />
      )}
      {stage.stage_number === 5 && !isActive && efficacy && (
        <div className="text-sm mt-2">
          <p><strong>Resultado:</strong> {efficacy.is_effective ? '✅ Eficaz' : '❌ Ineficaz'}</p>
          {efficacy.evidence && <p className="text-muted-foreground mt-1">{efficacy.evidence}</p>}
        </div>
      )}
    </div>
  );
}

/* ======================== CAUSE ANALYSIS ======================== */
function CauseAnalysisForm({ rncId, stageId, existing, user, queryClient }: any) {
  const [whys, setWhys] = useState({
    why_1: existing?.why_1 || '', why_2: existing?.why_2 || '', why_3: existing?.why_3 || '',
    why_4: existing?.why_4 || '', why_5: existing?.why_5 || '',
  });
  const [rootCause, setRootCause] = useState<number>(existing?.root_cause_why || 1);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      if (existing) {
        await supabase.from('rnc_cause_analysis').update({
          ...whys, root_cause_why: rootCause, root_cause_description: whys[`why_${rootCause}` as keyof typeof whys],
        }).eq('id', existing.id);
      } else {
        await supabase.from('rnc_cause_analysis').insert({
          rnc_id: rncId, ...whys, root_cause_why: rootCause,
          root_cause_description: whys[`why_${rootCause}` as keyof typeof whys],
          analyzed_by: user.id,
        });
      }
      queryClient.invalidateQueries({ queryKey: ['rnc-cause'] });
      toast.success('Análise de causa salva');
    } catch (error: any) { toast.error(error.message); } finally { setLoading(false); }
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      await supabase.from('rnc_stages').update({ status: 'concluido', completed_at: new Date().toISOString() }).eq('id', stageId);
      // Activate stage 2
      const { data: nextStage } = await supabase.from('rnc_stages').select('id').eq('rnc_id', rncId).eq('stage_number', 2).single();
      if (nextStage) await supabase.from('rnc_stages').update({ status: 'em_andamento' }).eq('id', nextStage.id);
      await supabase.from('rnc_occurrences').update({ status: 'plano_acao' }).eq('id', rncId);
      queryClient.invalidateQueries({ queryKey: ['rnc-stages'] });
      queryClient.invalidateQueries({ queryKey: ['rnc-detail'] });
      toast.success('Análise de causa concluída. Próxima etapa: Plano de Ação.');
    } catch (error: any) { toast.error(error.message); } finally { setLoading(false); }
  };

  return (
    <div className="mt-3 space-y-3">
      <h4 className="text-sm font-medium">5 Porquês</h4>
      {[1, 2, 3, 4, 5].map((n) => (
        <div key={n} className="flex items-start gap-2">
          <div className="flex items-center gap-2 mt-2">
            <input type="radio" name="rootCause" checked={rootCause === n} onChange={() => setRootCause(n)} className="accent-primary" />
          </div>
          <div className="flex-1 space-y-1">
            <Label className="text-xs">Por quê {n}? {rootCause === n && <span className="text-primary font-medium">(Causa Raiz)</span>}</Label>
            <Input value={whys[`why_${n}` as keyof typeof whys]} onChange={(e) => setWhys({ ...whys, [`why_${n}`]: e.target.value })} placeholder={`Por quê ${n}...`} className="h-9" />
          </div>
        </div>
      ))}
      <div className="flex justify-end gap-2">
        <Button size="sm" variant="outline" onClick={handleSave} disabled={loading}>Salvar Rascunho</Button>
        <Button size="sm" onClick={handleComplete} disabled={loading}>Concluir Análise e Avançar</Button>
      </div>
    </div>
  );
}

function CauseAnalysisReadonly({ causeAnalysis }: any) {
  return (
    <div className="mt-3 space-y-2 text-sm">
      {[1, 2, 3, 4, 5].map((n) => {
        const value = causeAnalysis[`why_${n}`];
        if (!value) return null;
        return (
          <div key={n} className="flex items-center gap-2">
            <span className={`text-xs font-medium ${causeAnalysis.root_cause_why === n ? 'text-primary' : 'text-muted-foreground'}`}>
              P{n}: {causeAnalysis.root_cause_why === n && '🎯'}
            </span>
            <span>{value}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ======================== ACTION PLAN ======================== */
function ActionPlanForm({ rncId, stageId, existing, user, queryClient, profiles }: any) {
  const [actions, setActions] = useState<any[]>(existing.length > 0 ? existing : []);
  const [loading, setLoading] = useState(false);

  const emptyAction = { what_to_do: '', why_to_do: '', how_to_do: '', responsible_user_id: '', deadline: '', cost: '' };

  const addAction = () => setActions([...actions, { ...emptyAction, _new: true }]);

  const updateAction = (index: number, field: string, value: string) => {
    const updated = [...actions];
    updated[index] = { ...updated[index], [field]: value };
    setActions(updated);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      for (const action of actions) {
        if (action._new) {
          if (!action.what_to_do || !action.why_to_do || !action.how_to_do || !action.responsible_user_id || !action.deadline) {
            toast.error('Preencha todos os campos obrigatórios de cada ação');
            setLoading(false);
            return;
          }
          await supabase.from('rnc_actions').insert({
            rnc_id: rncId, what_to_do: action.what_to_do, why_to_do: action.why_to_do,
            how_to_do: action.how_to_do, responsible_user_id: action.responsible_user_id,
            deadline: action.deadline, cost: action.cost ? parseFloat(action.cost) : null,
          });
        }
      }
      queryClient.invalidateQueries({ queryKey: ['rnc-actions'] });
      toast.success('Plano de ação salvo');
    } catch (error: any) { toast.error(error.message); } finally { setLoading(false); }
  };

  const handleComplete = async () => {
    if (actions.length === 0) { toast.error('Adicione pelo menos uma ação'); return; }
    await handleSave();
    setLoading(true);
    try {
      await supabase.from('rnc_stages').update({ status: 'concluido', completed_at: new Date().toISOString() }).eq('id', stageId);
      const { data: nextStage } = await supabase.from('rnc_stages').select('id').eq('rnc_id', rncId).eq('stage_number', 3).single();
      if (nextStage) await supabase.from('rnc_stages').update({ status: 'em_andamento' }).eq('id', nextStage.id);
      await supabase.from('rnc_occurrences').update({ status: 'validacao' }).eq('id', rncId);
      queryClient.invalidateQueries({ queryKey: ['rnc-stages'] });
      queryClient.invalidateQueries({ queryKey: ['rnc-detail'] });
      toast.success('Plano de ação concluído. Próxima etapa: Validação.');
    } catch (error: any) { toast.error(error.message); } finally { setLoading(false); }
  };

  return (
    <div className="mt-3 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">Plano de Ação (5W2H)</h4>
        <Button size="sm" variant="outline" onClick={addAction}>+ Adicionar Ação</Button>
      </div>

      {actions.map((action: any, i: number) => (
        <div key={action.id || i} className="bg-muted/50 rounded-lg p-4 space-y-3 border">
          <p className="text-sm font-medium text-foreground">Ação {i + 1}</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1 col-span-2">
              <Label className="text-xs">O que fazer? (What) *</Label>
              <Input value={action.what_to_do} onChange={(e) => updateAction(i, 'what_to_do', e.target.value)} className="h-9" disabled={!action._new} />
            </div>
            <div className="space-y-1 col-span-2">
              <Label className="text-xs">Por que fazer? (Why) *</Label>
              <Input value={action.why_to_do} onChange={(e) => updateAction(i, 'why_to_do', e.target.value)} className="h-9" disabled={!action._new} />
            </div>
            <div className="space-y-1 col-span-2">
              <Label className="text-xs">Como fazer? (How) *</Label>
              <Textarea value={action.how_to_do} onChange={(e) => updateAction(i, 'how_to_do', e.target.value)} rows={2} disabled={!action._new} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Responsável (Who) *</Label>
              <Select value={action.responsible_user_id} onValueChange={(v) => updateAction(i, 'responsible_user_id', v)} disabled={!action._new}>
                <SelectTrigger className="h-9"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{profiles.map((p: any) => <SelectItem key={p.user_id} value={p.user_id}>{p.full_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Prazo (When) *</Label>
              <Input type="date" value={action.deadline?.split?.('T')?.[0] || action.deadline || ''} onChange={(e) => updateAction(i, 'deadline', e.target.value)} className="h-9" disabled={!action._new} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Custo (How much)</Label>
              <Input type="number" value={action.cost || ''} onChange={(e) => updateAction(i, 'cost', e.target.value)} placeholder="R$" className="h-9" disabled={!action._new} />
            </div>
          </div>
        </div>
      ))}

      {actions.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">Nenhuma ação adicionada. Clique em "+ Adicionar Ação".</p>
      )}

      <div className="flex justify-end gap-2">
        <Button size="sm" variant="outline" onClick={handleSave} disabled={loading}>Salvar Rascunho</Button>
        <Button size="sm" onClick={handleComplete} disabled={loading}>Concluir Plano e Avançar</Button>
      </div>
    </div>
  );
}

function ActionPlanReadonly({ actions, profiles, showImplementation }: any) {
  const getProfileName = (userId: string) => profiles.find((p: any) => p.user_id === userId)?.full_name || '';
  return (
    <div className="mt-3">
      <h4 className="text-sm font-medium mb-2">Plano de Ação ({actions.length} ações)</h4>
      <div className="space-y-2">
        {actions.map((a: any, i: number) => (
          <div key={a.id} className="bg-muted/50 rounded p-3 text-sm">
            <p className="font-medium">Ação {i + 1}: {a.what_to_do}</p>
            <div className="grid grid-cols-3 gap-2 mt-1 text-xs text-muted-foreground">
              <span>Responsável: {getProfileName(a.responsible_user_id)}</span>
              <span>Prazo: {new Date(a.deadline).toLocaleDateString('pt-BR')}</span>
              <span>{a.is_implemented ? '✅ Implementada' : '⏳ Pendente'}</span>
            </div>
            {showImplementation && a.evidence && (
              <p className="text-xs text-muted-foreground mt-1">Evidência: {a.evidence}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ======================== VALIDATION ======================== */
function ValidationForm({ stageId, rncId, queryClient, stageName }: any) {
  const [rejectionReason, setRejectionReason] = useState('');
  const [reject, setReject] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleValidate = async () => {
    setLoading(true);
    try {
      if (reject) {
        await supabase.from('rnc_stages').update({ status: 'reprovado', rejection_reason: rejectionReason }).eq('id', stageId);
        // Go back to stage 2 (Plano de Ação)
        const { data: stage2 } = await supabase.from('rnc_stages').select('id').eq('rnc_id', rncId).eq('stage_number', 2).single();
        if (stage2) await supabase.from('rnc_stages').update({ status: 'em_andamento' }).eq('id', stage2.id);
        await supabase.from('rnc_occurrences').update({ status: 'plano_acao' }).eq('id', rncId);
        toast.info('Validação reprovada. Retornando ao Plano de Ação.');
      } else {
        await supabase.from('rnc_stages').update({ status: 'aprovado', completed_at: new Date().toISOString() }).eq('id', stageId);
        // Activate stage 4
        const { data: nextStage } = await supabase.from('rnc_stages').select('id').eq('rnc_id', rncId).eq('stage_number', 4).single();
        if (nextStage) await supabase.from('rnc_stages').update({ status: 'em_andamento' }).eq('id', nextStage.id);
        await supabase.from('rnc_occurrences').update({ status: 'implementacao' }).eq('id', rncId);
        toast.success('Validação aprovada. Próxima etapa: Implementação.');
      }
      queryClient.invalidateQueries({ queryKey: ['rnc-stages'] });
      queryClient.invalidateQueries({ queryKey: ['rnc-detail'] });
    } catch (error: any) { toast.error(error.message); } finally { setLoading(false); }
  };

  return (
    <div className="mt-3 space-y-3">
      <p className="text-sm text-muted-foreground">O setor especializado deve validar o plano de ação proposto.</p>
      <div className="flex items-center gap-2">
        <Checkbox checked={reject} onCheckedChange={(c) => setReject(!!c)} />
        <Label className="text-sm">Reprovar e devolver ao Plano de Ação</Label>
      </div>
      {reject && (
        <div className="space-y-1">
          <Label className="text-xs">Motivo da reprovação *</Label>
          <Textarea value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} placeholder="Justifique..." rows={2} />
        </div>
      )}
      <div className="flex justify-end">
        <Button size="sm" variant={reject ? 'destructive' : 'default'} onClick={handleValidate}
          disabled={loading || (reject && !rejectionReason)}>
          {loading ? 'Processando...' : reject ? 'Reprovar' : 'Aprovar Validação'}
        </Button>
      </div>
    </div>
  );
}

/* ======================== IMPLEMENTATION ======================== */
function ImplementationForm({ actions, user, queryClient, rncId, stageId, sectors }: any) {
  const [evidence, setEvidence] = useState<Record<string, string>>({});
  const [validationSector, setValidationSector] = useState('');
  const [validationDeadline, setValidationDeadline] = useState('');
  const [loading, setLoading] = useState(false);

  const allImplemented = actions.every((a: any) => a.is_implemented);

  const handleImplement = async (actionId: string) => {
    setLoading(true);
    try {
      await supabase.from('rnc_actions').update({
        is_implemented: true, implemented_at: new Date().toISOString(),
        evidence: evidence[actionId] || '',
      }).eq('id', actionId);
      queryClient.invalidateQueries({ queryKey: ['rnc-actions'] });
      toast.success('Ação implementada');
    } catch (error: any) { toast.error(error.message); } finally { setLoading(false); }
  };

  const handleFinishStage = async () => {
    if (!validationSector) { toast.error('Selecione o setor para análise de eficácia'); return; }
    if (!validationDeadline) { toast.error('Defina o prazo para análise de eficácia'); return; }
    setLoading(true);
    try {
      await supabase.from('rnc_stages').update({ status: 'concluido', completed_at: new Date().toISOString() }).eq('id', stageId);
      // Update stage 5 with sector and deadline
      const { data: stage5 } = await supabase.from('rnc_stages').select('id').eq('rnc_id', rncId).eq('stage_number', 5).single();
      if (stage5) {
        await supabase.from('rnc_stages').update({
          status: 'em_andamento', responsible_sector_id: validationSector, deadline: validationDeadline,
        }).eq('id', stage5.id);
      }
      await supabase.from('rnc_occurrences').update({ status: 'eficacia' }).eq('id', rncId);
      await supabase.from('rnc_efficacy').insert({ rnc_id: rncId, scheduled_date: validationDeadline });
      queryClient.invalidateQueries({ queryKey: ['rnc-stages'] });
      queryClient.invalidateQueries({ queryKey: ['rnc-detail'] });
      toast.success('Implementação finalizada. Eficácia agendada.');
    } catch (error: any) { toast.error(error.message); } finally { setLoading(false); }
  };

  return (
    <div className="mt-3 space-y-3">
      <h4 className="text-sm font-medium">Implementação das Ações</h4>
      {actions.filter((a: any) => !a.is_implemented).map((action: any) => (
        <div key={action.id} className="bg-muted/50 rounded p-3 space-y-2">
          <p className="text-sm font-medium">{action.what_to_do}</p>
          <div className="space-y-1">
            <Label className="text-xs">Evidência da implementação</Label>
            <Textarea value={evidence[action.id] || ''} onChange={(e) => setEvidence({ ...evidence, [action.id]: e.target.value })}
              placeholder="Descreva a evidência..." rows={2} />
          </div>
          <Button size="sm" onClick={() => handleImplement(action.id)} disabled={loading}>Marcar como Implementada</Button>
        </div>
      ))}

      {actions.filter((a: any) => a.is_implemented).length > 0 && (
        <div className="text-sm text-muted-foreground">
          ✅ {actions.filter((a: any) => a.is_implemented).length} de {actions.length} ações implementadas
        </div>
      )}

      {allImplemented && (
        <div className="border-t pt-4 space-y-3">
          <h4 className="text-sm font-medium">Finalizar Implementação</h4>
          <p className="text-xs text-muted-foreground">Selecione o setor especializado e o prazo para a análise de eficácia.</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Setor para Análise de Eficácia *</Label>
              <Select value={validationSector} onValueChange={setValidationSector}>
                <SelectTrigger className="h-9"><SelectValue placeholder="Setor" /></SelectTrigger>
                <SelectContent>{sectors.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Prazo para Eficácia *</Label>
              <Input type="date" value={validationDeadline} onChange={(e) => setValidationDeadline(e.target.value)} className="h-9" />
            </div>
          </div>
          <Button onClick={handleFinishStage} disabled={loading}>
            {loading ? 'Processando...' : 'Finalizar Implementação e Agendar Eficácia'}
          </Button>
        </div>
      )}
    </div>
  );
}

/* ======================== EFFICACY ======================== */
function EfficacyForm({ rncId, stageId, existing, user, queryClient }: any) {
  const [isEffective, setIsEffective] = useState<boolean | null>(existing?.is_effective ?? null);
  const [evidence, setEvidence] = useState(existing?.evidence || '');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (isEffective === null) { toast.error('Selecione se foi eficaz ou ineficaz'); return; }
    setLoading(true);
    try {
      if (existing) {
        await supabase.from('rnc_efficacy').update({
          is_effective: isEffective, evidence, evaluated_by: user.id,
          evaluation_date: new Date().toISOString().split('T')[0],
        }).eq('id', existing.id);
      }

      if (isEffective) {
        await supabase.from('rnc_stages').update({ status: 'concluido', completed_at: new Date().toISOString() }).eq('id', stageId);
        await supabase.from('rnc_occurrences').update({ status: 'concluida' }).eq('id', rncId);
        toast.success('RNC concluída com eficácia!');
      } else {
        // Return to stage 2 (Plano de Ação)
        await supabase.from('rnc_stages').update({ status: 'reprovado' }).eq('id', stageId);
        const { data: stage2 } = await supabase.from('rnc_stages').select('id').eq('rnc_id', rncId).eq('stage_number', 2).single();
        if (stage2) await supabase.from('rnc_stages').update({ status: 'em_andamento' }).eq('id', stage2.id);
        await supabase.from('rnc_occurrences').update({ status: 'plano_acao' }).eq('id', rncId);
        toast.info('Eficácia não comprovada. Retornando ao Plano de Ação.');
      }
      queryClient.invalidateQueries({ queryKey: ['rnc-efficacy'] });
      queryClient.invalidateQueries({ queryKey: ['rnc-stages'] });
      queryClient.invalidateQueries({ queryKey: ['rnc-detail'] });
    } catch (error: any) { toast.error(error.message); } finally { setLoading(false); }
  };

  return (
    <div className="mt-3 space-y-3">
      <p className="text-sm text-muted-foreground">
        {existing?.scheduled_date && `Data agendada: ${new Date(existing.scheduled_date).toLocaleDateString('pt-BR')}`}
      </p>
      <div className="flex gap-3">
        <label className={`flex items-center gap-2 px-4 py-2 rounded-md border cursor-pointer text-sm ${isEffective === true ? 'border-risk-low bg-risk-low-light' : 'border-border'}`}>
          <input type="radio" name="efficacy" checked={isEffective === true} onChange={() => setIsEffective(true)} className="accent-primary" />
          Eficaz
        </label>
        <label className={`flex items-center gap-2 px-4 py-2 rounded-md border cursor-pointer text-sm ${isEffective === false ? 'border-destructive bg-destructive/5' : 'border-border'}`}>
          <input type="radio" name="efficacy" checked={isEffective === false} onChange={() => setIsEffective(false)} className="accent-primary" />
          Ineficaz
        </label>
      </div>
      <div className="space-y-1">
        <Label>Evidência</Label>
        <Textarea value={evidence} onChange={(e) => setEvidence(e.target.value)} placeholder="Descreva a evidência..." />
      </div>
      <Button onClick={handleSave} disabled={loading}>{loading ? 'Salvando...' : 'Salvar Avaliação'}</Button>
    </div>
  );
}

import { useState } from 'react';
import { ArrowLeft, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';
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

export default function RNCDetail() {
  const { selectedRNCId, setSelectedRNCId } = useModule();
  const { user, isAdmin } = useAuth();
  const queryClient = useQueryClient();

  const { data: rnc } = useQuery({
    queryKey: ['rnc-detail', selectedRNCId],
    queryFn: async () => {
      const { data } = await supabase
        .from('rnc_occurrences')
        .select('*, companies(name), sectors(name)')
        .eq('id', selectedRNCId!)
        .single();
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
  const isCreator = rnc?.created_by === user?.id;

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

      {/* Triage - if status is aberta and user is approver */}
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

function TriageSection({ rncId, rnc, profiles, sectors, queryClient, user }: any) {
  const [reclassifiedType, setReclassifiedType] = useState<OccurrenceType>(rnc.occurrence_type);
  const [reject, setReject] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [notify, setNotify] = useState(true);
  const [loading, setLoading] = useState(false);

  // Stage assignments
  const [stage1User, setStage1User] = useState('');
  const [stage1Sector, setStage1Sector] = useState('');
  const [stage1Deadline, setStage1Deadline] = useState('');
  const [stage2Sector, setStage2Sector] = useState('');
  const [stage3Sector, setStage3Sector] = useState('');
  const [stage4Sector, setStage4Sector] = useState('');

  const sectorUsers = profiles.filter((p: any) => p.sector_id === stage1Sector);

  const handleApprove = async () => {
    setLoading(true);
    try {
      if (reject) {
        await supabase.from('rnc_occurrences').update({
          status: 'recusada',
          rejection_reason: rejectionReason,
        }).eq('id', rncId);
        toast.success('RNC recusada');
      } else {
        // Update RNC
        await supabase.from('rnc_occurrences').update({
          status: 'analise_causa',
          reclassified_type: reclassifiedType,
          notify_participants: notify,
        }).eq('id', rncId);

        // Create stages
        const stageData = [
          { rnc_id: rncId, stage_number: 1, stage_name: 'Análise de Causa', responsible_user_id: stage1User || null, responsible_sector_id: stage1Sector || null, deadline: stage1Deadline || null, status: 'em_andamento' as const },
          { rnc_id: rncId, stage_number: 2, stage_name: 'Validação', responsible_sector_id: stage2Sector || null, deadline: stage1Deadline ? new Date(new Date(stage1Deadline).getTime() + 5 * 86400000).toISOString().split('T')[0] : null, status: 'pendente' as const },
          { rnc_id: rncId, stage_number: 3, stage_name: 'Implementação', responsible_sector_id: stage3Sector || null, status: 'pendente' as const },
          { rnc_id: rncId, stage_number: 4, stage_name: 'Validação Final', responsible_sector_id: stage3Sector || null, status: 'pendente' as const },
          { rnc_id: rncId, stage_number: 5, stage_name: 'Avaliação de Eficácia', responsible_sector_id: stage4Sector || null, status: 'pendente' as const },
        ];
        await supabase.from('rnc_stages').insert(stageData);

        // Add participants
        if (stage1User) {
          await supabase.from('rnc_participants').insert({
            rnc_id: rncId, user_id: stage1User, role: 'analyst'
          });
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
              <p className="text-sm font-medium">Etapa 1 — Análise de Causa e Plano de Ação</p>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Setor</Label>
                  <Select value={stage1Sector} onValueChange={setStage1Sector}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="Setor" /></SelectTrigger>
                    <SelectContent>
                      {sectors.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Responsável</Label>
                  <Select value={stage1User} onValueChange={setStage1User}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="Pessoa" /></SelectTrigger>
                    <SelectContent>
                      {sectorUsers.map((u: any) => <SelectItem key={u.user_id} value={u.user_id}>{u.full_name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Prazo</Label>
                  <Input type="date" value={stage1Deadline} onChange={(e) => setStage1Deadline(e.target.value)} className="h-9" />
                </div>
              </div>
            </div>

            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <p className="text-sm font-medium">Etapa 2 — Validação (Prazo: 5 dias após Etapa 1)</p>
              <div className="space-y-1">
                <Label className="text-xs">Setor Especialista</Label>
                <Select value={stage2Sector} onValueChange={setStage2Sector}>
                  <SelectTrigger className="h-9"><SelectValue placeholder="Setor" /></SelectTrigger>
                  <SelectContent>
                    {sectors.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <p className="text-sm font-medium">Etapa 3 — Implementação</p>
              <div className="space-y-1">
                <Label className="text-xs">Setor Responsável</Label>
                <Select value={stage3Sector} onValueChange={setStage3Sector}>
                  <SelectTrigger className="h-9"><SelectValue placeholder="Setor" /></SelectTrigger>
                  <SelectContent>
                    {sectors.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <p className="text-sm font-medium">Etapa 4/5 — Avaliação de Eficácia</p>
              <div className="space-y-1">
                <Label className="text-xs">Setor Especialista</Label>
                <Select value={stage4Sector} onValueChange={setStage4Sector}>
                  <SelectTrigger className="h-9"><SelectValue placeholder="Setor" /></SelectTrigger>
                  <SelectContent>
                    {sectors.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
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
  const getProfileName = (userId: string) => profiles.find((p: any) => p.user_id === userId)?.full_name || '';

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

      {/* Stage 1: Cause Analysis */}
      {stage.stage_number === 1 && isActive && (
        <CauseAnalysisForm rncId={rnc.id} stageId={stage.id} existing={causeAnalysis}
          user={user} queryClient={queryClient} profiles={profiles} />
      )}
      {stage.stage_number === 1 && !isActive && causeAnalysis && (
        <CauseAnalysisReadonly causeAnalysis={causeAnalysis} />
      )}

      {/* Stage 2: Action Plan (shown in stage 1 after cause is approved, or in stage 2) */}
      {(stage.stage_number === 2 || (stage.stage_number === 1 && (stage.status === 'aprovado' || stage.status === 'concluido'))) && actions.length > 0 && (
        <ActionPlanReadonly actions={actions} profiles={profiles} />
      )}

      {/* Stage 3: Implementation */}
      {stage.stage_number === 3 && isActive && (
        <ImplementationForm actions={actions} user={user} queryClient={queryClient} rncId={rnc.id} stageId={stage.id} />
      )}

      {/* Stage 5: Efficacy */}
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

function CauseAnalysisForm({ rncId, stageId, existing, user, queryClient, profiles }: any) {
  const [whys, setWhys] = useState({
    why_1: existing?.why_1 || '',
    why_2: existing?.why_2 || '',
    why_3: existing?.why_3 || '',
    why_4: existing?.why_4 || '',
    why_5: existing?.why_5 || '',
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
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
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
      <div className="flex justify-end">
        <Button size="sm" onClick={handleSave} disabled={loading}>{loading ? 'Salvando...' : 'Salvar Análise de Causa'}</Button>
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

function ActionPlanReadonly({ actions, profiles }: any) {
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
          </div>
        ))}
      </div>
    </div>
  );
}

function ImplementationForm({ actions, user, queryClient, rncId, stageId }: any) {
  const [evidence, setEvidence] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const myActions = actions.filter((a: any) => a.responsible_user_id === user?.id && !a.is_implemented);
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
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFinishStage = async () => {
    setLoading(true);
    try {
      await supabase.from('rnc_stages').update({ status: 'concluido', completed_at: new Date().toISOString() }).eq('id', stageId);
      await supabase.from('rnc_occurrences').update({ status: 'eficacia' }).eq('id', rncId);
      // Schedule efficacy evaluation 30 days from now
      const scheduledDate = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
      await supabase.from('rnc_efficacy').insert({ rnc_id: rncId, scheduled_date: scheduledDate });
      queryClient.invalidateQueries({ queryKey: ['rnc-stages'] });
      queryClient.invalidateQueries({ queryKey: ['rnc-detail'] });
      toast.success('Etapa finalizada. Eficácia agendada para 30 dias.');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-3 space-y-3">
      {myActions.map((action: any) => (
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
      {allImplemented && (
        <div className="pt-2">
          <Button onClick={handleFinishStage} disabled={loading}>Finalizar Etapa de Implementação</Button>
        </div>
      )}
    </div>
  );
}

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
        // Restart from action plan
        await supabase.from('rnc_occurrences').update({ status: 'plano_acao' }).eq('id', rncId);
        toast.info('Eficácia não comprovada. Fluxo retorna ao Plano de Ação.');
      }
      queryClient.invalidateQueries({ queryKey: ['rnc-efficacy'] });
      queryClient.invalidateQueries({ queryKey: ['rnc-stages'] });
      queryClient.invalidateQueries({ queryKey: ['rnc-detail'] });
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-3 space-y-3">
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

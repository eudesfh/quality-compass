import { useState, useRef } from 'react';
import { CheckCircle, XCircle, Clock, Upload, Paperclip, FileText, ArrowLeft, Plus, Pencil } from 'lucide-react';
import AdminEditRNCDialog from './AdminEditRNCDialog';
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
import { formatDateBR } from '@/lib/utils';

type RNCStatus = Database['public']['Enums']['rnc_status'];
type OccurrenceType = Database['public']['Enums']['occurrence_type'];
type CritLevel = Database['public']['Enums']['criticality_level'];

const statusLabels: Record<RNCStatus, string> = {
  aberta: 'Aberta', triagem: 'Triagem', analise_causa: 'Análise de Causa',
  plano_acao: 'Plano de Ação', validacao: 'Validação', implementacao: 'Implementação',
  eficacia: 'Eficácia', concluida: 'Concluída', recusada: 'Recusada',
};

const typeLabels: Record<OccurrenceType, string> = {
  real: 'Real (NC)', potencial: 'Potencial', oportunidade: 'Oportunidade de Melhoria',
};

// Stages for "Real" type
const REAL_STAGES = ['Análise de Causa', 'Plano de Ação', 'Validação', 'Implementação', 'Análise de Eficácia'];
// Stages for "Oportunidade" type
const OPORTUNIDADE_STAGES = ['Plano de Ação', 'Implementação', 'Análise de Eficácia'];

function getStageNames(occType: OccurrenceType): string[] {
  return occType === 'oportunidade' ? OPORTUNIDADE_STAGES : REAL_STAGES;
}

const openFileUrl = async (path: string) => {
  const { data, error } = await supabase.storage.from('rnc-attachments').createSignedUrl(path, 3600);
  if (error || !data?.signedUrl) {
    toast.error('Erro ao abrir o arquivo');
    return;
  }
  window.open(data.signedUrl, '_blank');
};

const SignedFileLink = ({ path, children, className }: { path: string; children: React.ReactNode; className?: string }) => (
  <button type="button" onClick={() => openFileUrl(path)} className={className}>
    {children}
  </button>
);

export default function RNCDetail() {
  const { selectedRNCId, setSelectedRNCId, setActiveModule, setShowRNCForm, setRncPreFill } = useModule();
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

  const { data: initialAttachments = [] } = useQuery({
    queryKey: ['rnc-attachments', selectedRNCId],
    queryFn: async () => {
      const { data } = await supabase.from('rnc_attachments').select('*').eq('rnc_id', selectedRNCId!);
      return data || [];
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

  const getActiveStageNumber = () => {
    const activeStage = stages.find(s => s.status === 'em_andamento');
    if (activeStage) return activeStage.stage_number;
    if (stages.length > 0 && stages.every(s => s.status === 'concluido' || s.status === 'aprovado')) return stages.length + 1;
    return 0;
  };

  const [viewingStage, setViewingStage] = useState<number | null>(null);
  const [adminEditOpen, setAdminEditOpen] = useState(false);

  if (!rnc) return <div className="p-6">Carregando...</div>;

  const effectiveType = (rnc.reclassified_type || rnc.occurrence_type) as OccurrenceType;
  const stageNames = getStageNames(effectiveType);
  const activeStageNum = getActiveStageNumber();
  const displayStage = viewingStage ?? activeStageNum;

  const getStageStatus = (num: number) => {
    const s = stages.find(st => st.stage_number === num);
    return s?.status || 'pendente';
  };

  const canViewStage = (num: number) => !!stages.find(st => st.stage_number === num);

  const handleCreateRealFromOportunidade = () => {
    setRncPreFill({
      occurrence_type: 'real',
      origin: 'Oportunidade de Melhoria',
      subject: rnc.subject,
      description: rnc.description || '',
      sourceRNCId: rnc.id,
    });
    setSelectedRNCId(null);
    setShowRNCForm(true);
  };

  const userProfile = profiles.find((p: any) => p.user_id === user?.id);
  const userSector = sectors.find((s: any) => s.id === userProfile?.sector_id);
  const isProcessos = userSector?.name?.toLowerCase().includes('processos');
  const canDeleteDirectly = activeStageNum <= 2 || isAdmin || isProcessos;

  const handleDeleteRNC = async () => {
    if (canDeleteDirectly) {
      if (!confirm('Tem certeza que deseja excluir esta ocorrência permanentemente?')) return;
      try {
        await supabase.from('rnc_occurrences').delete().eq('id', rnc.id);
        toast.success('Ocorrência excluída com sucesso.');
        setSelectedRNCId(null);
        queryClient.invalidateQueries({ queryKey: ['rnc-list'] });
      } catch (error: any) { toast.error(error.message); }
    } else {
      const reason = window.prompt('A exclusão desta ocorrência (após etapa 2) requer aprovação. Por favor, digite o motivo da exclusão para notificar o setor de Processos:');
      if (!reason) return;
      try {
        const processosUsers = profiles.filter((p: any) => {
          const s = sectors.find((sec: any) => sec.id === p.sector_id);
          return s?.name?.toLowerCase().includes('processos');
        });
        const notifications = processosUsers.map((u: any) => ({
          user_id: u.user_id,
          title: 'Solicitação de Exclusão de Ocorrência',
          message: `O usuário ${userProfile?.full_name || 'Desconhecido'} solicitou a exclusão da ocorrência ${rnc.code}. Motivo: ${reason}`,
          type: 'rnc', reference_type: 'rnc', reference_id: rnc.id,
        }));
        if (notifications.length > 0) {
          await supabase.from('notifications').insert(notifications);
        }
        toast.success('Solicitação de exclusão enviada ao setor de Processos.');
      } catch (error: any) { toast.error(error.message); }
    }
  };

  return (
    <div className="p-6 animate-fade-in max-w-5xl mx-auto">
      <Button variant="ghost" size="sm" onClick={() => setSelectedRNCId(null)} className="mb-4 gap-1">
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Button>

      {/* Header */}
      <div className="bg-card border rounded-lg p-6 mb-4">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-lg font-semibold text-foreground">{rnc.code}</h1>
              <Badge variant="secondary">{statusLabels[rnc.status]}</Badge>
              <Badge variant="outline" className="text-xs">
                {typeLabels[effectiveType]}
              </Badge>
            </div>
            <p className="text-foreground">{rnc.subject}</p>
            {rnc.description && <p className="text-sm text-muted-foreground mt-1">{rnc.description}</p>}
          </div>
          <div className="flex items-center gap-2">
            {effectiveType === 'oportunidade' && (rnc.status === 'concluida' || rnc.status === 'plano_acao') && (
              <Button variant="outline" size="sm" onClick={handleCreateRealFromOportunidade}>
                <Plus className="h-3.5 w-3.5 mr-1" /> Criar NC Real
              </Button>
            )}
            {isAdmin && (
              <Button variant="outline" size="sm" onClick={() => setAdminEditOpen(true)}>
                <Pencil className="h-3.5 w-3.5 mr-1" /> Editar
              </Button>
            )}
            <Button variant="destructive" size="sm" onClick={handleDeleteRNC}>
              {canDeleteDirectly ? 'Excluir' : 'Solicitar Exclusão'}
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div><span className="text-muted-foreground">Empresa:</span> <span className="font-medium">{(rnc.companies as any)?.name}</span></div>
          <div><span className="text-muted-foreground">Setor Receptor:</span> <span className="font-medium">{(rnc.sectors as any)?.name}</span></div>
          <div><span className="text-muted-foreground">Origem:</span> <span className="font-medium">{rnc.origin}</span></div>
          <div><span className="text-muted-foreground">Data:</span> <span className="font-medium">{formatDateBR(rnc.occurrence_date)}</span></div>
          <div><span className="text-muted-foreground">Criado por:</span> <span className="font-medium">{getProfileName(rnc.created_by)}</span></div>
          <div><span className="text-muted-foreground">Aprovador:</span> <span className="font-medium">{getProfileName(rnc.approver_id)}</span></div>
          <div><span className="text-muted-foreground">Criticidade:</span> <span className="font-medium capitalize">{rnc.criticality}</span></div>
        </div>
        {initialAttachments.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-sm font-medium mb-2">Anexos da Ocorrência:</p>
            <div className="flex flex-wrap gap-2">
              {initialAttachments.map((att: any) => (
                <SignedFileLink key={att.id} path={att.file_path} className="inline-block">
                  <Badge variant="outline" className="flex items-center gap-1 hover:bg-muted cursor-pointer">
                    <Paperclip className="h-3 w-3" />
                    {att.file_name}
                  </Badge>
                </SignedFileLink>
              ))}
            </div>
          </div>
        )}
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

      {/* Horizontal Stepper */}
      {stages.length > 0 && (
        <div className="bg-card border rounded-lg p-6 mb-4">
          <div className="flex items-center justify-between mb-6">
            {stageNames.map((name, i) => {
              const num = i + 1;
              const status = getStageStatus(num);
              const isActive = num === activeStageNum;
              const isCompleted = status === 'concluido' || status === 'aprovado';
              const isRejected = status === 'reprovado';
              const isViewing = displayStage === num;
              const clickable = canViewStage(num);

              return (
                <div key={num} className="flex items-center flex-1">
                  <button
                    onClick={() => clickable && setViewingStage(num)}
                    disabled={!clickable}
                    className={`flex flex-col items-center gap-1.5 flex-1 transition-all ${clickable ? 'cursor-pointer' : 'cursor-default opacity-50'}`}
                  >
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-all ${
                      isViewing ? 'ring-2 ring-primary/30 ring-offset-2 ring-offset-card' : ''
                    } ${
                      isCompleted ? 'bg-primary border-primary text-primary-foreground' :
                      isRejected ? 'bg-destructive border-destructive text-destructive-foreground' :
                      isActive ? 'bg-primary/10 border-primary text-primary' :
                      'bg-muted border-border text-muted-foreground'
                    }`}>
                      {isCompleted ? <CheckCircle className="h-4 w-4" /> :
                       isRejected ? <XCircle className="h-4 w-4" /> :
                       num}
                    </div>
                    <span className={`text-xs font-medium text-center leading-tight max-w-[90px] ${
                      isActive ? 'text-primary' : isCompleted ? 'text-foreground' : 'text-muted-foreground'
                    }`}>{name}</span>
                  </button>
                  {i < stageNames.length - 1 && (
                    <div className={`h-0.5 flex-1 mx-1 mt-[-20px] ${isCompleted ? 'bg-primary' : 'bg-border'}`} />
                  )}
                </div>
              );
            })}
          </div>

          <div className="border-t pt-4">
            <StageContent
              stageNumber={displayStage}
              stages={stages}
              rnc={rnc}
              causeAnalysis={causeAnalysis}
              actions={actions}
              efficacy={efficacy}
              profiles={profiles}
              sectors={sectors}
              user={user}
              isAdmin={isAdmin}
              queryClient={queryClient}
              activeStageNum={activeStageNum}
              effectiveType={effectiveType}
            />
          </div>
        </div>
      )}

      {isAdmin && adminEditOpen && (
        <AdminEditRNCDialog
          open={adminEditOpen}
          onOpenChange={setAdminEditOpen}
          rnc={rnc}
          profiles={profiles}
          sectors={sectors}
          queryClient={queryClient}
        />
      )}
    </div>
  );
}

/* ======================== STAGE CONTENT ======================== */
function StageContent({ stageNumber, stages, rnc, causeAnalysis, actions, efficacy, profiles, sectors, user, isAdmin, queryClient, activeStageNum, effectiveType }: any) {
  const stage = stages.find((s: any) => s.stage_number === stageNumber);
  if (!stage) return <p className="text-sm text-muted-foreground py-4">Etapa não disponível.</p>;

  const isActive = stage.status === 'em_andamento';
  const getSectorName = (id: string) => sectors.find((s: any) => s.id === id)?.name || '';

  // For "oportunidade", stage 1 is Plano de Ação (maps to ActionPlan)
  const isOportunidade = effectiveType === 'oportunidade';

  const userProfile = profiles.find((p: any) => p.user_id === user?.id);
  const userSector = sectors.find((s: any) => s.id === userProfile?.sector_id);
  const isProcessos = userSector?.name?.toLowerCase().includes('processos');
  const canValidate = isAdmin || isProcessos;
  const canExecuteStage = isAdmin || isProcessos || user?.id === stage.responsible_user_id;
  const canUserExecuteImplementation = canExecuteStage || actions.some((a: any) => a.responsible_user_id === user?.id);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">Etapa {stage.stage_number} — {stage.stage_name}</span>
          <Badge variant={isActive ? 'default' : 'secondary'} className="text-xs">
            {stage.status === 'em_andamento' ? 'Em andamento' : stage.status === 'pendente' ? 'Pendente' : stage.status === 'aprovado' ? 'Aprovado' : stage.status === 'concluido' ? 'Concluído' : 'Reprovado'}
          </Badge>
        </div>
        <div className="text-xs text-muted-foreground flex gap-3">
          {stage.responsible_sector_id && <span>Setor: {getSectorName(stage.responsible_sector_id)}</span>}
          {stage.deadline && <span>Prazo: {formatDateBR(stage.deadline)}</span>}
        </div>
      </div>

      {stage.rejection_reason && (
        <div className="bg-destructive/5 border border-destructive/20 rounded p-3 mb-3">
          <p className="text-sm text-destructive"><strong>Motivo da reprovação:</strong> {stage.rejection_reason}</p>
        </div>
      )}

      {isOportunidade ? (
        <>
          {/* Oportunidade: stage 1 */}
          {stage.stage_number === 1 && isActive && (
            canExecuteStage ? (
              <ActionPlanFormOportunidade rncId={rnc.id} stageId={stage.id} existing={actions} rnc={rnc}
                user={user} queryClient={queryClient} profiles={profiles} />
            ) : (
              <p className="text-sm text-muted-foreground py-2">⏳ Aguardando elaboração do Plano de Ação pelo responsável.</p>
            )
          )}
          {stage.stage_number === 1 && !isActive && actions.length > 0 && (
            <ActionPlanReadonly actions={actions} profiles={profiles} causeAnalysis={null} />
          )}
          {stage.stage_number === 2 && isActive && (
            canUserExecuteImplementation ? (
              <ImplementationForm actions={actions} user={user} isAdmin={isAdmin} isProcessos={isProcessos} queryClient={queryClient} rncId={rnc.id} stageId={stage.id} sectors={sectors} isOportunidade={true} />
            ) : (
              <p className="text-sm text-muted-foreground py-2">⏳ Aguardando implementação das ações pelos responsáveis.</p>
            )
          )}
          {stage.stage_number === 2 && !isActive && actions.length > 0 && (
            <ActionPlanReadonly actions={actions} profiles={profiles} showImplementation causeAnalysis={null} />
          )}
          {stage.stage_number === 3 && isActive && (
            canValidate ? (
              <EfficacyForm rncId={rnc.id} stageId={stage.id} existing={efficacy} user={user} queryClient={queryClient} />
            ) : (
              <p className="text-sm text-muted-foreground py-2">⏳ Aguardando análise de eficácia do setor de Processos.</p>
            )
          )}
          {stage.stage_number === 3 && !isActive && efficacy && (
            <div className="text-sm mt-2">
              <p><strong>Resultado:</strong> {efficacy.is_effective ? '✅ Eficaz' : '❌ Ineficaz'}</p>
              {efficacy.evidence && <p className="text-muted-foreground mt-1">{efficacy.evidence}</p>}
            </div>
          )}
        </>
      ) : (
        // Real: 5 stages
        <>
          {stage.stage_number === 1 && isActive && (
            canExecuteStage ? (
              <CauseAnalysisForm rncId={rnc.id} stageId={stage.id} existing={causeAnalysis} user={user} queryClient={queryClient} />
            ) : (
              <p className="text-sm text-muted-foreground py-2">⏳ Aguardando Análise de Causa pelo responsável.</p>
            )
          )}
          {stage.stage_number === 1 && !isActive && causeAnalysis && (
            <CauseAnalysisReadonly causeAnalysis={causeAnalysis} />
          )}
 
          {stage.stage_number === 2 && isActive && (
            canExecuteStage ? (
              <ActionPlanForm rncId={rnc.id} stageId={stage.id} existing={actions} rnc={rnc} user={user} queryClient={queryClient} profiles={profiles} causeAnalysis={causeAnalysis} />
            ) : (
              <p className="text-sm text-muted-foreground py-2">⏳ Aguardando elaboração do Plano de Ação pelo responsável.</p>
            )
          )}
          {stage.stage_number === 2 && !isActive && actions.length > 0 && (
            <ActionPlanReadonly actions={actions} profiles={profiles} causeAnalysis={causeAnalysis} />
          )}

          {stage.stage_number === 3 && isActive && (
            canValidate ? (
              <div className="space-y-4">
                {actions.length > 0 && <ActionPlanReadonly actions={actions} profiles={profiles} causeAnalysis={causeAnalysis} />}
                <ValidationForm stageId={stage.id} rncId={rnc.id} rnc={rnc} queryClient={queryClient} sectors={sectors} />
              </div>
            ) : (
              <div className="space-y-4">
                {actions.length > 0 && <ActionPlanReadonly actions={actions} profiles={profiles} causeAnalysis={causeAnalysis} />}
                <p className="text-sm text-muted-foreground py-2">⏳ Aguardando validação do setor de Processos.</p>
              </div>
            )
          )}
          {stage.stage_number === 3 && !isActive && (stage.status === 'aprovado' || stage.status === 'concluido') && (
            <p className="text-sm text-muted-foreground py-2">✅ Validação aprovada pelo setor especializado.</p>
          )}

          {stage.stage_number === 4 && isActive && (
            canUserExecuteImplementation ? (
              <ImplementationForm actions={actions} user={user} isAdmin={isAdmin} isProcessos={isProcessos} queryClient={queryClient} rncId={rnc.id} stageId={stage.id} sectors={sectors} isOportunidade={false} />
            ) : (
              <p className="text-sm text-muted-foreground py-2">⏳ Aguardando implementação das ações pelos responsáveis.</p>
            )
          )}
          {stage.stage_number === 4 && !isActive && actions.length > 0 && (
            <ActionPlanReadonly actions={actions} profiles={profiles} showImplementation causeAnalysis={causeAnalysis} />
          )}

          {stage.stage_number === 5 && isActive && (
            canValidate ? (
              <EfficacyForm rncId={rnc.id} stageId={stage.id} existing={efficacy} user={user} queryClient={queryClient} />
            ) : (
              <p className="text-sm text-muted-foreground py-2">⏳ Aguardando análise de eficácia do setor de Processos.</p>
            )
          )}
          {stage.stage_number === 5 && !isActive && efficacy && (
            <div className="text-sm mt-2">
              <p><strong>Resultado:</strong> {efficacy.is_effective ? '✅ Eficaz' : '❌ Ineficaz'}</p>
              {efficacy.evidence && <p className="text-muted-foreground mt-1">{efficacy.evidence}</p>}
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ======================== TRIAGE ======================== */
function TriageSection({ rncId, rnc, profiles, sectors, queryClient, user }: any) {
  const [reclassifiedType, setReclassifiedType] = useState<OccurrenceType>(rnc.occurrence_type);
  const [criticality, setCriticality] = useState<CritLevel>(rnc.criticality);
  const [reject, setReject] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [notify, setNotify] = useState(true);
  const [loading, setLoading] = useState(false);

  const [stage1Sector, setStage1Sector] = useState(rnc?.sector_id || '');
  const [stage1User, setStage1User] = useState('');
  const [stage1Deadline, setStage1Deadline] = useState('');
  const [stage3Sector, setStage3Sector] = useState('');
  const [stage5Sector, setStage5Sector] = useState('');

  const sectorMatch = profiles.filter((p: any) => p?.user_id && stage1Sector && p.sector_id === stage1Sector);
  const sectorUsers = sectorMatch.length > 0 ? sectorMatch : profiles.filter((p: any) => p?.user_id);

  const handleApprove = async () => {
    setLoading(true);
    try {
      if (reject) {
        await supabase.from('rnc_occurrences').update({
          status: 'recusada', rejection_reason: rejectionReason, criticality,
        }).eq('id', rncId);
        toast.success('RNC recusada');
      } else {
        const isOportunidade = reclassifiedType === 'oportunidade';

        if (isOportunidade && (!stage1Sector || !stage1User || !stage1Deadline)) {
          toast.error('Preencha todos os campos obrigatórios da Etapa 1 e 2.');
          setLoading(false);
          return;
        }

        if (!isOportunidade && (!stage1Sector || !stage1User || !stage1Deadline || !stage3Sector || !stage5Sector)) {
          toast.error('Preencha todos os setores e responsáveis obrigatórios para as etapas.');
          setLoading(false);
          return;
        }

        await supabase.from('rnc_occurrences').update({
          status: isOportunidade ? 'plano_acao' : 'analise_causa',
          reclassified_type: reclassifiedType,
          criticality,
          notify_participants: notify,
        }).eq('id', rncId);

        if (isOportunidade) {
          // 3 stages for oportunidade: Plano de Ação + Implementação + Análise de Eficácia
          await supabase.from('rnc_stages').insert([
            { rnc_id: rncId, stage_number: 1, stage_name: 'Plano de Ação', responsible_user_id: stage1User || null, responsible_sector_id: stage1Sector || null, deadline: stage1Deadline || null, status: 'em_andamento' as const },
            { rnc_id: rncId, stage_number: 2, stage_name: 'Implementação', responsible_user_id: stage1User || null, responsible_sector_id: stage1Sector || null, status: 'pendente' as const },
            { rnc_id: rncId, stage_number: 3, stage_name: 'Análise de Eficácia', responsible_user_id: stage1User || null, responsible_sector_id: stage1Sector || null, status: 'pendente' as const },
          ]);
        } else {
          // 5 stages for Real
          const stageData = [
            { rnc_id: rncId, stage_number: 1, stage_name: 'Análise de Causa', responsible_user_id: stage1User || null, responsible_sector_id: stage1Sector || null, deadline: stage1Deadline || null, status: 'em_andamento' as const },
            { rnc_id: rncId, stage_number: 2, stage_name: 'Plano de Ação', responsible_user_id: stage1User || null, responsible_sector_id: stage1Sector || null, status: 'pendente' as const },
            { rnc_id: rncId, stage_number: 3, stage_name: 'Validação', responsible_sector_id: stage3Sector || null, status: 'pendente' as const },
            { rnc_id: rncId, stage_number: 4, stage_name: 'Implementação', responsible_sector_id: stage1Sector || null, status: 'pendente' as const },
            { rnc_id: rncId, stage_number: 5, stage_name: 'Análise de Eficácia', responsible_sector_id: stage5Sector || null, status: 'pendente' as const },
          ];
          await supabase.from('rnc_stages').insert(stageData);
        }

        if (stage1User) {
          await supabase.from('rnc_participants').insert({ rnc_id: rncId, user_id: stage1User, role: 'analyst' });
          await supabase.from('notifications').insert({
            user_id: stage1User,
            title: 'RNC atribuída a você',
            message: `Você foi designado para a RNC ${rnc.code}: ${rnc.subject}`,
            type: 'rnc', reference_type: 'rnc', reference_id: rncId,
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
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Classificação do Tipo de Ocorrência</Label>
            <Select value={reclassifiedType} onValueChange={(v) => setReclassifiedType(v as OccurrenceType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="real">Real (NC)</SelectItem>
                <SelectItem value="oportunidade">Oportunidade de Melhoria</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Criticidade</Label>
            <Select value={criticality} onValueChange={(v) => setCriticality(v as CritLevel)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="baixa">🟢 Baixa</SelectItem>
                <SelectItem value="media">🟡 Média</SelectItem>
                <SelectItem value="alta">🔴 Alta</SelectItem>
              </SelectContent>
            </Select>
          </div>
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
              <p className="text-sm font-medium">
                {reclassifiedType === 'oportunidade' ? 'Etapa 1 — Plano de Ação' : 'Etapas 1 e 2 — Análise de Causa e Plano de Ação'}
              </p>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Setor</Label>
                  <Select value={stage1Sector || undefined} onValueChange={setStage1Sector}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="Setor" /></SelectTrigger>
                    <SelectContent>{sectors.filter((s: any) => s?.id).map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Responsável</Label>
                  <Select value={stage1User || undefined} onValueChange={setStage1User}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="Pessoa" /></SelectTrigger>
                    <SelectContent>{sectorUsers.filter((u: any) => u?.user_id).map((u: any) => <SelectItem key={u.user_id} value={u.user_id}>{u.full_name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Prazo</Label>
                  <Input type="date" value={stage1Deadline} onChange={(e) => setStage1Deadline(e.target.value)} className="h-9" />
                </div>
              </div>
            </div>

            {reclassifiedType !== 'oportunidade' && (
              <>
                <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                  <p className="text-sm font-medium">Etapa 3 — Validação do Setor Especializado</p>
                  <div className="space-y-1">
                    <Label className="text-xs">Setor Especialista</Label>
                    <Select value={stage3Sector || undefined} onValueChange={setStage3Sector}>
                      <SelectTrigger className="h-9"><SelectValue placeholder="Setor" /></SelectTrigger>
                      <SelectContent>{sectors.filter((s: any) => s?.id).map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                  <p className="text-sm font-medium">Etapa 5 — Análise de Eficácia</p>
                  <div className="space-y-1">
                    <Label className="text-xs">Setor Especialista</Label>
                    <Select value={stage5Sector || undefined} onValueChange={setStage5Sector}>
                      <SelectTrigger className="h-9"><SelectValue placeholder="Setor" /></SelectTrigger>
                      <SelectContent>{sectors.filter((s: any) => s?.id).map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
              </>
            )}

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
    const filledWhys = [whys.why_1, whys.why_2, whys.why_3, whys.why_4, whys.why_5].filter(w => w?.trim() !== '');
    if (filledWhys.length < 3) { toast.error('Preencha ao menos 3 porquês'); return; }
    await handleSave();
    setLoading(true);
    try {
      await supabase.from('rnc_stages').update({ status: 'concluido', completed_at: new Date().toISOString() }).eq('id', stageId);
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

/* ======================== ACTION PLAN (for Real type) ======================== */
function ActionPlanForm({ rncId, stageId, existing, rnc, user, queryClient, profiles, causeAnalysis }: any) {
  const [actions, setActions] = useState<any[]>(existing.length > 0 ? existing : []);
  const [loading, setLoading] = useState(false);
  const sectorProfiles = profiles.filter((p: any) => p?.user_id && rnc?.sector_id && p.sector_id === rnc.sector_id);
  const filteredProfiles = sectorProfiles.length > 0 ? sectorProfiles : profiles.filter((p: any) => p?.user_id);

  const availableWhys: { number: number; text: string }[] = [];
  if (causeAnalysis) {
    for (let i = 1; i <= 5; i++) {
      const val = causeAnalysis[`why_${i}`];
      if (val) availableWhys.push({ number: i, text: val });
    }
  }

  const emptyAction = { what_to_do: '', why_to_do: '', how_to_do: '', responsible_user_id: '', deadline: '', cost: '', related_cause_why: null as number | null };
  const addAction = () => setActions([...actions, { ...emptyAction, _new: true }]);
  const updateAction = (index: number, field: string, value: any) => {
    const updated = [...actions];
    updated[index] = { ...updated[index], [field]: value };
    setActions(updated);
  };

  const handleSaveAction = async (action: any, index: number) => {
    if (!action.what_to_do || !action.why_to_do || !action.how_to_do || !action.responsible_user_id || !action.deadline) {
      toast.error('Preencha todos os campos obrigatórios da ação'); return;
    }
    setLoading(true);
    try {
      if (action._new) {
        const { data, error } = await supabase.from('rnc_actions').insert({
          rnc_id: rncId, what_to_do: action.what_to_do, why_to_do: action.why_to_do,
          how_to_do: action.how_to_do, responsible_user_id: action.responsible_user_id,
          deadline: action.deadline, cost: action.cost ? parseFloat(action.cost) : null,
          related_cause_why: action.related_cause_why,
        }).select().single();
        if (error) throw error;
        const updated = [...actions]; updated[index] = data; setActions(updated);
        // Notify responsible
        await supabase.from('notifications').insert({
          user_id: action.responsible_user_id,
          title: 'Ação atribuída a você',
          message: `Nova ação no plano: ${action.what_to_do}`,
          type: 'rnc', reference_type: 'rnc', reference_id: rncId,
        });
      } else {
        const { data, error } = await supabase.from('rnc_actions').update({
          what_to_do: action.what_to_do, why_to_do: action.why_to_do,
          how_to_do: action.how_to_do, responsible_user_id: action.responsible_user_id,
          deadline: action.deadline, cost: action.cost ? parseFloat(action.cost) : null,
          related_cause_why: action.related_cause_why,
        }).eq('id', action.id).select().single();
        if (error) throw error;
        const updated = [...actions]; updated[index] = data; setActions(updated);
      }
      queryClient.invalidateQueries({ queryKey: ['rnc-actions'] });
      toast.success('Ação salva com sucesso');
    } catch (error: any) { toast.error(error.message); } finally { setLoading(false); }
  };

  const handleDeleteAction = async (action: any, index: number) => {
    if (action._new) {
      setActions(actions.filter((_, i) => i !== index));
      return;
    }
    if (!confirm('Tem certeza que deseja excluir esta ação?')) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('rnc_actions').delete().eq('id', action.id);
      if (error) throw error;
      setActions(actions.filter((_, i) => i !== index));
      queryClient.invalidateQueries({ queryKey: ['rnc-actions'] });
      toast.success('Ação excluída com sucesso');
    } catch (error: any) { toast.error(error.message); } finally { setLoading(false); }
  };

  const handleComplete = async () => {
    if (actions.length === 0) { toast.error('Adicione pelo menos uma ação'); return; }
    const unsaved = actions.filter(a => a._new);
    if (unsaved.length > 0) { toast.error('Salve todas as ações antes de avançar'); return; }
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
        <ActionCard key={action.id || i} action={action} index={i} profiles={filteredProfiles}
          availableWhys={availableWhys} causeAnalysis={causeAnalysis}
          onUpdate={updateAction} onSave={handleSaveAction} onDelete={handleDeleteAction} loading={loading} />
      ))}
      {actions.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Nenhuma ação adicionada.</p>}
      <div className="flex justify-end gap-2">
        <Button size="sm" onClick={handleComplete} disabled={loading || actions.length === 0}>Concluir Plano e Avançar</Button>
      </div>
    </div>
  );
}

/* ======================== ACTION PLAN (for Oportunidade type) ======================== */
function ActionPlanFormOportunidade({ rncId, stageId, existing, rnc, user, queryClient, profiles }: any) {
  const [actions, setActions] = useState<any[]>(existing.length > 0 ? existing : []);
  const [loading, setLoading] = useState(false);
  const sectorProfiles = profiles.filter((p: any) => p?.user_id && rnc?.sector_id && p.sector_id === rnc.sector_id);
  const filteredProfiles = sectorProfiles.length > 0 ? sectorProfiles : profiles.filter((p: any) => p?.user_id);

  const emptyAction = { what_to_do: '', why_to_do: '', how_to_do: '', responsible_user_id: '', deadline: '', cost: '' };
  const addAction = () => setActions([...actions, { ...emptyAction, _new: true }]);
  const updateAction = (index: number, field: string, value: any) => {
    const updated = [...actions]; updated[index] = { ...updated[index], [field]: value }; setActions(updated);
  };

  const handleSaveAction = async (action: any, index: number) => {
    if (!action.what_to_do || !action.why_to_do || !action.how_to_do || !action.responsible_user_id || !action.deadline) {
      toast.error('Preencha todos os campos obrigatórios'); return;
    }
    setLoading(true);
    try {
      if (action._new) {
        const { data, error } = await supabase.from('rnc_actions').insert({
          rnc_id: rncId, what_to_do: action.what_to_do, why_to_do: action.why_to_do,
          how_to_do: action.how_to_do, responsible_user_id: action.responsible_user_id,
          deadline: action.deadline, cost: action.cost ? parseFloat(action.cost) : null,
        }).select().single();
        if (error) throw error;
        const updated = [...actions]; updated[index] = data; setActions(updated);
      } else {
        const { data, error } = await supabase.from('rnc_actions').update({
          what_to_do: action.what_to_do, why_to_do: action.why_to_do,
          how_to_do: action.how_to_do, responsible_user_id: action.responsible_user_id,
          deadline: action.deadline, cost: action.cost ? parseFloat(action.cost) : null,
        }).eq('id', action.id).select().single();
        if (error) throw error;
        const updated = [...actions]; updated[index] = data; setActions(updated);
      }
      queryClient.invalidateQueries({ queryKey: ['rnc-actions'] });
      toast.success('Ação salva');
    } catch (error: any) { toast.error(error.message); } finally { setLoading(false); }
  };

  const handleDeleteAction = async (action: any, index: number) => {
    if (action._new) {
      setActions(actions.filter((_, i) => i !== index));
      return;
    }
    if (!confirm('Tem certeza que deseja excluir esta ação?')) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('rnc_actions').delete().eq('id', action.id);
      if (error) throw error;
      setActions(actions.filter((_, i) => i !== index));
      queryClient.invalidateQueries({ queryKey: ['rnc-actions'] });
      toast.success('Ação excluída com sucesso');
    } catch (error: any) { toast.error(error.message); } finally { setLoading(false); }
  };

  const handleComplete = async () => {
    if (actions.length === 0) { toast.error('Adicione pelo menos uma ação'); return; }
    const unsaved = actions.filter(a => a._new);
    if (unsaved.length > 0) { toast.error('Salve todas as ações antes de concluir'); return; }
    setLoading(true);
    try {
      await supabase.from('rnc_stages').update({ status: 'concluido', completed_at: new Date().toISOString() }).eq('id', stageId);
      const { data: nextStage } = await supabase.from('rnc_stages').select('id').eq('rnc_id', rncId).eq('stage_number', 2).single();
      if (nextStage) await supabase.from('rnc_stages').update({ status: 'em_andamento' }).eq('id', nextStage.id);
      await supabase.from('rnc_occurrences').update({ status: 'implementacao' }).eq('id', rncId);
      queryClient.invalidateQueries({ queryKey: ['rnc-stages'] });
      queryClient.invalidateQueries({ queryKey: ['rnc-detail'] });
      queryClient.invalidateQueries({ queryKey: ['rnc-list'] });
      toast.success('Plano de ação concluído. Próxima etapa: Implementação.');
    } catch (error: any) { toast.error(error.message); } finally { setLoading(false); }
  };

  return (
    <div className="mt-3 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">Plano de Ação (5W2H)</h4>
        <Button size="sm" variant="outline" onClick={addAction}>+ Adicionar Ação</Button>
      </div>
      {actions.map((action: any, i: number) => (
        <ActionCard key={action.id || i} action={action} index={i} profiles={filteredProfiles}
          availableWhys={[]} causeAnalysis={null}
          onUpdate={updateAction} onSave={handleSaveAction} onDelete={handleDeleteAction} loading={loading} />
      ))}
      {actions.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Nenhuma ação adicionada.</p>}
      <div className="flex justify-end gap-2">
        <Button size="sm" onClick={handleComplete} disabled={loading || actions.length === 0}>Concluir Oportunidade</Button>
      </div>
    </div>
  );
}

/* ======================== ACTION CARD ======================== */
function ActionCard({ action, index, profiles, availableWhys, causeAnalysis, onUpdate, onSave, onDelete, loading }: any) {
  return (
    <div className="bg-muted/50 rounded-lg p-4 space-y-3 border">
      <p className="text-sm font-medium text-foreground">Ação {index + 1} {!action._new && <Badge variant="secondary" className="text-xs ml-2">Salva</Badge>}</p>

      {availableWhys.length > 0 && (
        <div className="space-y-2">
          <Label className="text-xs">Causas Relacionadas (da Etapa 1)</Label>
          <div className="space-y-1.5">
            {availableWhys.map((w: any) => (
              <label key={w.number} className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={action.related_cause_why === w.number}
                  onChange={(e) => onUpdate(index, 'related_cause_why', e.target.checked ? w.number : null)}
                  className="accent-primary rounded" />
                <span className={`${causeAnalysis?.root_cause_why === w.number ? 'text-primary font-medium' : 'text-foreground'}`}>
                  P{w.number}: {w.text} {causeAnalysis?.root_cause_why === w.number && '🎯'}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1 col-span-2">
          <Label className="text-xs">O que fazer? (What) *</Label>
          <Input value={action.what_to_do} onChange={(e) => onUpdate(index, 'what_to_do', e.target.value)} className="h-9" />
        </div>
        <div className="space-y-1 col-span-2">
          <Label className="text-xs">Por que fazer? (Why) *</Label>
          <Input value={action.why_to_do} onChange={(e) => onUpdate(index, 'why_to_do', e.target.value)} className="h-9" />
        </div>
        <div className="space-y-1 col-span-2">
          <Label className="text-xs">Como fazer? (How) *</Label>
          <Textarea value={action.how_to_do} onChange={(e) => onUpdate(index, 'how_to_do', e.target.value)} rows={2} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Responsável (Who) *</Label>
          <Select value={action.responsible_user_id || undefined} onValueChange={(v) => onUpdate(index, 'responsible_user_id', v)}>
            <SelectTrigger className="h-9"><SelectValue placeholder="Selecione" /></SelectTrigger>
            <SelectContent>{profiles.filter((p: any) => p?.user_id).map((p: any) => <SelectItem key={p.user_id} value={p.user_id}>{p.full_name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Prazo (When) *</Label>
          <Input type="date" value={action.deadline?.split?.('T')?.[0] || action.deadline || ''} onChange={(e) => onUpdate(index, 'deadline', e.target.value)} className="h-9" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Custo (How much)</Label>
          <Input type="number" value={action.cost || ''} onChange={(e) => onUpdate(index, 'cost', e.target.value)} placeholder="R$" className="h-9" />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button size="sm" variant="destructive" onClick={() => onDelete(action, index)} disabled={loading}>
          Excluir
        </Button>
        <Button size="sm" onClick={() => onSave(action, index)} disabled={loading}>
          {action._new ? 'Salvar Ação' : 'Atualizar Ação'}
        </Button>
      </div>
    </div>
  );
}

function ActionPlanReadonly({ actions, profiles, showImplementation, causeAnalysis }: any) {
  const getProfileName = (userId: string) => profiles.find((p: any) => p.user_id === userId)?.full_name || '';
  const getWhyText = (num: number | null) => {
    if (!num || !causeAnalysis) return null;
    return causeAnalysis[`why_${num}`];
  };
  return (
    <div className="mt-3 border rounded-lg p-4 bg-muted/20">
      <h4 className="text-sm font-semibold mb-3 text-foreground">Plano de Ação ({actions.length} ações)</h4>
      <div className="space-y-3">
        {actions.map((a: any, i: number) => (
          <div key={a.id} className="bg-card border rounded p-3 text-sm space-y-2">
            <p className="font-semibold text-primary">Ação {i + 1}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 text-sm mt-1">
              <div>
                <strong className="text-muted-foreground font-medium">O que fazer? (What):</strong> 
                <span className="text-foreground ml-1">{a.what_to_do}</span>
              </div>
              <div>
                <strong className="text-muted-foreground font-medium">Por que fazer? (Why):</strong> 
                <span className="text-foreground ml-1">{a.why_to_do}</span>
              </div>
              <div className="col-span-1 md:col-span-2">
                <strong className="text-muted-foreground font-medium">Como fazer? (How):</strong> 
                <span className="text-foreground ml-1 whitespace-pre-wrap">{a.how_to_do}</span>
              </div>
              <div>
                <strong className="text-muted-foreground font-medium">Responsável (Who):</strong> 
                <span className="text-foreground ml-1">{getProfileName(a.responsible_user_id)}</span>
              </div>
              <div>
                <strong className="text-muted-foreground font-medium">Prazo (When):</strong> 
                <span className="text-foreground ml-1">{formatDateBR(a.deadline)}</span>
              </div>
              {a.cost !== null && a.cost !== undefined && (
                <div>
                  <strong className="text-muted-foreground font-medium">Custo (How much):</strong> 
                  <span className="text-foreground ml-1">R$ {a.cost}</span>
                </div>
              )}
              <div>
                <strong className="text-muted-foreground font-medium">Status:</strong> 
                <span className="text-foreground ml-1">{a.is_implemented ? '✅ Implementada' : '⏳ Pendente'}</span>
              </div>
            </div>
            {a.related_cause_why && causeAnalysis && (
              <p className="text-xs text-primary mt-1 border-t pt-1">
                Causa Relacionada: P{a.related_cause_why} — {getWhyText(a.related_cause_why)}
              </p>
            )}
            {showImplementation && a.evidence && (
              <p className="text-xs text-muted-foreground mt-1 bg-background/50 p-2 rounded">
                <strong>Evidência:</strong> {a.evidence}
              </p>
            )}
            {showImplementation && a.evidence_file_path && (
              <SignedFileLink path={a.evidence_file_path} className="text-xs text-primary hover:underline mt-1 flex items-center gap-1">
                <Paperclip className="h-3 w-3" /> Ver anexo da implementação
              </SignedFileLink>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ======================== VALIDATION ======================== */
function ValidationForm({ stageId, rncId, rnc, queryClient, sectors }: any) {
  const [rejectionReason, setRejectionReason] = useState('');
  const [reject, setReject] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editCriticality, setEditCriticality] = useState<CritLevel>(rnc.criticality);
  const [editType, setEditType] = useState<OccurrenceType>(rnc.reclassified_type || rnc.occurrence_type);
  const [editSectorId, setEditSectorId] = useState<string>(rnc.sector_id);

  const handleValidate = async () => {
    setLoading(true);
    try {
      await supabase.from('rnc_occurrences').update({
        criticality: editCriticality, reclassified_type: editType, sector_id: editSectorId,
      }).eq('id', rncId);

      if (reject) {
        await supabase.from('rnc_stages').update({ status: 'reprovado', rejection_reason: rejectionReason }).eq('id', stageId);
        const { data: stage1 } = await supabase.from('rnc_stages').select('id').eq('rnc_id', rncId).eq('stage_number', 1).single();
        const { data: stage2 } = await supabase.from('rnc_stages').select('id').eq('rnc_id', rncId).eq('stage_number', 2).single();
        if (stage1) await supabase.from('rnc_stages').update({ status: 'em_andamento' }).eq('id', stage1.id);
        if (stage2) await supabase.from('rnc_stages').update({ status: 'em_andamento' }).eq('id', stage2.id);
        await supabase.from('rnc_occurrences').update({ status: 'analise_causa' }).eq('id', rncId);

        // Notify creator
        await supabase.from('notifications').insert({
          user_id: rnc.created_by,
          title: 'Validação reprovada',
          message: `RNC ${rnc.code}: Revisão solicitada. Motivo: ${rejectionReason}`,
          type: 'rnc', reference_type: 'rnc', reference_id: rncId,
        });
        toast.info('Validação reprovada. Etapas 1 e 2 reabertas.');
      } else {
        await supabase.from('rnc_stages').update({ status: 'aprovado', completed_at: new Date().toISOString() }).eq('id', stageId);
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
    <div className="mt-3 space-y-4">
      <p className="text-sm text-muted-foreground">O setor especializado pode editar informações da ocorrência e validar as etapas 1 e 2.</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label className="text-xs">Criticidade</Label>
          <Select value={editCriticality} onValueChange={(v) => setEditCriticality(v as CritLevel)}>
            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="baixa">Baixa</SelectItem>
              <SelectItem value="media">Média</SelectItem>
              <SelectItem value="alta">Alta</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-xs">Tipo de Ocorrência</Label>
          <Select value={editType} onValueChange={(v) => setEditType(v as OccurrenceType)}>
            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="real">Real (NC)</SelectItem>
              <SelectItem value="oportunidade">Oportunidade de Melhoria</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-xs">Setor Receptor</Label>
          <Select value={editSectorId} onValueChange={setEditSectorId}>
            <SelectTrigger className="h-9"><SelectValue placeholder="Selecione o setor" /></SelectTrigger>
            <SelectContent>
              {sectors.filter((s: any) => s?.id).map((s: any) => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox checked={reject} onCheckedChange={(c) => setReject(!!c)} />
        <Label className="text-sm">Reprovar e devolver para revisão (Etapas 1 e 2)</Label>
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
function ImplementationForm({ actions, user, isAdmin, isProcessos, queryClient, rncId, stageId, sectors, isOportunidade }: any) {
  const [evidence, setEvidence] = useState<Record<string, string>>({});
  const [files, setFiles] = useState<Record<string, File | null>>({});
  const [validationSector, setValidationSector] = useState('');
  const [validationDeadline, setValidationDeadline] = useState('');
  const [loading, setLoading] = useState(false);

  const allImplemented = actions.every((a: any) => a.is_implemented);

  const handleImplement = async (actionId: string) => {
    const text = (evidence[actionId] || '').trim();
    const file = files[actionId];
    if (!text && !file) {
      toast.error('Preencha a evidência ou anexe um arquivo.');
      return;
    }
    setLoading(true);
    try {
      let filePath: string | null = null;
      if (file) {
        const ext = file.name.split('.').pop();
        const path = `${rncId}/${actionId}/evidence-${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage.from('rnc-attachments').upload(path, file, { upsert: false });
        if (uploadError) throw uploadError;
        filePath = path;
      }
      const updatePayload: any = {
        is_implemented: true,
        implemented_at: new Date().toISOString(),
        evidence: text,
      };
      if (filePath) updatePayload.evidence_file_path = filePath;
      const { error } = await supabase.from('rnc_actions').update(updatePayload).eq('id', actionId);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['rnc-actions'] });
      toast.success('Ação implementada');
    } catch (error: any) { toast.error(error.message); } finally { setLoading(false); }
  };

  const handleEditImplementation = async (action: any) => {
    setLoading(true);
    try {
      await supabase.from('rnc_actions').update({
        is_implemented: false
      }).eq('id', action.id);
      
      setEvidence(prev => ({ ...prev, [action.id]: action.evidence || '' }));
      queryClient.invalidateQueries({ queryKey: ['rnc-actions'] });
    } catch (error: any) { toast.error(error.message); } finally { setLoading(false); }
  };

  const handleFinishStage = async () => {
    setLoading(true);
    try {
      await supabase.from('rnc_stages').update({ status: 'concluido', completed_at: new Date().toISOString() }).eq('id', stageId);
      const nextStageNumber = isOportunidade ? 3 : 5;
      const { data: nextStage } = await supabase.from('rnc_stages').select('id, responsible_sector_id').eq('rnc_id', rncId).eq('stage_number', nextStageNumber).single();
      if (nextStage) {
        await supabase.from('rnc_stages').update({ status: 'em_andamento' }).eq('id', nextStage.id);
      }
      await supabase.from('rnc_occurrences').update({ status: 'eficacia' }).eq('id', rncId);
      await supabase.from('rnc_efficacy').insert({ rnc_id: rncId });
      toast.success('Implementação finalizada. Eficácia agendada.');
      queryClient.invalidateQueries({ queryKey: ['rnc-stages'] });
      queryClient.invalidateQueries({ queryKey: ['rnc-detail'] });
      queryClient.invalidateQueries({ queryKey: ['rnc-list'] });
    } catch (error: any) { toast.error(error.message); } finally { setLoading(false); }
  };

  return (
    <div className="mt-3 space-y-3">
      <h4 className="text-sm font-medium">Implementação das Ações</h4>
      <p className="text-xs text-muted-foreground">Implemente cada ação individualmente.</p>
      {actions.map((action: any, idx: number) => (
        <div key={action.id} className={`rounded-lg p-4 space-y-2 border ${action.is_implemented ? 'bg-primary/5 border-primary/20' : 'bg-muted/50'}`}>
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Ação {idx + 1}: {action.what_to_do}</p>
            {action.is_implemented && <Badge variant="default" className="text-xs">✅ Implementada</Badge>}
          </div>
          {!action.is_implemented ? (
            <>
              <div className="space-y-1">
                <Label className="text-xs">Evidência *</Label>
                <Textarea value={evidence[action.id] || ''} onChange={(e) => setEvidence({ ...evidence, [action.id]: e.target.value })} rows={2} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Anexo</Label>
                <Input type="file" onChange={(e) => setFiles({ ...files, [action.id]: e.target.files?.[0] || null })} className="h-9" />
              </div>
              {isAdmin || isProcessos || action.responsible_user_id === user?.id ? (
                <Button size="sm" onClick={() => handleImplement(action.id)} disabled={loading}>Salvar Implementação</Button>
              ) : (
                <p className="text-xs text-muted-foreground italic">Somente o responsável ou Time de Processos pode implementar.</p>
              )}
            </>
          ) : (
            <div className="text-xs text-muted-foreground">
              {action.evidence && <p>Evidência: {action.evidence}</p>}
              {action.evidence_file_path && (
                <SignedFileLink path={action.evidence_file_path} className="flex items-center gap-1 text-primary hover:underline mt-1 text-xs">
                  <Paperclip className="h-3 w-3" /> Baixar anexo enviado
                </SignedFileLink>
              )}
              {action.implemented_at && <p className="mt-1">Implementada em: {new Date(action.implemented_at).toLocaleDateString('pt-BR')}</p>}
              {(isAdmin || isProcessos || action.responsible_user_id === user?.id) && (
                <Button variant="outline" size="sm" className="mt-2" onClick={() => handleEditImplementation(action)} disabled={loading}>
                  Editar Implementação
                </Button>
              )}
            </div>
          )}
        </div>
      ))}
      <div className="text-sm text-muted-foreground">✅ {actions.filter((a: any) => a.is_implemented).length} de {actions.length} ações</div>
      {allImplemented && (
        <div className="border-t pt-4 space-y-3">
          <h4 className="text-sm font-medium">Finalizar Implementação</h4>
          <p className="text-xs text-muted-foreground">Todas as ações foram implementadas. Clique para avançar para a análise de eficácia.</p>
          <Button onClick={handleFinishStage} disabled={loading}>{loading ? 'Processando...' : 'Finalizar e Agendar Eficácia'}</Button>
        </div>
      )}
    </div>
  );
}

/* ======================== EFFICACY ======================== */
function EfficacyForm({ rncId, stageId, existing, user, queryClient }: any) {
  const [isEffective, setIsEffective] = useState<boolean | null>(existing?.is_effective ?? null);
  const [evidence, setEvidence] = useState(existing?.evidence || '');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (isEffective === null) { toast.error('Selecione eficaz ou ineficaz'); return; }
    setLoading(true);
    try {
      let filePath = existing?.evidence_file_path || null;
      if (file) {
        const ext = file.name.split('.').pop();
        const path = `${rncId}/efficacy/evidence.${ext}`;
        await supabase.storage.from('rnc-attachments').upload(path, file, { upsert: true });
        filePath = path;
      }
      if (existing) {
        await supabase.from('rnc_efficacy').update({
          is_effective: isEffective, evidence, evaluated_by: user.id,
          evaluation_date: new Date().toISOString().split('T')[0], evidence_file_path: filePath,
        }).eq('id', existing.id);
      }
      if (isEffective) {
        await supabase.from('rnc_stages').update({ status: 'concluido', completed_at: new Date().toISOString() }).eq('id', stageId);
        await supabase.from('rnc_occurrences').update({ status: 'concluida' }).eq('id', rncId);
        toast.success('RNC concluída com eficácia!');
      } else {
        await supabase.from('rnc_stages').update({ status: 'reprovado' }).eq('id', stageId);
        const { data: implStage } = await supabase.from('rnc_stages').select('id').eq('rnc_id', rncId).eq('stage_name', 'Implementação').maybeSingle();
        if (implStage) await supabase.from('rnc_stages').update({ status: 'em_andamento', completed_at: null }).eq('id', implStage.id);
        await supabase.from('rnc_occurrences').update({ status: 'implementacao' }).eq('id', rncId);
        toast.info('Eficácia não comprovada. Retornando à etapa de Implementação para ajuste do responsável.');
      }
      queryClient.invalidateQueries({ queryKey: ['rnc-efficacy'] });
      queryClient.invalidateQueries({ queryKey: ['rnc-stages'] });
      queryClient.invalidateQueries({ queryKey: ['rnc-detail'] });
    } catch (error: any) { toast.error(error.message); } finally { setLoading(false); }
  };

  return (
    <div className="mt-3 space-y-3">
      <p className="text-sm text-muted-foreground">
        {existing?.scheduled_date && `Data agendada: ${formatDateBR(existing.scheduled_date)}`}
      </p>
      <div className="flex gap-3">
        <label className={`flex items-center gap-2 px-4 py-2 rounded-md border cursor-pointer text-sm ${isEffective === true ? 'border-primary bg-primary/5' : 'border-border'}`}>
          <input type="radio" name="efficacy" checked={isEffective === true} onChange={() => setIsEffective(true)} className="accent-primary" /> Eficaz
        </label>
        <label className={`flex items-center gap-2 px-4 py-2 rounded-md border cursor-pointer text-sm ${isEffective === false ? 'border-destructive bg-destructive/5' : 'border-border'}`}>
          <input type="radio" name="efficacy" checked={isEffective === false} onChange={() => setIsEffective(false)} className="accent-primary" /> Ineficaz
        </label>
      </div>
      <div className="space-y-1">
        <Label>Evidência *</Label>
        <Textarea value={evidence} onChange={(e) => setEvidence(e.target.value)} placeholder="Descreva a evidência..." />
      </div>
      <div className="space-y-1">
        <Label>Anexo</Label>
        <Input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} className="h-9" />
        {existing?.evidence_file_path && (
          <SignedFileLink path={existing.evidence_file_path} className="text-xs text-primary hover:underline flex items-center gap-1 w-fit mt-1">
            <Paperclip className="h-3 w-3" /> Baixar anexo existente
          </SignedFileLink>
        )}
      </div>
      <Button onClick={handleSave} disabled={loading}>{loading ? 'Salvando...' : 'Salvar Avaliação'}</Button>
    </div>
  );
}

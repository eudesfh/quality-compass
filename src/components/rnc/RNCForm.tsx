import { useState, useEffect } from 'react';
import { X, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
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

type OccurrenceType = Database['public']['Enums']['occurrence_type'];
type CompanyType = Database['public']['Enums']['company_type'];

const ORIGINS = [
  'Auditoria Interna', 'Processos', 'Produto',
  'Reclamação do Cliente', 'Indicadores', 'Acidente de Trabalho (CAT)',
  'Gestão de Riscos', 'Oportunidade de Melhoria'
];

export default function RNCForm() {
  const { setShowRNCForm, rncPreFill, setRncPreFill } = useModule();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [type, setType] = useState<OccurrenceType | ''>(rncPreFill?.occurrence_type || '');
  const [subject, setSubject] = useState(rncPreFill?.subject || '');
  const [description, setDescription] = useState(rncPreFill?.description || '');
  const [date, setDate] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [companyType, setCompanyType] = useState<CompanyType | ''>('');
  const [sectorId, setSectorId] = useState('');
  const [origin, setOrigin] = useState(rncPreFill?.origin || '');
  const [approverId, setApproverId] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    return () => setRncPreFill(null);
  }, [setRncPreFill]);

  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: async () => {
      const { data } = await supabase.from('companies').select('*').eq('is_active', true);
      return data || [];
    },
  });

  const { data: sectors = [] } = useQuery({
    queryKey: ['sectors'],
    queryFn: async () => {
      const { data } = await supabase.from('sectors').select('*').eq('is_active', true);
      return data || [];
    },
  });

  const { data: approvers = [] } = useQuery({
    queryKey: ['approvers'],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*, permission_profiles(can_approve_rnc)')
        .eq('is_active', true);
      return (data || []).filter(p =>
        p.permission_profiles?.can_approve_rnc || false
      );
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    const images = selected.filter(f => f.type.startsWith('image/'));
    if (images.length > 3) { toast.error('Máximo de 3 imagens'); return; }
    const tooLarge = selected.find(f => f.size > 5 * 1024 * 1024);
    if (tooLarge) { toast.error('Arquivos devem ter no máximo 5MB'); return; }
    setFiles(prev => [...prev, ...selected].slice(0, 6));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!type || !subject || !date || !companyId || !companyType || !sectorId || !origin || !approverId) {
      toast.error('Preencha todos os campos obrigatórios.');
      return;
    }
    if (!user) return;
    setLoading(true);

    try {
      const { data: rnc, error } = await supabase
        .from('rnc_occurrences')
        .insert({
          code: 'PENDING',
          occurrence_type: type,
          subject,
          description,
          criticality: 'media', // Default; will be set in Triagem
          occurrence_date: date,
          company_id: companyId,
          company_type: companyType,
          sector_id: sectorId,
          origin,
          approver_id: approverId,
          created_by: user.id,
          status: 'aberta',
        })
        .select()
        .single();

      if (error) throw error;

      await supabase.from('rnc_participants').insert([
        { rnc_id: rnc.id, user_id: user.id, role: 'creator' },
        { rnc_id: rnc.id, user_id: approverId, role: 'approver' },
      ]);

      for (const file of files) {
        const path = `${rnc.id}/${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from('rnc-attachments')
          .upload(path, file);
        if (!uploadError) {
          await supabase.from('rnc_attachments').insert({
            rnc_id: rnc.id,
            file_name: file.name,
            file_path: path,
            file_type: file.type,
            file_size: file.size,
            uploaded_by: user.id,
          });
        }
      }

      await supabase.from('notifications').insert({
        user_id: approverId,
        title: 'Nova RNC para aprovação',
        message: `RNC ${rnc.code}: ${subject}`,
        type: 'rnc',
        reference_type: 'rnc',
        reference_id: rnc.id,
      });

      queryClient.invalidateQueries({ queryKey: ['rnc-list'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success(`RNC ${rnc.code} registrada com sucesso!`);
      setShowRNCForm(false);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao registrar RNC');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50 flex items-start justify-center pt-8 overflow-y-auto pb-8">
      <div className="bg-card rounded-lg shadow-lg w-full max-w-2xl animate-fade-in border">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold text-foreground">Registrar Ocorrência</h2>
          <Button variant="ghost" size="icon" onClick={() => setShowRNCForm(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Tipo de Ocorrência *</Label>
            <div className="flex gap-3 flex-wrap">
              {([
                { value: 'real' as const, label: 'Real (Não Conformidade)' },
                { value: 'oportunidade' as const, label: 'Oportunidade de Melhoria' },
              ]).map((opt) => (
                <label key={opt.value} className={`flex items-center gap-2 px-4 py-2.5 rounded-md border cursor-pointer transition-colors text-sm ${
                  type === opt.value ? 'border-primary bg-primary/5 text-foreground' : 'border-border text-muted-foreground hover:border-primary/40'
                }`}>
                  <input type="radio" name="type" value={opt.value} checked={type === opt.value}
                    onChange={(e) => setType(e.target.value as OccurrenceType)} className="accent-primary" />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Assunto da Ocorrência *</Label>
            <Input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Assunto..." />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descreva a ocorrência..." rows={3} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Data da Ocorrência *</Label>
              <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Empresa *</Label>
              <Select value={companyId} onValueChange={setCompanyId}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {companies.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tipo de Empresa *</Label>
              <Select value={companyType} onValueChange={(v) => setCompanyType(v as CompanyType)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="obra">Obra</SelectItem>
                  <SelectItem value="escritorio">Escritório</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Setor Receptor *</Label>
              <Select value={sectorId} onValueChange={setSectorId}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {sectors.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Origem *</Label>
              <Select value={origin} onValueChange={setOrigin}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {ORIGINS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Aprovador da RNC *</Label>
            <Select value={approverId} onValueChange={setApproverId}>
              <SelectTrigger><SelectValue placeholder="Selecione o aprovador" /></SelectTrigger>
              <SelectContent>
                {approvers.map((u) => (
                  <SelectItem key={u.user_id} value={u.user_id}>{u.full_name} — {u.email}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Anexos</Label>
            <label className="border-2 border-dashed rounded-lg p-6 text-center text-muted-foreground hover:border-primary/40 transition-colors cursor-pointer block">
              <Upload className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Arraste arquivos ou clique para enviar</p>
              <p className="text-xs mt-1">Máx. 3 imagens + PDF, Excel, Word (até 5MB cada)</p>
              <input type="file" multiple className="hidden" onChange={handleFileChange}
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx" />
            </label>
            {files.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {files.map((f, i) => (
                  <span key={i} className="text-xs bg-muted px-2 py-1 rounded flex items-center gap-1">
                    {f.name}
                    <button type="button" onClick={() => setFiles(files.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-foreground">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setShowRNCForm(false)}>Cancelar</Button>
            <Button type="submit" disabled={loading}>{loading ? 'Enviando...' : 'Enviar'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

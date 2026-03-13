import { useState } from 'react';
import { X, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useModule } from '@/contexts/ModuleContext';
import { SECTORS, ORIGINS, COMPANIES, MOCK_USERS } from '@/types/qms';
import type { OccurrenceType, Criticality, CompanyType } from '@/types/qms';
import { toast } from 'sonner';

export default function RNCForm() {
  const { setShowRNCForm } = useModule();
  const [type, setType] = useState<OccurrenceType | ''>('');
  const [subject, setSubject] = useState('');
  const [criticality, setCriticality] = useState<Criticality | ''>('');
  const [date, setDate] = useState('');
  const [company, setCompany] = useState('');
  const [companyType, setCompanyType] = useState<CompanyType | ''>('');
  const [sector, setSector] = useState('');
  const [origin, setOrigin] = useState('');
  const [approver, setApprover] = useState('');

  const approvers = MOCK_USERS.filter(u => u.role === 'approver' || u.role === 'admin');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!type || !subject || !criticality || !date || !company || !companyType || !sector || !origin || !approver) {
      toast.error('Preencha todos os campos obrigatórios.');
      return;
    }
    toast.success('RNC registrada com sucesso! O aprovador será notificado.');
    setShowRNCForm(false);
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
          {/* Tipo de Ocorrência */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Tipo de Ocorrência *</Label>
            <div className="flex gap-3">
              {([
                { value: 'real', label: 'Real (Já ocorrida)' },
                { value: 'potencial', label: 'Potencial (Pode ocorrer)' },
                { value: 'oportunidade', label: 'Oportunidade de Melhoria' },
              ] as const).map((opt) => (
                <label key={opt.value} className={`flex items-center gap-2 px-4 py-2.5 rounded-md border cursor-pointer transition-colors text-sm ${
                  type === opt.value
                    ? 'border-primary bg-primary/5 text-foreground'
                    : 'border-border text-muted-foreground hover:border-primary/40'
                }`}>
                  <input
                    type="radio"
                    name="type"
                    value={opt.value}
                    checked={type === opt.value}
                    onChange={(e) => setType(e.target.value as OccurrenceType)}
                    className="accent-primary"
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>

          {/* Assunto */}
          <div className="space-y-2">
            <Label htmlFor="subject">Assunto da Ocorrência *</Label>
            <Textarea id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Descreva o assunto da ocorrência..." rows={3} />
          </div>

          {/* Criticidade + Data */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Criticidade *</Label>
              <Select value={criticality} onValueChange={(v) => setCriticality(v as Criticality)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="baixa">🟢 Baixa</SelectItem>
                  <SelectItem value="media">🟡 Média</SelectItem>
                  <SelectItem value="alta">🔴 Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Data da Ocorrência *</Label>
              <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>

          {/* Empresa + Tipo */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Empresa *</Label>
              <Select value={company} onValueChange={setCompany}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {COMPANIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
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

          {/* Setor + Origem */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Setor *</Label>
              <Select value={sector} onValueChange={setSector}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {SECTORS.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Origem *</Label>
              <Select value={origin} onValueChange={setOrigin}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {ORIGINS.map((o) => (
                    <SelectItem key={o} value={o}>{o}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Aprovador */}
          <div className="space-y-2">
            <Label>Aprovador da RNC *</Label>
            <Select value={approver} onValueChange={setApprover}>
              <SelectTrigger><SelectValue placeholder="Selecione o aprovador" /></SelectTrigger>
              <SelectContent>
                {approvers.map((u) => (
                  <SelectItem key={u.id} value={u.id}>{u.name} — {u.sector}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Anexos */}
          <div className="space-y-2">
            <Label>Anexos</Label>
            <div className="border-2 border-dashed rounded-lg p-6 text-center text-muted-foreground hover:border-primary/40 transition-colors cursor-pointer">
              <Upload className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Arraste arquivos ou clique para enviar</p>
              <p className="text-xs mt-1">Máx. 3 imagens + PDF, Excel, Word (até 5MB cada)</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setShowRNCForm(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              Enviar RNC
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

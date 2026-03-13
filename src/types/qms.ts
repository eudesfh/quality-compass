export type Module = 'rnc' | 'risk';
export type SubView = 'inicio' | 'consultas' | 'visao-geral';

export type OccurrenceType = 'real' | 'potencial' | 'oportunidade';
export type Criticality = 'baixa' | 'media' | 'alta';
export type CompanyType = 'obra' | 'escritorio';

export type RNCStatus = 
  | 'aberta' 
  | 'triagem' 
  | 'analise-causa' 
  | 'plano-acao' 
  | 'validacao' 
  | 'implementacao' 
  | 'eficacia' 
  | 'concluida' 
  | 'recusada';

export interface RNCOccurrence {
  id: string;
  type: OccurrenceType;
  subject: string;
  criticality: Criticality;
  date: string;
  company: string;
  companyType: CompanyType;
  sector: string;
  origin: string;
  approver: string;
  status: RNCStatus;
  createdBy: string;
  createdAt: string;
  attachments?: string[];
}

export type RiskResponse = 'aceitar' | 'compartilhar' | 'eliminar' | 'minimizar' | 'evitar';
export type RiskFrequency = 'por-evento' | 'diario' | 'semanal' | 'mensal' | 'trimestral' | 'anual';
export type RiskStatus = 'em-andamento' | 'concluido' | 'iniciar' | 'sem-previsao' | 'acao-constante';

export interface Risk {
  id: string;
  risk: string;
  cause: string;
  causeSource: string;
  consequence: string;
  probability: 1 | 2 | 3;
  severity: 1 | 2 | 3;
  riskLevel: number;
  riskClassification: 'baixo' | 'medio' | 'alto';
  response: RiskResponse;
  frequency: RiskFrequency;
  treatment: string;
  deadline: string;
  status: RiskStatus;
  createdBy: string;
  createdAt: string;
}

export const SECTORS = [
  'Financeiro', 'TI', 'Sala Técnica', 'Contabilidade', 'Engenharia',
  'RH', 'Qualidade', 'Suprimentos', 'Planejamento', 'Segurança do Trabalho'
];

export const ORIGINS = [
  'Auditoria Interna', 'Processos', 'Produto', 
  'Reclamação do Cliente', 'Indicadores', 'Acidente de Trabalho (CAT)'
];

export const COMPANIES = ['Lura', 'OK Empreendimentos'];

export const MOCK_USERS = [
  { id: '1', name: 'Ana Silva', sector: 'Qualidade', role: 'admin' },
  { id: '2', name: 'Carlos Santos', sector: 'Engenharia', role: 'user' },
  { id: '3', name: 'Maria Oliveira', sector: 'Financeiro', role: 'user' },
  { id: '4', name: 'João Pereira', sector: 'TI', role: 'approver' },
  { id: '5', name: 'Roberto Lima', sector: 'Qualidade', role: 'approver' },
];

export const MOCK_RNCS: RNCOccurrence[] = [
  {
    id: 'RNC-001',
    type: 'real',
    subject: 'Produto entregue fora da especificação técnica',
    criticality: 'alta',
    date: '2026-03-10',
    company: 'Lura',
    companyType: 'obra',
    sector: 'Engenharia',
    origin: 'Reclamação do Cliente',
    approver: 'Ana Silva',
    status: 'analise-causa',
    createdBy: 'Carlos Santos',
    createdAt: '2026-03-10',
  },
  {
    id: 'RNC-002',
    type: 'potencial',
    subject: 'Risco de falha no processo de compras',
    criticality: 'media',
    date: '2026-03-08',
    company: 'OK Empreendimentos',
    companyType: 'escritorio',
    sector: 'Suprimentos',
    origin: 'Auditoria Interna',
    approver: 'Roberto Lima',
    status: 'triagem',
    createdBy: 'Maria Oliveira',
    createdAt: '2026-03-08',
  },
  {
    id: 'RNC-003',
    type: 'oportunidade',
    subject: 'Melhoria no processo de onboarding de colaboradores',
    criticality: 'baixa',
    date: '2026-03-05',
    company: 'Lura',
    companyType: 'escritorio',
    sector: 'RH',
    origin: 'Processos',
    approver: 'Ana Silva',
    status: 'plano-acao',
    createdBy: 'João Pereira',
    createdAt: '2026-03-05',
  },
];

export const MOCK_RISKS: Risk[] = [
  {
    id: 'RSK-001',
    risk: 'Atraso na entrega de materiais',
    cause: 'Fornecedor com capacidade limitada',
    causeSource: 'Análise de desempenho do fornecedor',
    consequence: 'Atraso no cronograma da obra',
    probability: 2,
    severity: 3,
    riskLevel: 6,
    riskClassification: 'alto',
    response: 'minimizar',
    frequency: 'mensal',
    treatment: 'Diversificar fornecedores e manter estoque mínimo',
    deadline: '2026-04-15',
    status: 'em-andamento',
    createdBy: 'Carlos Santos',
    createdAt: '2026-03-01',
  },
  {
    id: 'RSK-002',
    risk: 'Perda de dados do sistema',
    cause: 'Falha no backup automático',
    causeSource: 'Auditoria de TI',
    consequence: 'Perda de informações críticas',
    probability: 1,
    severity: 3,
    riskLevel: 3,
    riskClassification: 'medio',
    response: 'eliminar',
    frequency: 'diario',
    treatment: 'Implementar backup redundante em nuvem',
    deadline: '2026-03-30',
    status: 'concluido',
    createdBy: 'João Pereira',
    createdAt: '2026-02-15',
  },
];

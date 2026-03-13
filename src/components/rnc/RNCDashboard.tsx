import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const statusData = [
  { name: 'Triagem', value: 4 },
  { name: 'Análise', value: 6 },
  { name: 'Plano', value: 3 },
  { name: 'Validação', value: 2 },
  { name: 'Implementação', value: 5 },
  { name: 'Eficácia', value: 1 },
  { name: 'Concluída', value: 12 },
];

const sectorData = [
  { name: 'Engenharia', value: 8 },
  { name: 'Financeiro', value: 3 },
  { name: 'TI', value: 5 },
  { name: 'Qualidade', value: 4 },
  { name: 'Suprimentos', value: 3 },
];

const critData = [
  { name: 'Baixa', value: 10, color: 'hsl(142, 72%, 35%)' },
  { name: 'Média', value: 15, color: 'hsl(37, 91%, 44%)' },
  { name: 'Alta', value: 8, color: 'hsl(0, 74%, 50%)' },
];

export default function RNCDashboard() {
  return (
    <div className="p-6 animate-fade-in">
      <h1 className="text-xl font-semibold text-foreground mb-6">Visão Geral — RNC</h1>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total de RNCs', value: '33', sub: 'Este mês' },
          { label: 'Pendentes', value: '21', sub: 'Aguardando ação' },
          { label: 'Concluídas', value: '12', sub: 'Finalizadas' },
          { label: 'Tempo Médio', value: '18d', sub: 'Para resolução' },
        ].map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="pt-6">
              <p className="text-2xl font-semibold text-foreground">{kpi.value}</p>
              <p className="text-sm font-medium text-foreground mt-1">{kpi.label}</p>
              <p className="text-xs text-muted-foreground">{kpi.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Status Chart */}
        <Card>
          <CardHeader><CardTitle className="text-base">Ocorrências por Status</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 32%, 91%)" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="value" fill="hsl(0, 74%, 50%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Criticality Pie */}
        <Card>
          <CardHeader><CardTitle className="text-base">Distribuição por Criticidade</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={critData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {critData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Sector Chart */}
        <Card className="col-span-2">
          <CardHeader><CardTitle className="text-base">Ocorrências por Setor</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={sectorData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 32%, 91%)" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={100} />
                <Tooltip />
                <Bar dataKey="value" fill="hsl(0, 74%, 50%)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

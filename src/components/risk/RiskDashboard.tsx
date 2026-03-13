import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const classData = [
  { name: 'Baixo', value: 8, color: 'hsl(142, 72%, 35%)' },
  { name: 'Médio', value: 12, color: 'hsl(37, 91%, 44%)' },
  { name: 'Alto', value: 5, color: 'hsl(0, 74%, 50%)' },
];

const statusData = [
  { name: 'Iniciar', value: 3 },
  { name: 'Em Andamento', value: 8 },
  { name: 'Concluído', value: 6 },
  { name: 'Sem Previsão', value: 2 },
  { name: 'Ação Constante', value: 6 },
];

export default function RiskDashboard() {
  return (
    <div className="p-6 animate-fade-in">
      <h1 className="text-xl font-semibold text-foreground mb-6">Visão Geral — Gestão de Riscos</h1>

      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total de Riscos', value: '25' },
          { label: 'Alto Risco', value: '5' },
          { label: 'Médio Risco', value: '12' },
          { label: 'Baixo Risco', value: '8' },
        ].map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="pt-6">
              <p className="text-2xl font-semibold text-foreground">{kpi.value}</p>
              <p className="text-sm font-medium text-foreground mt-1">{kpi.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Classificação dos Riscos</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={classData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {classData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Riscos por Status</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 32%, 91%)" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="value" fill="hsl(37, 91%, 44%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

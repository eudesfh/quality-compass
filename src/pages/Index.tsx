import { ModuleProvider, useModule } from '@/contexts/ModuleContext';
import { useAuth } from '@/contexts/AuthContext';
import TopNav from '@/components/TopNav';
import SubNav from '@/components/SubNav';
import RNCForm from '@/components/rnc/RNCForm';
import RNCPendingList from '@/components/rnc/RNCPendingList';
import RNCConsultas from '@/components/rnc/RNCConsultas';
import RNCDashboard from '@/components/rnc/RNCDashboard';
import RNCDetail from '@/components/rnc/RNCDetail';
import RiskForm from '@/components/risk/RiskForm';
import RiskPendingList from '@/components/risk/RiskPendingList';
import RiskConsultas from '@/components/risk/RiskConsultas';
import RiskDashboard from '@/components/risk/RiskDashboard';
import RiskDetail from '@/components/risk/RiskDetail';
import AdminPanel from '@/components/admin/AdminPanel';
import AuthPage from '@/pages/AuthPage';

function ModuleContent() {
  const { activeModule, activeView, showRNCForm, showRiskForm, selectedRNCId, selectedRiskId, showAdminPanel } = useModule();
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  if (!user) return <AuthPage />;

  const renderContent = () => {
    if (showAdminPanel) return <AdminPanel />;
    if (selectedRNCId && activeModule === 'rnc') return <RNCDetail />;
    if (selectedRiskId && activeModule === 'risk') return <RiskDetail />;

    if (activeModule === 'rnc') {
      switch (activeView) {
        case 'inicio': return <RNCPendingList />;
        case 'consultas': return <RNCConsultas />;
        case 'visao-geral': return <RNCDashboard />;
      }
    } else {
      switch (activeView) {
        case 'inicio': return <RiskPendingList />;
        case 'consultas': return <RiskConsultas />;
        case 'visao-geral': return <RiskDashboard />;
      }
    }
  };

  return (
    <div className={`min-h-screen bg-background ${activeModule === 'rnc' ? 'module-rnc' : 'module-risk'}`}>
      <TopNav />
      {!showAdminPanel && <SubNav />}
      <main className={activeView === 'consultas' && !showAdminPanel && !selectedRNCId && !selectedRiskId ? '' : 'max-w-7xl mx-auto'}>
        {renderContent()}
      </main>
      {showRNCForm && <RNCForm />}
      {showRiskForm && <RiskForm />}
    </div>
  );
}

export default function Index() {
  return (
    <ModuleProvider>
      <ModuleContent />
    </ModuleProvider>
  );
}

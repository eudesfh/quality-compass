import { ModuleProvider, useModule } from '@/contexts/ModuleContext';
import TopNav from '@/components/TopNav';
import SubNav from '@/components/SubNav';
import RNCForm from '@/components/rnc/RNCForm';
import RNCPendingList from '@/components/rnc/RNCPendingList';
import RNCConsultas from '@/components/rnc/RNCConsultas';
import RNCDashboard from '@/components/rnc/RNCDashboard';
import RiskForm from '@/components/risk/RiskForm';
import RiskPendingList from '@/components/risk/RiskPendingList';
import RiskConsultas from '@/components/risk/RiskConsultas';
import RiskDashboard from '@/components/risk/RiskDashboard';

function ModuleContent() {
  const { activeModule, activeView, showRNCForm, showRiskForm } = useModule();

  const renderContent = () => {
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
      <SubNav />
      <main className="max-w-7xl mx-auto">
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


import React from 'react';
import { useAppLogic } from '../../useAppLogic';
import { MenuView } from '../../MenuView';
import { PlanningView } from '../../PlanningView';
import { ArchiveView } from '../../ArchiveView';
import { GuideView } from '../../GuideView';
import { OracyView } from '../../OracyView';
import { MyPageView } from '../../MyPageView';
import { AuthView } from '../../AuthView';
import { AdminView } from '../../AdminView';
import { DisclaimerModal } from '../../components/auth/DisclaimerModal';
import { EasterEggView } from '../../EasterEggView';
import { ClassroomToolsView } from '../../ClassroomToolsView';
import { SeilasplanView } from '../../SeilasplanView';
import { KleppModellenGuide } from '../../tools/KleppModellenGuide';
import { LessonStudyTool } from '../../tools/LessonStudyTool';
import { TeacherDashboard } from '../../tools/TeacherDashboard';
import { TestDashboard } from '../../views/TestDashboard';
import { PageTransition } from '../../CommonComponents';
import { QuickTools } from './QuickTools';

type AppLogic = ReturnType<typeof useAppLogic>;

interface AppRoutesProps {
  appLogic: AppLogic;
  t: any;
  refreshStructures: () => Promise<void>;
}

export const AppRoutes: React.FC<AppRoutesProps> = ({ appLogic, t, refreshStructures }) => {
  const {
    view, setView, currentUser, isGuestMode,
    state, setState, planningStep, setPlanningStep,
    actions, dbStructures, saveStatus,
    archiveTab, setArchiveTab, archiveSearch, setArchiveSearch, isLoadingArchive, myPlans, communityPlans,
    dbOracyResources,
    importProgress, importLogs, isImporting,
    enterGuestMode, acceptDisclaimer, disclaimerAccepted
  } = appLogic;

  // 1. Not Logged In -> Show Auth Screen
  if (!currentUser && !isGuestMode) {
    return (
      <AuthView 
        accessGranted={true} 
        onAccessGranted={() => {}} 
        onLogin={appLogic.signIn}
        t={t}
        onGuestLogin={enterGuestMode}
      />
    );
  }

  // 2. Logged In / Guest but Disclaimer Not Accepted -> Show Disclaimer Modal
  if ((currentUser || isGuestMode) && !disclaimerAccepted) {
    return (
      <DisclaimerModal 
        onAccept={acceptDisclaimer} 
        isGuest={isGuestMode} 
      />
    );
  }

  return (
    <>
      {/* Global Quick Tools - Accessible everywhere except student view (handled in App.tsx) */}
      <QuickTools t={t} language={state.languageForm} />

      {(() => {
        switch (view) {
          case 'menu': return <PageTransition key="menu"><MenuView t={t} onNavigate={setView} currentUser={currentUser} guestName={isGuestMode ? t.guestName : undefined} /></PageTransition>;
          case 'dashboard': return <PageTransition key="dashboard"><TeacherDashboard t={t} onClose={() => setView('menu')} onSwitchTool={(id) => { actions.setActiveToolId(id); setView('tools'); }} /></PageTransition>;
          case 'plan': return (
            <PageTransition key="plan">
              <PlanningView 
                state={state} 
                setState={setState} 
                planningStep={planningStep} 
                setPlanningStep={setPlanningStep} 
                t={t} 
                onBack={() => setView('menu')} 
                onFindAims={actions.findAims}
                onSelectAims={actions.selectAimsAndGoToStructure}
                onGenerateTask={actions.generateFinalTask}
                onSave={actions.saveToArchive}
                dbStructures={dbStructures}
                actions={actions}
                saveStatus={saveStatus}
                currentUser={currentUser}
                myPlans={myPlans}
                availableSubjects={appLogic.availableSubjects}
              />
            </PageTransition>
          );
          case 'archive': return (
            <PageTransition key="archive">
              <ArchiveView 
                archiveTab={archiveTab} 
                setArchiveTab={setArchiveTab} 
                archiveSearch={archiveSearch} 
                setArchiveSearch={setArchiveSearch}
                isLoading={isLoadingArchive} 
                plans={archiveTab === 'mine' ? myPlans : communityPlans} 
                currentUser={currentUser}
                onToggleShare={actions.toggleShare} 
                onLike={actions.toggleLike} 
                onDelete={actions.deletePlan} 
                onViewPlan={actions.loadArchivedPlan}
                onBack={() => setView('menu')}
                t={t}
                onRefresh={() => actions.refreshPlans(currentUser?.id)}
              />
            </PageTransition>
          );
          case 'guide': return (
            <PageTransition key="guide">
              <GuideView 
                onBack={() => setView('menu')} 
                t={t} 
                dbStructures={dbStructures} 
                language={state.languageForm}
                currentUser={currentUser}
                onRefresh={refreshStructures}
              />
            </PageTransition>
          );
          case 'oracy': return <PageTransition key="oracy"><OracyView onBack={() => setView('menu')} t={t} dbOracyResources={dbOracyResources} /></PageTransition>;
          case 'tools': return (
            <PageTransition key="tools">
              <ClassroomToolsView 
                onBack={() => setView('menu')} 
                t={t} 
                dbStructures={dbStructures} 
                language={state.languageForm} 
                currentUser={currentUser} 
                state={state}
                actions={actions}
              />
            </PageTransition>
          );
          case 'bti_guide': return <PageTransition key="bti"><KleppModellenGuide t={t} onBack={() => setView('menu')} /></PageTransition>;
          case 'lesson_study': return <PageTransition key="ls"><LessonStudyTool t={t} onBack={() => setView('menu')} currentUser={currentUser} /></PageTransition>;
          case 'mypage': return (
            <PageTransition key="mypage">
              <MyPageView 
                user={currentUser} 
                onBack={() => setView('menu')} 
                onLogout={actions.logout}
                onUpdateName={actions.updateName}
                onUpdatePassword={actions.updatePassword}
                stats={{ totalPlans: myPlans.length, totalLikes: myPlans.reduce((acc, p) => acc + (p.likes || 0), 0) }}
                isGuestMode={isGuestMode}
                onLogin={() => setView('auth')}
              />
            </PageTransition>
          );
          case 'auth': return (
            <PageTransition key="auth">
              <AuthView 
                accessGranted={true} 
                onAccessGranted={() => {}} 
                onLogin={appLogic.signIn}
                t={t}
                onGuestLogin={enterGuestMode}
              />
            </PageTransition>
          );
          case 'admin': return currentUser?.role === 'admin' ? (
            <PageTransition key="admin">
              <AdminView 
                onBack={() => setView('menu')}
                importProgress={importProgress}
                importLogs={importLogs}
                isImporting={isImporting}
                onStartCLImport={() => {}}
                onStartOracyImport={() => {}}
                onClearDatabase={() => {}}
                onSeedDefaults={() => {}}
                onUploadFiles={actions.handleAdminFileUpload}
                fetchStats={actions.fetchAdminStats}
              />
            </PageTransition>
          ) : null;
          case 'seilasplan': return <PageTransition key="seilas"><SeilasplanView onBack={() => setView('menu')} /></PageTransition>;
          case 'easter-egg': return <PageTransition key="egg"><EasterEggView onBack={() => setView('menu')} /></PageTransition>;
          case 'test-dashboard': return <PageTransition key="test"><TestDashboard onBack={() => setView('menu')} /></PageTransition>;
          default: return <PageTransition key="default"><MenuView t={t} onNavigate={setView} currentUser={currentUser} /></PageTransition>;
        }
      })()}
    </>
  );
};

export interface ProjectsTabProps {
  companyId: string | undefined;
  onCreateProject: () => void;
  onNavigate: (path: string | URL) => void;
}

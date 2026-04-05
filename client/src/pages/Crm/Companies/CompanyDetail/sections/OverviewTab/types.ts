export interface OverviewTabProps {
  company: any;
  companyId: string | undefined;
  onTabChange: (tab: string) => void;
  onCreateProject: () => void;
}

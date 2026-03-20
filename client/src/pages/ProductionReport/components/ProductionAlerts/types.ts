export interface AlertData {
  overduePOsByInHands: number;
  overduePOsByNextAction: number;
  problemPOs: number;
  followUpPOs: number;
  sosWithoutPO: number;
  overdueProofs: number;
}

export interface AlertTile {
  key: string;
  label: string;
  count: number;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
  filterParam: string;
}

export interface ProductionAlertsProps {
  onAlertClick?: (filterParam: string) => void;
}

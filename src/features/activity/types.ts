// src/features/activity/types.ts

export interface IssueTrendPoint {
  date: string; // "YYYY-MM-DD"
  opened: number;
  closed: number;
  backlogSize: number; // Cumulative open issues
}

export interface IssueFunnelData {
  opened: number;
  closed: number;
  closeRatio: number; // 0-1
  avgCycleTimeDays: number;
  trend: IssueTrendPoint[];
}

export interface PRIntervalBucket {
  label: string; // "< 1 day" | "1–3 days" | "3–7 days" | "1–2 weeks" | "> 2 weeks"
  count: number;
  percentage: number;
}

export interface IssueAgingBucket {
  label: string; // "< 7 days" | "7–14 days" | "15–30 days" | "30+ days"
  count: number;
}

export interface LabelDistributionSlice {
  name: string; // the label text
  count: number;
  color: string;
}

export interface HotCampaign {
  id: string;
  title: string;
  githubUrl: string | null;
  repositoryName: string;
  commentCount: number;
  lastCommentAt: string | null; // ISO
  openedAt: string; // ISO
  state: "OPEN" | "CLOSED";
}

export interface ActivityFunnelPayload {
  funnel: IssueFunnelData;
  prIntervals: PRIntervalBucket[];
  issueAging: IssueAgingBucket[];
  labelDistribution: LabelDistributionSlice[];
  hotCampaigns: HotCampaign[];
}

import { ReportArguments } from "@satellite-earth/core/types";
import Report from "./report";

import OverviewReport from "./overview";
import ConversationsReport from "./conversations";
import LogsReport from "./logs";
import ServicesReport from "./services";
import DMSearchReport from "./dm-search";
import ScrapperStatusReport from "./scrapper-status";
import ReceiverStatusReport from "./receiver-status";
import NetworkStatusReport from "./network-status";
import NotificationChannelsReport from "./notification-channels";
import EventsSummaryReport from "./events-summary";

export const ReportClasses: {
  [k in keyof ReportArguments]?: typeof Report<k>;
} = {
  OVERVIEW: OverviewReport,
  CONVERSATIONS: ConversationsReport,
  LOGS: LogsReport,
  SERVICES: ServicesReport,
  DM_SEARCH: DMSearchReport,
  SCRAPPER_STATUS: ScrapperStatusReport,
  RECEIVER_STATUS: ReceiverStatusReport,
  NETWORK_STATUS: NetworkStatusReport,
  NOTIFICATION_CHANNELS: NotificationChannelsReport,
  EVENTS_SUMMARY: EventsSummaryReport,
} as const;

export type ReportTypes = {
  OVERVIEW: OverviewReport;
  CONVERSATIONS: ConversationsReport;
  LOGS: LogsReport;
  SERVICES: ServicesReport;
  DM_SEARCH: DMSearchReport;
  SCRAPPER_STATUS: ScrapperStatusReport;
  RECEIVER_STATUS: ReceiverStatusReport;
  NETWORK_STATUS: NetworkStatusReport;
  NOTIFICATION_CHANNELS: NotificationChannelsReport;
  EVENTS_SUMMARY: EventsSummaryReport;
};

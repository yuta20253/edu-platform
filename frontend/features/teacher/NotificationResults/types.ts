export type TeacherNotificationResult = {
  id: number;
  email: string;
  status: TeacherNotificationStatus;
  formatted_sent_at: string | null;
  sender_user: {
    id: number;
    name: string;
  };
  receiver_user: {
    id: number;
    name: string;
  };
};

export type NotificationResultsData = TeacherNotificationResult[];

export type TeacherNotificationStatus = "sent" | "failed";

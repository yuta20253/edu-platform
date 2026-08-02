export type TeacherNotificationResult = {
  id: number;
  email: string;
  status: string;
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

export type TeacherNotificationResultsData = TeacherNotificationResult[];

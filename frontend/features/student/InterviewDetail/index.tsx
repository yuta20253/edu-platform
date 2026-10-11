"use client";

import { ErrorState } from "@/components/ui/ErrorState";
import { Box, CircularProgress } from "@mui/material";
import { useInterviewDetail } from "./hooks";
import { Presenter } from "./Presenter";

type Props = {
  interviewId: string;
};

export const InterviewDetail = ({ interviewId }: Props) => {
  const {
    interview,
    messages,
    loading,
    error,
    sendMessage,
    sendError,
    cancel,
    cancelError,
    clearCancelError,
  } = useInterviewDetail(interviewId);

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!interview || error) {
    return <ErrorState />;
  }

  return (
    <Presenter
      interview={interview}
      messages={messages}
      onSendMessage={sendMessage}
      sendError={sendError}
      onCancel={cancel}
      cancelError={cancelError}
      onClearCancelError={clearCancelError}
    />
  );
};

"use client";

import { Alert, Snackbar } from "@mui/material";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type ToastSeverity = "success" | "error" | "info" | "warning";

export type ToastOptions = {
  message: string;
  severity?: ToastSeverity;
};

type ToastContextValue = {
  show: (options: ToastOptions) => void;
};

// 自動消去時間とanchorOriginは画面によって3000/4000/5000・
// top/bottomがバラバラだったため1つに統一する。
const AUTO_HIDE_DURATION = 3000;
const ANCHOR_ORIGIN = { vertical: "bottom", horizontal: "center" } as const;

const ToastContext = createContext<ToastContextValue | null>(null);

type ToastState = {
  open: boolean;
  message: string;
  severity: ToastSeverity;
};

const initialState: ToastState = {
  open: false,
  message: "",
  severity: "success",
};

// アプリ全体で1箇所だけマウントするトースト表示。useToast().show()を呼ぶだけで
// 各Presenterがsnackbar/onSnackbarCloseのstateを持ち回す必要をなくす。
export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<ToastState>(initialState);

  const show = useCallback(
    ({ message, severity = "success" }: ToastOptions) => {
      setState({ open: true, message, severity });
    },
    [],
  );

  const handleClose = useCallback(() => {
    setState((prev) => ({ ...prev, open: false }));
  }, []);

  const value = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Snackbar
        open={state.open}
        autoHideDuration={AUTO_HIDE_DURATION}
        onClose={handleClose}
        anchorOrigin={ANCHOR_ORIGIN}
      >
        <Alert
          onClose={handleClose}
          severity={state.severity}
          sx={{ width: "100%" }}
        >
          {state.message}
        </Alert>
      </Snackbar>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextValue => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

export type ToastType = "success" | "error";

export type AppToastDetail = {
  message: string;
  type?: ToastType;
};

const APP_TOAST_EVENT = "app-toast";

export function pushToast(message: string, type: ToastType = "success") {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new CustomEvent<AppToastDetail>(APP_TOAST_EVENT, { detail: { message, type } }));
}

export const appToastEventName = APP_TOAST_EVENT;

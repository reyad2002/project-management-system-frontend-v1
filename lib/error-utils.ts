import axios from "axios";

const FALLBACK_ERROR_MESSAGE = "Something went wrong. Please try again.";

export function getErrorMessage(error: unknown): string {
  if (typeof error === "string" && error.trim()) {
    return error;
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      | { error?: string; message?: string; errors?: string[] }
      | undefined;

    const apiMessage =
      data?.error ||
      data?.message ||
      (Array.isArray(data?.errors) ? data?.errors[0] : undefined);

    if (apiMessage?.trim()) {
      return apiMessage;
    }

    if (error.response?.status === 0 || error.code === "ERR_NETWORK") {
      return "Network error. Please check your internet connection.";
    }
  }

  return FALLBACK_ERROR_MESSAGE;
}

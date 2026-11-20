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

    const status = error.response?.status;
    // Our API already words its 4xx answers for people ("Email already registered"); keep those.
    if (apiMessage?.trim() && status !== undefined && status < 500) {
      return apiMessage;
    }

    if (!error.response || error.code === "ERR_NETWORK") {
      return "Can't reach the server. Check your internet connection and try again.";
    }
    if (error.code === "ECONNABORTED") return "The server took too long to answer. Please try again.";
    if (status === 401) return "Your session has ended. Please sign in again.";
    if (status === 403) return "You don't have permission to do this.";
    if (status === 404) return "This item no longer exists. It may have been deleted.";
    if (status === 409) return "This conflicts with something that already exists.";
    if (status === 413) return "That is too large to upload.";
    if (status === 429) return "Too many attempts. Wait a moment and try again.";
    if (status !== undefined && status >= 500) return "Something went wrong on our side. Please try again in a minute.";
  }

  return FALLBACK_ERROR_MESSAGE;
}

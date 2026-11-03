import axios from 'axios';

export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string } | undefined;

    if (data?.message) {
      return data.message;
    }

    if (error.code === 'ECONNABORTED') {
      return 'The request timed out. Please try again.';
    }

    if (!error.response) {
      return 'Could not reach the store. Check your connection and try again.';
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Something went wrong. Please try again.';
}

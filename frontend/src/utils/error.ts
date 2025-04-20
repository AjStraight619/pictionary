// frontend/src/utils/error.ts

type ErrorWithMessage = {
  message: string;
};

function isErrorWithMessage(error: unknown): error is ErrorWithMessage {
  return (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as Record<string, unknown>).message === "string"
  );
}

function isResponse(error: unknown): error is Response {
  return (
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    "statusText" in error
  );
}

function toErrorMessage(error: unknown): string {
  if (isErrorWithMessage(error)) {
    return error.message;
  }

  if (isResponse(error)) {
    return `API Error: ${error.status} ${error.statusText}`;
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return "Unknown error occurred";
}

export function handleError(
  error: unknown,
  options?: {
    log?: boolean;
    prefix?: string;
  }
) {
  const message = toErrorMessage(error);
  const formattedMessage = options?.prefix
    ? `${options.prefix}: ${message}`
    : message;

  // Optionally log the error for debugging
  if (options?.log) {
    console.error("Error:", error);
  }

  return {
    message: formattedMessage,
    originalError: error,
    isError: true,
  };
}

export async function handleApiError(response: Response): Promise<never> {
  let errorMessage = `API Error: ${response.status} ${response.statusText}`;

  try {
    const errorData = await response.json();
    if (errorData.error) {
      errorMessage = errorData.error;
    } else if (errorData.message) {
      errorMessage = errorData.message;
    }
  } catch {
    errorMessage = `API Error: ${response.status} ${response.statusText}`;
    console.error(errorMessage);
  }

  throw new Error(errorMessage);
}

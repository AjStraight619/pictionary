import { Prisma } from "@prisma/client";

export const mapErrorToMessage = (error: unknown): string => {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case "P2002":
        return "A player with this email or username already exists.";
      default:
        return "An unexpected database error occurred.";
    }
  }

  return getErrorMessage(error);
};

export const getErrorMessage = (error: unknown): string => {
  let message: string;

  if (error instanceof Error) {
    message = error.message;
  } else if (error && typeof error === "object" && "message" in error) {
    message = String(error.message);
  } else if (typeof error === "string") {
    message = error;
  } else {
    message = "Something went wrong";
  }

  return message;
};

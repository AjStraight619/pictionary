import { z } from "zod";

export const profileSchema = z.object({
  email: z
    .string()
    .min(1, {
      message: "Email is required",
    })
    .max(50, {
      message: "Email is too long",
    }),
  username: z
    .string()
    .min(1, {
      message: "Username is required",
    })
    .max(15, {
      message: "Username is too long",
    }),
});

export const createRoomSchema = z.object({
  roomname: z
    .string()
    .min(1, {
      message: "Room name is required",
    })
    .max(12, {
      message: "Room name cannot exceed 12 characters",
    }),
  isOpen: z.boolean(),
});

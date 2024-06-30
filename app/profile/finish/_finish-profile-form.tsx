"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { profileSchema } from "@/lib/schemas";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { useState, useTransition } from "react";
import SubmitButton from "@/components/ui/submit-button";
import { createPlayer } from "@/actions/player";
import GoHomeButton from "@/components/ui/go-home-button";

type FinishProfileFormProps = {
  email: string | undefined;
};

export default function FinishProfileForm({ email }: FinishProfileFormProps) {
  const [error, setError] = useState<string | null>("");
  const [success, setSuccess] = useState("");

  const [isPending, startTransition] = useTransition();

  const form = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      email: email ?? "",
      username: "",
    },
  });

  const onSubmit = (values: z.infer<typeof profileSchema>) => {
    setSuccess("");
    setError("");
    startTransition(() => {
      createPlayer(values).then((data) => {
        if (data.success) {
          setSuccess("Profile created successfully!");
        } else {
          setError(data.error);
        }
      });
    });
  };

  return (
    <Card className="w-full sm:w-1/2 md:w-1/3">
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>
          FInish setting up your profile to join a room.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        {success && (
          <div className="text-emerald-500 p-2 rounded-md bg-emerald-600/20 text-center text-wrap">
            {success}
          </div>
        )}
        {error && (
          <div className="text-red-500 bg-red-600/20 text-center rounded-md p-2 text-wrap">
            {error}
          </div>
        )}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter a username" {...field} />
                  </FormControl>
                  <FormDescription>
                    This is your public username
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <SubmitButton isPending={isPending}>Create Profile</SubmitButton>
          </form>
        </Form>
      </CardContent>
      <CardFooter>
        <GoHomeButton>Go Back</GoHomeButton>
      </CardFooter>
    </Card>
  );
}

'use client';
import { createRoomSchema } from '@/lib/schemas';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogContent,
  DialogDescription,
} from '../ui/dialog';
import { Button } from '../ui/button';

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../ui/form';
import { useState, useTransition } from 'react';
import { Input } from '../ui/input';
import { ErrorMessage, SuccessMessage } from '../forms/form-messages';
import { useRouter } from 'next/navigation';
import SubmitButton from '../ui/submit-button';
import { createGame } from '@/actions/game';
import { Loader2 } from 'lucide-react';
import { useSession } from '@clerk/nextjs';
import { Checkbox } from '../ui/checkbox';

export default function CreateRoom() {
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isPending, startTransition] = useTransition();
  const { isLoaded, session } = useSession();

  const { push } = useRouter();
  const form = useForm({
    resolver: zodResolver(createRoomSchema),
    defaultValues: {
      roomname: '',
      isOpen: false,
    },
  });

  const onSubmit = (values: z.infer<typeof createRoomSchema>) => {
    setError('');
    setSuccess('');
    startTransition(() => {
      createGame(values).then(data => {
        console.log('data: ', data);
        if (!data) {
          setError('Something went wrong');
          return;
        }
        if (data.error) {
          setError(data.error);
          return;
        }
        if (data.success && data.success.ok && data.success.room) {
          setSuccess('Room created successfully, redirecting!');
          push(`/room/${data.success.room}`);
        }
      });
    });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="w-full">Create Room</Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Room</DialogTitle>
          <DialogDescription>
            Create a room and invite friends!
          </DialogDescription>
          {error && <ErrorMessage message={error} />}
          {success && (
            <div className="flex items-center justify-center gap-2 w-full">
              <SuccessMessage message={success} />
            </div>
          )}
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              name="roomname"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Room Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Name the room" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name="isOpen"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center">
                    <FormLabel className="mr-2">Joinable</FormLabel>
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </div>
                  <FormDescription>
                    Allow the room to be joinable
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <SubmitButton isPending={isPending || !isLoaded}>
              Create Room
            </SubmitButton>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

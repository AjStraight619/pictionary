import { ReactNode } from "react";
import { Button } from "./button";
import { Loader2 } from "lucide-react";

type SubmitButtonProps = {
  isPending: boolean;
  children: ReactNode;
};

export default function SubmitButton({
  isPending,
  children,
}: SubmitButtonProps) {
  return (
    <Button className="w-full" disabled={isPending} type="submit">
      {isPending ? <Loader2 className="animate-spin" /> : children}
    </Button>
  );
}

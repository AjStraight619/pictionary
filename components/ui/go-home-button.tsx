import Link from "next/link";
import { Button } from "./button";
import { ReactNode } from "react";

type GoHomeButtonProps = {
  children: ReactNode;
};

export default function GoHomeButton({ children }: GoHomeButtonProps) {
  return (
    <Button type="button" className="w-full" asChild>
      <Link href="/">{children}</Link>
    </Button>
  );
}

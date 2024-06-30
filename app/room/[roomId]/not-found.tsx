// app/room/not-found.tsx
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import GoHomeButton from "@/components/ui/go-home-button";
import { FrownIcon } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex items-center justify-center p-4 h-screen z-[999] bg-black">
      <div className="flex flex-col gap-y-12 text-muted-foreground items-center w-full sm:w-1/2 md:w-1/3">
        <div className="flex flex-row gap-x-6 items-center">
          <h1 className="text-4xl font-semibold">404 Not Found</h1>
          <FrownIcon size={100} />
        </div>
        <h3 className="text-lg">This room does not exist</h3>
        <GoHomeButton>Go Back</GoHomeButton>
      </div>
    </div>
  );
}

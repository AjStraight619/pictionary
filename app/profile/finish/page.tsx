import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import FinishProfileForm from "./_finish-profile-form";

export default async function ProfileFinishPage() {
  const user = await currentUser();
  if (!user || !user.id) redirect("/sign-in");

  return <FinishProfileForm email={user.primaryEmailAddress?.emailAddress} />;
}

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";

type ProfilePageProps = {
  params: {
    id: string;
  };
};

const getCurrentPlayer = async (userId: string) => {
  const player = await db.player.findUnique({
    where: {
      id: userId,
    },
    select: {
      username: true,
      email: true,
    },
  });
  return player;
};

export default async function ProfilePage({
  params: { id },
}: ProfilePageProps) {
  const player = await getCurrentPlayer(id);
  if (!player) redirect("/profile/finish");

  return (
    <Card className="w-full sm:w-1/2 md:w-1/3">
      <CardHeader>
        <CardTitle></CardTitle>
      </CardHeader>
      <CardContent></CardContent>
    </Card>
  );
}

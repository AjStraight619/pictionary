import CreateGameForm from "@/components/home/create-game";
import JoinGameForm from "@/components/home/join-game";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Home = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-4xl font-bold mb-8">Pictionary With Friends</h1>
      <Tabs
        defaultValue="create"
        className="max-w-lg mx-auto bg-background/40 min-h-[620px]"
      >
        <TabsList className="w-full justify-evenly">
          <TabsTrigger value="create">Create</TabsTrigger>
          <TabsTrigger value="join">Join</TabsTrigger>
        </TabsList>
        <TabsContent value="create">
          <CreateGameForm />
        </TabsContent>
        <TabsContent value="join">
          <JoinGameForm />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Home;

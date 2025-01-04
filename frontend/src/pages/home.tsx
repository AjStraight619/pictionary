import CreateGameForm from "@/components/home/create-game";

const Home = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground">
      <h1 className="text-4xl font-bold">Pictionary With Friends</h1>
      <CreateGameForm />
    </div>
  );
};

export default Home;

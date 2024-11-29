import CreateGameForm from '@/components/home/create-game';

const Home = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground">
      <h1 className="text-4xl font-bold">Welcome to the Game</h1>
      {/* <Link
        to="/game"
        className="mt-4 px-6 py-2 bg-primary text-white rounded-lg"
      >
        Enter Game
      </Link> */}
      <CreateGameForm />
    </div>
  );
};

export default Home;

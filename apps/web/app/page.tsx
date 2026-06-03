import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black gap-4">
      <h1 className="font-sans text-4xl font-bold text-imperial-red">
        Bem-vindo ao Cinema Booking
      </h1>
      <Button variant="secondary">
        <p className="text-background">Ver filmes em exibição </p>
      </Button>
    </div>
  );
}

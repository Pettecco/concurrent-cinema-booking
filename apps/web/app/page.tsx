import { MovieList } from "@/components/movies/movie-list";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-12 bg-background px-4 py-12">
      <div className="text-center">
        <h1 className="font-sans text-5xl font-bold text-imperial-red">
          Cinema Booking
        </h1>
        <p className="mt-4 text-lg text-gray">
          Escolha seu filme e reserve seu assento
        </p>
      </div>

      <MovieList />
    </div>
  );
}

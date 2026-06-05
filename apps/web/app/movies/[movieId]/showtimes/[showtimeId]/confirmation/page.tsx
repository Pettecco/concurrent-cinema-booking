"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Ticket } from "@/components/booking/ticket";

export default function ConfirmationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const movieTitle = searchParams.get("movie") ?? "";
  const showtime = searchParams.get("showtime") ?? "";
  const roomName = searchParams.get("room") ?? "";
  const seats = searchParams.get("seats")?.split(",") ?? [];
  const bookingId = searchParams.get("bookingId") ?? "";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12">
      <div className="mb-8 text-center">
        <p className="text-2xl font-bold text-white">
          "Obrigado por comprar seu ingresso conosco. Esperamos que você aproveite sua experiência no cinema."
        </p>
        <p className="mt-4 text-lg text-gray">
          A confirmação foi enviada para seu email.
        </p>
      </div>

      <Ticket
        movieTitle={movieTitle}
        showtime={showtime}
        roomName={roomName}
        seats={seats}
        bookingId={bookingId}
      />

      <button
        onClick={() => router.push("/")}
        className="mt-12 cursor-pointer rounded-full bg-imperial-red px-16 py-5 text-xl font-bold text-white transition-all hover:bg-imperial-red/80"
      >
        <span className="mr-2">←</span> Voltar ao início
      </button>
    </div>
  );
}

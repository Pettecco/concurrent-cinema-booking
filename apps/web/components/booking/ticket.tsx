"use client";

interface TicketProps {
  movieTitle: string;
  showtime: string;
  roomName: string;
  seats: string[];
  bookingId: string;
}

export function Ticket({ movieTitle, showtime, roomName, seats, bookingId }: TicketProps) {
  return (
    <div className="relative mx-auto w-full max-w-sm overflow-hidden rounded-2xl bg-background-2">
      <div className="relative p-8 pb-6">
        <div className="mb-6 text-center">
          <p className="text-sm font-semibold text-gray uppercase tracking-wider">
            Cinema Booking
          </p>
        </div>

        <div className="mb-6">
          <h2 className="text-3xl font-bold text-white">{movieTitle}</h2>
          <p className="mt-2 text-xl text-imperial-red">{showtime}</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray">Sala</p>
            <p className="text-lg font-bold text-white">{roomName}</p>
          </div>
          <div>
            <p className="text-sm text-gray">Pedido</p>
            <p className="text-lg font-bold text-imperial-red">{bookingId}</p>
          </div>
          <div>
            <p className="text-sm text-gray">Ingressos</p>
            <p className="text-lg font-bold text-imperial-red">{seats.length}</p>
          </div>
          <div>
            <p className="text-sm text-gray">Assentos</p>
            <p className="text-lg font-bold text-imperial-red">{seats.join(", ")}</p>
          </div>
        </div>
      </div>

      <div className="relative">
        <div className="absolute -left-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-background" />
        <div className="absolute -right-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-background" />
        <div className="border-t-2 border-dashed border-background-3" />
      </div>

      <div className="flex justify-center p-6">
        <div className="flex gap-0.5">
          {Array.from({ length: 30 }).map((_, i) => (
            <div
              key={i}
              className={`h-12 ${i % 3 === 0 ? "w-0.5" : "w-1"} bg-gray`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

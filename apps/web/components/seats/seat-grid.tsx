"use client";

interface SeatGridProps {
  layout: string;
  bookedSeats: string[];
  lockedSeats: string[];
  myLockedSeats: string[];
  onToggleSeat: (seatId: string) => void;
}

export function SeatGrid({
  layout,
  bookedSeats,
  lockedSeats,
  myLockedSeats,
  onToggleSeat,
}: SeatGridProps) {
  const [rows, cols] = layout.split("x").map(Number);
  const midCol = Math.floor(cols / 2);
  const rowLabels = Array.from({ length: rows }, (_, i) =>
    String.fromCharCode(65 + i),
  );

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative w-full max-w-md mb-6">
        <p className="mb-2 text-center text-sm font-semibold text-gray">Tela</p>
        <div className="mx-auto h-1 w-3/4 rounded-full bg-violet/60" />
        <div className="mx-auto h-2 w-3/4 rounded-full bg-violet/30 blur-sm" />
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="w-6" />
          {Array.from({ length: cols }).map((_, col) => {
            const isCorridor = col === midCol - 1;
            return (
              <div key={col} className="flex items-center gap-2">
                <span className="h-10 w-10 text-center text-sm font-bold text-gray">
                  {col + 1}
                </span>
                {isCorridor && <div className="w-6" />}
              </div>
            );
          })}
        </div>

        {Array.from({ length: rows }).map((_, row) => (
          <div key={row} className="flex items-center gap-2">
            <span className="w-6 text-center text-sm font-bold text-gray">
              {rowLabels[row]}
            </span>
            {Array.from({ length: cols }).map((_, col) => {
              const seatId = `${rowLabels[row]}${col + 1}`;
              const isBooked = bookedSeats.includes(seatId);
              const isLocked = lockedSeats.includes(seatId);
              const isMyLock = myLockedSeats.includes(seatId);
              const isCorridor = col === midCol - 1;

              return (
                <div key={seatId} className="flex items-center gap-2">
                  <button
                    disabled={isBooked || (isLocked && !isMyLock)}
                    onClick={() => onToggleSeat(seatId)}
                    className={`group relative h-10 w-10 rounded-md border-2 transition-all duration-200 ${
                      isBooked
                        ? "cursor-not-allowed border-violet/30 bg-violet/20 opacity-50"
                        : isMyLock
                          ? "scale-105 border-carrow-orange bg-carrow-orange shadow-[0_0_12px_rgba(241,143,1,0.4)]"
                          : isLocked
                            ? "cursor-not-allowed border-carrow-orange/50 bg-carrow-orange/20"
                            : "cursor-pointer border-gray/30 bg-background-3 hover:scale-110 hover:border-imperial-red hover:bg-imperial-red/20 hover:shadow-[0_0_10px_rgba(247,67,70,0.3)] active:scale-95"
                    }`}
                  />
                  {isCorridor && <div className="w-6" />}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="h-5 w-5 rounded-md border-2 border-carrow-orange bg-carrow-orange" />
          <span className="text-sm font-medium text-white">Travado</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-5 w-5 rounded-md border-2 border-violet/40 bg-violet/40" />
          <span className="text-sm font-medium text-white">Reservado</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-5 w-5 rounded-md border-2 border-gray/30 bg-background-3" />
          <span className="text-sm font-medium text-white">Disponível</span>
        </div>
      </div>
    </div>
  );
}

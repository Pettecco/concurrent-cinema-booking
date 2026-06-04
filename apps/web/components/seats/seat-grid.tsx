"use client";

interface SeatGridProps {
  layout: string;
  bookedSeats: string[];
  selectedSeats: string[];
  onToggleSeat: (seatId: string) => void;
  onClearSeats: () => void;
}

export function SeatGrid({
  layout,
  bookedSeats,
  selectedSeats,
  onToggleSeat,
  onClearSeats,
}: SeatGridProps) {
  const [rows, cols] = layout.split("x").map(Number);
  const midCol = Math.floor(cols / 2);
  const rowLabels = Array.from({ length: rows }, (_, i) =>
    String.fromCharCode(65 + i),
  );

  return (
    <div className="flex flex-col items-center gap-12">
      <div className="relative w-full max-w-3xl mb-12">
        <p className="mb-4 text-center text-2xl font-bold text-gray">Tela</p>
        <div className="mx-auto h-2 w-3/4 rounded-full bg-violet/60" />
        <div className="mx-auto h-5 w-3/4 rounded-full bg-violet/30 blur-sm" />
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <span className="w-8" />
          {Array.from({ length: cols }).map((_, col) => {
            const isCorridor = col === midCol - 1;
            return (
              <div key={col} className="flex items-center gap-4">
                <span className="h-16 w-16 text-center text-lg font-bold text-gray">
                  {col + 1}
                </span>
                {isCorridor && <div className="w-12" />}
              </div>
            );
          })}
        </div>

        {Array.from({ length: rows }).map((_, row) => (
          <div key={row} className="flex items-center gap-4">
            <span className="w-8 text-center text-lg font-bold text-gray">
              {rowLabels[row]}
            </span>
            {Array.from({ length: cols }).map((_, col) => {
              const seatId = `${rowLabels[row]}${col + 1}`;
              const isBooked = bookedSeats.includes(seatId);
              const isSelected = selectedSeats.includes(seatId);
              const isCorridor = col === midCol - 1;

              return (
                <div key={seatId} className="flex items-center gap-4">
                  <button
                    disabled={isBooked}
                    onClick={() => onToggleSeat(seatId)}
                    className={`group relative h-16 w-16 rounded-xl border-2 transition-all duration-200 ${
                      isBooked
                        ? "cursor-not-allowed border-violet/30 bg-violet/20 opacity-50"
                        : isSelected
                          ? "scale-105 border-imperial-red bg-imperial-red shadow-[0_0_20px_rgba(247,67,70,0.5)]"
                          : "cursor-pointer border-gray/30 bg-background-3 hover:scale-110 hover:border-imperial-red hover:bg-imperial-red/20 hover:shadow-[0_0_15px_rgba(247,67,70,0.3)] active:scale-95"
                    }`}
                  ></button>
                  {isCorridor && <div className="w-12" />}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-12">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl border-2 border-imperial-red bg-imperial-red" />
          <span className="text-xl font-bold text-white">Selecionado</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl border-2 border-violet/40 bg-violet/40" />
          <span className="text-xl font-bold text-white">Reservado</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl border-2 border-gray/30 bg-background-3" />
          <span className="text-xl font-bold text-white">Disponível</span>
        </div>
      </div>
    </div>
  );
}

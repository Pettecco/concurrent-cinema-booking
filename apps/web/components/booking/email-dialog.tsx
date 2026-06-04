"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface EmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  seats: string[];
  onConfirm: (email: string) => void;
}

export function EmailDialog({
  open,
  onOpenChange,
  seats,
  onConfirm,
}: EmailDialogProps) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      setError("Email é obrigatório");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Email inválido");
      return;
    }

    onConfirm(email);
    setEmail("");
    setError("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-background-2 text-white">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold text-imperial-red">
            Finalizar Reserva
          </DialogTitle>
          <p className="text-center text-sm text-gray mt-2">
            Confirme seus dados para garantir seus assentos
          </p>
        </DialogHeader>

        <div className="flex flex-col gap-6 py-4">
          <div className="text-center">
            <p className="text-sm text-gray">Assentos:</p>
            <p className="text-lg font-bold text-white">{seats.join(", ")}</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-white">
                Email para confirmação
              </label>
              <Input
                type="email"
                placeholder="cinemabooking@gmail.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError("");
                }}
                className="h-10 text-base bg-background-3 text-white border border-background-3 focus:border-imperial-red rounded-lg px-3"
              />
              {error && <p className="text-sm text-imperial-red">{error}</p>}
            </div>

            <button
              type="submit"
              className="cursor-pointer rounded-lg bg-imperial-red px-6 py-3 text-base font-bold text-white transition-all hover:bg-imperial-red/80"
            >
              Finalizar Reserva
            </button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}

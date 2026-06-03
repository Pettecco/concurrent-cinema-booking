import type { Metadata } from "next";
import { Urbanist } from "next/font/google";
import "./globals.css";
import { UserIdDisplay } from "@/components/layout/user-id-display";

const urbanist = Urbanist({
  variable: "--font-urbanist",
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Cinema Booking",
  description: "Seu sistema de reserva de cinemas",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-br" className={`${urbanist.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        <UserIdDisplay />
        {children}
      </body>
    </html>
  );
}

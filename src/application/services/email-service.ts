import { emailQueue } from '../../infra/queues/email-queue.js';

export class EmailService {
  async sendBookingConfirmation(
    email: string,
    booking: {
      movieTitle: string;
      showtime: string;
      seatId: string;
      bookingId: string;
    }
  ) {
    await emailQueue.add('booking-confirmation', {
      to: email,
      subject: 'Reserva Confirmada - Cinema',
      body: `Sua reserva foi confirmada!\n\nFilme: ${booking.movieTitle}\nHorário: ${booking.showtime}\nAssento: ${booking.seatId}\nCódigo: ${booking.bookingId}`,
      html: `
        <h1>Reserva Confirmada!</h1>
        <p><strong>Filme:</strong> ${booking.movieTitle}</p>
        <p><strong>Horário:</strong> ${booking.showtime}</p>
        <p><strong>Assento:</strong> ${booking.seatId}</p>
        <p><strong>Código:</strong> ${booking.bookingId}</p>
      `,
    });
  }
}

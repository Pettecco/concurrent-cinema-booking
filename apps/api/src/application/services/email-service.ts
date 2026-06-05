import { emailQueue } from '../../infra/queues/email-queue.js';

export class EmailService {
  async sendBookingConfirmation(email: string, booking: any) {
    await emailQueue.add('booking-confirmation', {
      to: email,
      subject: 'Reserva Confirmada - Cinema',
      body: `Sua reserva foi confirmada!\n\nFilme: ${booking.movieTitle}\nHorário: ${booking.showtime}\nSala: ${booking.roomName}\nAssento: ${booking.seatId}\nCódigo: ${booking.bookingId}`,
      html: `
        <h1>Reserva Confirmada!</h1>
        <p><strong>Filme:</strong> ${booking.movieTitle}</p>
        <p><strong>Horário:</strong> ${booking.showtime}</p>
        <p><strong>Sala:</strong> ${booking.roomName}</p>
        <p><strong>Assento:</strong> ${booking.seatId}</p>
        <p><strong>Código:</strong> ${booking.bookingId}</p>
      `,
    });
  }

  async sendBatchBookingConfirmation(email: string, bookings: any[]) {
    if (!bookings.length) return;

    const first = bookings[0]!;
    const seatList = bookings.map((b) => b.seatId).join(', ');
    const bookingId = first.bookingId;

    await emailQueue.add('booking-confirmation', {
      to: email,
      subject: 'Reserva Confirmada - Cinema',
      body: `Sua reserva foi confirmada!\n\nFilme: ${first.movieTitle}\nHorário: ${first.showtime}\nSala: ${first.roomName}\nAssentos: ${seatList}\nCódigo: ${bookingId}`,
      html: `
        <div style="max-width: 400px; margin: 0 auto; font-family: Arial, sans-serif; background: #161621; color: #ffffff; border-radius: 16px; overflow: hidden;">
          <div style="padding: 32px 24px 16px; text-align: center;">
            <p style="margin: 0; font-size: 12px; color: #cbcbcb; text-transform: uppercase; letter-spacing: 2px;">Cinema Booking</p>
          </div>
          
          <div style="padding: 0 24px 24px;">
            <h2 style="margin: 0 0 8px; font-size: 24px; color: #ffffff;">${first.movieTitle}</h2>
            <p style="margin: 0 0 24px; font-size: 16px; color: #f74346;">${first.showtime}</p>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px;">
              <div>
                <p style="margin: 0 0 4px; font-size: 12px; color: #cbcbcb;">Sala</p>
                <p style="margin: 0; font-size: 16px; font-weight: bold; color: #ffffff;">${first.roomName}</p>
              </div>
              <div>
                <p style="margin: 0 0 4px; font-size: 12px; color: #cbcbcb;">Pedido</p>
                <p style="margin: 0; font-size: 16px; font-weight: bold; color: #f74346;">${bookingId}</p>
              </div>
              <div>
                <p style="margin: 0 0 4px; font-size: 12px; color: #cbcbcb;">Ingressos</p>
                <p style="margin: 0; font-size: 16px; font-weight: bold; color: #f74346;">${bookings.length}</p>
              </div>
              <div>
                <p style="margin: 0 0 4px; font-size: 12px; color: #cbcbcb;">Assentos</p>
                <p style="margin: 0; font-size: 16px; font-weight: bold; color: #f74346;">${seatList}</p>
              </div>
            </div>
            
            <div style="border-top: 2px dashed #4a4b56; margin: 0 -24px; position: relative;">
              <div style="position: absolute; left: -12px; top: 50%; transform: translateY(-50%); width: 24px; height: 24px; background: #161621; border-radius: 50%;"></div>
              <div style="position: absolute; right: -12px; top: 50%; transform: translateY(-50%); width: 24px; height: 24px; background: #161621; border-radius: 50%;"></div>
            </div>
            
            <div style="padding: 24px; text-align: center;">
              <div style="display: inline-block; background: #ffffff; padding: 8px 16px; border-radius: 4px;">
                <div style="display: flex; gap: 2px;">
                  ${Array.from({ length: 20 }).map(() => `<div style="width: 3px; height: 40px; background: #161621;"></div>`).join('')}
                </div>
              </div>
            </div>
          </div>
          
          <div style="padding: 16px 24px 32px; text-align: center;">
            <p style="margin: 0; font-size: 14px; color: #cbcbcb;">Obrigado por comprar conosco!</p>
          </div>
        </div>
      `,
    });
  }
}

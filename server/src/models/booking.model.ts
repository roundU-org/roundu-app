import { getPool } from '../config/database';

export interface Booking {
  id: string;
  customer_id: string;
  provider_id: string;
  service_id: string;
  status: string;
  scheduled_at: string;
  address: string;
  price: number;
  notes: string;
}

export const BookingModel = {
  async create(booking: Partial<Booking>): Promise<Booking> {
    const res = await getPool().query(
      'INSERT INTO bookings (customer_id, provider_id, service_id, status, scheduled_at, address, price, notes) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [booking.customer_id, booking.provider_id, booking.service_id, 'pending', booking.scheduled_at, booking.address, booking.price, booking.notes]
    );
    return res.rows[0];
  },

  async findByCustomerId(customerId: string): Promise<Booking[]> {
    const res = await getPool().query('SELECT * FROM bookings WHERE customer_id = $1 ORDER BY created_at DESC', [customerId]);
    return res.rows;
  },

  async findByProviderId(providerId: string): Promise<Booking[]> {
    const res = await getPool().query('SELECT * FROM bookings WHERE provider_id = $1 ORDER BY created_at DESC', [providerId]);
    return res.rows;
  }
};

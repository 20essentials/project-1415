import { BOOKING_CONFIRM_SECRET } from 'astro:env/server';
import {
  signBookingConfirmation,
  verifyBookingConfirmation,
  type BookingConfirmationInput,
} from '@/features/workshops/confirmation-url';

export function signBookingConfirmationUrl(input: BookingConfirmationInput): string {
  return signBookingConfirmation(input, BOOKING_CONFIRM_SECRET);
}

export function verifyBookingConfirmationUrl(params: URLSearchParams): boolean {
  return verifyBookingConfirmation(params, BOOKING_CONFIRM_SECRET);
}

import enMessages from '../messages/en.json';
import hiMessages from '../messages/hi.json';

export type Messages = typeof enMessages;

export const messagesMap: Record<string, Record<string, unknown>> = {
  en: enMessages as Record<string, unknown>,
  hi: hiMessages as Record<string, unknown>,
};

export const defaultMessages = enMessages;

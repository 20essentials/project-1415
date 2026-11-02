import type { PublicChatHandler } from './chat';

export type ChatHandlerMode =
  | 'UNKNOWN_MODE'
  | 'ALWAYS_WITH_AI'
  | 'ALWAYS_WITH_WIX_USER'
  | 'SCHEDULED'
  | 'OFF';

export type FrameHandler = 'UNKNOWN_FRAME_HANDLER' | 'NOT_SELECTED' | 'AI_CHAT' | 'WIX_USER_CHAT';

export type DayOfWeek =
  | 'UNKNOWN_DAY'
  | 'MONDAY'
  | 'TUESDAY'
  | 'WEDNESDAY'
  | 'THURSDAY'
  | 'FRIDAY'
  | 'SATURDAY'
  | 'SUNDAY';

export interface ActiveHoursFrame {
  start?: number | null;
  end?: number | null;
  handler?: FrameHandler | null;
  days?: DayOfWeek[] | null;
}

export interface ActiveHoursInput {
  mode?: ChatHandlerMode | null;
  timeZone?: string | null;
  schedule?: ActiveHoursFrame[] | null;
}

const DAY_NAMES: DayOfWeek[] = [
  'SUNDAY',
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
];

const DAY_INDEX: Record<DayOfWeek, number> = {
  SUNDAY: 0,
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
  UNKNOWN_DAY: -1,
};

interface ZonedClock {
  day: DayOfWeek;
  millisecondsSinceMidnight: number;
}

function zonedClock(now: Date, timeZone: string | null | undefined): ZonedClock {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timeZone || 'UTC',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  });
  const parts = formatter.formatToParts(now);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? '';

  const weekday = value('weekday').toUpperCase();
  const day = DAY_NAMES.find((candidate) => candidate.slice(0, 3) === weekday) ?? 'UNKNOWN_DAY';
  const hours = Number(value('hour'));
  const minutes = Number(value('minute'));
  const seconds = Number(value('second'));
  const milliseconds =
    ((hours * 60 + minutes) * 60 + seconds) * 1000 + now.getMilliseconds();

  return { day, millisecondsSinceMidnight: milliseconds };
}

function previousDay(day: DayOfWeek): DayOfWeek {
  const index = DAY_INDEX[day];
  if (index < 0) return 'UNKNOWN_DAY';
  return DAY_NAMES[(index + 6) % 7];
}

function frameMatches(
  frame: ActiveHoursFrame,
  clock: ZonedClock,
): boolean {
  const start = frame.start;
  const end = frame.end;
  if (start == null || end == null || start === end) return false;

  const days =
    frame.days && frame.days.length > 0
      ? frame.days.filter((day): day is Exclude<DayOfWeek, 'UNKNOWN_DAY'> => day !== 'UNKNOWN_DAY')
      : DAY_NAMES;

  const now = clock.millisecondsSinceMidnight;
  const inDay = days.includes(clock.day as Exclude<DayOfWeek, 'UNKNOWN_DAY'>);

  if (start < end) {
    return inDay && now >= start && now < end;
  }

  if (now >= start) return inDay;
  if (now < end) return days.includes(previousDay(clock.day) as Exclude<DayOfWeek, 'UNKNOWN_DAY'>);
  return false;
}

function handlerForFrame(frame: ActiveHoursFrame): PublicChatHandler | null {
  if (frame.handler === 'AI_CHAT') return 'AI';
  if (frame.handler === 'WIX_USER_CHAT') return 'WIX_USER';
  return null;
}

export function resolveActiveHandlers(
  activeHours: ActiveHoursInput | null | undefined,
  now: Date = new Date(),
): PublicChatHandler[] {
  if (!activeHours) return [];

  switch (activeHours.mode) {
    case 'ALWAYS_WITH_AI':
      return ['AI'];
    case 'ALWAYS_WITH_WIX_USER':
      return ['WIX_USER'];
    case 'OFF':
    case 'UNKNOWN_MODE':
    case undefined:
    case null:
      return [];
    case 'SCHEDULED':
    default:
      break;
  }

  const clock = zonedClock(now, activeHours.timeZone);
  const handlers = new Set<PublicChatHandler>();

  for (const frame of activeHours.schedule ?? []) {
    if (!frameMatches(frame, clock)) continue;
    const handler = handlerForFrame(frame);
    if (handler) handlers.add(handler);
  }

  return [...handlers];
}

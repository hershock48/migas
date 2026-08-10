import { AVAILABILITY, SITE } from "./site";

/**
 * Calendar invites, hand-rolled.
 *
 * This is what a scheduling service is mostly selling: the bit where the call lands in both
 * calendars. It is a text format from 1998, it is about eighty lines, and it costs nothing —
 * so there is no reason to rent it.
 *
 * It also does the job the weekly-pattern slot list cannot. Nothing in this build knows what
 * is already booked; but if every confirmed call arrives in his own calendar as a real event,
 * his calendar becomes the record, which is where it should have been anyway.
 *
 * TWO THINGS THAT ARE EASY TO GET WRONG AND SILENT WHEN YOU DO.
 *
 * Timezones. Emitting `DTSTART;TZID=America/Detroit:20260812T093000` without shipping a
 * matching VTIMEZONE block is the common shortcut, and some clients quietly guess UTC from
 * it — a call an hour or four out with no error anywhere. Converting to a real instant and
 * emitting `...Z` avoids the whole question, and every client on earth understands Zulu.
 * The conversion resolves the offset twice, because the offset depends on the instant and the
 * instant depends on the offset; one pass is wrong for the hour either side of a DST change.
 *
 * Line folding. RFC 5545 caps a content line at 75 octets and requires longer ones to be
 * folded onto continuation lines beginning with a space. Skip it and a long description
 * imports as garbage in some clients and not others, which is the worst way to find out.
 */

/** The zone's UTC offset, in minutes, at a given instant. Read from Intl rather than
 *  hardcoded, so it is right on both sides of a clock change without a table. */
function offsetMinutes(at: Date): number {
  const name = new Intl.DateTimeFormat("en-US", {
    timeZone: AVAILABILITY.timeZone,
    timeZoneName: "longOffset",
  })
    .formatToParts(at)
    .find((p) => p.type === "timeZoneName")?.value;
  const m = /GMT([+-])(\d{2}):(\d{2})/.exec(name ?? "");
  if (!m) return 0;
  return (m[1] === "-" ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3]));
}

/** "2026-08-12T09:30" in AVAILABILITY.timeZone → the actual instant. */
export function toInstant(local: string): Date {
  const [d, t] = local.split("T");
  const [y, mo, da] = d.split("-").map(Number);
  const [h, mi] = (t ?? "00:00").split(":").map(Number);
  const naive = Date.UTC(y, mo - 1, da, h, mi);
  // Two passes. The first uses the naive instant to find an offset; the second re-reads the
  // offset at the corrected instant, which is what makes the hour around a DST boundary come
  // out right instead of an hour off.
  let ms = naive;
  for (let i = 0; i < 2; i++) ms = naive - offsetMinutes(new Date(ms)) * 60_000;
  return new Date(ms);
}

const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

/** Commas, semicolons, backslashes and newlines all carry meaning in a property value. */
const esc = (v: string) =>
  v.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

/** RFC 5545 §3.1: fold content lines at 75 octets, continuations start with a space. */
function fold(line: string): string {
  const bytes = Buffer.from(line, "utf8");
  if (bytes.length <= 75) return line;
  const out: string[] = [];
  let start = 0;
  while (start < bytes.length) {
    const take = start === 0 ? 75 : 74;
    let end = Math.min(start + take, bytes.length);
    // Never split a multi-byte character: back up off a continuation byte.
    while (end < bytes.length && (bytes[end] & 0xc0) === 0x80) end--;
    out.push((start === 0 ? "" : " ") + bytes.subarray(start, end).toString("utf8"));
    start = end;
  }
  return out.join("\r\n");
}

export type IcsEvent = {
  uid: string;
  /** Local wall time in AVAILABILITY.timeZone, e.g. "2026-08-12T09:30". */
  localStart: string;
  minutes: number;
  title: string;
  description: string;
  /** Whoever is being invited. Omitted from ATTENDEE if absent. */
  attendeeEmail?: string;
};

export function buildIcs(ev: IcsEvent, now: Date = new Date()): string {
  const start = toInstant(ev.localStart);
  const end = new Date(start.getTime() + ev.minutes * 60_000);
  const organiser = SITE.email.startsWith("PLACEHOLDER") ? null : SITE.email;

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:-//${SITE.name}//Booking//EN`,
    "CALSCALE:GREGORIAN",
    // REQUEST rather than PUBLISH, so a mail client offers Accept/Decline on the attachment
    // instead of treating it as a read-only subscription entry.
    "METHOD:REQUEST",
    "BEGIN:VEVENT",
    `UID:${ev.uid}`,
    `DTSTAMP:${stamp(now)}`,
    `DTSTART:${stamp(start)}`,
    `DTEND:${stamp(end)}`,
    `SUMMARY:${esc(ev.title)}`,
    `DESCRIPTION:${esc(ev.description)}`,
    organiser ? `ORGANIZER;CN=${esc(SITE.name)}:mailto:${organiser}` : null,
    ev.attendeeEmail ? `ATTENDEE;ROLE=REQ-PARTICIPANT;RSVP=TRUE:mailto:${ev.attendeeEmail}` : null,
    "STATUS:CONFIRMED",
    "SEQUENCE:0",
    "BEGIN:VALARM",
    "TRIGGER:-PT30M",
    "ACTION:DISPLAY",
    `DESCRIPTION:${esc(ev.title)}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter((l): l is string => l !== null);

  // CRLF throughout, per the spec. Bare newlines are the other thing that makes an otherwise
  // valid calendar fail to import in exactly one client.
  return lines.map(fold).join("\r\n") + "\r\n";
}

/** An inline download for the confirmation screen. No route, no storage, no round trip —
 *  the file is already in the response that rendered the page. */
export const icsDataUrl = (ics: string) =>
  `data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}`;

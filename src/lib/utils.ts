import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type Appointment = {
  id: number;
  date: string;
  start_time: string;
  end_time: string;
  title: string;
  location: string;
  attendees: string;
  description: string;
  status: 'Pending' | 'Confirmed' | 'Cancelled' | 'Postponed';
  secretary_note: string;
  executive_feedback: string;
  last_updated: string;
};

export function downloadICS(appointment: Appointment) {
  const formatDate = (dateStr: string, timeStr: string) => {
    return dateStr.replace(/-/g, '') + 'T' + timeStr.replace(/:/g, '') + '00';
  };

  const start = formatDate(appointment.date, appointment.start_time);
  const end = formatDate(appointment.date, appointment.end_time);
  const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//ExecManager//Appointment System//EN
BEGIN:VEVENT
UID:${appointment.id}@execmanager.app
DTSTAMP:${now}
DTSTART:${start}
DTEND:${end}
SUMMARY:${appointment.title}
DESCRIPTION:${appointment.description || ''}
LOCATION:${appointment.location || ''}
STATUS:${appointment.status.toUpperCase()}
END:VEVENT
END:VCALENDAR`;

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `appointment-${appointment.id}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

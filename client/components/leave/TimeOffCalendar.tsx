"use client";

import { useMemo, useState } from "react";
import { formatMonthLabel, shiftMonth } from "@/lib/date";
import { cn } from "@/lib/cn";
import type { LeaveRequest } from "@/lib/types";

interface TimeOffCalendarProps {
  requests: LeaveRequest[];
  initialMonth: string;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function statusDotClass(status: LeaveRequest["status"]): string {
  switch (status) {
    case "approved":
      return "bg-status-present";
    case "rejected":
      return "bg-status-danger";
    default:
      return "bg-status-absent";
  }
}

function addDays(dateStr: string, days: number): string {
  const date = new Date(`${dateStr}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export default function TimeOffCalendar({ requests, initialMonth }: TimeOffCalendarProps) {
  const [month, setMonth] = useState(initialMonth);

  const requestsByDate = useMemo(() => {
    const map = new Map<string, LeaveRequest[]>();
    for (const request of requests) {
      let cursor = request.startDate;
      while (cursor <= request.endDate) {
        const existing = map.get(cursor) ?? [];
        existing.push(request);
        map.set(cursor, existing);
        cursor = addDays(cursor, 1);
      }
    }
    return map;
  }, [requests]);

  const [year, monthIndex] = month.split("-").map(Number);
  const firstOfMonth = new Date(Date.UTC(year, monthIndex - 1, 1));
  const daysInMonth = new Date(Date.UTC(year, monthIndex, 0)).getUTCDate();
  const startWeekday = firstOfMonth.getUTCDay();

  const cells: Array<{ date: string; day: number } | null> = [];
  for (let i = 0; i < startWeekday; i += 1) cells.push(null);
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push({ date: `${month}-${String(day).padStart(2, "0")}`, day });
  }

  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setMonth((current) => shiftMonth(current, -1))}
          className="rounded-md px-2 py-1 text-sm text-muted hover:bg-background"
          aria-label="Previous month"
        >
          ←
        </button>
        <span className="text-sm font-semibold text-foreground">{formatMonthLabel(month)}</span>
        <button
          type="button"
          onClick={() => setMonth((current) => shiftMonth(current, 1))}
          className="rounded-md px-2 py-1 text-sm text-muted hover:bg-background"
          aria-label="Next month"
        >
          →
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs">
        {WEEKDAYS.map((day) => (
          <div key={day} className="py-1 font-medium text-muted">
            {day}
          </div>
        ))}
        {cells.map((cell, index) => {
          if (!cell) return <div key={`empty-${index}`} />;
          const dayRequests = requestsByDate.get(cell.date);
          return (
            <div
              key={cell.date}
              title={dayRequests?.map((request) => `${request.leaveType} (${request.status})`).join(", ")}
              className={cn(
                "flex flex-col items-center gap-0.5 rounded-md py-1.5 text-foreground",
                dayRequests && "bg-background",
              )}
            >
              <span>{cell.day}</span>
              {dayRequests && (
                <span className="flex gap-0.5">
                  {dayRequests.slice(0, 3).map((request) => (
                    <span key={request.id} className={cn("h-1.5 w-1.5 rounded-full", statusDotClass(request.status))} />
                  ))}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

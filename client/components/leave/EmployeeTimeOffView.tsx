"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getLeaveBalances, getLeaveRequestsForUser, MOCK_TODAY } from "@/lib/mock";
import { subscribeMockEvent } from "@/lib/mock/events";
import LeaveBalanceCards from "@/components/leave/LeaveBalanceCards";
import ApplyLeaveModal from "@/components/leave/ApplyLeaveModal";
import TimeOffCalendar from "@/components/leave/TimeOffCalendar";
import LeaveRequestList from "@/components/leave/LeaveRequestList";
import Button from "@/components/ui/Button";
import type { LeaveBalance, LeaveRequest } from "@/lib/types";

export default function EmployeeTimeOffView() {
  const { user } = useAuth();
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    function load() {
      Promise.all([getLeaveBalances(user!.id), getLeaveRequestsForUser(user!.id)]).then(
        ([nextBalances, nextRequests]) => {
          if (!cancelled) {
            setBalances(nextBalances);
            setRequests(nextRequests);
            setLoading(false);
          }
        },
      );
    }

    load();
    const unsubscribe = subscribeMockEvent("leave:update", load);

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [user]);

  if (!user) return null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-foreground">Time Off</h1>
        <Button onClick={() => setShowModal(true)}>+ New</Button>
      </div>

      <LeaveBalanceCards balances={balances} />

      <TimeOffCalendar requests={requests} initialMonth={MOCK_TODAY.slice(0, 7)} />

      <div>
        <h2 className="mb-3 text-sm font-semibold text-foreground">Your Requests</h2>
        <LeaveRequestList requests={requests} loading={loading} />
      </div>

      {showModal && (
        <ApplyLeaveModal user={user} onClose={() => setShowModal(false)} onSubmitted={() => setShowModal(false)} />
      )}
    </div>
  );
}

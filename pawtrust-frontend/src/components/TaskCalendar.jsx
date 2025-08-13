import React, { useMemo } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

function toEvents(tasks = []) {
  return tasks
    .filter((t) => t?.date)
    .map((t) => {
      const start = new Date(t.date);
      const end = new Date(start);
      const hours = Number(t.duration || 1);
      end.setHours(end.getHours() + (isNaN(hours) ? 1 : hours));
      return {
        id: String(t._id),
        title: `${t.petType || "Task"}${t.location ? " · " + t.location : ""}`,
        start,
        end,
      };
    });
}

/** props: { tasks, onCreate(iso), onOpen(taskId), initialView } */
export default function TaskCalendar({
  tasks = [],
  onCreate,
  onOpen,
  initialView = "timeGridWeek",
}) {
  const events = useMemo(() => toEvents(tasks), [tasks]);

  return (
    <div className="rounded-2xl bg-white/80 ring-1 ring-black/5 shadow-xl p-4">
      <div className="w-full overflow-x-auto">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView={initialView}
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay",
          }}
          height="auto"
          selectable
          dayMaxEventRows
          events={events}
          dateClick={(arg) => onCreate?.(new Date(arg.date).toISOString())}
          eventClick={(info) => onOpen?.(info.event.id)}
        />
      </div>
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import type { Task } from "@/lib/api";
import { dateKey, formatDate, getMonthMatrix, tasksByDueDate } from "@/lib/task-utils";
import { ChevronLeftIcon, ChevronRightIcon } from "../layout/icons";
import WidgetCard from "./WidgetCard";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

export default function CalendarWidget({ tasks }: { tasks: Task[] }) {
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });
  const [selected, setSelected] = useState<string | null>(null);

  const byDate = useMemo(() => tasksByDueDate(tasks), [tasks]);
  const cells = useMemo(() => getMonthMatrix(cursor.getFullYear(), cursor.getMonth()), [cursor]);
  const todayKey = dateKey(new Date());
  const selectedTasks = selected ? byDate.get(selected) ?? [] : [];

  return (
    <WidgetCard
      title="Calendar"
      action={
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Previous month"
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
            className="rounded p-1 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <ChevronLeftIcon className="h-4 w-4" />
          </button>
          <span className="min-w-[7rem] text-center text-xs font-medium text-zinc-600 dark:text-zinc-300">
            {cursor.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
          </span>
          <button
            type="button"
            aria-label="Next month"
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
            className="rounded p-1 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <ChevronRightIcon className="h-4 w-4" />
          </button>
        </div>
      }
    >
      <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-zinc-400">
        {WEEKDAYS.map((d, i) => (
          <div key={i}>{d}</div>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {cells.map(({ date, inCurrentMonth }) => {
          const key = dateKey(date);
          const has = byDate.has(key);
          const isToday = key === todayKey;
          const isSelected = key === selected;
          return (
            <button
              type="button"
              key={key}
              onClick={() => setSelected(isSelected ? null : key)}
              className={`relative aspect-square rounded-lg text-xs transition-colors ${
                inCurrentMonth ? "text-zinc-700 dark:text-zinc-200" : "text-zinc-300 dark:text-zinc-700"
              } ${
                isSelected
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                  : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
              } ${isToday && !isSelected ? "ring-1 ring-inset ring-zinc-900 dark:ring-zinc-100" : ""}`}
            >
              {date.getDate()}
              {has && (
                <span
                  className={`absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full ${
                    isSelected ? "bg-white dark:bg-zinc-900" : "bg-blue-500"
                  }`}
                />
              )}
            </button>
          );
        })}
      </div>

      {selected && (
        <div className="mt-4 space-y-2 border-t border-zinc-100 pt-3 dark:border-zinc-800">
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{formatDate(selected)}</p>
          {selectedTasks.length === 0 ? (
            <p className="text-sm text-zinc-400">No tasks due.</p>
          ) : (
            selectedTasks.map((t) => (
              <div key={t.id} className="flex items-center gap-2 text-sm">
                <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${t.completed ? "bg-green-500" : "bg-amber-500"}`} />
                <span className={t.completed ? "truncate text-zinc-400 line-through" : "truncate text-zinc-700 dark:text-zinc-200"}>
                  {t.title}
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </WidgetCard>
  );
}

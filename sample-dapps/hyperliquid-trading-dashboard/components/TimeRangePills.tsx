"use client";

import clsx from "clsx";

export type TimeRangeMinutes = 15 | 30 | 60;

const OPTIONS: Array<{ v: TimeRangeMinutes; label: string }> = [
  { v: 15, label: "15m" },
  { v: 30, label: "30m" },
  { v: 60, label: "1h" }
];

export default function TimeRangePills(props: {
  value: TimeRangeMinutes;
  onChange: (v: TimeRangeMinutes) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-qn-grey-500 font-medium">Window</span>
      <div className="inline-flex items-center gap-1">
        {OPTIONS.map((o) => {
          const active = o.v === props.value;
          return (
            <button
              key={o.v}
              onClick={() => props.onChange(o.v)}
              className={clsx(
                "qn-chip",
                active && "qn-chip-active"
              )}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
"use client";

import clsx from "clsx";

export default function Tabs(props: {
  tabs: Array<{ key: string; label: string }>;
  value: string;
  onChange: (key: string) => void;
}) {
  return (
    <div className="inline-flex items-center gap-1 p-1 rounded-full bg-qn-grey-100/50 border border-qn-grey-100">
      {props.tabs.map((t) => {
        const active = t.key === props.value;
        return (
          <button
            key={t.key}
            onClick={() => props.onChange(t.key)}
            className={clsx(
              "qn-tab",
              active && "qn-tab-active"
            )}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
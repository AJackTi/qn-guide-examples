import clsx from "clsx";

export default function TableShell(props: { children: React.ReactNode; className?: string }) {
  return (
    <div className={clsx("overflow-auto rounded-xl border border-qn-grey-100 bg-qn-white", props.className)}>
      {props.children}
    </div>
  );
}
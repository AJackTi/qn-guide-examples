import clsx from "clsx";

export default function Tile(props: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={clsx("qn-card p-5", props.className)}>
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h3 className="text-base font-semibold text-qn-grey-900">{props.title}</h3>
          {props.subtitle && (
            <p className="text-xs text-qn-grey-500 mt-0.5">{props.subtitle}</p>
          )}
        </div>
        {props.right}
      </div>
      {props.children}
    </section>
  );
}
type StatTileProps = {
  label: string;
  value: string | number;
  hint?: string;
};

const StatTile = ({ label, value, hint }: StatTileProps) => {
  return (
    <div className="rounded-xl border border-border bg-bg-2 p-4">
      <p className="text-xs uppercase tracking-wider text-txt-3">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
      {hint ? <p className="mt-1 text-xs text-txt-3">{hint}</p> : null}
    </div>
  );
};

export default StatTile;
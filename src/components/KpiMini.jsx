export default function KpiMini({ label, value, unit }) {
  return (
    <div className="kpi-mini">
      <div className="kpi-mini-label">{label}</div>
      <div className="kpi-mini-value">
        <span>{value}</span>
        <span className="kpi-mini-unit">{unit}</span>
      </div>
    </div>
  );
}

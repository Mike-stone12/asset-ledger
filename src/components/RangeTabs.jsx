export default function RangeTabs({ value, onChange }) {
  const opts = ['1M', '3M', '6M', '1Y', 'ALL'];
  return (
    <div className="range-tabs">
      {opts.map(o => (
        <button key={o} className={value === o ? 'active' : ''} onClick={() => onChange(o)}>{o}</button>
      ))}
    </div>
  );
}

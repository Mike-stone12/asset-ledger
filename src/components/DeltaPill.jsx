export default function DeltaPill({ value, suffix = '%', size = 'sm', showArrow = true }) {
  const positive = value >= 0;
  const cls = positive ? 'text-pos bg-pos-10' : 'text-neg bg-neg-10';
  const sizes = {
    xs: 'delta-xs',
    sm: 'delta-sm',
    md: 'delta-md',
  };
  return (
    <span className={`delta-pill ${sizes[size]} ${cls}`}>
      {showArrow && (
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.8">
          {positive
            ? <path d="M5 8V2M2 5l3-3 3 3" strokeLinecap="round" strokeLinejoin="round" />
            : <path d="M5 2v6M2 5l3 3 3-3" strokeLinecap="round" strokeLinejoin="round" />}
        </svg>
      )}
      <span>{positive ? '+' : '−'}{Math.abs(value).toFixed(suffix === '%' ? 2 : 0)}{suffix}</span>
    </span>
  );
}

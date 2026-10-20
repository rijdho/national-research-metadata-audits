import { useFormat } from "./lib.jsx";

/**
 * A radar chart for comparing a few profiles on the same axes, all on a 0 to 1 scale.
 * Plain SVG (no chart library). Each vertex carries a data-tip with its exact value, and the
 * page always shows the same figures in a table next to it: area exaggerates differences and the
 * shape depends on the order of the axes, so the chart summarises and the table is the record.
 *
 *   axes:   [{ key, label }]
 *   series: [{ label, color, values: { [key]: 0..1 } }]
 */
export default function Radar({ axes, series, label }) {
  const { pct0 } = useFormat();
  const W = 440, H = 340, cx = W / 2, cy = H / 2 + 4, R = 118;
  const angle = (i) => -Math.PI / 2 + (i * 2 * Math.PI) / axes.length;
  const point = (i, v) => [cx + R * v * Math.cos(angle(i)), cy + R * v * Math.sin(angle(i))];
  const ring = (v) => axes.map((_, i) => point(i, v).join(",")).join(" ");
  return (
    <figure className="radar">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label}>
        {[0.25, 0.5, 0.75, 1].map((v) => (
          <polygon key={v} points={ring(v)} className="radar-grid" />
        ))}
        {[0.5, 1].map((v) => (
          <text key={v} x={cx + 3} y={cy - R * v + 11} className="radar-scale">{pct0(v)}</text>
        ))}
        {axes.map((a, i) => {
          const [x, y] = point(i, 1);
          const [lx, ly] = point(i, 1.16);
          const anchor = Math.abs(lx - cx) < 8 ? "middle" : lx > cx ? "start" : "end";
          return (
            <g key={a.key}>
              <line x1={cx} y1={cy} x2={x} y2={y} className="radar-axis" />
              <text x={lx} y={ly + 4} textAnchor={anchor} className="radar-label">{a.label}</text>
            </g>
          );
        })}
        {series.map((s) => (
          <g key={s.label} style={{ "--c": s.color }}>
            <polygon className="radar-area" points={axes.map((a, i) => point(i, s.values[a.key] ?? 0).join(",")).join(" ")} />
            {axes.map((a, i) => {
              const [x, y] = point(i, s.values[a.key] ?? 0);
              return <circle key={a.key} cx={x} cy={y} r="4.5" className="radar-dot"
                data-tip={`${s.label}, ${a.label}: ${pct0(s.values[a.key])}`} />;
            })}
          </g>
        ))}
      </svg>
      <figcaption className="radar-legend">
        {series.map((s) => (
          <span key={s.label}><i style={{ background: s.color }} />{s.label}</span>
        ))}
      </figcaption>
    </figure>
  );
}

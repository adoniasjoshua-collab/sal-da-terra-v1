export function WorldCover() {
  return <svg className="mb-6 h-36 w-full rounded-2xl bg-[#e3efe7]" viewBox="0 0 640 144" role="img" aria-labelledby="world-cover-title">
    <title id="world-cover-title">Pessoas diferentes reunidas em um círculo de acolhimento</title>
    <ellipse cx="320" cy="105" rx="170" ry="22" fill="#cadfce" />
    {[{ x: 215, y: 48, color: "#176b49" }, { x: 285, y: 34, color: "#ad791e" }, { x: 355, y: 34, color: "#416b86" }, { x: 425, y: 48, color: "#805d72" }].map(({ x, y, color }) => <g key={x} fill={color}><circle cx={x} cy={y} r="16" /><path d={`M ${x - 23} ${y + 59} V ${y + 40} a 23 23 0 0 1 46 0 V ${y + 59} Z`} /></g>)}
    <path d="M247 78 L261 70 M309 64 L331 64 M379 70 L393 78" stroke="#143d2c" strokeWidth="7" strokeLinecap="round" />
  </svg>;
}

export default function Badge({ tone="gray", children }) {
  const map = {
    green: "badge badge-green",
    red: "badge badge-red",
    yellow: "badge badge-yellow",
    gray: "badge badge-gray"
  };
  return <span className={map[tone] || map.gray}>{children}</span>;
}

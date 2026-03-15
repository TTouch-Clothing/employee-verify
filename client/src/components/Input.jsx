export default function Input({ label, ...props }) {
  return (
    <div style={{marginBottom:12}}>
      {label && <div className="label">{label}</div>}
      <input className="input" {...props} />
    </div>
  );
}

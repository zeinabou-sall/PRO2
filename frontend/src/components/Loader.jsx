export default function Loader({ label = 'Chargement...' }) {
  return (
    <div className="loader-wrap">
      <div className="loader" />
      <span>{label}</span>
    </div>
  );
}

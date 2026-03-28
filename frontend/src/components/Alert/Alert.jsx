export default function Alert({ message }) {
  return (
    <div className="alert" role="alert">
      <strong>Attention</strong>
      <span>{message}</span>
    </div>
  );
}

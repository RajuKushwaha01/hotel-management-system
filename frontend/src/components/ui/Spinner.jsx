export default function Spinner({ size = 24 }) {
  return (
    <div
      style={{ width: size, height: size }}
      className="border-4 border-gold/20 border-t-gold rounded-full animate-spin"
    />
  );
}

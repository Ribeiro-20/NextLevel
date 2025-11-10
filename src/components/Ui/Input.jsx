export function Input({ className = "", ...props }) {
  return (
    <input
      {...props}
      className={`w-full px-4 py-2 rounded-lg outline-none ${className}`}
    />
  );
}

export function Button({ children, onClick, className = "", href, variant = "default" }) {
  const base = "px-4 py-2 rounded-lg font-semibold transition-all duration-300";
  const styles = {
    default: "bg-purple-600 hover:bg-purple-700 text-white",
    outline: "border border-white/30 hover:bg-white/10 text-white",
    ghost: "bg-transparent hover:bg-white/10 text-gray-300",
  };

  const classes = `${base} ${styles[variant]} ${className}`;

  if (href) {
    return (
      <a href={href} className={classes}>
        {children}
      </a>
    );
  }

  return (
    <button onClick={onClick} className={classes}>
      {children}
    </button>
  );
}

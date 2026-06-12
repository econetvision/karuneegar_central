interface Props {
  src: string;
  alt: string;
  className?: string;
}

export default function ProtectedPhoto({ src, alt, className }: Props) {
  return (
    <div
      className="relative overflow-hidden select-none"
      onContextMenu={(e) => e.preventDefault()}
    >
      <img
        src={src}
        alt={alt}
        className={className}
        draggable={false}
        style={{ pointerEvents: 'none', userSelect: 'none' }}
      />
    </div>
  );
}

interface Props {
  src: string;
  alt: string;
  className?: string;
  wrapperClassName?: string;
}

export default function ProtectedPhoto({ src, alt, className, wrapperClassName }: Props) {
  return (
    <div
      className={`relative overflow-hidden select-none ${wrapperClassName ?? 'w-full h-full'}`}
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

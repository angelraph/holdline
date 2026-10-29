import Image from "next/image";
import Link from "next/link";

/** The Holdline lockup: the shield mark plus the two-tone wordmark from the brand logo. */
export function Wordmark({ size = 30, href = "/" }: { size?: number; href?: string | null }) {
  const inner = (
    <>
      <Image src="/brand/mark.png" alt="" width={size} height={size} priority className="wm-mark" />
      <span className="wm-text" style={{ fontSize: size * 0.82 }}>
        Hold<span className="wm-line">line</span>
      </span>
    </>
  );
  return href ? (
    <Link href={href} className="wordmark" aria-label="Holdline home">
      {inner}
    </Link>
  ) : (
    <span className="wordmark">{inner}</span>
  );
}

export function GlowMark({ size = 260 }: { size?: number }) {
  return (
    <div className="glowmark" style={{ width: size, height: size }} aria-hidden>
      <div className="glowmark-halo" />
      <div className="glowmark-ring" />
      <Image src="/brand/mark.png" alt="" width={size} height={size} priority className="glowmark-img" />
      <div className="grain" />
    </div>
  );
}

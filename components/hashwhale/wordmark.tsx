import Image from "next/image"

export function Wordmark() {
  return (
    <div className="flex items-center gap-2.5">
      <Image
        src="/hashwhale-logo.png"
        alt="HashWhale logo"
        width={36}
        height={36}
        className="h-9 w-9 object-contain"
        priority
      />
      <span className="text-xl font-bold tracking-tight">
        <span style={{ color: "var(--hw-accent)" }}>Hash</span>
        <span style={{ color: "var(--hw-primary)" }}>Whale</span>
      </span>
    </div>
  )
}

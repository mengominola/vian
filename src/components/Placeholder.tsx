export default function Placeholder({ title, note }: { title: string; note?: string }) {
  return (
    <div style={{ padding: "28px 34px" }}>
      <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.01em" }}>{title}</div>
      <div style={{ fontSize: 12.5, color: "var(--mut)", marginTop: 8 }}>
        {note ?? "En construcción."}
      </div>
    </div>
  );
}

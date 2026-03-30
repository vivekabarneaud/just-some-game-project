interface CountdownProps {
  remainingSeconds: number;
}

export default function Countdown(props: CountdownProps) {
  const format = () => {
    const s = Math.max(0, Math.ceil(props.remainingSeconds));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  return <span class="countdown">{format()}</span>;
}

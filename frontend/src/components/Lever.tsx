import type { ReactNode } from "react";

type LeverColor = "red" | "black" | "yellow" | "blue";

const HANDLE: Record<LeverColor, string> = {
  red: "bg-aspect-red",
  black: "bg-lever-black ring-enamel/70",
  yellow: "bg-aspect-amber",
  blue: "bg-lever-blue",
};

interface Props {
  number: string | number;
  color: LeverColor;
  pulled?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  label: ReactNode;
  sub?: ReactNode;
  ariaLabel: string;
  size?: "md" | "lg";
}

/**
 * A lever in the frame. Pulling (pressing) it rotates the handle toward you and lights the plate.
 * It is a real <button>; the handle is decoration on top of a labelled control.
 */
export default function Lever({ number, color, pulled = false, disabled, onClick, label, sub, ariaLabel, size = "md" }: Props) {
  const h = size === "lg" ? "h-28" : "h-24";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={pulled}
      aria-label={ariaLabel}
      className="group flex w-full flex-col items-stretch text-left disabled:cursor-not-allowed disabled:opacity-60"
    >
      {/* the slot in the frame */}
      <span className={`relative mx-auto flex ${h} w-14 items-end justify-center overflow-visible rounded-t-md bg-box-700 shadow-well`}>
        <span
          className={`absolute bottom-1 left-1/2 flex origin-bottom flex-col items-center transition-transform duration-300 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] ${
            pulled ? "-translate-x-1/2 rotate-[22deg]" : "-translate-x-1/2 rotate-0 group-enabled:group-hover:-rotate-6"
          }`}
        >
          {/* grip */}
          <span className={`block h-5 w-9 rounded-md ${HANDLE[color]} ring-2 ${color === "black" ? "" : "ring-black/40"}`} />
          {/* rod */}
          <span className={`block ${size === "lg" ? "h-[4.6rem]" : "h-[3.8rem]"} w-2.5 ${HANDLE[color]} ring-1 ${color === "black" ? "" : "ring-black/40"}`} />
        </span>
      </span>
      {/* the plate under the lever */}
      <span
        className={`plate flex min-h-[4.25rem] items-center gap-2 rounded-t-none px-2.5 py-2.5 sm:gap-3 sm:px-3 transition-colors duration-300 ${
          pulled ? "!bg-aspect-lamp" : "group-enabled:group-hover:!bg-enamel-deep"
        }`}
      >
        <span className="sign flex h-8 w-8 shrink-0 items-center justify-center rounded bg-enamel-ink text-xl text-enamel sm:h-10 sm:w-10 sm:text-2xl">{number}</span>
        <span className="min-w-0">
          <span className="sign block text-lg leading-none text-enamel-ink sm:text-xl">{label}</span>
          {sub && <span className="mt-1 block text-[12px] leading-snug text-enamel-soft sm:text-[13px]">{sub}</span>}
        </span>
      </span>
    </button>
  );
}

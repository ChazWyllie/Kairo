import type { ReactNode, CSSProperties } from "react";

interface PhoneFrameProps {
  children: ReactNode;
  /** rotateY degrees for perspective tilt. -5 = left tilt, 0 = straight, 5 = right tilt */
  tiltDeg?: number;
  /** CSS animation-delay for the phone-float keyframe */
  floatDelay?: string;
  className?: string;
}

/**
 * Reusable phone shell component.
 * Renders a realistic device outline with notch, subtle rim, and box-shadow glow.
 * The phone-float CSS keyframe is applied here -- each instance gets a different
 * floatDelay so phones never all move in sync.
 *
 * Perspective tilt is applied via rotateY on the outer wrapper. The caller
 * should set perspective(1200px) on the parent container.
 */
export default function PhoneFrame({
  children,
  tiltDeg = 0,
  floatDelay = "0s",
  className = "",
}: PhoneFrameProps) {
  const wrapperStyle: CSSProperties = {
    transform: tiltDeg !== 0 ? `rotateY(${tiltDeg}deg)` : undefined,
    transformStyle: "preserve-3d",
  };

  const frameStyle: CSSProperties = {
    position: "relative",
    width: "270px",
    height: "540px",
    borderRadius: "44px",
    border: "2px solid rgba(255,255,255,0.12)",
    background: "#0f0f0f",
    boxShadow: [
      "0 32px 64px rgba(0,0,0,0.6)",
      "0 0 0 1px rgba(255,255,255,0.04)",
      "0 0 40px var(--accent-glow)",
    ].join(", "),
    overflow: "hidden",
    animationName: "phone-float",
    animationDuration: "3s",
    animationTimingFunction: "ease-in-out",
    animationIterationCount: "infinite",
    animationDelay: floatDelay,
  };

  const notchStyle: CSSProperties = {
    position: "absolute",
    top: 0,
    left: "50%",
    transform: "translateX(-50%)",
    width: "98px",
    height: "34px",
    background: "#000",
    borderRadius: "0 0 20px 20px",
    zIndex: 10,
  };

  const contentStyle: CSSProperties = {
    position: "absolute",
    inset: 0,
    top: "34px",
    overflow: "hidden",
    borderRadius: "0 0 42px 42px",
  };

  return (
    <div style={wrapperStyle} className={className}>
      <div style={frameStyle}>
        {/* Dynamic Island / notch */}
        <div style={notchStyle} aria-hidden="true" />
        {/* Screen content */}
        <div style={contentStyle}>
          {children}
        </div>
      </div>
    </div>
  );
}

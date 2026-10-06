import { motion } from "motion/react";
import { useSyncExternalStore } from "react";

const motionPreference = () => window.matchMedia("(prefers-reduced-motion: reduce)");
function subscribeToMotionPreference(onChange: () => void) {
  const query = motionPreference();
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}
const getReducedMotion = () => motionPreference().matches;

const drawings = [
  { color: "--sketch-blue", path: "M25 100 L75 55 L125 100 M40 90 V145 H110 V90 M65 145 V112 H85 V145 M95 67 V48 H109 V80", label: "A little house" },
  { color: "--sketch-clay", path: "M195 140 C160 105 155 85 175 75 C190 68 200 80 205 88 C215 65 235 65 245 80 C265 108 225 135 205 150 Z", label: "A wonky heart" },
  { color: "--sketch-sage", path: "M320 52 L335 85 L373 88 L345 113 L353 150 L320 131 L287 150 L295 113 L268 88 L305 85 Z", label: "A hand-drawn star" },
];

export function AnimatedSvgElements() {
  const reduceMotion = useSyncExternalStore(subscribeToMotionPreference, getReducedMotion, () => true);
  return (
    <svg aria-hidden="true" viewBox="0 0 400 185" className="w-full max-w-[320px] h-auto lg:max-w-[280px]" fill="none">
      {drawings.map((drawing, index) => (
        <motion.path
          key={drawing.label}
          d={drawing.path}
          stroke={`hsl(var(${drawing.color}))`}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: reduceMotion ? 1 : 0, opacity: 0.85 }}
          animate={{ pathLength: reduceMotion ? 1 : [0, 1, 1], opacity: 0.85 }}
          transition={reduceMotion ? { duration: 0 } : {
            duration: 12, times: [0, 0.65, 1], delay: index * 1.2,
            repeat: Infinity, repeatDelay: 8, ease: "easeInOut",
          }}
        />
      ))}
      <path d="M20 170 Q100 163 140 170 M165 170 Q215 177 255 170 M277 170 Q320 164 378 170" stroke="currentColor" strokeOpacity="0.12" strokeLinecap="round" />
    </svg>
  );
}

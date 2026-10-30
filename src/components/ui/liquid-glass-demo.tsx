"use client";

import React, { useRef } from "react";
import { motion, useReducedMotion } from "motion/react";
import { LiquidGlass } from "./liquid-glass";

export type LiquidGlassDemoProps = {
  shape?: "circle" | "pill";
  scale?: number;
  aberration?: number;
  bevelDepth?: number;
  frost?: number;
  tint?: number;
  title?: string;
  subtitle?: string;
  backgroundImage?: string;
  className?: string;
  badgeText?: string;
};

export default function LiquidGlassDemo({
  shape = "circle",
  scale = 48,
  aberration = 14,
  bevelDepth = 37,
  frost = 0.4,
  tint = 0.12,
  title,
  subtitle,
  backgroundImage = "https://assets.aceternity.com/screenshots/colourful-office.webp",
  className = "h-[32rem] sm:h-[36rem]",
  badgeText,
}: LiquidGlassDemoProps) {
  const constraintsRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const size = shape === "pill" ? { w: 320, h: 120 } : { w: 200, h: 200 };

  return (
    <div
      ref={constraintsRef}
      className={`relative w-full overflow-hidden rounded-3xl bg-neutral-900 border border-sage/40 shadow-elevated ${className}`}
    >
      <img
        src={backgroundImage}
        alt="CivicTrace Optics Background"
        className="absolute inset-0 size-full object-cover opacity-90"
        draggable={false}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-forest/90 via-forest/40 to-transparent pointer-events-none" />

      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center p-8 text-center select-none z-10">
        {badgeText && (
          <span className="mb-4 inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-peach/80 text-burnt border border-burnt/30 shadow-subtle backdrop-blur-xs">
            <span className="w-2 h-2 rounded-full bg-burnt animate-pulse" />
            {badgeText}
          </span>
        )}

        <p className="text-4xl sm:text-6xl md:text-7xl leading-[0.95] font-extrabold tracking-tighter text-softwhite">
          {title ? (
            title
          ) : (
            <>
              Bend the
              <br />
              light.
            </>
          )}
        </p>

        {subtitle && (
          <p className="mt-3 text-xs sm:text-sm text-sage max-w-md font-medium">
            {subtitle}
          </p>
        )}

        <div className="mt-6 grid w-full max-w-md grid-cols-12 gap-1.5 opacity-75">
          {Array.from({ length: 48 }).map((_, i) => (
            <span key={i} className="h-1.5 rounded-full bg-softwhite/80" />
          ))}
        </div>

        <p className="mt-4 text-[10px] sm:text-xs text-softwhite/80 font-mono flex items-center gap-1.5">
          <span>✦ Drag the refractive liquid glass lens to inspect</span>
        </p>
      </div>

      <motion.div
        drag
        dragConstraints={constraintsRef}
        dragElastic={0.1}
        whileDrag={reduceMotion ? undefined : { scale: 1.04 }}
        className="absolute top-1/2 left-1/2 cursor-grab touch-none active:cursor-grabbing z-20"
        style={{
          width: size.w,
          height: size.h,
          marginLeft: -size.w / 2,
          marginTop: -size.h / 2,
        }}
      >
        <LiquidGlass
          radius={size.h / 2}
          scale={scale}
          aberration={aberration}
          bevelDepth={bevelDepth}
          frost={frost}
          tint={tint}
          className="size-full shadow-[0_12px_40px_rgb(0_0_0/0.35),inset_0_1px_0_rgb(255_255_255/0.6)]"
        />
      </motion.div>
    </div>
  );
}

export { LiquidGlassDemo };

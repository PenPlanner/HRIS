"use client"

export function ExperimentalBadge() {
  return (
    <div className="fixed inset-0 pointer-events-none z-40 flex items-center justify-center overflow-hidden">
      <div
        className="text-[12rem] font-bold text-white/5 select-none hover:text-white/10 transition-colors duration-500 tracking-wider"
        style={{ transform: 'rotate(-45deg) translateY(-40%) translateX(100%)' }}
      >
        FLOWY PREVIEW
      </div>
    </div>
  );
}


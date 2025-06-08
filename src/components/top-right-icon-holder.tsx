"use client";

import * as React from "react";

/**
 * Top-right icon holder with decorative border that blends with the sidebar layout
 */
export default function TopRightIconHolder({
  children,
}: {
  children?: React.ReactNode;
}) {
  return (
    <div
      className="fixed top-0 -right-4 z-20 h-16 w-28 max-sm:hidden"
      style={{ clipPath: "inset(0px 12px 0px 0px)" }}
    >
      {" "}
      <div className="group ease-snappy pointer-events-none absolute top-4 z-10 -mb-8 h-32 w-full origin-top transition-all">
        <svg
          className="absolute -right-8 h-9 origin-top-left skew-x-[30deg] overflow-visible"
          version="1.1"
          xmlns="http://www.w3.org/2000/svg"
          xmlnsXlink="http://www.w3.org/1999/xlink"
          viewBox="0 0 128 32"
          xmlSpace="preserve"
        >
          <line
            stroke="currentColor"
            className="stroke-sidebar"
            strokeWidth="2px"
            shapeRendering="optimizeQuality"
            vectorEffect="non-scaling-stroke"
            strokeLinecap="round"
            strokeMiterlimit="10"
            x1="1"
            y1="0"
            x2="128"
            y2="0"
          />
          <path
            stroke="currentColor"
            className="stroke-sidebar-border fill-sidebar translate-y-[0.5px]"
            fill="currentColor"
            shapeRendering="optimizeQuality"
            strokeWidth="1px"
            strokeLinecap="round"
            strokeMiterlimit="10"
            vectorEffect="non-scaling-stroke"
            d="M0,0c5.9,0,10.7,4.8,10.7,10.7v10.7c0,5.9,4.8,10.7,10.7,10.7H128V0"
          />
        </svg>
        {children && (
          <div className="pointer-events-auto absolute inset-0 flex items-center justify-center">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}

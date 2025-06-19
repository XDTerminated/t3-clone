"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

interface PortalTooltipProps {
  content: string;
  children: React.ReactNode;
}

export const CapabilityTooltip: React.FC<PortalTooltipProps> = ({
  content,
  children,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [portalNode, setPortalNode] = useState<HTMLElement | null>(null);

  useEffect(() => {
    // This ensures the portal target is available only on the client side.
    setPortalNode(document.body);
  }, []);

  const updatePosition = () => {
    if (triggerRef.current && tooltipRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();

      let top = triggerRect.top - tooltipRect.height - 8; // 8px gap above
      let left =
        triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;

      // Adjust if it goes off-screen
      if (top < 8) {
        top = triggerRect.bottom + 8; // Show below if not enough space above
      }
      if (left < 8) {
        left = 8;
      }
      if (left + tooltipRect.width > window.innerWidth - 8) {
        left = window.innerWidth - tooltipRect.width - 8;
      }

      setPosition({ top, left });
    }
  };

  const showTooltip = () => {
    setIsVisible(true);
  };

  const hideTooltip = () => {
    setIsVisible(false);
  };

  useEffect(() => {
    if (isVisible) {
      // Position the tooltip after it has been rendered to get its dimensions
      queueMicrotask(updatePosition);

      window.addEventListener("scroll", updatePosition, true);
      window.addEventListener("resize", updatePosition);

      return () => {
        window.removeEventListener("scroll", updatePosition, true);
        window.removeEventListener("resize", updatePosition);
      };
    }
  }, [isVisible]);

  const tooltip = (
    <div
      ref={tooltipRef}
      className={`fixed z-[99999] rounded-md bg-black px-2.5 py-1.5 text-xs font-semibold text-white shadow-lg transition-opacity duration-200 ${
        isVisible ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
    >
      {content}
    </div>
  );

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        className="inline-flex"
      >
        {children}
      </div>
      {portalNode && isVisible && createPortal(tooltip, portalNode)}
    </>
  );
};

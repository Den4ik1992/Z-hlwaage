import React, { useEffect, useRef } from 'react';
import { Scale } from 'lucide-react';

interface Props {
  isActive: boolean;
  onComplete: () => void;
}

export function CalibrationAnimation({ isActive, onComplete }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const weightRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isActive) return;

    const timer = setTimeout(() => {
      onComplete();
    }, 3000);

    return () => clearTimeout(timer);
  }, [isActive, onComplete]);

  return (
    <div className="relative w-full h-80 bg-gradient-to-b from-gray-50 to-gray-100 rounded-lg overflow-hidden shadow-inner">
      <div 
        ref={containerRef}
        className="absolute inset-0 flex flex-col items-center justify-center"
      >
        {/* Waage */}
        <div className="relative">
          {/* Waagschale */}
          <div className="relative">
            <div className="absolute left-1/2 -translate-x-1/2 w-40 h-1 bg-gray-400 rounded-full animate-calibration-arm" />
            <div className="absolute left-1/2 -translate-x-1/2 top-0 w-1 h-20 bg-gray-500 origin-top animate-calibration-stand" />
          </div>
          
          {/* Basis */}
          <div className="mt-20 flex items-center justify-center">
            <Scale className="w-16 h-16 text-blue-600 animate-calibration-base" />
          </div>

          {/* Kalibriergewichte */}
          <div 
            ref={weightRef}
            className="absolute left-1/2 top-2 -translate-x-1/2 flex gap-1 animate-calibration-weights"
          >
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="w-8 h-8 bg-gray-700 rounded-sm shadow-lg"
                style={{
                  animation: `weightBounce 0.5s ease-out ${i * 0.2}s`
                }}
              />
            ))}
          </div>
        </div>

        {/* Statustext */}
        <div className="absolute bottom-4 left-0 right-0 text-center">
          <div className="text-lg font-medium text-gray-700 mb-2">
            Kalibriere Waage...
          </div>
          <div className="flex justify-center items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" />
          </div>
        </div>
      </div>
    </div>
  );
}
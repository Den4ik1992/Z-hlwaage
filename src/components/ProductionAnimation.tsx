import React, { useEffect, useRef, useState } from 'react';

interface Props {
  isActive: boolean;
  totalParts: number;
  onComplete: () => void;
}

export function ProductionAnimation({ isActive, totalParts, onComplete }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const partsRef = useRef<HTMLDivElement[]>([]);
  const mixerRef = useRef<HTMLDivElement | null>(null);
  const [status, setStatus] = useState('Starte Produktion...');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isActive) {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
      setStatus('Starte Produktion...');
      setProgress(0);
      return;
    }

    const container = containerRef.current;
    if (!container) return;

    // Box-Dimensionen
    const boxHeight = container.clientHeight * 0.4;
    const boxWidth = container.clientWidth * 0.6;
    const boxLeft = (container.clientWidth - boxWidth) / 2;
    const boxBottom = container.clientHeight - 80; // Angepasst für Statustext

    // Maschine erstellen
    const machine = document.createElement('div');
    machine.className = 'absolute bg-gray-700 rounded-lg shadow-lg';
    machine.style.width = `${boxWidth * 0.4}px`;
    machine.style.height = '60px';
    machine.style.left = `${boxLeft + (boxWidth * 0.3)}px`;
    machine.style.top = '20px';
    container.appendChild(machine);

    // Rutsche erstellen
    const chute = document.createElement('div');
    chute.className = 'absolute bg-gray-500 transform -rotate-45';
    chute.style.width = '80px';
    chute.style.height = '12px';
    chute.style.left = `${boxLeft + (boxWidth * 0.5)}px`;
    chute.style.top = '70px';
    container.appendChild(chute);

    // Box erstellen
    const box = document.createElement('div');
    box.className = 'absolute bg-gray-200 border-4 border-gray-400 rounded-lg transition-all duration-1000';
    box.style.width = `${boxWidth}px`;
    box.style.height = `${boxHeight}px`;
    box.style.left = `${boxLeft}px`;
    box.style.bottom = `80px`; // Angepasst für Statustext
    container.appendChild(box);

    // Mixer erstellen
    const mixer = document.createElement('div');
    mixer.className = 'absolute bg-gray-600 rounded-full transition-all duration-500';
    mixer.style.width = '40px';
    mixer.style.height = '40px';
    mixer.style.left = `${boxLeft + (boxWidth / 2) - 20}px`;
    mixer.style.bottom = `${boxHeight + 90}px`; // Angepasst für Statustext
    mixer.style.opacity = '0';
    container.appendChild(mixer);
    mixerRef.current = mixer;

    // Teile generieren und fallen lassen
    const parts = Math.min(totalParts, 100);
    const delay = 2000 / parts; // 2 Sekunden für alle Teile
    const fallDuration = 800; // 0.8 Sekunden Fallzeit pro Teil

    setStatus('Produziere Teile...');

    for (let i = 0; i < parts; i++) {
      const part = document.createElement('div');
      const size = Math.random() * 6 + 6; // 6-12px Teile
      
      part.className = 'absolute bg-blue-500 rounded-md opacity-0 shadow-sm';
      part.style.width = `${size}px`;
      part.style.height = `${size}px`;
      part.style.transition = `all ${fallDuration}ms cubic-bezier(.45,.05,.55,.95)`;
      
      // Startposition an der Maschine
      const startX = boxLeft + (boxWidth * 0.5);
      part.style.left = `${startX}px`;
      part.style.top = '80px';
      
      container.appendChild(part);
      partsRef.current.push(part);

      // Fallanimation
      setTimeout(() => {
        part.style.opacity = '1';
        
        // Berechne Endposition mit Streuung
        const endX = boxLeft + (boxWidth * 0.2) + (Math.random() * boxWidth * 0.6);
        const endY = boxBottom - (Math.random() * (boxHeight * 0.8));
        const rotation = Math.random() * 360;
        
        part.style.transform = `translate(${endX - startX}px, ${endY - 80}px) rotate(${rotation}deg)`;
        
        // Fortschritt aktualisieren
        setProgress((i + 1) / parts * 70); // 70% für Produktion
      }, i * delay);
    }

    // Mischanimation nach dem Fallen
    setTimeout(() => {
      setStatus('Vermische Teile...');
      setProgress(80);

      if (mixerRef.current) {
        mixerRef.current.style.opacity = '1';
        mixerRef.current.style.transform = 'translateY(-20px)';
        
        // Mixer-Bewegung
        let position = 0;
        const mixInterval = setInterval(() => {
          position += 1;
          if (position > 3) {
            clearInterval(mixInterval);
            setStatus('Fertigstellung...');
            setProgress(90);
            setTimeout(() => {
              if (mixerRef.current) {
                mixerRef.current.style.opacity = '0';
                mixerRef.current.style.transform = 'translateY(0)';
              }
              setStatus('Produktion abgeschlossen');
              setProgress(100);
              setTimeout(onComplete, 500);
            }, 500);
          }
          
          // Bewege alle Teile
          partsRef.current.forEach(part => {
            const randomX = (Math.random() - 0.5) * 20;
            const randomY = (Math.random() - 0.5) * 20;
            const currentTransform = part.style.transform.match(/translate\((.*?)\)/)?.[1] || '';
            const [currentX, currentY] = currentTransform.split(',').map(v => parseFloat(v) || 0);
            
            part.style.transform = `translate(${currentX + randomX}px, ${currentY + randomY}px) rotate(${Math.random() * 360}deg)`;
          });
        }, 500);
      }
    }, parts * delay + fallDuration + 500);

    return () => {
      partsRef.current = [];
      mixerRef.current = null;
    };
  }, [isActive, totalParts, onComplete]);

  return (
    <div className="relative w-full h-80 bg-gradient-to-b from-gray-50 to-gray-100 rounded-lg overflow-hidden shadow-inner">
      <div 
        ref={containerRef} 
        className="absolute inset-0"
      >
        <div className="absolute inset-0 bg-gradient-radial from-transparent to-gray-100/30" />
      </div>
      
      {/* Status und Fortschrittsanzeige */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">{status}</span>
          <span className="text-sm text-gray-500">{Math.round(progress)}%</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-500 transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
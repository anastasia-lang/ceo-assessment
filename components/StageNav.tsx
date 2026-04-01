'use client';

import { stages } from '@/lib/content';

interface StageNavProps {
  currentStage: number;
}

export default function StageNav({ currentStage }: StageNavProps) {
  return (
    <div className="flex items-center gap-1 w-full max-w-md">
      {stages.map((stage, i) => {
        const isCompleted = currentStage > stage.number;
        const isCurrent = currentStage === stage.number;

        return (
          <div key={stage.number} className="flex items-center flex-1">
            <div className="flex-1 flex flex-col items-center gap-1">
              <div
                className={`w-full h-2 rounded-full transition-colors ${
                  isCompleted
                    ? 'bg-emerald-500'
                    : isCurrent
                    ? 'bg-[#e94560]'
                    : 'bg-white/20'
                }`}
              />
              <span className={`text-xs ${isCurrent ? 'text-white font-medium' : 'text-white/50'}`}>
                Stage {stage.number}
              </span>
            </div>
            {i < stages.length - 1 && <div className="w-2" />}
          </div>
        );
      })}
    </div>
  );
}

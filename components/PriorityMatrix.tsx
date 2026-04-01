'use client';

import { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  useDroppable,
} from '@dnd-kit/core';
import { useDraggable } from '@dnd-kit/core';
import { stage1Items, matrixQuadrants } from '@/lib/content';
import InboxItem from './InboxItem';

interface PriorityMatrixProps {
  value: Record<string, string[]>;
  onChange: (value: Record<string, string[]>) => void;
}

function DraggableItem({
  item,
  isInQuadrant,
}: {
  item: (typeof stage1Items)[0];
  isInQuadrant: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: item.id,
  });

  const style = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)` }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`touch-none ${isDragging ? 'opacity-30' : ''}`}
    >
      {isInQuadrant ? (
        <InboxItem item={item} compact />
      ) : (
        <InboxItem item={item} />
      )}
    </div>
  );
}

function DroppableQuadrant({
  quadrant,
  items,
}: {
  quadrant: (typeof matrixQuadrants)[0];
  items: (typeof stage1Items)[0][];
}) {
  const { isOver, setNodeRef } = useDroppable({ id: quadrant.id });

  return (
    <div
      ref={setNodeRef}
      className={`rounded-lg border-2 border-dashed p-3 min-h-[140px] transition-colors ${
        isOver ? 'border-[#e94560] bg-[#e94560]/5' : 'border-gray-300 bg-gray-50'
      }`}
    >
      <div className="flex items-center gap-2 mb-2">
        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: quadrant.color }} />
        <h4 className="text-sm font-semibold text-gray-800">{quadrant.label}</h4>
      </div>
      <p className="text-xs text-gray-500 mb-2">{quadrant.subtitle}</p>
      <div className="space-y-1.5">
        {items.map(item => (
          <DraggableItem key={item.id} item={item} isInQuadrant />
        ))}
      </div>
      {items.length === 0 && (
        <p className="text-xs text-gray-400 italic text-center py-4">Drag items here</p>
      )}
    </div>
  );
}

export default function PriorityMatrix({ value, onChange }: PriorityMatrixProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const getItemQuadrant = (itemId: string): string | null => {
    for (const [quadrant, items] of Object.entries(value)) {
      if (items.includes(itemId)) return quadrant;
    }
    return null;
  };

  const unsortedItems = stage1Items.filter(item => !getItemQuadrant(item.id));

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const itemId = active.id as string;
    const targetQuadrant = over.id as string;

    if (!matrixQuadrants.find(q => q.id === targetQuadrant)) return;

    const newValue = { ...value };
    for (const key of Object.keys(newValue)) {
      newValue[key] = newValue[key].filter(id => id !== itemId);
    }

    if (!newValue[targetQuadrant]) newValue[targetQuadrant] = [];
    newValue[targetQuadrant].push(itemId);

    onChange(newValue);
  };

  const activeItem = activeId ? stage1Items.find(i => i.id === activeId) : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-4">
        {unsortedItems.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">
              Unsorted Items ({unsortedItems.length} remaining)
            </h3>
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {unsortedItems.map(item => (
                <DraggableItem key={item.id} item={item} isInQuadrant={false} />
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          {matrixQuadrants.map(quadrant => (
            <DroppableQuadrant
              key={quadrant.id}
              quadrant={quadrant}
              items={
                (value[quadrant.id] || [])
                  .map(id => stage1Items.find(i => i.id === id)!)
                  .filter(Boolean)
              }
            />
          ))}
        </div>
      </div>

      <DragOverlay>
        {activeItem ? <InboxItem item={activeItem} compact /> : null}
      </DragOverlay>
    </DndContext>
  );
}

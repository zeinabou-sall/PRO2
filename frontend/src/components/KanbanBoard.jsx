import { useMemo } from 'react';
import { DndContext, PointerSensor, useDroppable, useSensor, useSensors, closestCenter } from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  rectSortingStrategy,
  arrayMove
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { dateLabel } from '../lib/utils';

function SortableCard({ card, deletingCardId, onEdit, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: `card-${card.id}` });
  const style = { transform: CSS.Transform.toString(transform), transition };
  const due = getDueMeta(card.dueDate);
  const priorityLabel = card.priority === 'high' ? 'Haute' : card.priority === 'low' ? 'Basse' : 'Moyenne';

  return (
    <article ref={setNodeRef} style={style} className="card-item" {...attributes} {...listeners}>
      <div className="card-cover" style={{ backgroundColor: card.coverColor || '#f72585' }} />
      <div className="card-top">
        <h4>{card.title}</h4>
        <span className={`priority-badge ${card.priority || 'medium'}`}>{priorityLabel}</span>
      </div>
      {card.description ? <p>{card.description}</p> : null}
      {card.dueDate ? <small className={`due-date ${due.tone}`}>Echeance: {dateLabel(card.dueDate)} ({due.label})</small> : null}
      {card.labels?.length ? (
        <div className="labels">
          {card.labels.map((label) => (
            <span key={label.id} style={{ backgroundColor: label.color }}>{label.name}</span>
          ))}
        </div>
      ) : null}
      <div className="row-actions">
        <button type="button" onClick={() => onEdit(card)}>Editer</button>
        <button type="button" className="danger" onClick={() => onDelete(card.id)} disabled={deletingCardId === card.id}>
          {deletingCardId === card.id ? 'Suppression...' : 'Supprimer'}
        </button>
      </div>
    </article>
  );
}

function Column({ column, deletingColumnId, deletingCardId, onAddCard, onEditColumn, onDeleteColumn, onEditCard, onDeleteCard }) {
  const sortable = useSortable({ id: `column-${column.id}` });
  const cardIds = useMemo(() => column.cards.map((card) => `card-${card.id}`), [column.cards]);
  const { setNodeRef, isOver } = useDroppable({ id: `column-${column.id}` });
  const style = {
    transform: CSS.Transform.toString(sortable.transform),
    transition: sortable.transition
  };
  function setRefs(node) {
    sortable.setNodeRef(node);
    setNodeRef(node);
  }

  return (
    <section
      className={`column ${isOver ? 'column-over' : ''}`}
      ref={setRefs}
      style={style}
    >
      <header>
        <div className="column-title-wrap">
          <button
            type="button"
            className="drag-handle"
            title="Déplacer la colonne"
            aria-label="Déplacer la colonne"
            {...sortable.attributes}
            {...sortable.listeners}
          >
            ::
          </button>
          <span className="column-color" style={{ background: column.color || '#b5179e' }} />
          <h3>{column.title}</h3>
        </div>
        <div className="column-actions">
          <button type="button" className="secondary" onClick={() => onEditColumn(column)}>Editer</button>
          <button type="button" className="danger" onClick={() => onDeleteColumn(column.id)} disabled={deletingColumnId === column.id}>
            {deletingColumnId === column.id ? '...' : 'X'}
          </button>
        </div>
      </header>
      <div className="column-meta">
        <small>{column.wipLimit > 0 ? `WIP ${column.cards.length}/${column.wipLimit}` : `WIP ${column.cards.length}`}</small>
      </div>
      <button type="button" onClick={() => onAddCard(column.id)}>+ Carte</button>
      <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
        <div className="card-list">
          {column.cards.map((card) => (
            <SortableCard
              key={card.id}
              card={card}
              deletingCardId={deletingCardId}
              onEdit={onEditCard}
              onDelete={onDeleteCard}
            />
          ))}
          {column.cards.length === 0 ? <div className="drop-zone">Deposer une carte ici</div> : null}
        </div>
      </SortableContext>
    </section>
  );
}

export default function KanbanBoard({
  board,
  onBack,
  onAddColumn,
  onDeleteColumn,
  onEditColumn,
  onAddCard,
  onEditCard,
  onDeleteCard,
  deletingColumnId,
  deletingCardId,
  onDragEnd,
  onDragEndColumn
}) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  function handleDragEnd(event) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const [activePrefix, activeId] = String(active.id).split('-');
    const [overPrefix, overId] = String(over.id).split('-');

    if (activePrefix === 'column' && (overPrefix === 'column' || overPrefix === 'card')) {
      const fromIndex = board.columns.findIndex((c) => c.id === Number(activeId));
      let targetColumnId = null;
      if (overPrefix === 'column') {
        targetColumnId = Number(overId);
      } else {
        const overCard = locateCard(board, Number(overId));
        targetColumnId = overCard?.columnId ?? null;
      }
      const toIndex = board.columns.findIndex((c) => c.id === targetColumnId);
      if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return;

      const reordered = arrayMove(board.columns, fromIndex, toIndex).map((column, idx) => ({
        ...column,
        order: idx
      }));
      onDragEndColumn?.({
        columnId: Number(activeId),
        fromIndex,
        toIndex,
        optimisticColumns: reordered
      });
      return;
    }

    if (activePrefix !== 'card') return;

    const src = locateCard(board, Number(activeId));
    if (!src) return;

    const overRaw = String(over.id);
    const nextColumns = board.columns.map((column) => ({ ...column, cards: [...column.cards] }));

    let targetColumnId;
    let targetIndex;

    if (overRaw.startsWith('card-')) {
      const overCardId = Number(overRaw.split('-')[1]);
      const dst = locateCard(board, overCardId);
      if (!dst) return;
      targetColumnId = dst.columnId;
      targetIndex = dst.index;
    } else if (overRaw.startsWith('column-')) {
      targetColumnId = Number(overRaw.split('-')[1]);
      const targetColumn = nextColumns.find((c) => c.id === targetColumnId);
      if (!targetColumn) return;
      targetIndex = targetColumn.cards.length;
    } else {
      return;
    }

    const source = nextColumns.find((c) => c.id === src.columnId);
    const target = nextColumns.find((c) => c.id === targetColumnId);
    if (!source || !target) return;

    if (src.columnId === targetColumnId) {
      const adjustedIndex = targetIndex > src.index ? targetIndex - 1 : targetIndex;
      source.cards = arrayMove(source.cards, src.index, Math.max(0, adjustedIndex)).map((card, idx) => ({
        ...card,
        order: idx
      }));
    } else {
      const [moved] = source.cards.splice(src.index, 1);
      target.cards.splice(targetIndex, 0, { ...moved, column: targetColumnId });
      source.cards = source.cards.map((card, idx) => ({ ...card, order: idx }));
      target.cards = target.cards.map((card, idx) => ({ ...card, order: idx }));
    }

    onDragEnd({
      cardId: Number(activeId),
      fromColumnId: src.columnId,
      toColumnId: targetColumnId,
      toIndex: targetIndex,
      optimisticColumns: nextColumns
    });
  }

  return (
    <div className="kanban-wrap">
      <div className="board-head">
        <div className="board-head-title">
          <button type="button" className="secondary" onClick={onBack}>Retour boards</button>
          <h2>{board.title}</h2>
        </div>
        <button type="button" onClick={onAddColumn}>+ Colonne</button>
      </div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext
          items={board.columns.map((column) => `column-${column.id}`)}
          strategy={rectSortingStrategy}
        >
          <div className="column-row">
            {board.columns.map((column) => (
              <Column
              key={column.id}
              column={column}
              deletingColumnId={deletingColumnId}
              deletingCardId={deletingCardId}
              onAddCard={onAddCard}
              onEditColumn={onEditColumn}
              onDeleteColumn={onDeleteColumn}
                onEditCard={onEditCard}
                onDeleteCard={onDeleteCard}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}

function locateCard(board, cardId) {
  for (const column of board.columns) {
    const index = column.cards.findIndex((card) => card.id === cardId);
    if (index >= 0) return { columnId: column.id, index };
  }
  return null;
}

function getDueMeta(dueDate) {
  if (!dueDate) return { tone: 'neutral', label: 'sans date' };
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  const diff = Math.round((due - now) / 86400000);
  if (diff < 0) return { tone: 'late', label: 'en retard' };
  if (diff === 0) return { tone: 'today', label: 'aujourd hui' };
  if (diff <= 2) return { tone: 'soon', label: 'bientot' };
  return { tone: 'ok', label: 'planifiee' };
}

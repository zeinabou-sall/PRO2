export function normalizeBoard(raw) {
  const board = raw?.data || raw;
  const columns = (board?.columns || board?.attributes?.columns || [])
    .map((col) => (col.attributes ? { id: col.id, ...col.attributes } : col))
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((col) => ({
      ...col,
      cards: (col.cards || col.attributes?.cards || [])
        .map((card) => (card.attributes ? { id: card.id, ...card.attributes } : card))
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    }));

  return {
    id: board.id,
    title: board.title || board.attributes?.title,
    columns
  };
}

export function dateLabel(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

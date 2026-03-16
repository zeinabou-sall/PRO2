export default function BoardList({
  boards,
  onOpen,
  onCreate,
  onDelete,
  creating
}) {
  return (
    <section className="board-list">
      <div className="board-list-head">
        <h2>Mes boards</h2>
        <button onClick={onCreate} disabled={creating}>
          {creating ? 'Création...' : 'Nouveau board'}
        </button>
      </div>
      {boards.length === 0 ? (
        <p className="empty-state">Aucun board pour le moment. Crée d'abord un board, puis une colonne, puis une carte.</p>
      ) : null}
      <div className="board-grid">
        {boards.map((board) => (
          <article className="board-tile" key={board.id}>
            <button className="tile-open" onClick={() => onOpen(board.id)}>{board.title}</button>
            <button className="danger" onClick={() => onDelete(board.id)}>Supprimer</button>
          </article>
        ))}
      </div>
    </section>
  );
}

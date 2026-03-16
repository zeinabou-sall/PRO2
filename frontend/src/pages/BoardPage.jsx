import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { normalizeBoard } from '../lib/utils';
import BoardList from '../components/BoardList';
import KanbanBoard from '../components/KanbanBoard';
import Loader from '../components/Loader';
import TextModal from '../components/TextModal';
import CardEditorModal from '../components/CardEditorModal';
import ColumnEditorModal from '../components/ColumnEditorModal';
import ConfirmModal from '../components/ConfirmModal';

const LAST_BOARD_KEY = 'suptaskflow-last-board-id';

export default function BoardPage({ token, notify, onLogout }) {
  const [boards, setBoards] = useState([]);
  const [labels, setLabels] = useState([]);
  const [board, setBoard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [creatingBoard, setCreatingBoard] = useState(false);
  const [deletingBoard, setDeletingBoard] = useState(false);
  const [submittingColumn, setSubmittingColumn] = useState(false);
  const [submittingCard, setSubmittingCard] = useState(false);
  const [deletingColumnId, setDeletingColumnId] = useState(null);
  const [deletingCardId, setDeletingCardId] = useState(null);
  const [boardModalOpen, setBoardModalOpen] = useState(false);
  const [boardToDelete, setBoardToDelete] = useState(null);
  const [columnModal, setColumnModal] = useState({ open: false, mode: 'create', column: null });
  const [cardModal, setCardModal] = useState({ open: false, mode: 'create', columnId: null, card: null });

  async function loadBoards() {
    try {
      const data = await api('/boards', {}, token);
      const list = (data.data || [])
        .map((item) => (item.attributes ? { id: item.id, ...item.attributes } : item))
        .sort((a, b) => {
          const da = new Date(a.createdAt || 0).getTime();
          const db = new Date(b.createdAt || 0).getTime();
          if (da !== db) return da - db;
          return Number(a.id) - Number(b.id);
        });
      setBoards(list);
    } catch (err) {
      notify('error', err.message);
    } finally {
      setLoading(false);
    }
  }

  async function openBoard(id) {
    try {
      const data = await api(`/boards/${id}?populate[columns][populate][cards][populate][0]=labels&populate[columns][sort][0]=order:asc&populate[columns][populate][cards][sort][0]=order:asc`, {}, token);
      const normalized = normalizeBoard(data);
      setBoard(normalized);
      localStorage.setItem(LAST_BOARD_KEY, String(id));
      return true;
    } catch (err) {
      notify('error', err.message);
      return false;
    }
  }

  async function loadLabels() {
    try {
      const data = await api('/labels', {}, token);
      const list = (data.data || []).map((item) => (item.attributes ? { id: item.id, ...item.attributes } : item));
      setLabels(list);
    } catch (err) {
      notify('error', err.message);
    }
  }

  async function createLabel(data) {
    const name = String(data?.name || '').trim();
    const color = String(data?.color || '#f72585');
    if (!name) return null;

    try {
      const created = await api('/labels', {
        method: 'POST',
        body: JSON.stringify({ data: { name, color } })
      }, token);

      const item = created?.data?.attributes
        ? { id: created.data.id, ...created.data.attributes }
        : created?.data || null;

      await loadLabels();
      notify('success', 'Label cree');
      return item;
    } catch (err) {
      notify('error', err.message);
      return null;
    }
  }

  useEffect(() => {
    let active = true;

    async function bootstrap() {
      const lastBoardId = Number(localStorage.getItem(LAST_BOARD_KEY) || 0);
      if (lastBoardId) {
        const ok = await openBoard(lastBoardId);
        if (!ok) {
          localStorage.removeItem(LAST_BOARD_KEY);
        }
      }
      if (active) {
        await loadBoards();
        await loadLabels();
      }
    }

    bootstrap();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!board?.id) return;
    localStorage.setItem(LAST_BOARD_KEY, String(board.id));
  }, [board?.id]);

  useEffect(() => {
    if (board?.id) return;
    if (!boards.length) return;
    const lastBoardId = Number(localStorage.getItem(LAST_BOARD_KEY) || 0);
    if (!lastBoardId) return;
    if (!boards.some((b) => Number(b.id) === lastBoardId)) return;
    openBoard(lastBoardId);
  }, [boards, board?.id]);

  async function createBoard(title) {
    if (!title) return;
    try {
      setCreatingBoard(true);
      const created = await api('/boards', {
        method: 'POST',
        body: JSON.stringify({ data: { title } })
      }, token);
      notify('success', 'Board cree');
      await loadBoards();

      const createdId = created?.data?.id;
      if (createdId) {
        await openBoard(createdId);
        setColumnModal({ open: true, mode: 'create', column: null });
      }
    } catch (err) {
      notify('error', err.message);
    } finally {
      setCreatingBoard(false);
    }
  }

  async function deleteBoard(id) {
    try {
      setDeletingBoard(true);
      await api(`/boards/${id}`, { method: 'DELETE' }, token);
      notify('success', 'Board supprime');
      if (board?.id === id) setBoard(null);
      if (Number(localStorage.getItem(LAST_BOARD_KEY) || 0) === Number(id)) {
        localStorage.removeItem(LAST_BOARD_KEY);
      }
      await loadBoards();
    } catch (err) {
      notify('error', err.message);
    } finally {
      setDeletingBoard(false);
    }
  }

  async function addColumn(data) {
    const title = String(data?.title || '').trim();
    if (!title || !board) return;
    try {
      setSubmittingColumn(true);
      await api('/columns', {
        method: 'POST',
        body: JSON.stringify({
          data: {
            title,
            color: data.color,
            wipLimit: Number(data.wipLimit || 0),
            board: board.id
          }
        })
      }, token);
      notify('success', 'Colonne ajoutee');
      await openBoard(board.id);
    } catch (err) {
      notify('error', err.message);
    } finally {
      setSubmittingColumn(false);
    }
  }

  async function editColumn(data) {
    if (!columnModal.column) return;
    try {
      setSubmittingColumn(true);
      await api(`/columns/${columnModal.column.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          data: {
            title: String(data.title || '').trim(),
            color: data.color,
            wipLimit: Number(data.wipLimit || 0)
          }
        })
      }, token);
      notify('success', 'Colonne modifiee');
      await openBoard(board.id);
    } catch (err) {
      notify('error', err.message);
    } finally {
      setSubmittingColumn(false);
    }
  }

  function startEditColumn(column) {
    setColumnModal({ open: true, mode: 'edit', column });
  }

  async function deleteColumn(id) {
    try {
      setDeletingColumnId(id);
      await api(`/columns/${id}`, { method: 'DELETE' }, token);
      notify('success', 'Colonne supprimee');
      await openBoard(board.id);
    } catch (err) {
      notify('error', err.message);
    } finally {
      setDeletingColumnId(null);
    }
  }

  function startAddCard(columnId) {
    setCardModal({ open: true, mode: 'create', columnId, card: null });
  }

  async function submitCreateCard(data) {
    try {
      setSubmittingCard(true);
      await api('/cards', {
        method: 'POST',
        body: JSON.stringify({ data: { ...data, column: cardModal.columnId } })
      }, token);
      notify('success', 'Carte creee');
      setCardModal({ open: false, mode: 'create', columnId: null, card: null });
      await openBoard(board.id);
    } catch (err) {
      notify('error', err.message);
    } finally {
      setSubmittingCard(false);
    }
  }

  function startEditCard(card) {
    setCardModal({ open: true, mode: 'edit', columnId: card.column?.id || null, card });
  }

  async function submitEditCard(data) {
    if (!cardModal.card) return;
    try {
      setSubmittingCard(true);
      await api(`/cards/${cardModal.card.id}`, {
        method: 'PUT',
        body: JSON.stringify({ data })
      }, token);
      notify('success', 'Carte modifiee');
      setCardModal({ open: false, mode: 'create', columnId: null, card: null });
      await openBoard(board.id);
    } catch (err) {
      notify('error', err.message);
    } finally {
      setSubmittingCard(false);
    }
  }

  async function deleteCard(id) {
    try {
      setDeletingCardId(id);
      await api(`/cards/${id}`, { method: 'DELETE' }, token);
      notify('success', 'Carte supprimee');
      await openBoard(board.id);
    } catch (err) {
      notify('error', err.message);
    } finally {
      setDeletingCardId(null);
    }
  }

  async function dragCard({ cardId, toColumnId, optimisticColumns }) {
    const previous = board.columns;
    setBoard((prev) => ({ ...prev, columns: optimisticColumns }));
    try {
      for (const column of optimisticColumns) {
        for (let i = 0; i < column.cards.length; i += 1) {
          const item = column.cards[i];
          await api(`/cards/${item.id}`, {
            method: 'PUT',
            body: JSON.stringify({ data: { order: i, column: column.id } })
          }, token);
        }
      }
      await api(`/cards/${cardId}`, {
        method: 'PUT',
        body: JSON.stringify({ data: { column: toColumnId } })
      }, token);
    } catch (err) {
      setBoard((prev) => ({ ...prev, columns: previous }));
      notify('error', `Deplacement annule: ${err.message}`);
    }
  }

  async function dragColumn({ optimisticColumns }) {
    const previous = board.columns;
    setBoard((prev) => ({ ...prev, columns: optimisticColumns }));
    try {
      for (let i = 0; i < optimisticColumns.length; i += 1) {
        const column = optimisticColumns[i];
        await api(`/columns/${column.id}`, {
          method: 'PUT',
          body: JSON.stringify({ data: { order: i } })
        }, token);
      }
    } catch (err) {
      setBoard((prev) => ({ ...prev, columns: previous }));
      notify('error', `Deplacement colonne annule: ${err.message}`);
    }
  }

  if (loading) return <Loader label="Chargement des boards..." />;

  return (
    <main className="app-shell">
      <nav className="topbar">
        <h1>SupTaskFlow</h1>
        <div className="top-actions">
          {!board ? <button onClick={() => setBoard(null)}>Boards</button> : null}
          <button onClick={onLogout}>Deconnexion</button>
        </div>
      </nav>

      {!board ? (
        <BoardList
          boards={boards}
          onOpen={openBoard}
          onCreate={() => setBoardModalOpen(true)}
          onDelete={(id) => setBoardToDelete(id)}
          creating={creatingBoard}
        />
      ) : (
        <KanbanBoard
          board={board}
          onBack={() => {
            setBoard(null);
            localStorage.removeItem(LAST_BOARD_KEY);
          }}
          onAddColumn={() => setColumnModal({ open: true, mode: 'create', column: null })}
          onDeleteColumn={deleteColumn}
          onEditColumn={startEditColumn}
          onAddCard={startAddCard}
          onEditCard={startEditCard}
          onDeleteCard={deleteCard}
          deletingColumnId={deletingColumnId}
          deletingCardId={deletingCardId}
          onDragEnd={dragCard}
          onDragEndColumn={dragColumn}
        />
      )}

      <TextModal
        open={boardModalOpen}
        title="Creer un board"
        label="Nom du board"
        placeholder="Ex: Projet marketing"
        confirmText="Creer"
        onClose={() => setBoardModalOpen(false)}
        onConfirm={async (value) => {
          await createBoard(value);
          setBoardModalOpen(false);
        }}
      />

      <ColumnEditorModal
        open={columnModal.open}
        mode={columnModal.mode}
        initialColumn={columnModal.column}
        loading={submittingColumn}
        onClose={() => setColumnModal({ open: false, mode: 'create', column: null })}
        onConfirm={async (data) => {
          if (columnModal.mode === 'create') {
            await addColumn(data);
          } else {
            await editColumn(data);
          }
          setColumnModal({ open: false, mode: 'create', column: null });
        }}
      />

      <CardEditorModal
        open={cardModal.open}
        mode={cardModal.mode}
        initialCard={cardModal.card}
        labels={labels}
        loading={submittingCard}
        onCreateLabel={createLabel}
        onClose={() => setCardModal({ open: false, mode: 'create', columnId: null, card: null })}
        onConfirm={cardModal.mode === 'create' ? submitCreateCard : submitEditCard}
      />

      <ConfirmModal
        open={!!boardToDelete}
        title="Supprimer le board"
        message="Cette action supprimera aussi ses colonnes et ses cartes."
        confirmText="Supprimer"
        loading={deletingBoard}
        onCancel={() => setBoardToDelete(null)}
        onConfirm={async () => {
          const id = boardToDelete;
          setBoardToDelete(null);
          await deleteBoard(id);
        }}
      />
    </main>
  );
}

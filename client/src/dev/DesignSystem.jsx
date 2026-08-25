import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faDownload, faTrash, faCheck, faBoxOpen } from '@fortawesome/free-solid-svg-icons';
import LoadingState from '@/components/ui/LoadingState.jsx';
import ErrorState from '@/components/ui/ErrorState.jsx';
import EmptyState from '@/components/ui/EmptyState.jsx';
import ErrorBoundary from '@/components/ErrorBoundary.jsx';
import StatusBadge from '@/components/ui/StatusBadge.jsx';
import Pagination from '@/components/ui/Pagination.jsx';
import Modal from '@/components/ui/Modal.jsx';
import ConfirmDialog from '@/components/ui/ConfirmDialog.jsx';
import styles from './DesignSystem.module.css';

const TOKENS = [
  'primary', 'primary-light', 'primary-dark', 'secondary', 'success',
  'warning', 'danger', 'light', 'dark', 'border', 'page-accent',
];

const STATUSES = [
  'active', 'expiring', 'expired', 'issued', 'disposed', 'returned', 'due_for_disposal',
];

function Boom() {
  const [boom, setBoom] = useState(false);
  if (boom) throw new Error('Тестовая ошибка для проверки ErrorBoundary');
  return (
    <button className="btn btn-danger" onClick={() => setBoom(true)}>
      Выбросить ошибку
    </button>
  );
}

export default function DesignSystem() {
  const [inputText, setInputText] = useState('');
  const [disabled, setDisabled] = useState(false);
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [stateKind, setStateKind] = useState('loading');
  const [badgeKind, setBadgeKind] = useState('success');

  return (
    <div className={styles.layout}>
      <h1>Дизайн-система IRBIS</h1>
      <p className={styles.muted}>
        Живая документация компонентов. Все элементы — реальные, интерактивные.
        Доступна только в режиме разработки.
      </p>

      <nav className={styles.nav}>
        <a href="#colors">Цвета</a>
        <a href="#buttons">Кнопки</a>
        <a href="#forms">Формы</a>
        <a href="#badges">Бейджи</a>
        <a href="#table">Таблица</a>
        <a href="#pagination">Пагинация</a>
        <a href="#modal">Модалки</a>
        <a href="#states">Состояния</a>
        <a href="#error-boundary">ErrorBoundary</a>
      </nav>

      {/* ===== ЦВЕТА ===== */}
      <section id="colors" className={styles.section}>
        <h2>Цветовые токены</h2>
        <div className={styles.swatches}>
          {TOKENS.map((name) => (
            <div key={name} className={styles.swatch}>
              <div className={styles.swatchColor} style={{ background: `var(--${name})` }} />
              <div className={styles.swatchName}>{name}</div>
              <div className={styles.swatchVar}>{`var(--${name})`}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== КНОПКИ ===== */}
      <section id="buttons" className={styles.section}>
        <h2>Кнопки</h2>
        <div className={styles.preview}>
          <div className={styles.grid}>
            <button className="btn">Основная</button>
            <button className="btn btn-secondary">Вторичная</button>
            <button className="btn btn-success">Успех</button>
            <button className="btn btn-danger">Опасная</button>
            <button className="btn" disabled>Заблокирована</button>
            <button className="btn btn-secondary" disabled>Заблокирована</button>
          </div>
          <div className={styles.spacer} />
          <div className={styles.grid}>
            <button className="btn"><FontAwesomeIcon icon={faPlus} /> Добавить</button>
            <button className="btn btn-secondary"><FontAwesomeIcon icon={faDownload} /> Скачать</button>
            <button className="btn btn-danger"><FontAwesomeIcon icon={faTrash} /> Удалить</button>
            <button className="btn btn-success"><FontAwesomeIcon icon={faCheck} /> Готово</button>
          </div>
        </div>
      </section>

      {/* ===== ФОРМЫ ===== */}
      <section id="forms" className={styles.section}>
        <h2>Поля ввода</h2>
        <div className={styles.preview}>
          <div className={styles.row}>
            <div className={styles.col}>
              <label>Текст</label>
              <input
                className="form-control"
                placeholder="Введите значение"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
              />
              <span className={styles.muted}>Значение: {inputText || '—'}</span>
            </div>
            <div className={styles.col}>
              <label>Число</label>
              <input type="number" className="form-control" defaultValue={1} />
            </div>
            <div className={styles.col}>
              <label>Дата</label>
              <input type="date" className="form-control" />
            </div>
            <div className={styles.col}>
              <label>Выбор</label>
              <select className="form-control">
                <option>Вариант 1</option>
                <option>Вариант 2</option>
              </select>
            </div>
          </div>
          <div className={styles.row}>
            <div className={styles.col}>
              <label>Textarea</label>
              <textarea className="form-control" rows={3} placeholder="Комментарий" />
            </div>
            <div className={styles.col}>
              <label>Файл</label>
              <input type="file" className="form-control" />
            </div>
            <div className={styles.col}>
              <label>Чекбокс</label>
              <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input type="checkbox" /> Активно
              </label>
            </div>
          </div>
          <div className={styles.spacer} />
          <div className={styles.grid}>
            <input className="form-control" disabled={disabled} placeholder="Поле с переключением" />
            <button className="btn btn-secondary" onClick={() => setDisabled((d) => !d)}>
              {disabled ? 'Включить' : 'Отключить'} поле
            </button>
          </div>
        </div>
      </section>

      {/* ===== БЕЙДЖИ ===== */}
      <section id="badges" className={styles.section}>
        <h2>Бейджи</h2>
        <div className={styles.preview}>
          <div className={styles.grid}>
            <span className="badge badge-success">success</span>
            <span className="badge badge-warning">warning</span>
            <span className="badge badge-danger">danger</span>
            <span className="badge badge-info">info</span>
          </div>
          <div className={styles.spacer} />
          <h4>StatusBadge (все статусы)</h4>
          <div className={styles.grid}>
            {STATUSES.map((s) => <StatusBadge key={s} status={s} />)}
          </div>
          <div className={styles.spacer} />
          <div className={styles.grid}>
            <button
              className="btn btn-secondary"
              onClick={() => setBadgeKind((k) => (k === 'success' ? 'danger' : 'success'))}
            >
              Переключить статус (сейчас: {badgeKind})
            </button>
            <StatusBadge status={badgeKind} />
          </div>
        </div>
      </section>

      {/* ===== ТАБЛИЦА ===== */}
      <section id="table" className={styles.section}>
        <h2>Таблица</h2>
        <div className={styles.preview}>
          <table className="table">
            <thead>
              <tr>
                <th>ФИО</th>
                <th>Должность</th>
                <th>Статус</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Иванов Иван</td>
                <td>Сварщик</td>
                <td><StatusBadge status="active" /></td>
                <td>
                  <div className="action-buttons">
                    <button className="btn">Карточка</button>
                    <button className="btn btn-danger">Удалить</button>
                  </div>
                </td>
              </tr>
              <tr>
                <td>Петрова Анна</td>
                <td>Лаборант</td>
                <td><StatusBadge status="expired" /></td>
                <td>
                  <div className="action-buttons">
                    <button className="btn">Карточка</button>
                    <button className="btn btn-danger">Удалить</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* ===== ПАГИНАЦИЯ ===== */}
      <section id="pagination" className={styles.section}>
        <h2>Пагинация</h2>
        <div className={styles.preview}>
          <Pagination
            totalItems={53}
            itemsPerPage={10}
            currentPage={page}
            onPageChange={setPage}
          />
          <p className={styles.muted}>Текущая страница: {page} (всего 6)</p>
        </div>
      </section>

      {/* ===== МОДАЛКИ ===== */}
      <section id="modal" className={styles.section}>
        <h2>Модальные окна</h2>
        <div className={styles.preview}>
          <div className={styles.grid}>
            <button className="btn" onClick={() => setModalOpen(true)}>Открыть Modal</button>
            <button className="btn btn-danger" onClick={() => setConfirmOpen(true)}>Открыть ConfirmDialog</button>
          </div>
        </div>
        <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Демо модального окна">
          <div className="form-group">
            <label>Имя</label>
            <input className="form-control" placeholder="Введите имя" />
          </div>
          <div className="form-group">
            <label>Комментарий</label>
            <textarea className="form-control" rows={3} />
          </div>
          <div className={styles.grid}>
            <button className="btn" onClick={() => setModalOpen(false)}>Сохранить</button>
            <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>Закрыть</button>
          </div>
        </Modal>
        <ConfirmDialog
          isOpen={confirmOpen}
          onClose={() => setConfirmOpen(false)}
          onConfirm={() => new Promise((r) => setTimeout(r, 600))}
          title="Подтверждение"
          message="Вы уверены, что хотите выполнить действие?"
        />
      </section>

      {/* ===== СОСТОЯНИЯ ===== */}
      <section id="states" className={styles.section}>
        <h2>Состояния (Loading / Error / Empty)</h2>
        <div className={styles.preview}>
          <div className={styles.grid}>
            <button className="btn btn-secondary" onClick={() => setStateKind('loading')}>LoadingState</button>
            <button className="btn btn-secondary" onClick={() => setStateKind('error')}>ErrorState</button>
            <button className="btn btn-secondary" onClick={() => setStateKind('empty')}>EmptyState</button>
          </div>
          <div className={styles.spacer} />
          {stateKind === 'loading' && <LoadingState label="Загрузка данных..." />}
          {stateKind === 'error' && (
            <ErrorState
              message="Не удалось загрузить данные. Проверьте подключение к серверу."
              onRetry={() => alert('onRetry вызван')}
            />
          )}
          {stateKind === 'empty' && (
            <EmptyState
              icon={<FontAwesomeIcon icon={faBoxOpen} />}
              title="Данных пока нет"
              description="Здесь появятся записи, когда они будут добавлены."
              action={<button className="btn">Добавить запись</button>}
            />
          )}
        </div>
      </section>

      {/* ===== ERROR BOUNDARY ===== */}
      <section id="error-boundary" className={styles.section}>
        <h2>ErrorBoundary</h2>
        <div className={styles.preview}>
          <ErrorBoundary>
            <Boom />
          </ErrorBoundary>
        </div>
      </section>
    </div>
  );
}

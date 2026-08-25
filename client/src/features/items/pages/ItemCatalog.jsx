import { useState, useEffect } from 'react';
import { itemsService } from '@lib/services/items.service.js';
import { certificatesService } from '@lib/services/certificates.service.js';
import { ITEM_CATEGORIES } from '@lib/constants/item-categories.js';
import { SEASONALITY } from '@lib/constants/seasonality.js';
import { CERTIFICATE_STATUSES, CERTIFICATE_STATUS_LABELS } from '@lib/constants/certificate-statuses.js';
import { formatDate } from '@/lib/utils/date.js';
import Modal from '@components/ui/Modal.jsx';
import ConfirmDialog from '@components/ui/ConfirmDialog.jsx';
import Pagination from '@/components/ui/Pagination.jsx';
import styles from './ItemCatalog.module.css';

const categories = ITEM_CATEGORIES;

const seasonality = SEASONALITY;

export default function ItemCatalog() {
  const [items, setItems] = useState([]);
  const [category, setCategory] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [detailItem, setDetailItem] = useState(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    category: 'consumable',
    unit: 'шт',
    default_wear_time_months: '',
    seasonality: 'year_round',
    requires_certificate: false
  });

  useEffect(() => {
    fetchItems();
  }, [category]);

  useEffect(() => {
    setCurrentPage(1);
  }, [category, items]);

  useEffect(() => {
    if (detailItem) {
      setTimeout(() => {
        const panel = document.getElementById('detail-panel');
        if (panel) {
          panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }, 100);
    }
  }, [detailItem]);

  const fetchItems = async () => {
    const res = await itemsService.list(category);
    setItems(res);
  };

  const startIndex = (currentPage - 1) * 10;
  const paginatedItems = items.slice(startIndex, startIndex + 10);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = { ...formData };
    if (data.default_wear_time_months === '') data.default_wear_time_months = null;
    if (editingItem) {
      await itemsService.update(editingItem.id, data);
      setEditingItem(null);
    } else {
      await itemsService.create(data);
    }
    setFormData({ name: '', category: 'consumable', unit: 'шт', default_wear_time_months: '', seasonality: 'year_round', requires_certificate: false });
    setShowModal(false);
    fetchItems();
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      category: item.category,
      unit: item.unit || 'шт',
      default_wear_time_months: item.default_wear_time_months || '',
      seasonality: item.seasonality || 'year_round',
      requires_certificate: item.requires_certificate || false
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    await itemsService.delete(deleteId);
    fetchItems();
    if (detailItem && detailItem.id === deleteId) setDetailItem(null);
    setDeleteId(null);
  };

  const handleCancel = () => {
    setEditingItem(null);
    setShowModal(false);
    setFormData({ name: '', category: 'consumable', unit: 'шт', default_wear_time_months: '', seasonality: 'year_round', requires_certificate: false });
  };

  const showDetails = async (item) => {
    setIsLoadingDetails(true);
    setDetailItem(null);
    try {
      const [itemRes, certRes] = await Promise.all([
        itemsService.get(item.id),
        certificatesService.listByItem(item.id)
      ]);
      setDetailItem({ ...itemRes, certificates: certRes });
    } catch (error) {
      console.error('Failed to load item details:', error);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.pageHeader}>
        <div className={`${styles.container} ${styles.pageHeaderContent}`}>
          <div className={styles.title}>
            <h1>Номенклатура</h1>
            <div className={styles.subtitle}>Справочник спецодежды, обуви и СИЗ</div>
          </div>
          <button className="btn" onClick={() => { setEditingItem(null); setFormData({ name: '', category: 'consumable', unit: 'шт', default_wear_time_months: '', seasonality: 'year_round', requires_certificate: false }); setShowModal(true); }}>
            Добавить позицию
          </button>
        </div>
      </div>
      <div className={styles.container}>
        <div className="card">
          <div className={styles.tabs}>
            <button
              className={!category ? styles.tabActive : styles.tab}
              onClick={() => { setCategory(''); fetchItems(); }}
            >Все</button>
            {Object.entries(categories).map(([key, label]) => (
              <button
                key={key}
                className={category === key ? styles.tabActive : styles.tab}
                onClick={() => { setCategory(key); fetchItems(); }}
              >{label}</button>
            ))}
          </div>

          <table className="table">
            <thead>
              <tr>
                <th>Наименование</th>
                <th>Категория</th>
                <th>Срок (мес)</th>
                <th>Сезон</th>
                <th>Сертификат</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {paginatedItems.map((item) => (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td>{categories[item.category]}</td>
                  <td>{item.default_wear_time_months || '-'}</td>
                  <td>{seasonality[item.seasonality] || '-'}</td>
                  <td>
                    {item.requires_certificate ? (
                      <span className="badge badge-warning">Требуется</span>
                    ) : (
                      <span className="badge badge-success">Не требуется</span>
                    )}
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn" onClick={() => showDetails(item)}>Подробнее</button>
                      <button className="btn" onClick={() => handleEdit(item)}>Редактировать</button>
                      <button className="btn btn-danger" onClick={() => handleDelete(item.id)}>Удалить</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination
            totalItems={items.length}
            itemsPerPage={10}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
          />
        </div>

        <div id="detail-panel" className={`${styles.detailPanel} ${detailItem && !isLoadingDetails ? styles.detailPanelOpen : ''}`}>
          {isLoadingDetails && (
            <div className={styles.loadingState}>
              <div className={styles.spinner}></div>
              <div className={styles.loadingText}>Загрузка подробных данных...</div>
            </div>
          )}
          {detailItem && !isLoadingDetails && (
            <div className={styles.detailCard}>
              <div className={styles.detailHeader}>
                <h3 className={styles.detailTitle}>{detailItem.name}</h3>
              </div>
              <div className={styles.detailsGrid}>
                <div className={styles.detailField}>
                  <span className={styles.detailFieldLabel}>Категория</span>
                  <span className={styles.detailFieldValue}>{categories[detailItem.category]}</span>
                </div>
                <div className={styles.detailField}>
                  <span className={styles.detailFieldLabel}>Единица измерения</span>
                  <span className={styles.detailFieldValue}>{detailItem.unit || '-'}</span>
                </div>
                <div className={styles.detailField}>
                  <span className={styles.detailFieldLabel}>Срок годности</span>
                  <span className={styles.detailFieldValue}>{detailItem.default_wear_time_months || '-'} мес.</span>
                </div>
                <div className={styles.detailField}>
                  <span className={styles.detailFieldLabel}>Сезонность</span>
                  <span className={styles.detailFieldValue}>{seasonality[detailItem.seasonality] || '-'}</span>
                </div>
                <div className={styles.detailField}>
                  <span className={styles.detailFieldLabel}>Требуется сертификат</span>
                  <span className={styles.detailFieldValue}>{detailItem.requires_certificate ? 'Да' : 'Нет'}</span>
                </div>
              </div>

              <div className={styles.certificatesSection}>
                <h4 className={styles.certificatesTitle}>Сертификаты</h4>
                {detailItem.certificates && detailItem.certificates.length > 0 ? (
                  <table className={`${styles.certificatesTable} table`}>
                    <thead>
                      <tr>
                        <th>Номер</th>
                        <th>Дата выдачи</th>
                        <th>Срок действия</th>
                        <th>Статус</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detailItem.certificates.map((cert) => (
                        <tr key={cert.id}>
                          <td>{cert.certificate_number}</td>
                           <td>{formatDate(cert.issue_date)}</td>
                           <td>{formatDate(cert.expiry_date)}</td>
                          <td>
                            {cert.status === CERTIFICATE_STATUSES.active && <span className="badge badge-success">{CERTIFICATE_STATUS_LABELS.active}</span>}
                            {cert.status === CERTIFICATE_STATUSES.expiring && <span className="badge badge-warning">{CERTIFICATE_STATUS_LABELS.expiring}</span>}
                            {cert.status === CERTIFICATE_STATUSES.expired && <span className="badge badge-danger">{CERTIFICATE_STATUS_LABELS.expired}</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className={styles.emptyCertificates}>Сертификаты отсутствуют</div>
                )}
              </div>
              <div className={styles.actionButtons}>
                <button className={`btn btn-secondary`} onClick={() => setDetailItem(null)}>Закрыть</button>
              </div>
            </div>
          )}
        </div>
      </div>

      <Modal isOpen={showModal} onClose={handleCancel} title={editingItem ? 'Редактировать позицию' : 'Новая позиция'}>
        <form onSubmit={handleSubmit} className={styles.formSection}>
          <div className={styles.formGrid}>
            <div className={`form-group ${styles.field}`}>
              <label>Наименование *</label>
              <input
                type="text"
                className="form-control"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
              />
            </div>
            <div className={`form-group ${styles.field}`}>
              <label>Категория *</label>
              <select
                className="form-control"
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
              >
                {Object.entries(categories).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <div className={`form-group ${styles.field}`}>
              <label>Единица измерения</label>
              <input
                type="text"
                className="form-control"
                value={formData.unit}
                onChange={(e) => setFormData({...formData, unit: e.target.value})}
              />
            </div>
            <div className={`form-group ${styles.field}`}>
              <label>Срок годности (мес)</label>
              <input
                type="number"
                className="form-control"
                value={formData.default_wear_time_months}
                onChange={(e) => setFormData({...formData, default_wear_time_months: e.target.value})}
              />
            </div>
            <div className={`form-group ${styles.field}`}>
              <label>Сезонность</label>
              <select
                className="form-control"
                value={formData.seasonality}
                onChange={(e) => setFormData({...formData, seasonality: e.target.value})}
              >
                <option value="year_round">Круглогодичная</option>
                <option value="winter">Зимняя</option>
                <option value="summer">Летняя</option>
              </select>
            </div>
            <div className={`form-group ${styles.field}`}>
              <div className={styles.checkboxRow}>
                <span>Требуется сертификат</span>
                <input
                  type="checkbox"
                  checked={formData.requires_certificate}
                  onChange={(e) => setFormData({...formData, requires_certificate: e.target.checked})}
                />
              </div>
            </div>
          </div>
          <div className={styles.actionButtons}>
            <button type="submit" className="btn">{editingItem ? 'Сохранить' : 'Добавить'}</button>
            {editingItem && <button type="button" className="btn btn-secondary" onClick={handleCancel}>Отмена</button>}
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        title="Удаление позиции"
        message="Вы уверены, что хотите удалить эту позицию?"
      />
    </div>
  );
}

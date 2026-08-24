import { useState, useEffect } from 'react';
import { sitesService } from '@lib/services/sites.service.js';
import Modal from '@components/ui/Modal.jsx';
import ConfirmDialog from '@/components/ui/ConfirmDialog.jsx';
import Pagination from '@/components/ui/Pagination.jsx';
import styles from './SitesPage.module.css';

export default function SitesPage() {
  const [sites, setSites] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingSite, setEditingSite] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    responsible_person: ''
  });
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchSites();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [sites]);

  const fetchSites = async () => {
    const res = await sitesService.list();
    setSites(res);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingSite) {
      await sitesService.update(editingSite.id, formData);
      setEditingSite(null);
    } else {
      await sitesService.create(formData);
    }
    setFormData({ name: '', responsible_person: '' });
    setShowModal(false);
    fetchSites();
  };

  const handleEdit = (site) => {
    setEditingSite(site);
    setFormData({ name: site.name, responsible_person: site.responsible_person || '' });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    await sitesService.delete(deleteId);
    fetchSites();
    setDeleteId(null);
  };

  const handleClose = () => {
    setShowModal(false);
    setEditingSite(null);
    setFormData({ name: '', responsible_person: '' });
  };

  const totalItems = sites.length;
  const startIndex = (currentPage - 1) * 10;
  const paginatedSites = sites.slice(startIndex, startIndex + 10);

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.pageHeader}>
        <div className={`${styles.container} ${styles.pageHeaderContent}`}>
          <div className={styles.title}>
            <h1>Объекты</h1>
            <div className={styles.subtitle}>Список АЗС и подразделений</div>
          </div>
          <button className="btn" onClick={() => { setEditingSite(null); setFormData({ name: '', responsible_person: '' }); setShowModal(true); }}>
            Добавить объект
          </button>
        </div>
      </div>
      <div className={styles.container}>
        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Название</th>
                <th>Ответственный</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {paginatedSites.map((s) => (
                <tr key={s.id}>
                  <td>{s.id}</td>
                  <td>{s.name}</td>
                  <td>{s.responsible_person}</td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn" onClick={() => handleEdit(s)}>Редактировать</button>
                      <button className="btn btn-danger" onClick={() => handleDelete(s.id)}>Удалить</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination
            totalItems={totalItems}
            itemsPerPage={10}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>

      <Modal isOpen={showModal} onClose={handleClose} title={editingSite ? 'Редактировать объект' : 'Добавить объект'}>
        <form onSubmit={handleSubmit} className={styles.formSection}>
          <div className={styles.formGrid}>
            <div className={`form-group ${styles.field}`}>
              <label>Название объекта *</label>
              <input
                type="text"
                className="form-control"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
              />
            </div>
            <div className={`form-group ${styles.field}`}>
              <label>Ответственный</label>
              <input
                type="text"
                className="form-control"
                value={formData.responsible_person}
                onChange={(e) => setFormData({...formData, responsible_person: e.target.value})}
              />
            </div>
          </div>
          <div className={styles.actionButtons}>
            <button type="submit" className="btn">{editingSite ? 'Сохранить' : 'Добавить объект'}</button>
            {editingSite && <button type="button" className="btn btn-secondary" onClick={handleClose}>Отмена</button>}
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        title="Удаление объекта"
        message="Вы уверены, что хотите удалить этот объект?"
      />
    </div>
  );
}

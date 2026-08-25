import { useState, useEffect } from 'react';
import { certificatesService } from '@lib/services/certificates.service.js';
import { itemsService } from '@/lib/services/items.service.js';
import { uploadService } from '@/lib/services/upload.service.js';
import { CERTIFICATE_STATUSES, CERTIFICATE_STATUS_LABELS } from '@/lib/constants/certificate-statuses.js';
import { formatDate } from '@/lib/utils/date.js';
import Modal from '@/components/ui/Modal.jsx';
import Pagination from '@/components/ui/Pagination.jsx';
import ConfirmDialog from '@/components/ui/ConfirmDialog.jsx';
import styles from './Certificates.module.css';

export default function Certificates() {
  const [certificates, setCertificates] = useState([]);
  const [items, setItems] = useState([]);
  const [showExpired, setShowExpired] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingCertificate, setEditingCertificate] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [formData, setFormData] = useState({
    product_name: '',
    certificate_number: '',
    issue_date: '',
    expiry_date: '',
    item_type_id: ''
  });
  const [certificateFile, setCertificateFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchCertificates();
    fetchItems();
  }, []);

  const fetchCertificates = async () => {
    const res = await certificatesService.list();
    setCertificates(res);
  };

  const fetchItems = async () => {
    const res = await itemsService.listRequiringCertificates();
    setItems(res);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    try {
      if (editingCertificate) {
        if (certificateFile) {
          const fd = new FormData();
          fd.append('certificate', certificateFile);
          fd.append('product_name', formData.product_name);
          fd.append('certificate_number', formData.certificate_number || '');
          fd.append('issue_date', formData.issue_date || '');
          fd.append('expiry_date', formData.expiry_date || '');
          fd.append('item_type_id', formData.item_type_id || '');
          await uploadService.uploadCertificate(fd);
        } else {
          await certificatesService.update(editingCertificate.id, formData);
        }
        setEditingCertificate(null);
      } else {
        if (certificateFile) {
          const fd = new FormData();
          fd.append('certificate', certificateFile);
          fd.append('product_name', formData.product_name);
          fd.append('certificate_number', formData.certificate_number || '');
          fd.append('issue_date', formData.issue_date || '');
          fd.append('expiry_date', formData.expiry_date || '');
          fd.append('item_type_id', formData.item_type_id || '');
          await uploadService.uploadCertificate(fd);
        } else {
          await certificatesService.create(formData);
        }
      }
      setFormData({ product_name: '', certificate_number: '', issue_date: '', expiry_date: '', item_type_id: '' });
      setCertificateFile(null);
      setShowModal(false);
      fetchCertificates();
    } catch (err) {
      alert(err.response?.data?.error || 'Ошибка загрузки');
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (cert) => {
    setEditingCertificate(cert);
    setFormData({
      product_name: cert.product_name,
      certificate_number: cert.certificate_number || '',
      issue_date: cert.issue_date || '',
      expiry_date: cert.expiry_date || '',
      item_type_id: cert.item_type_id || ''
    });
    setCertificateFile(null);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    await certificatesService.delete(deleteId);
    fetchCertificates();
    setDeleteId(null);
  };

  const handleClose = () => {
    setShowModal(false);
    setEditingCertificate(null);
    setFormData({ product_name: '', certificate_number: '', issue_date: '', expiry_date: '', item_type_id: '' });
    setCertificateFile(null);
  };

  const filteredCerts = showExpired
    ? certificates
    : certificates.filter(c => c.status !== CERTIFICATE_STATUSES.expired);

  useEffect(() => {
    setCurrentPage(1);
  }, [showExpired, certificates]);

  const startIndex = (currentPage - 1) * 10;
  const paginatedCerts = filteredCerts.slice(startIndex, startIndex + 10);

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.pageHeader}>
        <div className={`${styles.container} ${styles.pageHeaderContent}`}>
          <div className={styles.title}>
            <h1>Сертификаты соответствия</h1>
            <div className={styles.subtitle}>Контроль сроков действия и файлов сертификатов</div>
          </div>
          <button className="btn" onClick={() => setShowModal(true)}>
            Добавить сертификат
          </button>
        </div>
      </div>
      <div className={styles.container}>
        <div className="card">
          <div className={styles.tableWrapper}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={showExpired}
                onChange={(e) => setShowExpired(e.target.checked)}
              /> Показать просроченные
            </label>
          </div>

          <table className={`table ${styles.tableWrapper}`}>
            <thead>
              <tr>
                <th>Продукция</th>
                <th>Номер</th>
                <th>Дата выдачи</th>
                <th>Срок действия</th>
                <th>Статус</th>
                <th>Файл</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {paginatedCerts.map((cert) => (
                <tr key={cert.id}>
                  <td>{cert.product_name}</td>
                  <td>{cert.certificate_number}</td>
                  <td>{formatDate(cert.issue_date)}</td>
                  <td>{formatDate(cert.expiry_date)}</td>
                  <td>
                    {cert.status === CERTIFICATE_STATUSES.active && <span className="badge badge-success">{CERTIFICATE_STATUS_LABELS.active}</span>}
                    {cert.status === CERTIFICATE_STATUSES.expiring && <span className="badge badge-warning">{CERTIFICATE_STATUS_LABELS.expiring}</span>}
                    {cert.status === CERTIFICATE_STATUSES.expired && <span className="badge badge-danger">{CERTIFICATE_STATUS_LABELS.expired}</span>}
                  </td>
                  <td>
                    {cert.file_path && (
                      <a className={styles.fileLink} href={cert.file_path} target="_blank" rel="noreferrer">Открыть файл</a>
                    )}
                    </td>
                    <td>
                    <div className="action-buttons">
                      <button className="btn" onClick={() => handleEdit(cert)}>Редактировать</button>
                      <button className="btn btn-danger" onClick={() => handleDelete(cert.id)}>Удалить</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination
            totalItems={filteredCerts.length}
            itemsPerPage={10}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>

      <Modal isOpen={showModal} onClose={handleClose} title={editingCertificate ? 'Редактировать сертификат' : 'Добавить сертификат'}>
        <form onSubmit={handleSubmit} className={styles.formSection}>
          <div className={styles.formGrid}>
            <div className={`form-group ${styles.field}`}>
              <label>Продукция *</label>
              <input
                type="text"
                className="form-control"
                value={formData.product_name}
                onChange={(e) => setFormData({...formData, product_name: e.target.value})}
                required
              />
            </div>
            <div className={`form-group ${styles.field}`}>
              <label>Номер сертификата</label>
              <input
                type="text"
                className="form-control"
                value={formData.certificate_number}
                onChange={(e) => setFormData({...formData, certificate_number: e.target.value})}
              />
            </div>
            <div className={`form-group ${styles.field}`}>
              <label>Дата выдачи</label>
              <input
                type="date"
                className="form-control"
                value={formData.issue_date}
                onChange={(e) => setFormData({...formData, issue_date: e.target.value})}
              />
            </div>
            <div className={`form-group ${styles.field}`}>
              <label>Срок действия *</label>
              <input
                type="date"
                className="form-control"
                value={formData.expiry_date}
                onChange={(e) => setFormData({...formData, expiry_date: e.target.value})}
                required
              />
            </div>
            <div className={`form-group ${styles.field}`}>
              <label>Позиция номенклатуры</label>
              <select
                className="form-control"
                value={formData.item_type_id}
                onChange={(e) => setFormData({...formData, item_type_id: e.target.value})}
              >
                <option value="">Выберите...</option>
                {items.map((item) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </select>
            </div>
            <div className={`form-group ${styles.field}`}>
              <label>Файл сертификата (PDF/изображение)</label>
              <input
                type="file"
                className="form-control"
                accept=".pdf,.png,.jpg,.jpeg,.gif,.webp"
                onChange={(e) => setCertificateFile(e.target.files[0] || null)}
              />
            </div>
          </div>
          <div className={styles.actionButtons}>
            <button type="submit" className="btn" disabled={uploading}>{uploading ? 'Загрузка...' : (editingCertificate ? 'Сохранить' : 'Добавить сертификат')}</button>
            {editingCertificate && <button type="button" className="btn btn-secondary" onClick={handleClose}>Отмена</button>}
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        title="Удаление сертификата"
        message="Вы уверены, что хотите удалить этот сертификат?"
      />
    </div>
  );
}
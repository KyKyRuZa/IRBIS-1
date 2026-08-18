import { useState, useEffect } from 'react';
import { employeesService } from '@/lib/services/employees.service.js';
import { itemsService } from '@/lib/services/items.service.js';
import { sitesService } from '@/lib/services/sites.service.js';
import { certificatesService } from '@/lib/services/certificates.service.js';
import { issuesService } from '@/lib/services/issues.service.js';
import { uploadService } from '@/lib/services/upload.service.js';
import { EMPLOYEE_STATUSES } from '@/lib/constants/employee-statuses.js';
import { ISSUE_STATUSES } from '@/lib/constants/issue-statuses.js';
import { useResource } from '@/hooks/useResource.js';
import { useFormState } from '@/hooks/useFormState.js';
import Modal from '@/components/ui/Modal.jsx';
import ConfirmDialog from '@/components/ui/ConfirmDialog.jsx';
import Pagination from '@/components/ui/Pagination.jsx';
import styles from './IssueForm.module.css';

const formInitialState = {
  employee_id: '',
  item_type_id: '',
  quantity: 1,
  certificate_id: '',
  wear_time_override: '',
  signature_path: '',
  notes: ''
};

export default function IssueForm() {
  const [employees, setEmployees] = useState([]);
  const [items, setItems] = useState([]);
  const [sites, setSites] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [lastSignature, setLastSignature] = useState(null);
  const [isGroup, setIsGroup] = useState(false);
  const [selectedSite, setSelectedSite] = useState('');
  const [signatureFile, setSignatureFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [disposeId, setDisposeId] = useState(null);
  const [editingRecord, setEditingRecord] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const form = useFormState(formInitialState);
  const { data: records, loading, error, refetch: refetchRecords } = useResource(issuesService.list);

  useEffect(() => {
    employeesService.list({ status: EMPLOYEE_STATUSES.active }).then(setEmployees);
    itemsService.list().then(setItems);
    sitesService.list().then(setSites);
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [records]);

  const handleItemChange = async (itemId) => {
    form.setMany({ item_type_id: itemId });
    if (itemId) {
      const certs = await certificatesService.listByItem(itemId);
      setCertificates(certs);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    try {
      const data = {
        item_type_id: form.values.item_type_id,
        quantity: form.values.quantity,
        certificate_id: form.values.certificate_id,
        wear_time_override: form.values.wear_time_override,
        notes: form.values.notes
      };
      let record;
      if (isGroup) {
        const res = await issuesService.batchCreate({
          site_id: selectedSite,
          ...data
        });
        record = res.records?.[0];
      } else {
        const res = await issuesService.create({
          employee_id: form.values.employee_id,
          ...data,
          signature_path: form.values.signature_path
        });
        record = res;
      }

      if (signatureFile && record?.id) {
        const fd = new FormData();
        fd.append('signature', signatureFile);
        fd.append('issue_record_id', record.id);
        const sigRes = await uploadService.uploadSignature(fd);
        setLastSignature(sigRes.signature_path || null);
      } else {
        setLastSignature(null);
      }

      form.reset();
      setSignatureFile(null);
      setCertificates([]);
      setShowModal(false);
      refetchRecords();
    } catch (err) {
      alert(err.response?.data?.error || 'Ошибка');
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (record) => {
    setEditingRecord(record);
    form.setMany({
      employee_id: record.employee_id || '',
      item_type_id: record.item_type_id || '',
      quantity: record.quantity || 1,
      certificate_id: record.certificate_id || '',
      wear_time_override: record.wear_time_override_months || '',
      notes: record.notes || ''
    });
    setShowModal(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setUploading(true);
    try {
      await issuesService.update(editingRecord.id, {
        employee_id: form.values.employee_id,
        item_type_id: form.values.item_type_id,
        quantity: form.values.quantity,
        certificate_id: form.values.certificate_id,
        wear_time_override: form.values.wear_time_override,
        notes: form.values.notes
      });
      form.reset();
      setEditingRecord(null);
      setShowModal(false);
      setCertificates([]);
      refetchRecords();
    } catch (err) {
      alert(err.response?.data?.error || 'Ошибка');
    } finally {
      setUploading(false);
    }
  };

  const confirmDispose = async () => {
    if (!disposeId) return;
    await issuesService.dispose(disposeId);
    refetchRecords();
    setDisposeId(null);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    await issuesService.delete(deleteId);
    refetchRecords();
    setDeleteId(null);
  };

  const handleClose = () => {
    setShowModal(false);
    setEditingRecord(null);
    form.reset();
    setSignatureFile(null);
    setCertificates([]);
    setLastSignature(null);
    setIsGroup(false);
    setSelectedSite('');
  };

  const startIndex = (currentPage - 1) * 10;
  const paginatedRecords = records.slice(startIndex, startIndex + 10);

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.pageHeader}>
        <div className={`container ${styles.pageHeaderContent}`}>
          <div className={styles.title}>
            <h1>Выдача спецодежды и СИЗ</h1>
            <div className={styles.subtitle}>Оперативная выдача, групповая раздача и возвраты</div>
          </div>
          <button className="btn" onClick={() => setShowModal(true)}>
            Новая выдача
          </button>
        </div>
      </div>
      <div className="container">
        <div className="card">
          <h3 className={styles.title}>Последние выдачи</h3>
          {loading && <div className="card">Загрузка...</div>}
          {error && <div className={`card ${styles.error}`}>{error}</div>}
          {!loading && !error && (
            <>
              <table className="table">
                <thead>
                  <tr>
                    <th>Дата</th>
                    <th>Сотрудник</th>
                    <th>Наименование</th>
                    <th>Кол-во</th>
                    <th>Срок годности</th>
                    <th>Статус</th>
                    <th>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedRecords.map((record) => (
                    <tr key={record.id}>
                      <td>{new Date(record.issue_date).toLocaleDateString()}</td>
                      <td>{record.full_name}</td>
                      <td>{record.item_type_name}</td>
                      <td>{record.quantity}</td>
                      <td>{record.expiry_date ? new Date(record.expiry_date).toLocaleDateString() : '-'}</td>
                      <td>
                        {record.status === ISSUE_STATUSES.issued ? (
                          <span className="badge badge-success">{ISSUE_STATUSES.issued}</span>
                        ) : record.status === ISSUE_STATUSES.disposed ? (
                          <span className="badge badge-danger">{ISSUE_STATUSES.disposed}</span>
                        ) : record.status === ISSUE_STATUSES.returned ? (
                          <span className="badge badge-info">{ISSUE_STATUSES.returned}</span>
                        ) : (
                          <span className="badge">{record.status}</span>
                        )}
                      </td>
                      <td>
                        {record.status === ISSUE_STATUSES.issued && (
                          <>
                            <button
                              className={`btn ${styles.smallButton}`}
                              onClick={() => handleEdit(record)}
                            >
                              Редактировать
                            </button>
                            <button
                              className="btn btn-danger"
                              onClick={() => setDeleteId(record.id)}
                            >
                              Удалить
                            </button>
                            <button
                              className="btn btn-secondary"
                              onClick={() => setDisposeId(record.id)}
                            >
                              Списать
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Pagination
                totalItems={records.length}
                itemsPerPage={10}
                currentPage={currentPage}
                onPageChange={setCurrentPage}
              />
            </>
          )}
        </div>
      </div>

      <Modal isOpen={showModal} onClose={handleClose} title={editingRecord ? 'Редактировать выдачу' : 'Выдача спецодежды и СИЗ'}>
        <form onSubmit={editingRecord ? handleUpdate : handleSubmit} className={styles.formSection}>
          <div className={styles.radioGroup}>
            <label>
              <input
                type="radio"
                checked={!isGroup}
                onChange={() => setIsGroup(false)}
                disabled={Boolean(editingRecord)}
              /> Одиночная выдача
            </label>
            <label>
              <input
                type="radio"
                checked={isGroup}
                onChange={() => setIsGroup(true)}
                disabled={Boolean(editingRecord)}
              /> Групповая выдача (всем сотрудникам объекта)
            </label>
          </div>

          {!editingRecord && isGroup && (
            <div className={`form-group ${styles.field}`}>
              <label>Объект *</label>
              <select
                className="form-control"
                value={selectedSite}
                onChange={(e) => handleSiteChange(e.target.value)}
                required
              >
                <option value="">Выберите объект...</option>
                {sites.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          )}

          {!editingRecord && !isGroup && (
            <div className={`form-group ${styles.field}`}>
              <label>Сотрудник *</label>
              <select
                className="form-control"
                value={form.values.employee_id}
                onChange={(e) => form.setMany({ employee_id: e.target.value })}
                required
              >
                <option value="">Выберите...</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>{emp.full_name} ({emp.position})</option>
                ))}
              </select>
            </div>
          )}

          {editingRecord && (
            <div className={`form-group ${styles.field}`}>
              <label>Сотрудник *</label>
              <select
                className="form-control"
                value={form.values.employee_id}
                onChange={(e) => form.setMany({ employee_id: e.target.value })}
                required
              >
                <option value="">Выберите...</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>{emp.full_name} ({emp.position})</option>
                ))}
              </select>
            </div>
          )}

          <div className={`form-group ${styles.field}`}>
            <label>Наименование *</label>
            <select
              className="form-control"
              value={form.values.item_type_id}
              onChange={(e) => handleItemChange(e.target.value)}
              required
            >
              <option value="">Выберите...</option>
              {items.map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
          </div>
          <div className={`form-group ${styles.field}`}>
            <label>Количество</label>
            <input
              type="number"
              className="form-control"
              value={form.values.quantity}
              onChange={(e) => form.setMany({ quantity: e.target.value })}
            />
          </div>
          <div className={`form-group ${styles.field}`}>
            <label>Срок носки (мес.) — оставьте пустым для значения по умолчанию</label>
            <input
              type="number"
              className="form-control"
              placeholder="Автоматически из нормы"
              value={form.values.wear_time_override}
              onChange={(e) => form.setMany({ wear_time_override: e.target.value })}
            />
          </div>
          {certificates.length > 0 && (
            <div className={`form-group ${styles.field}`}>
              <label>Сертификат</label>
              <select
                className="form-control"
                value={form.values.certificate_id}
                onChange={(e) => form.setMany({ certificate_id: e.target.value })}
              >
                <option value="">Выберите...</option>
                {certificates.map((cert) => (
                  <option key={cert.id} value={cert.id}>
                    {cert.certificate_number} (до {new Date(cert.expiry_date).toLocaleDateString()})
                  </option>
                ))}
              </select>
            </div>
          )}
          {!editingRecord && !isGroup && (
            <div className={`form-group ${styles.field}`}>
              <label>Подпись сотрудника (файл)</label>
              <input
                type="file"
                className="form-control"
                accept=".png,.jpg,.jpeg,.gif,.webp,.pdf"
                onChange={(e) => setSignatureFile(e.target.files[0] || null)}
              />
              {signatureFile && <small className={styles.signatureHint}>Выбран файл: {signatureFile.name}</small>}
            </div>
          )}
          <div className={`form-group ${styles.field}`}>
            <label>Примечание</label>
            <textarea
              className="form-control"
              value={form.values.notes}
              onChange={(e) => form.setMany({ notes: e.target.value })}
            />
          </div>
          <button type="submit" className="btn" disabled={uploading}>
            {uploading ? 'Загрузка...' : (editingRecord ? 'Сохранить' : (isGroup ? `Выдать всем сотрудникам объекта (${selectedSite ? sites.find(s => s.id == selectedSite)?.name : 'объект не выбран'})` : 'Выдать'))}
          </button>
          {editingRecord && <button type="button" className="btn btn-secondary" onClick={handleClose}>Отмена</button>}
          {lastSignature && editingRecord && (
            <div className={styles.signatureSuccess}>
              <strong>Подпись загружена:</strong> <a href={lastSignature} target="_blank" rel="noreferrer">Открыть подпись</a>
            </div>
          )}
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(disposeId)}
        onClose={() => setDisposeId(null)}
        onConfirm={confirmDispose}
        title="Списание"
        message="Вы уверены, что хотите списать эту выдачу?"
      />

      <ConfirmDialog
        isOpen={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        title="Удаление выдачи"
        message="Вы уверены, что хотите удалить эту запись о выдаче?"
      />
    </div>
  );
}

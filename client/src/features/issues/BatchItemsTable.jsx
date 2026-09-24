import { ISSUE_METHODS } from '@/lib/constants/issue-methods.js';
import Icon from '@components/ui/Icon.jsx';
import styles from '@styles/IssueForm.module.css';

const emptyBatchItem = () => ({ item_type_id: '', quantity: 1, certificate_id: '', issue_method: 'personal', notes: '' });

export default function BatchItemsTable({ batchItems, items, certificates, fieldErrors, updateBatchItem, removeBatchItem, addBatchItem, handleBatchItemChange }) {
  return (
    <div className={styles.section}>
      <table className={`table ${styles.batchTable}`} style={{ marginBottom: 8 }}>
        <thead>
          <tr>
            <th>Наименование</th>
            <th>Кол-во</th>
            <th>Сертификат</th>
            <th>Способ выдачи</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {batchItems.map((bi, idx) => (
            <tr key={idx}>
              <td>
                <select
                  className="form-control"
                  value={bi.item_type_id}
                  onChange={(e) => handleBatchItemChange(idx, e.target.value)}
                  aria-invalid={Boolean(fieldErrors[`items.${idx}.item_type_id`])}
                  aria-describedby={fieldErrors[`items.${idx}.item_type_id`] ? `batch-item-${idx}-error` : undefined}
                >
                  <option value="">Выберите...</option>
                  {items.map((item) => (
                    <option key={item.id} value={String(item.id)}>{item.name}</option>
                  ))}
                </select>
              </td>
              <td>
                <input
                  type="number"
                  className="form-control"
                  value={bi.quantity}
                  onChange={(e) => updateBatchItem(idx, { quantity: e.target.value })}
                  aria-invalid={Boolean(fieldErrors[`items.${idx}.quantity`])}
                  aria-describedby={fieldErrors[`items.${idx}.quantity`] ? `batch-item-${idx}-error` : undefined}
                />
              </td>
              <td>
                <select
                  className="form-control"
                  value={bi.certificate_id}
                  onChange={(e) => updateBatchItem(idx, { certificate_id: e.target.value })}
                  aria-invalid={Boolean(fieldErrors[`items.${idx}.certificate_id`])}
                  aria-describedby={fieldErrors[`items.${idx}.certificate_id`] ? `batch-item-${idx}-error` : undefined}
                >
                  <option value="">Без сертификата</option>
                  {certificates.map((cert) => (
                    <option key={cert.id} value={cert.id}>
                      {cert.certificate_number}
                    </option>
                  ))}
                </select>
              </td>
              <td>
                <select
                  className="form-control"
                  value={bi.issue_method}
                  onChange={(e) => updateBatchItem(idx, { issue_method: e.target.value })}
                  aria-invalid={Boolean(fieldErrors[`items.${idx}.issue_method`])}
                  aria-describedby={fieldErrors[`items.${idx}.issue_method`] ? `batch-item-${idx}-error` : undefined}
                >
                  <option value="personal">{ISSUE_METHODS.personal}</option>
                  <option value="dosator">{ISSUE_METHODS.dosator}</option>
                </select>
              </td>
              <td>
                <button type="button" className="btn btn-danger" onClick={() => removeBatchItem(idx)}>×</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {batchItems.some((_, idx) => ['item_type_id', 'quantity', 'certificate_id', 'issue_method'].some(key => fieldErrors[`items.${idx}.${key}`])) && (
        <div className={styles.batchErrors}>
          {batchItems.map((_, idx) =>
            ['item_type_id', 'quantity', 'certificate_id', 'issue_method'].map(key => {
              const errKey = `items.${idx}.${key}`;
              if (fieldErrors[errKey]) {
                return <div key={errKey} id={`batch-item-${idx}-error`} className={styles.fieldError} role="alert">{fieldErrors[errKey]}</div>;
              }
              return null;
            })
          ).flat()}
        </div>
      )}
      <button type="button" className="btn btn-secondary" onClick={addBatchItem}><Icon name="plus" size={16} /> Добавить позицию</button>
    </div>
  );
}

export { emptyBatchItem };

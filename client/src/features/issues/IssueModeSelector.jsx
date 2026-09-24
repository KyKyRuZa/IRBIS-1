import { ISSUE_METHODS } from '@/lib/constants/issue-methods.js';
import styles from '@styles/IssueForm.module.css';

export default function IssueModeSelector({ issueMode, setIssueMode, setBatchItems }) {
  return (
    <div className={styles.modeCards}>
      <label className={`${styles.modeCard} ${issueMode === 'single' ? styles.active : ''}`}>
        <input
          type="radio"
          name="issue_mode"
          value="single"
          checked={issueMode === 'single'}
          onChange={() => { setIssueMode('single'); setBatchItems([]); }}
        />
        <span className={styles.modeCardTitle}>Одиночная</span>
      </label>
      <label className={`${styles.modeCard} ${issueMode === 'group' ? styles.active : ''}`}>
        <input
          type="radio"
          name="issue_mode"
          value="group"
          checked={issueMode === 'group'}
          onChange={() => { setIssueMode('group'); setBatchItems([]); }}
        />
        <span className={styles.modeCardTitle}>Групповая</span>
      </label>
      <label className={`${styles.modeCard} ${issueMode === 'batch-single' ? styles.active : ''}`}>
        <input
          type="radio"
          name="issue_mode"
          value="batch-single"
          checked={issueMode === 'batch-single'}
          onChange={() => { setIssueMode('batch-single'); setBatchItems([{ item_type_id: '', quantity: 1, certificate_id: '', issue_method: 'personal', notes: '' }]); }}
        />
        <span className={styles.modeCardTitle}>Несколько позиций</span>
      </label>
    </div>
  );
}

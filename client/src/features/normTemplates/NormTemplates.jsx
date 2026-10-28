import { useState, useEffect } from 'react'
import { normTemplatesService } from '@/lib/services/normTemplates.service.js'
import { itemsService } from '@/lib/services/items.service.js'
import { employeesService } from '@/lib/services/employees.service.js'
import { ITEM_CATEGORIES } from '@/lib/constants/item-categories.js'
import { useResource } from '@/hooks/useResource'
import { showSuccess, showFieldErrors, handleValidationError } from '@/lib/toast.js'
import { normTemplateSchema, normTemplateItemSchema } from '@/lib/validation/forms.js'
import Modal from '@components/ui/Modal.jsx'
import ConfirmDialog from '@components/ui/ConfirmDialog.jsx'
import LoadingState from '@components/ui/LoadingState.jsx'
import EmptyState from '@components/ui/EmptyState.jsx'
import Dropdown from '@components/ui/Dropdown.jsx'
import Icon from '@components/ui/Icon.jsx'
import styles from '@styles/NormTemplates.module.css'

export default function NormTemplates() {
  const [items, setItems] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState(null)
  const [mode, setMode] = useState('create') // 'create' | 'edit'
  const [itemForm, setItemForm] = useState({
    item_type_id: '',
    period_months: '',
    quantity: 1,
  })
  const [templateItems, setTemplateItems] = useState([])
  const [templateForm, setTemplateForm] = useState({
    name: '',
    position: '',
  })
  const [positions, setPositions] = useState([])
  const [deleteId, setDeleteId] = useState(null)

  const { data: templates, loading, error, refetch } = useResource(normTemplatesService.list, {}, {
    queryKey: ['norm-templates'],
  })

  useEffect(() => {
    itemsService
      .list()
      .then(setItems)
      .catch(() => setItems([]))
  }, [])

  const fetchTemplateItems = async (id) => {
    if (!id) {
      setTemplateItems([])
      return
    }
    try {
      const data = await normTemplatesService.get(id)
      setTemplateItems(data.items || [])
    } catch {
      setTemplateItems([])
    }
  }

  const resetTemplateForm = () => {
    setTemplateForm({ name: '', position: '' })
  }

  const resetItemForm = () => {
    setItemForm({ item_type_id: '', period_months: '', quantity: 1 })
  }

  const handleTemplateSubmit = async (e) => {
    e.preventDefault()
    const result = normTemplateSchema.safeParse(templateForm)
    if (!result.success) {
      showFieldErrors(result.error?.issues || [])
      return
    }
    try {
      const payload = {
        name: result.data.name,
        position: result.data.position,
      }
      if (editingTemplate) {
        await normTemplatesService.update(editingTemplate.id, payload)
        showSuccess('Шаблон обновлён')
        setShowModal(false)
        setEditingTemplate(null)
        setMode('create')
        refetch()
      } else {
        const created = await normTemplatesService.create(payload)
        const template = created?.data ?? created // нормализация ответа
        setEditingTemplate(template)
        setTemplateItems([])
        setMode('edit')
        showSuccess('Шаблон создан — добавьте позиции')
        refetch()
      }
    } catch (err) {
      handleValidationError(err, 'Не удалось сохранить шаблон')
    }
  }

  const handleItemSubmit = async (e) => {
    e.preventDefault()

    const itemResult = normTemplateItemSchema.safeParse(itemForm)
    if (!itemResult.success) {
      showFieldErrors(itemResult.error?.issues || [])
      return
    }

    try {
      let template = editingTemplate

      // Если шаблон ещё не сохранён — создаём его "на лету"
      // по данным из формы выше, чтобы можно было добавлять позиции сразу.
      if (!template) {
        const templateResult = normTemplateSchema.safeParse(templateForm)
        if (!templateResult.success) {
          showFieldErrors(templateResult.error?.issues || [])
          return
        }
        const created = await normTemplatesService.create({
          name: templateResult.data.name,
          position: templateResult.data.position,
        })
        template = created?.data ?? created
        setEditingTemplate(template)
        setMode('edit')
      }

      const payload = {
        item_type_id: Number(itemResult.data.item_type_id),
        period_months: Number(itemResult.data.period_months),
        quantity: itemResult.data.quantity ? Number(itemResult.data.quantity) : null,
      }
      await normTemplatesService.addItem(template.id, payload)
      showSuccess('Позиция добавлена')
      resetItemForm()
      fetchTemplateItems(template.id)
      refetch()
    } catch (err) {
      handleValidationError(err, 'Не удалось добавить позицию')
    }
  }

  const fetchPositions = async () => {
    try {
      const res = await employeesService.list({ limit: 200 })
      const emps = res?.data || res
      const distinct = [...new Set(emps.map((e) => e.position).filter((p) => p && p.trim()))].sort()
      setPositions(distinct)
    } catch {
      setPositions([])
    }
  }

  const handleEdit = (template) => {
    setMode('edit')
    setEditingTemplate(template)
    setTemplateForm({
      name: template.name,
      position: template.position,
    })
    fetchTemplateItems(template.id)
    fetchPositions()
    setShowModal(true)
  }

  const handleCreateNew = () => {
    setMode('create')
    setEditingTemplate(null)
    resetTemplateForm()
    resetItemForm()
    setTemplateItems([])
    fetchPositions()
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    setDeleteId(id)
  }

  const confirmDelete = async () => {
    if (!deleteId) return
    await normTemplatesService.delete(deleteId)
    showSuccess('Шаблон удалён')
    refetch()
    setDeleteId(null)
  }

  const handleDeleteItem = async (itemId) => {
    if (!editingTemplate) return
    await normTemplatesService.removeItem(editingTemplate.id, itemId)
    showSuccess('Позиция удалена')
    fetchTemplateItems(editingTemplate.id)
    refetch()
  }

  const handleClose = () => {
    setShowModal(false)
    setEditingTemplate(null)
    setMode('create')
    resetTemplateForm()
    resetItemForm()
    setTemplateItems([])
    setPositions([])
  }

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.pageHeader}>
        <div className={`${styles.container} ${styles.pageHeaderContent}`}>
          <div className={styles.title}>
            <h1>Шаблоны норм выдачи</h1>
            <div className={styles.subtitle}>Шаблоны норм по должностям. При создании сотрудника можно выбрать шаблон.</div>
          </div>
          <button className="btn" onClick={handleCreateNew}>
            <Icon name="plus" size={16} /> Создать шаблон
          </button>
        </div>
      </div>
      <div className={styles.container}>
        <div className="card">
          {loading && <LoadingState label="Загрузка шаблонов..." />}
          {!loading && error && <div className={styles.error}>{error}</div>}
          {!loading && !error && (
            templates && templates.length === 0 ? (
              <EmptyState
                icon={<Icon name="clipboardList" size={48} />}
                title="Шаблоны не созданы"
                description="Создайте шаблон норм для должности, чтобы автоматически назначать СИЗ при приёме новых сотрудников."
                action={
                  <button className="btn" onClick={handleCreateNew}>
                    <Icon name="plus" size={16} /> Создать шаблон
                  </button>
                }
              />
            ) : (
              <div className="tableScroll">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Название</th>
                      <th>Должность</th>
                      <th>Позиций</th>
                      <th>Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {templates?.map((template) => (
                      <tr key={template.id}>
                        <td>{template.name}</td>
                        <td>{template.position}</td>
                        <td>{template.item_count || 0}</td>
                        <td>
                          <div className="action-buttons">
                            <button
                              className="btn action-btn"
                              aria-label="Редактировать"
                              data-tooltip="Редактировать"
                              onClick={() => handleEdit(template)}
                            >
                              <Icon name="pencil" size={14} />
                            </button>
                            <button
                              className="btn btn-danger action-btn"
                              aria-label="Удалить"
                              data-tooltip="Удалить"
                              onClick={() => handleDelete(template.id)}
                            >
                              <Icon name="trash" size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
        </div>
      </div>

      <Modal
        isOpen={showModal}
        onClose={handleClose}
        title={mode === 'edit' ? 'Редактировать шаблон' : 'Создать шаблон'}
        size="large"
      >
        <form id="template-form" onSubmit={handleTemplateSubmit} className={styles.modalForm}>
          <div className={styles.formGrid}>
            <div className={`form-group ${styles.field}`}>
              <label>Название *</label>
              <input
                type="text"
                className="form-control"
                value={templateForm.name}
                onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                required
              />
            </div>
            <div className={`form-group ${styles.field}`}>
              <label>Должность *</label>
              <Dropdown
                value={templateForm.position}
                onChange={(val) => setTemplateForm({ ...templateForm, position: val })}
                placeholder="Выберите должность..."
              >
                {[...new Set([...positions, ...(templates?.map((t) => t.position) || [])])]
                  .filter((p) => p && p.trim())
                  .sort()
                  .map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
              </Dropdown>
            </div>
          </div>
        </form>

        {/* Позиции в шаблоне — всегда активны, шаблон создаётся автоматически при добавлении */}
        <div className={styles.itemsSection}>
          <div className={styles.itemsHeader}>
            <span className={styles.itemsTitle}>Позиции в шаблоне</span>
            <div>
                <form
                  onSubmit={handleItemSubmit}
                  className={styles.addFormGrid}
                >
                <select
                  className="form-control"
                  value={itemForm.item_type_id}
                  onChange={(e) => setItemForm({ ...itemForm, item_type_id: e.target.value })}
                >
                  <option value="">Наименование...</option>
                  {items.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} ({ITEM_CATEGORIES[item.category] || item.category})
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  className="form-control"
                  placeholder="Мес"
                  value={itemForm.period_months}
                  onChange={(e) => setItemForm({ ...itemForm, period_months: e.target.value })}
                  min="1"
                  required
                />
                <input
                  type="number"
                  className="form-control"
                  placeholder="Кол-во"
                  value={itemForm.quantity}
                  onChange={(e) => setItemForm({ ...itemForm, quantity: e.target.value })}
                  min="1"
                />
                <button
                  type="submit"
                  className="btn btn-secondary"
                >
                  <Icon name="plus" size={14} /> Добавить
                </button>
              </form>
            </div>
          </div>

          {templateItems.length === 0 ? (
            <EmptyState
              icon={<Icon name="package" size={32} />}
              title="Позиции не добавлены"
              description={
                editingTemplate
                  ? 'Добавьте позиции СИЗ в шаблон.'
                  : 'Заполните название и должность шаблона, затем добавляйте позиции — шаблон создастся автоматически.'
              }
            />
          ) : (
            <div className="tableScroll">
              <table className={styles.itemsTable}>
                <thead>
                  <tr>
                    <th className={styles.itemNameCell}>Наименование</th>
                    <th className={styles.periodCell}>Периодичность</th>
                    <th className={styles.qtyCell}>Кол-во</th>
                    <th className={styles.actionCell}>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {templateItems.map((item) => (
                    <tr key={item.id}>
                      <td>{item.item_type_name}</td>
                      <td>{item.period_months} мес</td>
                      <td>{item.quantity || 1}</td>
                      <td className={styles.actionCell}>
                        <button
                          className="btn btn-danger action-btn"
                          aria-label="Удалить позицию"
                          data-tooltip="Удалить"
                          onClick={() => handleDeleteItem(item.id)}
                        >
                          <Icon name="trash" size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className={styles.modalActions}>
          <button type="button" className="btn btn-secondary" onClick={handleClose}>
            Отмена
          </button>
          <button type="submit" form="template-form" className="btn">
            {mode === 'edit' ? 'Сохранить' : 'Создать'}
          </button>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        title="Удаление шаблона"
        message="Вы уверены, что хотите удалить этот шаблон норм?"
      />
    </div>
  )
}

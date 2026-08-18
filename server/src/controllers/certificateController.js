import {
  createCertificate,
  getAllCertificates,
  getCertificatesByItemTypeId,
  updateCertificateStatus,
  getCertificateById,
  updateCertificate as updateCertificateModel,
  deleteCertificate as deleteCertificateModel
} from '../models/certificateModel.js';

export async function addCertificate(req, res) {
  try {
    const { product_name, certificate_number, issue_date, expiry_date, file_path, item_type_id } = req.body;
    if (!product_name) {
      return res.status(400).json({ error: 'product_name is required' });
    }
    const certificate = await createCertificate(product_name, certificate_number, issue_date, expiry_date, file_path, item_type_id);
    res.status(201).json(certificate);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function listCertificates(req, res) {
  try {
    await updateCertificateStatus();
    const certificates = await getAllCertificates();
    res.json(certificates);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function getCertificate(req, res) {
  try {
    const certificate = await getCertificateById(req.params.id);
    if (!certificate) return res.status(404).json({ error: 'Certificate not found' });
    res.json(certificate);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function updateCertificate(req, res) {
  try {
    const certificate = await updateCertificateModel(req.params.id, req.body);
    if (!certificate) return res.status(404).json({ error: 'Certificate not found' });
    res.json(certificate);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function deleteCertificate(req, res) {
  try {
    const certificate = await deleteCertificateModel(req.params.id);
    if (!certificate) return res.status(404).json({ error: 'Certificate not found' });
    res.json({ message: 'Certificate deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function listCertificatesByItem(req, res) {
  try {
    const certificates = await getCertificatesByItemTypeId(req.params.itemTypeId);
    res.json(certificates);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

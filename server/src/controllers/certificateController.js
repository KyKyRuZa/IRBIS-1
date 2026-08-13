import {
  createCertificate,
  getAllCertificates,
  getCertificatesByItemTypeId,
  updateCertificateStatus
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

export async function listCertificatesByItem(req, res) {
  try {
    const certificates = await getCertificatesByItemTypeId(req.params.itemTypeId);
    res.json(certificates);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
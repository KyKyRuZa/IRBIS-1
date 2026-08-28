import { childLogger } from '../utils/logger.js';
const log = childLogger('certificate');

import {
  createCertificate,
  getAllCertificates,
  getCertificatesByItemTypeId,
  updateCertificateStatus,
  getCertificateById,
  updateCertificate as updateCertificateModel,
  deleteCertificate as deleteCertificateModel
} from '../models/certificateModel.js';

export async function addCertificate(req, res, next) {
  try {
    const { product_name, certificate_number, issue_date, expiry_date, file_path, item_type_id } = req.body;
    if (!product_name) {
      return res.status(400).json({ error: 'product_name is required' });
    }
    const certificate = await createCertificate(product_name, certificate_number, issue_date, expiry_date, file_path, item_type_id);
    res.status(201).json(certificate);
  } catch (error) {
    log.error(error);
    next(error);
  }
}

export async function listCertificates(req, res, next) {
  try {
    await updateCertificateStatus();
    const certificates = await getAllCertificates();
    res.json(certificates);
  } catch (error) {
    log.error(error);
    next(error);
  }
}

export async function getCertificate(req, res, next) {
  try {
    const certificate = await getCertificateById(req.params.id);
    if (!certificate) return res.status(404).json({ error: 'Certificate not found' });
    res.json(certificate);
  } catch (error) {
    log.error(error);
    next(error);
  }
}

export async function updateCertificate(req, res, next) {
  try {
    const certificate = await updateCertificateModel(req.params.id, req.body);
    if (!certificate) return res.status(404).json({ error: 'Certificate not found' });
    res.json(certificate);
  } catch (error) {
    log.error(error);
    next(error);
  }
}

export async function deleteCertificate(req, res, next) {
  try {
    const certificate = await deleteCertificateModel(req.params.id);
    if (!certificate) return res.status(404).json({ error: 'Certificate not found' });
    res.json({ message: 'Certificate deleted' });
  } catch (error) {
    log.error(error);
    next(error);
  }
}

export async function listCertificatesByItem(req, res, next) {
  try {
    const certificates = await getCertificatesByItemTypeId(req.params.itemTypeId);
    res.json(certificates);
  } catch (error) {
    log.error(error);
    next(error);
  }
}

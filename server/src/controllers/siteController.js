import { createSite, getAllSites, getSiteById, updateSite as updateSiteModel, deleteSite as deleteSiteModel } from '../models/employeeModel.js';

export async function addSite(req, res) {
  try {
    const { name, responsible_person } = req.body;
    if (!name) return res.status(400).json({ error: 'name is required' });
    const site = await createSite(name, responsible_person);
    res.status(201).json(site);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function listSites(req, res) {
  try {
    const sites = await getAllSites();
    res.json(sites);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function getSite(req, res) {
  try {
    const site = await getSiteById(req.params.id);
    if (!site) return res.status(404).json({ error: 'Site not found' });
    res.json(site);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function updateSite(req, res) {
  try {
    const site = await updateSiteModel(req.params.id, req.body);
    if (!site) return res.status(404).json({ error: 'Site not found' });
    res.json(site);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function deleteSite(req, res) {
  try {
    const site = await deleteSiteModel(req.params.id);
    if (!site) return res.status(404).json({ error: 'Site not found' });
    res.json({ message: 'Site deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
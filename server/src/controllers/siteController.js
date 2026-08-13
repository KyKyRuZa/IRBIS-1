import { createSite, getAllSites } from '../models/siteModel.js';

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
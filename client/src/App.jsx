import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import EmployeeList from './pages/EmployeeList.jsx';
import EmployeeCard from './pages/EmployeeCard.jsx';
import ItemCatalog from './pages/ItemCatalog.jsx';
import IssueNorms from './pages/IssueNorms.jsx';
import IssueForm from './pages/IssueForm.jsx';
import Certificates from './pages/Certificates.jsx';
import Reports from './pages/Reports.jsx';
import SitesPage from './pages/SitesPage.jsx';
import './index.css';

export default function App() {
  return (
    <>
      <nav className="navbar">
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link to="/" className="logo">
            <span style={{ fontSize: '28px', fontWeight: 'bold' }}>АЗС ИРБИС</span>
          </Link>
          <div className="nav-links">
            <Link to="/">Сотрудники</Link>
            <Link to="/sites">Объекты</Link>
            <Link to="/items">Номенклатура</Link>
            <Link to="/norms">Нормы выдачи</Link>
            <Link to="/issue">Выдача</Link>
            <Link to="/certificates">Сертификаты</Link>
            <Link to="/reports">Отчёты</Link>
          </div>
        </div>
      </nav>
      <main className="container">
        <Routes>
          <Route path="/" element={<EmployeeList />} />
          <Route path="/sites" element={<SitesPage />} />
          <Route path="/employees/:id" element={<EmployeeCard />} />
          <Route path="/items" element={<ItemCatalog />} />
          <Route path="/norms" element={<IssueNorms />} />
          <Route path="/issue" element={<IssueForm />} />
          <Route path="/certificates" element={<Certificates />} />
          <Route path="/reports" element={<Reports />} />
        </Routes>
      </main>
    </>
  );
}
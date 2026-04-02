import HomePage from '../pages/Home/HomePage.jsx';
import LoginPage from '../pages/Login/LoginPage.jsx';
import UploadCropPage from '../pages/UploadCrop/UploadCropPage.jsx';
import DiagnosisResultPage from '../pages/DiagnosisResult/DiagnosisResultPage.jsx';
import HistoryPage from '../pages/History/HistoryPage.jsx';
import DashboardPage from '../pages/Dashboard/DashboardPage.jsx';
import KnowledgeAdminPage from '../pages/KnowledgeAdmin/KnowledgeAdminPage.jsx';

export const routes = {
  '#/': HomePage,
  '#/login': LoginPage,
  '#/upload-crop': UploadCropPage,
  '#/diagnosis-result': DiagnosisResultPage,
  '#/history': HistoryPage,
  '#/dashboard': DashboardPage,
  '#/knowledge-admin': KnowledgeAdminPage,
};

export const resolveRoute = (hash) => routes[hash] || HomePage;

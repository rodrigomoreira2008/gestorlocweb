import React from 'react';
import ReactDOM from 'react-dom/client';
import { Navigate, RouterProvider, createBrowserRouter } from 'react-router-dom';
import { Layout } from './components/Layout';
import { GrupoParceirosPage } from './pages/GrupoParceirosPage';
import { GrupoProdutosPage } from './pages/GrupoProdutosPage';
import { LocacaoPage } from './pages/LocacaoPage';
import { ParceirosPage } from './pages/ParceirosPage';
import { ProdutosPage } from './pages/ProdutosPage';
import './index.css';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Navigate to="/parceiros" replace /> },
      { path: 'parceiros', element: <ParceirosPage /> },
      { path: 'grupo-parceiros', element: <GrupoParceirosPage /> },
      { path: 'grupo-produtos', element: <GrupoProdutosPage /> },
      { path: 'locacao', element: <LocacaoPage /> },
      { path: 'produtos', element: <ProdutosPage /> }
    ]
  }
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);

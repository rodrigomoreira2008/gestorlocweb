import { NavLink, Outlet } from 'react-router-dom';
import { Building2, ClipboardList, Home, Layers3, Package, ShoppingBag, Users } from 'lucide-react';

export function Layout() {
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold ${
      isActive ? 'bg-blue-600 text-white shadow' : 'text-slate-600 hover:bg-slate-100'
    }`;

  return (
    <div className="min-h-screen lg:flex">
      <aside className="border-b border-slate-200 bg-white p-4 lg:fixed lg:inset-y-0 lg:w-72 lg:border-b-0 lg:border-r">
        <div className="mb-8 flex items-center gap-3">
          <div className="rounded-2xl bg-blue-600 p-3 text-white">
            <Building2 size={24} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">GestorLoc</h1>
            <p className="text-xs text-slate-500">Sistema Web</p>
          </div>
        </div>

        <nav className="grid gap-2">
          <NavLink to="/pedidos" className={linkClass}>
            <ClipboardList size={18} /> Pedidos
          </NavLink>
          <NavLink to="/parceiros" className={linkClass}>
            <Users size={18} /> Parceiros
          </NavLink>
          <NavLink to="/grupo-parceiros" className={linkClass}>
            <Layers3 size={18} /> Grupo Parceiros
          </NavLink>
          <NavLink to="/grupo-produtos" className={linkClass}>
            <Package size={18} /> Grupo Produtos
          </NavLink>
          <NavLink to="/locacao" className={linkClass}>
            <Home size={18} /> Locação
          </NavLink>
          <NavLink to="/produtos" className={linkClass}>
            <ShoppingBag size={18} /> Produtos
          </NavLink>
        </nav>
      </aside>

      <main className="w-full p-4 lg:ml-72 lg:p-8">
        <Outlet />
      </main>
    </div>
  );
}

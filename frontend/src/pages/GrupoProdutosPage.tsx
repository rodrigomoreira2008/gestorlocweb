import { FormEvent, useEffect, useState } from 'react';
import { Edit, Plus, Search, Trash2, X } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { api } from '../services/api';

type GrupoProduto = {
  ID?: number;
  NOME: string;
  STATUS: string;
  CONTROLE: string;
};

const emptyForm: GrupoProduto = { NOME: '', STATUS: 'ATIVO', CONTROLE: '' };

export function GrupoProdutosPage() {
  const [rows, setRows] = useState<GrupoProduto[]>([]);
  const [q, setQ] = useState('');
  const [form, setForm] = useState<GrupoProduto>(emptyForm);
  const [open, setOpen] = useState(false);

  async function load() {
    setRows(await api<GrupoProduto[]>(`/grupo-produtos?q=${encodeURIComponent(q)}`));
  }

  useEffect(() => { load(); }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const method = form.ID ? 'PUT' : 'POST';
    const path = form.ID ? `/grupo-produtos/${form.ID}` : '/grupo-produtos';
    const payload = { NOME: form.NOME, STATUS: form.STATUS };
    await api(path, { method, body: JSON.stringify(payload) });
    setOpen(false);
    setForm(emptyForm);
    await load();
  }

  async function remove(id?: number) {
    if (!id || !confirm('Deseja excluir este grupo?')) return;
    await api(`/grupo-produtos/${id}`, { method: 'DELETE' });
    await load();
  }

  return (
    <>
      <PageHeader title="Grupo Produtos" description="Cadastre e organize grupos de produtos.">
        <button className="btn btn-primary gap-2" onClick={() => { setForm(emptyForm); setOpen(true); }}>
          <Plus size={18} /> Novo Grupo
        </button>
      </PageHeader>

      <div className="card mb-4 p-4">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
            <input className="input pl-10" placeholder="Buscar por nome, status ou controle..." value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <button className="btn btn-light" onClick={load}>Buscar</button>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="p-4">ID</th>
                <th className="p-4">Nome</th>
                <th className="p-4">Status</th>
                <th className="p-4">Controle</th>
                <th className="p-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row) => (
                <tr key={row.ID} className="hover:bg-slate-50">
                  <td className="p-4 font-semibold">{row.ID}</td>
                  <td className="p-4">{row.NOME}</td>
                  <td className="p-4"><span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">{row.STATUS}</span></td>
                  <td className="p-4">{row.CONTROLE}</td>
                  <td className="p-4">
                    <div className="flex justify-end gap-2">
                      <button className="btn btn-light p-2" onClick={() => { setForm(row); setOpen(true); }}><Edit size={16} /></button>
                      <button className="btn btn-danger p-2" onClick={() => remove(row.ID)}><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {!rows.length && <tr><td className="p-6 text-center text-slate-500" colSpan={5}>Nenhum registro encontrado.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4">
          <form onSubmit={submit} className="card w-full max-w-2xl p-6">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-lg font-bold">{form.ID ? 'Editar Grupo' : 'Novo Grupo'}</h3>
              <button type="button" onClick={() => setOpen(false)}><X /></button>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <label>
                <span className="label">Nome</span>
                <input className="input" value={form.NOME || ''} onChange={(e) => setForm({ ...form, NOME: e.target.value })} required />
              </label>
              <label>
                <span className="label">Status</span>
                <select className="input" value={form.STATUS || ''} onChange={(e) => setForm({ ...form, STATUS: e.target.value })}>
                  <option>ATIVO</option>
                  <option>INATIVO</option>
                </select>
              </label>
              <label className="md:col-span-2">
                <span className="label">Controle</span>
                <input className="input bg-slate-100 text-slate-500" value={form.ID ? form.CONTROLE || '' : 'Será gerado automaticamente ao salvar'} readOnly />
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" className="btn btn-light" onClick={() => setOpen(false)}>Cancelar</button>
              <button className="btn btn-primary">Salvar</button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}

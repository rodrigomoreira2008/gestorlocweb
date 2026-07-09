import { FormEvent, useEffect, useState } from 'react';
import { Edit, Plus, Search, Trash2, X } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { api } from '../services/api';

type GrupoParceiro = { ID: number; NOME: string };

type Parceiro = {
  ID?: number;
  TIPO?: string;
  GRUPO?: string | number;
  RAZAOSOCIAL?: string;
  NOMEFANTASIA?: string;
  CPF?: string;
  CNPJ?: string;
  TELEFONE?: string;
  CELULAR?: string;
  EMAIL?: string;
  ENDERECO?: string;
  BAIRRO?: string;
  CIDADE?: string;
  UF?: string;
  CEP?: string;
  STATUS?: string;
  OBSERVACAO?: string;
  GRUPO_NOME?: string;
};

const emptyForm: Parceiro = {
  TIPO: 'CLIENTE',
  STATUS: 'ATIVO',
  RAZAOSOCIAL: '',
  NOMEFANTASIA: '',
  GRUPO: ''
};

export function ParceirosPage() {
  const [rows, setRows] = useState<Parceiro[]>([]);
  const [grupos, setGrupos] = useState<GrupoParceiro[]>([]);
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Parceiro>(emptyForm);

  async function load() {
    setRows(await api<Parceiro[]>(`/parceiros?q=${encodeURIComponent(q)}`));
  }

  async function loadGrupos() {
    setGrupos(await api<GrupoParceiro[]>('/grupo-parceiros'));
  }

  useEffect(() => {
    load();
    loadGrupos();
  }, []);

  function change(field: keyof Parceiro, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    const method = form.ID ? 'PUT' : 'POST';
    const path = form.ID ? `/parceiros/${form.ID}` : '/parceiros';
    await api(path, { method, body: JSON.stringify(form) });
    setOpen(false);
    setForm(emptyForm);
    await load();
  }

  async function remove(id?: number) {
    if (!id || !confirm('Deseja excluir este parceiro?')) return;
    await api(`/parceiros/${id}`, { method: 'DELETE' });
    await load();
  }

  return (
    <>
      <PageHeader title="Parceiros" description="Cadastro, edição e consulta de parceiros.">
        <button className="btn btn-primary gap-2" onClick={() => { setForm(emptyForm); setOpen(true); }}>
          <Plus size={18} /> Novo Parceiro
        </button>
      </PageHeader>

      <div className="card mb-4 p-4">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
            <input className="input pl-10" placeholder="Buscar por razão social, fantasia, CPF, CNPJ ou e-mail..." value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <button className="btn btn-light" onClick={load}>Buscar</button>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="p-4">ID</th>
                <th className="p-4">Razão Social</th>
                <th className="p-4">Fantasia</th>
                <th className="p-4">Grupo</th>
                <th className="p-4">CPF/CNPJ</th>
                <th className="p-4">Contato</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row) => (
                <tr key={row.ID} className="hover:bg-slate-50">
                  <td className="p-4 font-semibold">{row.ID}</td>
                  <td className="p-4">{row.RAZAOSOCIAL}</td>
                  <td className="p-4">{row.NOMEFANTASIA}</td>
                  <td className="p-4">{row.GRUPO_NOME}</td>
                  <td className="p-4">{row.CPF || row.CNPJ}</td>
                  <td className="p-4">{row.CELULAR || row.TELEFONE}</td>
                  <td className="p-4"><span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">{row.STATUS}</span></td>
                  <td className="p-4">
                    <div className="flex justify-end gap-2">
                      <button className="btn btn-light p-2" onClick={() => { setForm(row); setOpen(true); }}><Edit size={16} /></button>
                      <button className="btn btn-danger p-2" onClick={() => remove(row.ID)}><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {!rows.length && <tr><td className="p-6 text-center text-slate-500" colSpan={8}>Nenhum registro encontrado.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 p-4">
          <form onSubmit={submit} className="card mx-auto my-8 w-full max-w-5xl p-6">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-lg font-bold">{form.ID ? 'Editar Parceiro' : 'Novo Parceiro'}</h3>
              <button type="button" onClick={() => setOpen(false)}><X /></button>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <label>
                <span className="label">Tipo</span>
                <select className="input" value={form.TIPO || ''} onChange={(e) => change('TIPO', e.target.value)}>
                  <option>CLIENTE</option>
                  <option>FORNECEDOR</option>
                  <option>AMBOS</option>
                </select>
              </label>
              <label>
                <span className="label">Grupo</span>
                <select className="input" value={form.GRUPO || ''} onChange={(e) => change('GRUPO', e.target.value)}>
                  <option value="">Selecione...</option>
                  {grupos.map((grupo) => <option key={grupo.ID} value={grupo.ID}>{grupo.NOME}</option>)}
                </select>
              </label>
              <label>
                <span className="label">Status</span>
                <select className="input" value={form.STATUS || ''} onChange={(e) => change('STATUS', e.target.value)}>
                  <option>ATIVO</option>
                  <option>INATIVO</option>
                  <option>BLOQUEADO</option>
                </select>
              </label>
              <label className="md:col-span-2">
                <span className="label">Razão Social</span>
                <input className="input" value={form.RAZAOSOCIAL || ''} onChange={(e) => change('RAZAOSOCIAL', e.target.value)} required />
              </label>
              <label>
                <span className="label">Nome Fantasia</span>
                <input className="input" value={form.NOMEFANTASIA || ''} onChange={(e) => change('NOMEFANTASIA', e.target.value)} />
              </label>
              <label>
                <span className="label">CPF</span>
                <input className="input" value={form.CPF || ''} onChange={(e) => change('CPF', e.target.value)} />
              </label>
              <label>
                <span className="label">CNPJ</span>
                <input className="input" value={form.CNPJ || ''} onChange={(e) => change('CNPJ', e.target.value)} />
              </label>
              <label>
                <span className="label">E-mail</span>
                <input className="input" type="email" value={form.EMAIL || ''} onChange={(e) => change('EMAIL', e.target.value)} />
              </label>
              <label>
                <span className="label">Telefone</span>
                <input className="input" value={form.TELEFONE || ''} onChange={(e) => change('TELEFONE', e.target.value)} />
              </label>
              <label>
                <span className="label">Celular</span>
                <input className="input" value={form.CELULAR || ''} onChange={(e) => change('CELULAR', e.target.value)} />
              </label>
              <label className="md:col-span-2">
                <span className="label">Endereço</span>
                <input className="input" value={form.ENDERECO || ''} onChange={(e) => change('ENDERECO', e.target.value)} />
              </label>
              <label>
                <span className="label">Bairro</span>
                <input className="input" value={form.BAIRRO || ''} onChange={(e) => change('BAIRRO', e.target.value)} />
              </label>
              <label>
                <span className="label">Cidade</span>
                <input className="input" value={form.CIDADE || ''} onChange={(e) => change('CIDADE', e.target.value)} />
              </label>
              <label>
                <span className="label">UF</span>
                <input className="input" maxLength={2} value={form.UF || ''} onChange={(e) => change('UF', e.target.value.toUpperCase())} />
              </label>
              <label>
                <span className="label">CEP</span>
                <input className="input" value={form.CEP || ''} onChange={(e) => change('CEP', e.target.value)} />
              </label>
              <label className="md:col-span-3">
                <span className="label">Observação</span>
                <textarea className="input min-h-28" value={form.OBSERVACAO || ''} onChange={(e) => change('OBSERVACAO', e.target.value)} />
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button type="button" className="btn btn-light" onClick={() => setOpen(false)}>Cancelar</button>
              <button className="btn btn-primary">Salvar Parceiro</button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}

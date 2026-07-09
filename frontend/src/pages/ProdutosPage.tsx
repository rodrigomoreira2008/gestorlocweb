import { FormEvent, useEffect, useState } from 'react';
import { Edit, Plus, Search, Trash2, X } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { api } from '../services/api';

type GrupoProduto = { ID: number; NOME: string };
type Locacao = { ID: number; DESCRICAO: string };

type Produto = {
  ID?: number;
  NUMERO?: string;
  DESCRICAO?: string;
  MARCA?: string;
  GRUPO?: number | string | null;
  UNIDADE?: string;
  VALORCOMPRA?: number | string | null;
  VALORESTIMADO?: number | string | null;
  QUANTIDADEREAL?: number | string | null;
  QUANTIDADEESTOQUE?: number | string | null;
  VALORMENSAL?: number | string | null;
  VALORMINIMO?: number | string | null;
  ACESSORIOS?: string;
  PATRIMONIO?: string;
  TIPO?: string;
  NUMEROSERIE?: string;
  TABELADESCONTOMENSAL?: number | string | null;
  TABELADESCONTODIARIO?: number | string | null;
  VALORLIMPEZA?: number | string | null;
  IDPRODUCAO?: number | string | null;
  MOSTRACONTRATO?: string;
  ACESSORIO?: string;
  DESCRICAODETALHADA?: string;
  PRODUCAO?: number | string | null;
  CONTROLE?: string;
  STATUS?: string;
  LOCACAO?: number | string | null;
  LOCACAOANTERIOR?: number | string | null;
  GRUPO_NOME?: string;
  LOCACAO_DESCRICAO?: string;
};

const emptyForm: Produto = {
  NUMERO: '',
  DESCRICAO: '',
  MARCA: '',
  GRUPO: '',
  UNIDADE: 'UNIDADE',
  QUANTIDADEREAL: 0,
  QUANTIDADEESTOQUE: 0,
  MOSTRACONTRATO: 'SIM',
  ACESSORIO: 'NAO',
  LOCACAO: '',
  TIPO: '',
  CONTROLE: ''
};

export function ProdutosPage() {
  const [rows, setRows] = useState<Produto[]>([]);
  const [grupos, setGrupos] = useState<GrupoProduto[]>([]);
  const [locacoes, setLocacoes] = useState<Locacao[]>([]);
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Produto>(emptyForm);

  async function load() {
    setRows(await api<Produto[]>(`/produtos?q=${encodeURIComponent(q)}`));
  }

  async function loadCombos() {
    const [grupoRows, locacaoRows] = await Promise.all([
      api<GrupoProduto[]>('/grupo-produtos'),
      api<Locacao[]>('/locacao')
    ]);
    setGrupos(grupoRows);
    setLocacoes(locacaoRows);
  }

  useEffect(() => {
    load();
    loadCombos();
  }, []);

  function change(field: keyof Produto, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    const method = form.ID ? 'PUT' : 'POST';
    const path = form.ID ? `/produtos/${form.ID}` : '/produtos';
    await api(path, { method, body: JSON.stringify(form) });
    setOpen(false);
    setForm(emptyForm);
    await load();
  }

  async function remove(id?: number) {
    if (!id || !confirm('Deseja excluir este produto?')) return;
    await api(`/produtos/${id}`, { method: 'DELETE' });
    await load();
  }

  return (
    <>
      <PageHeader title="Produtos" description="Cadastre produtos e vincule grupo de produtos e locação.">
        <button className="btn btn-primary gap-2" onClick={() => { setForm(emptyForm); setOpen(true); }}>
          <Plus size={18} /> Novo Produto
        </button>
      </PageHeader>

      <div className="card mb-4 p-4">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
            <input className="input pl-10" placeholder="Buscar por número, descrição, marca, patrimônio, série ou controle..." value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <button className="btn btn-light" onClick={load}>Buscar</button>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1200px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="p-4">ID</th>
                <th className="p-4">Número</th>
                <th className="p-4">Descrição</th>
                <th className="p-4">Grupo</th>
                <th className="p-4">Locação</th>
                <th className="p-4">Unidade</th>
                <th className="p-4">Estoque</th>
                <th className="p-4">Status</th>
                <th className="p-4">Controle</th>
                <th className="p-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row) => (
                <tr key={row.ID} className="hover:bg-slate-50">
                  <td className="p-4 font-semibold">{row.ID}</td>
                  <td className="p-4">{row.NUMERO}</td>
                  <td className="p-4 max-w-xs truncate">{row.DESCRICAO}</td>
                  <td className="p-4">{row.GRUPO_NOME}</td>
                  <td className="p-4">{row.LOCACAO_DESCRICAO}</td>
                  <td className="p-4">{row.UNIDADE}</td>
                  <td className="p-4">{row.QUANTIDADEESTOQUE}</td>
                  <td className="p-4"><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">{row.STATUS}</span></td>
                  <td className="p-4">{row.CONTROLE}</td>
                  <td className="p-4">
                    <div className="flex justify-end gap-2">
                      <button className="btn btn-light p-2" onClick={() => { setForm(row); setOpen(true); }}><Edit size={16} /></button>
                      <button className="btn btn-danger p-2" onClick={() => remove(row.ID)}><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {!rows.length && <tr><td className="p-6 text-center text-slate-500" colSpan={10}>Nenhum registro encontrado.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 p-4">
          <form onSubmit={submit} className="card mx-auto my-8 w-full max-w-6xl p-6">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-lg font-bold">{form.ID ? 'Editar Produto' : 'Novo Produto'}</h3>
              <button type="button" onClick={() => setOpen(false)}><X /></button>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
              <label>
                <span className="label">Número</span>
                <input className="input" value={form.NUMERO || ''} onChange={(e) => change('NUMERO', e.target.value)} />
              </label>
              <label className="md:col-span-2">
                <span className="label">Descrição</span>
                <input className="input" value={form.DESCRICAO || ''} onChange={(e) => change('DESCRICAO', e.target.value)} required />
              </label>
              <label>
                <span className="label">Marca</span>
                <input className="input" value={form.MARCA || ''} onChange={(e) => change('MARCA', e.target.value)} />
              </label>
              <label>
                <span className="label">Grupo</span>
                <select className="input" value={form.GRUPO || ''} onChange={(e) => change('GRUPO', e.target.value)}>
                  <option value="">Selecione...</option>
                  {grupos.map((grupo) => <option key={grupo.ID} value={grupo.ID}>{grupo.NOME}</option>)}
                </select>
              </label>
              <label>
                <span className="label">Locação</span>
                <select className="input" value={form.LOCACAO || ''} onChange={(e) => change('LOCACAO', e.target.value)}>
                  <option value="">Selecione...</option>
                  {locacoes.map((locacao) => <option key={locacao.ID} value={locacao.ID}>{locacao.DESCRICAO}</option>)}
                </select>
              </label>
              <label>
                <span className="label">Unidade</span>
                <select className="input" value={form.UNIDADE || 'UNIDADE'} onChange={(e) => change('UNIDADE', e.target.value)}>
                  <option>UNIDADE</option>
                  <option>METRO</option>
                  <option>CENTIMETRO</option>
                  <option>PACOTE</option>
                </select>
              </label>
              <label>
                <span className="label">Tipo</span>
                <input className="input" value={form.TIPO || ''} onChange={(e) => change('TIPO', e.target.value)} maxLength={6} />
              </label>
              <label>
                <span className="label">Quantidade Real</span>
                <input className="input" type="number" step="0.01" value={form.QUANTIDADEREAL ?? ''} onChange={(e) => change('QUANTIDADEREAL', e.target.value)} />
              </label>
              <label>
                <span className="label">Quantidade Estoque</span>
                <input className="input" type="number" step="0.01" value={form.QUANTIDADEESTOQUE ?? ''} onChange={(e) => change('QUANTIDADEESTOQUE', e.target.value)} />
              </label>
              <label>
                <span className="label">Valor Compra</span>
                <input className="input" type="number" step="0.01" value={form.VALORCOMPRA ?? ''} onChange={(e) => change('VALORCOMPRA', e.target.value)} />
              </label>
              <label>
                <span className="label">Valor Estimado</span>
                <input className="input" type="number" step="0.01" value={form.VALORESTIMADO ?? ''} onChange={(e) => change('VALORESTIMADO', e.target.value)} />
              </label>
              <label>
                <span className="label">Valor Mensal</span>
                <input className="input" type="number" step="0.01" value={form.VALORMENSAL ?? ''} onChange={(e) => change('VALORMENSAL', e.target.value)} />
              </label>
              <label>
                <span className="label">Valor Mínimo</span>
                <input className="input" type="number" step="0.01" value={form.VALORMINIMO ?? ''} onChange={(e) => change('VALORMINIMO', e.target.value)} />
              </label>
              <label>
                <span className="label">Valor Limpeza</span>
                <input className="input" type="number" step="0.01" value={form.VALORLIMPEZA ?? ''} onChange={(e) => change('VALORLIMPEZA', e.target.value)} />
              </label>
              <label>
                <span className="label">Patrimônio</span>
                <input className="input" value={form.PATRIMONIO || ''} onChange={(e) => change('PATRIMONIO', e.target.value)} />
              </label>
              <label>
                <span className="label">Número Série</span>
                <input className="input" value={form.NUMEROSERIE || ''} onChange={(e) => change('NUMEROSERIE', e.target.value)} />
              </label>
              <label>
                <span className="label">Mostra Contrato</span>
                <select className="input" value={form.MOSTRACONTRATO || 'SIM'} onChange={(e) => change('MOSTRACONTRATO', e.target.value)}>
                  <option>SIM</option>
                  <option>NAO</option>
                </select>
              </label>
              <label>
                <span className="label">Acessório?</span>
                <select className="input" value={form.ACESSORIO || 'NAO'} onChange={(e) => change('ACESSORIO', e.target.value)}>
                  <option>SIM</option>
                  <option>NAO</option>
                </select>
              </label>
              <label>
                <span className="label">Status</span>
                <input className="input bg-slate-100 text-slate-500" value={form.STATUS || 'Calculado pelo estoque'} readOnly />
              </label>
              <label>
                <span className="label">Controle</span>
                <input className="input bg-slate-100 text-slate-500" value={form.ID ? form.CONTROLE || '' : 'Será gerado automaticamente ao salvar'} readOnly />
              </label>
              <label className="md:col-span-4">
                <span className="label">Acessórios</span>
                <textarea className="input min-h-24" value={form.ACESSORIOS || ''} onChange={(e) => change('ACESSORIOS', e.target.value)} />
              </label>
              <label className="md:col-span-4">
                <span className="label">Descrição Detalhada</span>
                <textarea className="input min-h-32" value={form.DESCRICAODETALHADA || ''} onChange={(e) => change('DESCRICAODETALHADA', e.target.value)} />
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button type="button" className="btn btn-light" onClick={() => setOpen(false)}>Cancelar</button>
              <button className="btn btn-primary">Salvar Produto</button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}

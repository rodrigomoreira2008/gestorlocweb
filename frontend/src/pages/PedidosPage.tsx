import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Edit, Plus, Search, Trash2, X } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { api } from '../services/api';

type Parceiro = { ID: number; RAZAOSOCIAL?: string; NOMEFANTASIA?: string; ENDERECO?: string; BAIRRO?: string; CIDADE?: string; UF?: string; CEP?: string };
type Produto = { ID: number; DESCRICAO?: string; VALORMINIMO?: number; VALORMENSAL?: number; TIPO?: string };

type ItemPedido = {
  ID?: number;
  PRODUTO?: number | string;
  NOMEPRODUTO?: string;
  QUANTIDADELOCADA?: number | string;
  QUANTIDADEDEVOLVIDA?: number | string;
  VALORDIA?: number | string;
  VALORMES?: number | string;
  VALORMINIMO?: number | string;
  TIPOLOCACAO?: string;
  PERIODO?: number | string;
  VALORDIARIO?: number | string;
  VALORUNITARIO?: number | string;
  VALORCALCULADO?: number | string;
  VALORACRESCIMODESCONTO?: number | string;
  VALORTOTAL?: number | string;
  OBSERVACOES?: string;
};

type Pedido = {
  ID?: number;
  NUMERO?: number;
  STATUS?: string;
  DATALOCACAO?: string;
  HORALOCACAO?: string;
  PERIODO?: number | string;
  DATADEVOLUCAO?: string;
  HORADEVOLUCAO?: string;
  CLIENTE?: number | string;
  ENDERECOINSTALACAO?: string;
  VALORPRODUTOS?: number;
  VALORFRETE?: number | string;
  VALORACRESCIMODESCONTO?: number | string;
  VALORTOTAL?: number;
  OBSERVACOES?: string;
  LOCADO?: string;
  VENDEDOR?: number | string;
  MOTORISTA?: number | string;
  FORMAPAGAMENTO?: string;
  TIPOFATURAMENTO?: string;
  PERCENTUALDESCONTO?: number;
  CONTROLE?: string;
  CLIENTE_NOME?: string;
  ITENS?: ItemPedido[];
};

function today() {
  return new Date().toISOString().slice(0, 10);
}

function timeNow() {
  return new Date().toTimeString().slice(0, 8);
}

function addDays(dateText: string, days: number) {
  const date = new Date(`${dateText}T00:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function diffDays(startText: string, endText: string) {
  const start = new Date(`${startText}T00:00:00`).getTime();
  const end = new Date(`${endText}T00:00:00`).getTime();
  return Math.max(0, Math.round((end - start) / 86400000));
}

function addTwoHours(timeText: string) {
  const date = new Date(`2000-01-01T${timeText || '00:00:00'}`);
  date.setHours(date.getHours() + 2);
  return date.toTimeString().slice(0, 8);
}

function n(value: any) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

const initialForm: Pedido = {
  STATUS: 'ABERTO',
  DATALOCACAO: today(),
  HORALOCACAO: timeNow(),
  PERIODO: 1,
  DATADEVOLUCAO: addDays(today(), 1),
  HORADEVOLUCAO: addTwoHours(timeNow()),
  VALORFRETE: 0,
  VALORACRESCIMODESCONTO: 0,
  VALORPRODUTOS: 0,
  VALORTOTAL: 0,
  LOCADO: 'NAO',
  ITENS: []
};

export function PedidosPage() {
  const [rows, setRows] = useState<Pedido[]>([]);
  const [parceiros, setParceiros] = useState<Parceiro[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Pedido>(initialForm);

  async function load() {
    setRows(await api<Pedido[]>(`/pedidos?q=${encodeURIComponent(q)}`));
  }

  async function loadCombos() {
    const [parceirosRows, produtosRows] = await Promise.all([
      api<Parceiro[]>('/parceiros'),
      api<Produto[]>('/produtos')
    ]);
    setParceiros(parceirosRows);
    setProdutos(produtosRows);
  }

  useEffect(() => {
    load();
    loadCombos();
  }, []);

  const totais = useMemo(() => {
    const valorProdutos = (form.ITENS || []).reduce((sum, item) => sum + n(item.VALORTOTAL), 0);
    const valorTotal = valorProdutos + n(form.VALORFRETE) - n(form.VALORACRESCIMODESCONTO);
    const percentualDesconto = valorProdutos > 0 ? (n(form.VALORACRESCIMODESCONTO) / valorProdutos) * 100 : 0;
    return { valorProdutos, valorTotal, percentualDesconto };
  }, [form.ITENS, form.VALORFRETE, form.VALORACRESCIMODESCONTO]);

  function updateForm(field: keyof Pedido, value: any) {
    setForm((current) => {
      const next = { ...current, [field]: value };
      if (field === 'PERIODO' && next.DATALOCACAO) {
        next.DATADEVOLUCAO = addDays(next.DATALOCACAO, n(value));
        next.ITENS = (next.ITENS || []).map((item) => calcularItem({ ...item, PERIODO: value }));
      }
      if (field === 'DATADEVOLUCAO' && next.DATALOCACAO) {
        next.PERIODO = diffDays(next.DATALOCACAO, value);
        next.ITENS = (next.ITENS || []).map((item) => calcularItem({ ...item, PERIODO: next.PERIODO }));
      }
      if (field === 'HORALOCACAO') next.HORADEVOLUCAO = addTwoHours(value);
      return next;
    });
  }

  function selecionarCliente(id: string) {
    const cliente = parceiros.find((p) => String(p.ID) === id);
    const endereco = cliente ? [cliente.ENDERECO, cliente.BAIRRO, cliente.CIDADE, cliente.UF, cliente.CEP].filter(Boolean).join(', ') : '';
    setForm((current) => ({ ...current, CLIENTE: id, ENDERECOINSTALACAO: endereco }));
  }

  function calcularItem(item: ItemPedido): ItemPedido {
    const periodo = n(item.PERIODO || form.PERIODO);
    const quantidade = n(item.QUANTIDADELOCADA || 1);
    const valorDiario = n(item.VALORDIARIO || item.VALORMINIMO || item.VALORDIA);
    const valorUnitario = valorDiario * periodo;
    const valorCalculado = valorUnitario * quantidade;
    const valorTotal = valorCalculado + n(item.VALORACRESCIMODESCONTO);
    return { ...item, PERIODO: periodo, VALORDIARIO: valorDiario, VALORUNITARIO: valorUnitario, VALORCALCULADO: valorCalculado, VALORTOTAL: valorTotal };
  }

  function adicionarItem() {
    setForm((current) => ({
      ...current,
      ITENS: [...(current.ITENS || []), calcularItem({ QUANTIDADELOCADA: 1, QUANTIDADEDEVOLVIDA: 0, PERIODO: current.PERIODO, VALORACRESCIMODESCONTO: 0 })]
    }));
  }

  function alterarItem(index: number, field: keyof ItemPedido, value: any) {
    setForm((current) => {
      const itens = [...(current.ITENS || [])];
      let item = { ...itens[index], [field]: value };
      if (field === 'PRODUTO') {
        const produto = produtos.find((p) => String(p.ID) === String(value));
        item = {
          ...item,
          NOMEPRODUTO: produto?.DESCRICAO || '',
          VALORDIA: produto?.VALORMINIMO || 0,
          VALORMINIMO: produto?.VALORMINIMO || 0,
          VALORMES: produto?.VALORMENSAL || 0,
          TIPOLOCACAO: produto?.TIPO || '',
          VALORDIARIO: produto?.VALORMINIMO || 0,
          PERIODO: current.PERIODO
        };
      }
      itens[index] = calcularItem(item);
      return { ...current, ITENS: itens };
    });
  }

  function removerItem(index: number) {
    setForm((current) => ({ ...current, ITENS: (current.ITENS || []).filter((_, i) => i !== index) }));
  }

  async function edit(row: Pedido) {
    const full = await api<Pedido>(`/pedidos/${row.ID}`);
    setForm(full);
    setOpen(true);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    const payload = { ...form, VALORPRODUTOS: totais.valorProdutos, VALORTOTAL: totais.valorTotal, PERCENTUALDESCONTO: totais.percentualDesconto };
    const method = form.ID ? 'PUT' : 'POST';
    const path = form.ID ? `/pedidos/${form.ID}` : '/pedidos';
    await api(path, { method, body: JSON.stringify(payload) });
    setOpen(false);
    setForm(initialForm);
    await load();
  }

  async function remove(id?: number) {
    if (!id || !confirm('Deseja excluir este pedido?')) return;
    await api(`/pedidos/${id}`, { method: 'DELETE' });
    await load();
  }

  return (
    <>
      <PageHeader title="Pedidos" description="Cadastro de pedidos com vários itens em modelo mestre-detalhe.">
        <button className="btn btn-primary gap-2" onClick={() => { setForm(initialForm); setOpen(true); }}><Plus size={18} /> Novo Pedido</button>
      </PageHeader>

      <div className="card mb-4 p-4">
        <div className="flex gap-3">
          <div className="relative flex-1"><Search className="absolute left-3 top-2.5 text-slate-400" size={18} /><input className="input pl-10" placeholder="Buscar por número, cliente, status ou controle..." value={q} onChange={(e) => setQ(e.target.value)} /></div>
          <button className="btn btn-light" onClick={load}>Buscar</button>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="p-4">Número</th><th className="p-4">Cliente</th><th className="p-4">Data Locação</th><th className="p-4">Devolução</th><th className="p-4">Status</th><th className="p-4">Total</th><th className="p-4">Controle</th><th className="p-4 text-right">Ações</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row) => <tr key={row.ID} className="hover:bg-slate-50"><td className="p-4 font-semibold">{row.NUMERO}</td><td className="p-4">{row.CLIENTE_NOME}</td><td className="p-4">{row.DATALOCACAO}</td><td className="p-4">{row.DATADEVOLUCAO}</td><td className="p-4"><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">{row.STATUS}</span></td><td className="p-4">R$ {n(row.VALORTOTAL).toFixed(2)}</td><td className="p-4">{row.CONTROLE}</td><td className="p-4"><div className="flex justify-end gap-2"><button className="btn btn-light p-2" onClick={() => edit(row)}><Edit size={16} /></button><button className="btn btn-danger p-2" onClick={() => remove(row.ID)}><Trash2 size={16} /></button></div></td></tr>)}
              {!rows.length && <tr><td className="p-6 text-center text-slate-500" colSpan={8}>Nenhum pedido encontrado.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {open && <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 p-4">
        <form onSubmit={submit} className="card mx-auto my-8 w-full max-w-7xl p-6">
          <div className="mb-5 flex items-center justify-between"><h3 className="text-lg font-bold">{form.ID ? 'Editar Pedido' : 'Novo Pedido'}</h3><button type="button" onClick={() => setOpen(false)}><X /></button></div>
          <div className="grid gap-4 md:grid-cols-4">
            <label><span className="label">Número</span><input className="input bg-slate-100" value={form.NUMERO || 'Automático'} readOnly /></label>
            <label><span className="label">Status</span><input className="input" value={form.STATUS || ''} onChange={(e) => updateForm('STATUS', e.target.value)} /></label>
            <label><span className="label">Data Locação</span><input className="input" type="date" value={form.DATALOCACAO || ''} onChange={(e) => updateForm('DATALOCACAO', e.target.value)} /></label>
            <label><span className="label">Hora Locação</span><input className="input" type="time" value={(form.HORALOCACAO || '').slice(0,5)} onChange={(e) => updateForm('HORALOCACAO', `${e.target.value}:00`)} /></label>
            <label><span className="label">Período</span><input className="input" type="number" value={form.PERIODO || 0} onChange={(e) => updateForm('PERIODO', e.target.value)} /></label>
            <label><span className="label">Data Devolução</span><input className="input" type="date" value={form.DATADEVOLUCAO || ''} onChange={(e) => updateForm('DATADEVOLUCAO', e.target.value)} /></label>
            <label><span className="label">Hora Devolução</span><input className="input bg-slate-100" value={form.HORADEVOLUCAO || ''} readOnly /></label>
            <label><span className="label">Locado</span><select className="input" value={form.LOCADO || 'NAO'} onChange={(e) => updateForm('LOCADO', e.target.value)}><option>SIM</option><option>NAO</option></select></label>
            <label className="md:col-span-2"><span className="label">Cliente</span><select className="input" value={form.CLIENTE || ''} onChange={(e) => selecionarCliente(e.target.value)}><option value="">Selecione...</option>{parceiros.map((p) => <option key={p.ID} value={p.ID}>{p.RAZAOSOCIAL || p.NOMEFANTASIA}</option>)}</select></label>
            <label><span className="label">Vendedor</span><select className="input" value={form.VENDEDOR || ''} onChange={(e) => updateForm('VENDEDOR', e.target.value)}><option value="">Selecione...</option>{parceiros.map((p) => <option key={p.ID} value={p.ID}>{p.RAZAOSOCIAL || p.NOMEFANTASIA}</option>)}</select></label>
            <label><span className="label">Motorista</span><select className="input" value={form.MOTORISTA || ''} onChange={(e) => updateForm('MOTORISTA', e.target.value)}><option value="">Selecione...</option>{parceiros.map((p) => <option key={p.ID} value={p.ID}>{p.RAZAOSOCIAL || p.NOMEFANTASIA}</option>)}</select></label>
            <label className="md:col-span-4"><span className="label">Endereço Instalação</span><input className="input" value={form.ENDERECOINSTALACAO || ''} onChange={(e) => updateForm('ENDERECOINSTALACAO', e.target.value)} /></label>
          </div>

          <div className="mt-6 rounded-2xl border border-slate-200 p-4">
            <div className="mb-4 flex items-center justify-between"><h4 className="font-bold">Itens do Pedido</h4><button type="button" className="btn btn-light" onClick={adicionarItem}>Adicionar Item</button></div>
            <div className="overflow-x-auto"><table className="w-full min-w-[1200px] text-sm"><thead className="text-xs uppercase text-slate-500"><tr><th className="p-2">Produto</th><th className="p-2">Qtd</th><th className="p-2">Devolvida</th><th className="p-2">Período</th><th className="p-2">Vlr Diário</th><th className="p-2">Unitário</th><th className="p-2">Calculado</th><th className="p-2">Acr/Desc</th><th className="p-2">Total</th><th></th></tr></thead><tbody>
              {(form.ITENS || []).map((item, index) => <tr key={index}><td className="p-2"><select className="input" value={item.PRODUTO || ''} onChange={(e) => alterarItem(index, 'PRODUTO', e.target.value)}><option value="">Selecione...</option>{produtos.map((p) => <option key={p.ID} value={p.ID}>{p.DESCRICAO}</option>)}</select></td><td className="p-2"><input className="input" type="number" step="0.01" value={item.QUANTIDADELOCADA || ''} onChange={(e) => alterarItem(index, 'QUANTIDADELOCADA', e.target.value)} /></td><td className="p-2"><input className="input" type="number" step="0.01" value={item.QUANTIDADEDEVOLVIDA || 0} onChange={(e) => alterarItem(index, 'QUANTIDADEDEVOLVIDA', e.target.value)} /></td><td className="p-2"><input className="input bg-slate-100" value={item.PERIODO || form.PERIODO || 0} readOnly /></td><td className="p-2"><input className="input" type="number" step="0.01" value={item.VALORDIARIO || 0} onChange={(e) => alterarItem(index, 'VALORDIARIO', e.target.value)} /></td><td className="p-2"><input className="input bg-slate-100" value={n(item.VALORUNITARIO).toFixed(2)} readOnly /></td><td className="p-2"><input className="input bg-slate-100" value={n(item.VALORCALCULADO).toFixed(2)} readOnly /></td><td className="p-2"><input className="input" type="number" step="0.01" value={item.VALORACRESCIMODESCONTO || 0} onChange={(e) => alterarItem(index, 'VALORACRESCIMODESCONTO', e.target.value)} /></td><td className="p-2"><input className="input bg-slate-100" value={n(item.VALORTOTAL).toFixed(2)} readOnly /></td><td className="p-2"><button type="button" className="btn btn-danger p-2" onClick={() => removerItem(index)}><Trash2 size={16} /></button></td></tr>)}
            </tbody></table></div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-4">
            <label><span className="label">Valor Produtos</span><input className="input bg-slate-100" value={totais.valorProdutos.toFixed(2)} readOnly /></label>
            <label><span className="label">Valor Frete</span><input className="input" type="number" step="0.01" value={form.VALORFRETE || 0} onChange={(e) => updateForm('VALORFRETE', e.target.value)} /></label>
            <label><span className="label">Acréscimo/Desconto</span><input className="input" type="number" step="0.01" value={form.VALORACRESCIMODESCONTO || 0} onChange={(e) => updateForm('VALORACRESCIMODESCONTO', e.target.value)} /></label>
            <label><span className="label">Valor Total</span><input className="input bg-slate-100" value={totais.valorTotal.toFixed(2)} readOnly /></label>
            <label><span className="label">% Desconto</span><input className="input bg-slate-100" value={totais.percentualDesconto.toFixed(2)} readOnly /></label>
            <label className="md:col-span-3"><span className="label">Forma Pagamento</span><input className="input" value={form.FORMAPAGAMENTO || ''} onChange={(e) => updateForm('FORMAPAGAMENTO', e.target.value)} /></label>
            <label className="md:col-span-4"><span className="label">Observações</span><textarea className="input min-h-24" value={form.OBSERVACOES || ''} onChange={(e) => updateForm('OBSERVACOES', e.target.value)} /></label>
          </div>

          <div className="mt-6 flex justify-end gap-3"><button type="button" className="btn btn-light" onClick={() => setOpen(false)}>Cancelar</button><button className="btn btn-primary">Salvar Pedido</button></div>
        </form>
      </div>}
    </>
  );
}

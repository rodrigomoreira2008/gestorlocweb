function gerarControle(prefixo: string) {
  const agora = new Date();
  const ano = String(agora.getFullYear()).slice(-2);
  const mes = String(agora.getMonth() + 1).padStart(2, '0');
  const dia = String(agora.getDate()).padStart(2, '0');
  const hora = String(agora.getHours()).padStart(2, '0');
  const minuto = String(agora.getMinutes()).padStart(2, '0');
  const segundo = String(agora.getSeconds()).padStart(2, '0');
  const milesimo = String(agora.getMilliseconds()).padStart(3, '0');
  const aleatorio = Math.floor(Math.random() * 10000).toString().padStart(4, '0');

  return `${prefixo}${ano}${mes}${dia}${hora}${minuto}${segundo}${milesimo}${aleatorio}`;
}

export function gerarControleGrupoParceiro() {
  return gerarControle('GP');
}

export function gerarControleGrupoProduto() {
  return gerarControle('GPR');
}

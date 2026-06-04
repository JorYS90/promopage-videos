import { useEffect, useRef, useState } from 'react';
import Topbar from './components/Topbar.jsx';
import VideoQuotaBadge from './components/VideoQuotaBadge.jsx';
import { useAuth } from './auth/useAuth.js';
import IconBar from './components/IconBar.jsx';
import Canvas from './components/Canvas.jsx';
import { PanelProdutos, PanelTemas, PanelLogo, PanelEmpresa, PanelTextos, PanelRegras, PanelGerar, PanelMeusVideos } from './panels.jsx';
import ModalEditarProdutos from './components/ModalEditarProdutos.jsx';
import ModalCriarTema from './components/ModalCriarTema.jsx';
import ModalConfirmarGerar from './components/ModalConfirmarGerar.jsx';
// Modais locais de Recursos/Atendimento removidos — abrem direto no PromoPage.
import { getTemplates, getTemas, getMusicas, getVozes, uploadImagem, criarVideo, getVideo, getVideoQuota, buscarImagens, excluirTema, getFavoritos, addFavorito, removeFavorito, listarProjetos, criarProjeto, atualizarProjeto, excluirProjeto as excluirProjetoApi } from './api.js';
import { parsearLista } from './parse-lista.js';
import { removerFundo } from './remover-fundo.js';

function produtoVazio() {
  return { nome: '', preco: '', precoDe: '', unidade: '', imagem: '', info: '', fundoRemovido: false, maioresDe18: false };
}

export default function App() {
  // Auth compartilhada com PromoPage (via cookie cross-subdomain em prod,
  // limitado a cada porta em dev). user=null quando deslogado, objeto quando logado.
  const auth = useAuth();
  const [meta, setMeta] = useState(null);
  const [temas, setTemas] = useState([]);
  const [musicas, setMusicas] = useState([]);
  const [vozes, setVozes] = useState([]);
  const [temaSelecionado, setTemaSelecionado] = useState(null);
  const [secao, setSecao] = useState('produtos');
  // Cota mensal de vídeos do plano do user. Atualizada após cada geração
  // e no mount (quando user faz login). null = ainda não consultado.
  const [videoQuota, setVideoQuota] = useState(null);

  // Atualiza a cota quando user muda (login/logout) e ao montar
  useEffect(() => {
    if (!auth.user) { setVideoQuota(null); return; }
    let vivo = true;
    getVideoQuota().then(q => { if (vivo) setVideoQuota(q); });
    return () => { vivo = false; };
  }, [auth.user?.id]);

  const recarregarCota = () => {
    if (!auth.user) return;
    getVideoQuota().then(q => setVideoQuota(q));
  };

  const [formato, setFormato] = useState('vertical');
  const [empresa, setEmpresa] = useState({ nome: '', logo: '', logoFundo: 'transparente', endereco: '', telefone: '', site: '', whatsapp: '', instagram: '', horario: '', dias: '' });
  const [produtos, setProdutos] = useState([produtoVazio(), produtoVazio(), produtoVazio()]);
  // narracao começa DESLIGADA durante o refino do vídeo (economiza crédito do ElevenLabs).
  // Religar é só voltar pra true aqui (ou marcar o toggle no painel Textos).
  const [textos, setTextos] = useState({ cta: '', periodo: '', introTexto: '', finalTexto: '', usarIA: true, narracao: false, trilha: '', sfx: true, vozId: '' });
  const [regras, setRegras] = useState(() => {
    const hoje = new Date();
    const fim = new Date(); fim.setDate(fim.getDate() + 7);
    const iso = (d) => d.toISOString().slice(0, 10);
    return {
      dataInicio: iso(hoje), dataFinal: iso(fim),
      mostrarDatas: true,
      enquantoEstoque: false,
      imagensIlustrativas: true,
      advertenciaMedicamento: false,
      mostrarFrase: false,
      frasePromocional: '',
    };
  });

  const [cena, setCena] = useState('produto-0');
  const [job, setJob] = useState(null);
  const [erro, setErro] = useState('');
  const [fotoProcessando, setFotoProcessando] = useState(null);
  const [buscandoFotos, setBuscandoFotos] = useState(false);
  const [editorAberto, setEditorAberto] = useState(false);
  const [criarTemaAberto, setCriarTemaAberto] = useState(false);
  const [confirmarAberto, setConfirmarAberto] = useState(false);
  const [painelAberto, setPainelAberto] = useState(true);
  // URL do PromoPage — usada pra abrir "Recursos e Planos" e "Atendimento" lá
  // (única fonte da verdade pros dois apps — sem duplicar conteúdo).
  const URL_PROMOPAGE = import.meta.env.PROD ? 'https://promopage.com.br' : 'http://localhost:5173';
  // Modo admin: derivado do user logado (super_admin pode criar/editar/excluir
  // temas — afeta TODOS os clientes; admin comum não tem essa permissão).
  // Override de debug via ?admin=1 na URL (só funciona em dev — backend valida).
  const debugAdmin = (() => {
    try {
      const p = new URLSearchParams(window.location.search);
      if (p.get('admin') === '1') localStorage.setItem('pp_admin', '1');
      if (p.get('admin') === '0') localStorage.removeItem('pp_admin');
      return localStorage.getItem('pp_admin') === '1';
    } catch { return false; }
  })();
  // isAdmin no PromoVideo = super_admin OU override de debug (dev only).
  // Em prod o backend rejeita qualquer chamada de criar/editar/excluir tema
  // que não venha de um super_admin REAL — o override só esconde a UI, não
  // burla validação. (Backend usa requireSuperAdmin nos endpoints de tema.)
  const isAdmin = !!auth.user?.isSuperAdmin || debugAdmin;
  const [temaEditando, setTemaEditando] = useState(null);
  // Favoritos de tema (por usuário, do PromoPage). Recarrega quando o user muda.
  const [favoritos, setFavoritos] = useState(new Set());
  // Projetos por usuário (inputs salvos). projetoAtualId vincula o estado da tela
  // a um projeto pra UPDATE em vez de CREATE quando o user "salvar".
  const [projetos, setProjetos] = useState([]);
  const [projetoAtualId, setProjetoAtualId] = useState(null);
  const pollRef = useRef(null);

  useEffect(() => {
    Promise.all([
      getTemplates(),
      getTemas(),
      getMusicas().catch(() => ({ trilhas: [] })),
      getVozes().catch(() => ({ vozes: [] })),
    ])
      .then(([m, t, mus, vz]) => {
        setMeta(m); setTemas(t.temas); setTemaSelecionado(t.temas[0]);
        setMusicas(mus.trilhas || []); setVozes(vz.vozes || []);
      })
      .catch((e) => setErro(e.message));
    return () => clearInterval(pollRef.current);
  }, []);

  // Carrega favoritos + projetos do user quando o login muda. Hooks SEMPRE antes
  // de qualquer return condicional pra não quebrar a regra dos hooks do React.
  useEffect(() => {
    if (!auth.user) { setFavoritos(new Set()); setProjetos([]); setProjetoAtualId(null); return; }
    getFavoritos().then((d) => setFavoritos(new Set(d.favoritos || []))).catch(() => {});
    listarProjetos().then((d) => setProjetos(d.projetos || [])).catch(() => {});
  }, [auth.user]);

  if (!meta || !temaSelecionado) {
    return (<><Topbar /><div style={{ padding: 30 }}>Carregando…{erro && <div className="erro-box">{erro}</div>}</div></>);
  }

  const { minProdutos, maxProdutos } = meta.limites;
  const segmento = temaSelecionado.segmento || 'supermercado';

  function setProduto(i, patch) { setProdutos((arr) => arr.map((p, idx) => (idx === i ? { ...p, ...patch } : p))); }
  function addProduto() { if (produtos.length < maxProdutos) setProdutos((a) => [...a, produtoVazio()]); }
  function removerProduto(i) {
    setProdutos((a) => (a.length <= 1 ? a : a.filter((_, idx) => idx !== i)));
    setCena('produto-0');
  }
  function removerTodos() { setProdutos([produtoVazio()]); setCena('produto-0'); setEditorAberto(false); }
  function reordenarProdutos(de, para) {
    setProdutos((a) => { const copia = [...a]; const [m] = copia.splice(de, 1); copia.splice(para, 0, m); return copia; });
  }
  function adicionarLista(texto) {
    const parsed = parsearLista(texto);
    if (parsed.length === 0) { setErro('Não consegui identificar produtos na lista.'); return 0; }
    let novos = parsed;
    if (novos.length > maxProdutos) { alert(`Máximo ${maxProdutos} produtos por vídeo — usando os primeiros ${maxProdutos}.`); novos = novos.slice(0, maxProdutos); }
    setProdutos(novos);
    setCena('produto-0');
    buscarFotosLote(novos.map((p) => p.nome));
    return novos.length;
  }

  // Remove o fundo automaticamente (chroma key — instantâneo, sem IA pra não travar).
  // Fundo não-uniforme → mantém a original (usuário pode forçar IA no botão).
  async function autoFundo(url) {
    try {
      const blob = await removerFundo(url, { pularIA: true });
      if (!blob) return { url, removido: false };
      const file = new File([blob], 'sem-fundo.png', { type: 'image/png' });
      const { url: nova } = await uploadImagem(file, 'produto');
      return { url: nova, removido: true };
    } catch { return { url, removido: false }; }
  }

  async function buscarFotosLote(nomes) {
    setBuscandoFotos(true);
    setErro('');
    try {
      const { resultados } = await buscarImagens(nomes);
      const proc = await Promise.all(resultados.map((r) => (r && r.imagem ? autoFundo(r.imagem) : null)));
      setProdutos((prev) => prev.map((p, i) => {
        const af = proc[i];
        if (af && p.nome === nomes[i] && !p.imagem) return { ...p, imagem: af.url, fundoRemovido: af.removido };
        return p;
      }));
    } catch (e) { setErro('Busca de imagens falhou: ' + e.message); }
    finally { setBuscandoFotos(false); }
  }

  async function buscarFotoProduto(idx) {
    const nome = produtos[idx]?.nome;
    if (!nome) return;
    setFotoProcessando(idx);
    setErro('');
    try {
      const { resultados } = await buscarImagens([nome]);
      const r = resultados[0];
      if (r && r.imagem) {
        const af = await autoFundo(r.imagem);
        setProduto(idx, { imagem: af.url, fundoRemovido: af.removido });
      } else setErro('Nenhuma imagem encontrada pra "' + nome + '".');
    } catch (e) { setErro('Busca falhou: ' + e.message); }
    finally { setFotoProcessando(null); }
  }

  async function onUpload(file, aplica, tipo) {
    if (!file) return;
    setErro('');
    try { const { url } = await uploadImagem(file, tipo); aplica(url); }
    catch (e) { setErro(e.message); }
  }

  // Upload do balão de preço: sobe e detecta a área branca interna (pro preço encaixar).
  async function onUploadBalao(file, aplica) {
    if (!file) return;
    setErro('');
    try { const { url, area } = await uploadImagem(file, 'balao'); aplica(url, area); }
    catch (e) { setErro(e.message); }
  }

  // Upload de camada decorativa: sobe e REMOVE O FUNDO (vira PNG recortado).
  async function onUploadCamada(file, aplica) {
    if (!file) return;
    setErro('');
    try {
      const { url } = await uploadImagem(file, 'fundo');
      const af = await autoFundo(url);
      aplica(af.url);
    } catch (e) { setErro(e.message); }
  }

  async function aoSalvarTema(salvo) {
    // salvo = tema retornado pelo POST/PUT /api/temas
    const r = await getTemas();
    setTemas(r.temas);
    const sel = r.temas.find((t) => t.id === salvo.id) || salvo;
    selecionarTema(sel);
    setCriarTemaAberto(false);
    setTemaEditando(null);
    setSecao('temas');
  }
  function abrirCriarTema() { setTemaEditando(null); setCriarTemaAberto(true); }
  function editarTema(t) { setTemaEditando(t); setCriarTemaAberto(true); }
  async function removerTema(t) {
    if (!confirm(`Excluir o tema "${t.nome}"? Essa ação não pode ser desfeita.`)) return;
    try {
      await excluirTema(t.id);
      const r = await getTemas();
      setTemas(r.temas);
      if (temaSelecionado.id === t.id) selecionarTema(r.temas[0]);
    } catch (e) { setErro(e.message); }
  }

  const produtosValidos = produtos.filter((p) => p.nome.trim() && p.preco.trim());
  const podeGerar = empresa.nome.trim().length > 0 && produtosValidos.length >= minProdutos;
  const gerando = job && (job.status === 'queued' || job.status === 'processing');

  // Abre a janela de revisão (ou leva pra seção Gerar se faltam dados).
  function pedirConfirmacao() {
    if (!podeGerar) { setSecao('gerar'); return; }
    setConfirmarAberto(true);
  }

  async function gerar() {
    setConfirmarAberto(false);
    if (!podeGerar) { setSecao('gerar'); return; }
    setErro('');
    const payload = {
      formato, segmento, templateId: temaSelecionado.id, tema: temaSelecionado,
      empresa: {
        nome: empresa.nome.trim(), logo: empresa.logo || '', logoFundo: empresa.logoFundo || 'transparente',
        endereco: empresa.endereco?.trim() || undefined,
        telefone: empresa.telefone?.trim() || undefined,
        site: empresa.site?.trim() || undefined,
        whatsapp: empresa.whatsapp?.trim() || undefined,
        instagram: empresa.instagram?.trim() || undefined,
        horario: empresa.horario?.trim() || undefined,
        dias: empresa.dias?.trim() || undefined,
      },
      produtos: produtosValidos.map((p) => ({
        nome: p.nome.trim(), preco: p.preco.trim(),
        precoDe: p.precoDe.trim() || undefined, unidade: p.unidade.trim() || undefined,
        imagem: p.imagem || undefined, info: p.info.trim() || undefined,
      })),
      cta: textos.cta.trim() || undefined, periodo: textos.periodo.trim() || undefined,
      introTexto: textos.introTexto.trim() || undefined, finalTexto: textos.finalTexto.trim() || undefined,
      usarIA: textos.usarIA, narracao: textos.narracao, trilha: textos.trilha || undefined, sfx: textos.sfx,
      vozId: textos.vozId || undefined,
      regras,
    };
    try {
      const criado = await criarVideo(payload);
      setJob(criado);
      setSecao('gerar');
      iniciarPolling(criado.id);
      recarregarCota(); // backend incrementou — atualiza badge "X/30"
    } catch (e) {
      // Erro de cota → mensagem clara + CTA pro upgrade
      if (e.code === 'QUOTA_EXCEEDED') {
        const { limite, usado } = e.cota || {};
        setErro(`Você já usou ${usado}/${limite} vídeos este mês. Faça upgrade pra "Ilimitado + 100 Vídeos" ou aguarde o próximo mês.`);
        recarregarCota();
      } else if (e.code === 'NO_PLAN') {
        setErro('Seu plano não inclui o PromoVideo. Assine "Ilimitado + 30 Vídeos" ou "+100 Vídeos" no PromoPage.');
      } else {
        setErro(e.message);
      }
    }
  }

  function iniciarPolling(id) {
    clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const j = await getVideo(id); setJob(j);
        if (j.status === 'done' || j.status === 'error') clearInterval(pollRef.current);
      } catch { /* tenta de novo */ }
    }, 1500);
  }

  function reset() { clearInterval(pollRef.current); setJob(null); setSecao('produtos'); }

  // ======== Projetos por usuário ========
  // Empacota o estado atual do user num "payload" salvável.
  function montarPayload() {
    return {
      formato, segmento, temaId: temaSelecionado?.id || '',
      empresa, produtos, textos, regras, cena,
    };
  }

  // Salvar: se já tem projetoAtualId → UPDATE; senão → CREATE (pede nome).
  async function salvarProjeto() {
    if (!auth.user) { alert('Faça login no PromoPage pra salvar seus projetos.'); return; }
    try {
      const payload = montarPayload();
      if (projetoAtualId) {
        const { projeto } = await atualizarProjeto(projetoAtualId, { payload });
        setProjetos((arr) => arr.map((p) => (p.id === projeto.id ? projeto : p)));
      } else {
        const nome = prompt('Nome do projeto:', empresa.nome || 'Meu vídeo');
        if (nome == null) return;
        const { projeto } = await criarProjeto(nome, payload);
        setProjetos((arr) => [projeto, ...arr]);
        setProjetoAtualId(projeto.id);
      }
    } catch (e) { setErro(e.message); }
  }

  // Carregar: aplica todo o payload do projeto no estado da tela.
  function carregarProjeto(p) {
    if (!p?.payload) return;
    const pl = p.payload;
    if (pl.formato) setFormato(pl.formato);
    if (pl.empresa) setEmpresa(pl.empresa);
    if (pl.produtos) setProdutos(pl.produtos);
    if (pl.textos) setTextos(pl.textos);
    if (pl.regras) setRegras(pl.regras);
    if (pl.cena) setCena(pl.cena);
    if (pl.temaId) {
      const t = temas.find((x) => x.id === pl.temaId);
      if (t) selecionarTema(t);
    }
    setProjetoAtualId(p.id);
    setJob(null);
    setSecao('produtos');
  }

  // Excluir projeto da conta do user.
  async function removerProjeto(p) {
    if (!confirm(`Excluir o projeto "${p.nome}"?`)) return;
    try {
      await excluirProjetoApi(p.id);
      setProjetos((arr) => arr.filter((x) => x.id !== p.id));
      if (projetoAtualId === p.id) setProjetoAtualId(null);
    } catch (e) { setErro(e.message); }
  }

  // Começar um projeto novo (limpa o vínculo; mantém o estado atual pra o user
  // partir de onde está ou começar do zero).
  function novoProjeto() {
    setProjetoAtualId(null);
  }

  // Liga/desliga favorito (atualiza UI na hora; reverte se o servidor recusar).
  async function toggleFavorito(temaId) {
    if (!auth.user) { alert('Faça login no PromoPage pra salvar favoritos.'); return; }
    const jaEra = favoritos.has(temaId);
    const novoSet = new Set(favoritos);
    if (jaEra) novoSet.delete(temaId); else novoSet.add(temaId);
    setFavoritos(novoSet);
    try {
      if (jaEra) await removeFavorito(temaId); else await addFavorito(temaId);
    } catch (e) {
      console.warn('[favoritos] falhou:', e.message);
      setFavoritos(favoritos); // reverte
    }
  }

  // Ao escolher um tema por imagem, se o formato atual não tem fundo, troca pro
  // primeiro formato que tiver — assim a prévia mostra o tema na hora.
  function selecionarTema(t) {
    setTemaSelecionado(t);
    if (t?.tipo === 'imagem' && t.backgrounds) {
      const temBg = (f) => { const b = t.backgrounds[f] || {}; return !!(b.intro || b.produtos || b.ctaFim); };
      if (!temBg(formato)) {
        const alt = ['vertical', 'horizontal', 'quadrado'].find(temBg);
        if (alt) setFormato(alt);
      }
    }
  }

  const ctx = {
    meta, limites: meta.limites,
    formato, setFormato,
    temas, temaSelecionado, setTema: selecionarTema, abrirCriarTema, editarTema, removerTema,
    empresa, setEmpresa,
    produtos, setProduto, addProduto, removerProduto,
    adicionarLista, abrirEditor: () => setEditorAberto(true),
    textos, setTextos, musicas, vozes,
    regras, setRegras,
    cena, setCena, setSecao,
    onUpload, onUploadCamada, fotoProcessando,
    buscarFotoProduto, buscandoFotos,
    gerar: pedirConfirmacao, job, podeGerar, reset,
    isAdmin,
    user: auth.user,
    favoritos, toggleFavorito,
    projetos, projetoAtualId, salvarProjeto, carregarProjeto, removerProjeto, novoProjeto,
  };

  const PAINEIS = {
    meusvideos: PanelMeusVideos,
    produtos: PanelProdutos, temas: PanelTemas,
    logo: PanelLogo, empresa: PanelEmpresa, textos: PanelTextos, regras: PanelRegras, gerar: PanelGerar,
  };
  const Painel = PAINEIS[secao] || PanelProdutos;

  return (
    <div className={`app ${painelAberto ? '' : 'painel-fechado'}`}>
      <Topbar
        aoRecursos={() => window.open(`${URL_PROMOPAGE}/?abrir=planos#recursos-e-planos`, '_blank', 'noopener')}
        aoAtendimento={() => window.open(`${URL_PROMOPAGE}/?abrir=atendimento#central-atendimento`, '_blank', 'noopener')}
        aoHome={reset}
        user={auth.user}
        loading={auth.loading}
        aoEntrar={auth.abrirLoginPromoPage}
        aoLogout={auth.logout}
      />
      <VideoQuotaBadge
        quota={videoQuota}
        user={auth.user}
        aoUpgrade={() => window.open(`${URL_PROMOPAGE}/?abrir=planos#recursos-e-planos`, '_blank', 'noopener')}
      />
      <IconBar ativa={secao} aoMudar={(s) => { setSecao(s); setPainelAberto(true); }} />
      <div className="painel-conteudo">
        <Painel ctx={ctx} />
        {erro && <div className="erro-box">{erro}</div>}
      </div>
      <button
        className="painel-toggle"
        onClick={() => setPainelAberto((v) => !v)}
        title={painelAberto ? 'Recolher painel' : 'Abrir painel'}
      >
        {painelAberto ? '‹' : '›'}
      </button>
      <div className="canvas-col">
        <div className="formato-barra">
          <label>Formato do vídeo</label>
          <select value={formato} onChange={(e) => setFormato(e.target.value)}>
            {meta.formatos.map((f) => (
              <option key={f.id} value={f.id}>{f.nome} — {f.w}×{f.h}</option>
            ))}
          </select>
        </div>
        <Canvas
          formato={formato}
          tema={temaSelecionado}
          empresa={empresa}
          produtos={produtos}
          textos={textos}
          regras={regras}
          cena={cena}
          setCena={setCena}
          job={job}
          aoGerar={pedirConfirmacao}
          podeGerar={podeGerar}
          gerando={gerando}
        />
      </div>

      {editorAberto && (
        <ModalEditarProdutos
          produtos={produtos}
          maxProdutos={maxProdutos}
          aoMudar={(idx, novo) => setProdutos((arr) => arr.map((p, i) => (i === idx ? novo : p)))}
          aoAdicionar={addProduto}
          aoRemover={removerProduto}
          aoRemoverTodos={removerTodos}
          aoReordenar={reordenarProdutos}
          aoBuscarImagem={buscarFotoProduto}
          buscandoIdx={fotoProcessando}
          aoFechar={() => setEditorAberto(false)}
        />
      )}

      {/* Modais locais de Recursos/Atendimento removidos — agora abrem direto
          no PromoPage (fonte única da verdade). Mantive os arquivos ModaisInfo.jsx
          caso queiramos voltar a usá-los como fallback offline. */}

      {confirmarAberto && (
        <ModalConfirmarGerar
          formato={formato}
          tema={temaSelecionado}
          empresa={empresa}
          produtos={produtosValidos}
          textos={textos}
          regras={regras}
          aoConfirmar={gerar}
          aoFechar={() => setConfirmarAberto(false)}
        />
      )}

      {criarTemaAberto && (
        <ModalCriarTema
          temaEditando={temaEditando}
          empresa={empresa}
          onUpload={onUpload}
          onUploadCamada={onUploadCamada}
          onUploadBalao={onUploadBalao}
          aoSalvar={aoSalvarTema}
          aoFechar={() => { setCriarTemaAberto(false); setTemaEditando(null); }}
        />
      )}
    </div>
  );
}

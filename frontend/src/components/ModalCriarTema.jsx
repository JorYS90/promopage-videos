import { useState } from 'react';
import { criarTema, atualizarTema } from '../api.js';
import PosicaoEditor from './PosicaoEditor.jsx';
import { FASES_LAYOUT } from '../layout-padrao.js';

const FONTES = ['Anton', 'Bebas Neue', 'Barlow Condensed'];
const SEGMENTOS = [
  { id: 'supermercado', estilo: 'energetico', nome: 'Supermercado (energético)' },
  { id: 'farmacia', estilo: 'suave', nome: 'Farmácia (clean)' },
  { id: 'adega', estilo: 'premium', nome: 'Adega (premium)' },
  { id: 'petshop', estilo: 'divertido', nome: 'Petshop (divertido)' },
  { id: 'perfumaria', estilo: 'luxuoso', nome: 'Perfumaria (luxo)' },
];
const FORMATOS_TEMA = [
  { id: 'vertical', nome: 'Vertical', rec: '1080×1920', ratio: '9 / 16' },
  { id: 'horizontal', nome: 'Horizontal', rec: '1920×1080', ratio: '16 / 9' },
  { id: 'quadrado', nome: 'Quadrado', rec: '1080×1080', ratio: '1 / 1' },
];
const FASES = [
  ['intro', '1 · Intro', 'Abertura'],
  ['produtos', '2 · Produtos', 'Fundo das cenas de produto'],
  ['cta', '3 · CTA', 'Chamada pra ação'],
  ['ctaFim', '4 · Encerramento', 'Card final (logo + dados da loja)'],
];
const vazio = () => ({ intro: '', produtos: '', cta: '', ctaFim: '' });
const vazioCamadas = () => ({ esq: { img: '', anim: 'flutuar' }, dir: { img: '', anim: 'flutuar' }, icones: { img: '', anim: 'parallax' } });
const ANIMS = [['flutuar', 'Flutuar'], ['deslizar', 'Deslizar na entrada'], ['parallax', 'Parallax'], ['balancar', 'Balançar'], ['pulsar', 'Pulsar'], ['nenhum', 'Parado']];
const SLOTS_CAMADA = [['esq', 'Elemento esquerdo', 'ex: carrinho'], ['dir', 'Elemento direito', 'ex: cesta'], ['icones', 'Ícones flutuantes', 'ex: ícones']];

function ColorField({ label, value, onChange }) {
  return (
    <div className="cor-field">
      <label>{label}</label>
      <div className="cor-row">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} />
        <input type="text" value={value} onChange={(e) => onChange(e.target.value)} />
      </div>
    </div>
  );
}

function UploadBox({ label, dica, url, aoEnviar, aoRemover, ratio = '3 / 1' }) {
  return (
    <div className="upload-box">
      <div className="upload-tit">{label}</div>
      <div className="upload-dica">{dica}</div>
      <label className="upload-area" style={{ aspectRatio: ratio }}>
        {url ? <img src={url} alt="" /> : <span className="upload-cta">📎 Escolher arquivo</span>}
        <input type="file" accept="image/*" hidden onChange={(e) => aoEnviar(e.target.files[0])} />
      </label>
      {url && aoRemover && (
        <button type="button" className="upload-remover" onClick={(e) => { e.stopPropagation(); aoRemover(); }} title="Remover esta imagem">🗑 Remover</button>
      )}
    </div>
  );
}

export default function ModalCriarTema({ temaEditando, empresa, onUpload, onUploadCamada, onUploadBalao, aoSalvar, aoFechar }) {
  const ed = temaEditando || {};
  const editando = !!temaEditando;
  const [nome, setNome] = useState(ed.nome || '');
  const [categoria, setCategoria] = useState(ed.categoria || 'Meus Temas');
  const [segmento, setSegmento] = useState(ed.segmento || 'supermercado');
  const [bg, setBg] = useState({
    vertical: { ...vazio(), ...(ed.backgrounds?.vertical || {}) },
    horizontal: { ...vazio(), ...(ed.backgrounds?.horizontal || {}) },
    quadrado: { ...vazio(), ...(ed.backgrounds?.quadrado || {}) },
  });
  const [formatoTab, setFormatoTab] = useState('vertical');
  const [balaoPreco, setBalaoPreco] = useState(ed.balaoPreco || '');
  const [balaoArea, setBalaoArea] = useState(ed.balaoTextoArea || null);
  const [precoAnim, setPrecoAnim] = useState(ed.precoAnim || 'flutuar');
  const [precoTransparente, setPrecoTransparente] = useState(!!ed.precoTransparente);
  const [efeitoLuzes, setEfeitoLuzes] = useState(!!ed.efeitoLuzes);
  const [fontes, setFontes] = useState({
    fontTitulo: ed.fontTitulo || 'Anton', fontPreco: ed.fontPreco || 'Anton', fontTexto: ed.fontTexto || 'Barlow Condensed',
  });
  const [cores, setCores] = useState({
    pilulaPreco: ed.pilulaPreco || '#fde047', textoPreco: ed.textoPreco || '#7f1d1d', textoForte: ed.textoForte || '#ffffff',
    textoSuave: ed.textoSuave || '#fee2e2', destaque: ed.destaque || '#fde047', ctaFundo: ed.ctaFundo || '#fde047', ctaTexto: ed.ctaTexto || '#7f1d1d',
    introTextoCor: ed.introTextoCor || ed.textoForte || '#ffffff',
    rodapeCor: ed.rodapeCor || '#1e3a8a',
    rodapeFiletCor: ed.rodapeFiletCor || '#e11d2a',
  });
  const [layout, setLayout] = useState(ed.layout || {});
  const [camadas, setCamadas] = useState({
    vertical: { ...vazioCamadas(), ...(ed.camadas?.vertical || {}) },
    horizontal: { ...vazioCamadas(), ...(ed.camadas?.horizontal || {}) },
    quadrado: { ...vazioCamadas(), ...(ed.camadas?.quadrado || {}) },
  });
  const setCamada = (fmt, slot, patch) =>
    setCamadas((c) => ({ ...c, [fmt]: { ...c[fmt], [slot]: { ...c[fmt][slot], ...patch } } }));
  const [faseTab, setFaseTab] = useState('produto');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  const setCor = (k, v) => setCores((c) => ({ ...c, [k]: v }));
  const setBgFor = (fmt, fase, url) => setBg((b) => ({ ...b, [fmt]: { ...b[fmt], [fase]: url } }));
  const filledCount = (fmt) => Object.values(bg[fmt]).filter(Boolean).length;
  const ativo = FORMATOS_TEMA.find((f) => f.id === formatoTab);
  const faseBg = FASES_LAYOUT.find((f) => f.id === faseTab)?.bg || 'produtos';

  async function salvar() {
    if (!nome.trim()) { setErro('Dê um nome ao tema.'); return; }
    setErro('');
    setSalvando(true);
    try {
      const estilo = SEGMENTOS.find((s) => s.id === segmento)?.estilo || 'energetico';
      const payload = {
        nome: nome.trim(), categoria: categoria.trim() || 'Meus Temas', segmento, estilo,
        backgrounds: bg, balaoPreco, balaoTextoArea: balaoArea, precoAnim, precoTransparente, efeitoLuzes, layout, camadas,
        ...fontes, ...cores,
      };
      const tema = editando ? await atualizarTema(temaEditando.id, payload) : await criarTema(payload);
      aoSalvar(tema);
    } catch (e) {
      setErro(e.message);
      setSalvando(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={aoFechar}>
      <div className="modal-editar" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>{editando ? '✏️ Editar Tema' : '+ Criar Tema'}</h2>
            <div className="sub">Envie 3 fundos (Intro, Produtos, CTA/Fim) para CADA formato. Ao escolher o tema + formato, o sistema puxa o fundo certo e encaixa os produtos por cima.</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn" onClick={aoFechar}>Cancelar</button>
            <button className="btn-concluir" disabled={salvando} onClick={salvar}>{salvando ? 'Salvando…' : (editando ? '💾 Salvar alterações' : '💾 Salvar Tema')}</button>
          </div>
        </div>

        {erro && <div className="erro-box" style={{ margin: '0 0 12px' }}>{erro}</div>}

        <div className="linha" style={{ marginBottom: 18 }}>
          <div className="campo" style={{ marginBottom: 0 }}>
            <label>Nome do tema *</label>
            <input type="text" value={nome} placeholder="Ex: Black Friday Outubro" onChange={(e) => setNome(e.target.value)} />
          </div>
          <div className="campo" style={{ marginBottom: 0 }}>
            <label>Segmento (define o ritmo da animação)</label>
            <select value={segmento} onChange={(e) => setSegmento(e.target.value)}>
              {SEGMENTOS.map((s) => <option key={s.id} value={s.id}>{s.nome}</option>)}
            </select>
          </div>
        </div>
        <div className="campo">
          <label>Categoria</label>
          <input type="text" value={categoria} onChange={(e) => setCategoria(e.target.value)} />
        </div>

        <h3 className="secao-form">🖼️ Backgrounds — 3 por formato</h3>
        <div className="tabs">
          {FORMATOS_TEMA.map((f) => (
            <button key={f.id} className={`tab ${formatoTab === f.id ? 'active' : ''}`} onClick={() => setFormatoTab(f.id)}>
              {f.nome} <span className="tab-count">{filledCount(f.id)}/3</span>
            </button>
          ))}
        </div>
        <p className="ajuda">Formato <b>{ativo.nome}</b> · recomendado <b>{ativo.rec}px</b> (o sistema corta em modo cover).</p>
        <div className="upload-grid">
          {FASES.map(([fase, label, dica]) => (
            <UploadBox
              key={fase}
              label={label}
              dica={dica}
              ratio={ativo.ratio}
              url={bg[formatoTab][fase]}
              aoEnviar={(file) => onUpload(file, (url) => setBgFor(formatoTab, fase, url), 'fundo')}
              aoRemover={() => setBgFor(formatoTab, fase, '')}
            />
          ))}
        </div>

        <h3 className="secao-form">🧩 Camadas decorativas da intro (opcional)</h3>
        <p className="ajuda" style={{ marginTop: -6 }}>
          Elementos soltos (PNG) que entram <b>por cima do fundo</b> da intro, com movimento. O fundo é
          removido automaticamente no upload. Use o fundo <b>sólido</b> (sem carrinho/cesta) e suba esses
          aqui. Formato <b>{ativo.nome}</b>.
        </p>
        <div className="upload-grid">
          {SLOTS_CAMADA.map(([slot, label, dica]) => (
            <div key={slot}>
              <UploadBox
                label={label}
                dica={dica}
                ratio="1 / 1"
                url={camadas[formatoTab][slot].img}
                aoEnviar={(file) => onUploadCamada(file, (url) => setCamada(formatoTab, slot, { img: url }))}
                aoRemover={() => setCamada(formatoTab, slot, { img: '' })}
              />
              <select
                value={camadas[formatoTab][slot].anim}
                onChange={(e) => setCamada(formatoTab, slot, { anim: e.target.value })}
                style={{ width: '100%', marginTop: 6 }}
              >
                {ANIMS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
          ))}
        </div>

        <h3 className="secao-form">📐 Posições (opcional)</h3>
        <p className="ajuda" style={{ marginTop: -6 }}>
          Arraste cada caixa pra posicionar, e use a alça do canto pra redimensionar — sobre o background do
          formato <b>{ativo.nome}</b>. O que você não mover continua na posição automática.
        </p>
        <div className="tabs" style={{ maxWidth: 420 }}>
          {FASES_LAYOUT.map((f) => (
            <button key={f.id} className={`tab ${faseTab === f.id ? 'active' : ''}`} onClick={() => setFaseTab(f.id)}>{f.label}</button>
          ))}
        </div>
        <PosicaoEditor
          formato={formatoTab}
          fase={faseTab}
          background={bg[formatoTab][faseBg]}
          logoUrl={empresa?.logo}
          layout={layout}
          setLayout={setLayout}
        />

        <h3 className="secao-form">💰 Balão de preço (opcional)</h3>
        <div className="campo" style={{ marginBottom: 8 }}>
          <label className="toggle">
            <input type="checkbox" checked={precoTransparente} onChange={(e) => setPrecoTransparente(e.target.checked)} />
            Preço sem fundo (transparente) — só o texto
          </label>
          <div className="dica" style={{ fontSize: 12, marginTop: 2 }}>Ligue quando o fundo do tema já tiver o painel/área do preço (ex.: Fecha Mês). O preço aparece só como texto, sem balão nem pílula.</div>
        </div>
        {!precoTransparente && (
          <>
            <p className="ajuda" style={{ marginTop: -2 }}>PNG transparente SEM texto — só a forma. O sistema escreve "R$ X,XX" por cima. Rec.: 600×150 (4:1). Vazio = usa a pílula de cor. (Serve pra todos os formatos.)</p>
            <div style={{ maxWidth: 320 }}>
              <UploadBox label="Forma do balão" dica="PNG transparente, sem texto" ratio="4 / 1" url={balaoPreco} aoEnviar={(f) => onUploadBalao(f, (url, area) => { setBalaoPreco(url); if (area) setBalaoArea(area); })} aoRemover={() => { setBalaoPreco(''); setBalaoArea(null); }} />
              {balaoArea && <div className="dica" style={{ fontSize: 12, marginTop: 4 }}>✓ Área interna do balão detectada — o preço encaixa dentro automaticamente.</div>}
              <div className="campo" style={{ marginTop: 8 }}>
                <label>Movimento do balão de preço</label>
                <select value={precoAnim} onChange={(e) => setPrecoAnim(e.target.value)}>
                  {ANIMS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
            </div>
          </>
        )}

        <h3 className="secao-form">🎬 Efeitos do fundo</h3>
        <div className="campo" style={{ marginBottom: 0 }}>
          <label className="toggle">
            <input type="checkbox" checked={efeitoLuzes} onChange={(e) => setEfeitoLuzes(e.target.checked)} />
            Pulsação de luzes (brilho/saturação oscilam suavemente)
          </label>
          <div className="dica" style={{ fontSize: 12, marginTop: 2 }}>Ideal pra temas com luzes/neon (hamburgueria, cenas noturnas). Deixe desligado em fundos planos pra não chamar atenção indesejada.</div>
        </div>

        <h3 className="secao-form">🔤 Fontes</h3>
        <div className="linha-3">
          {[['fontTitulo', 'Título / nomes'], ['fontPreco', 'Preço'], ['fontTexto', 'Texto']].map(([k, lbl]) => (
            <div className="campo" key={k} style={{ marginBottom: 0 }}>
              <label>{lbl}</label>
              <select value={fontes[k]} onChange={(e) => setFontes((f) => ({ ...f, [k]: e.target.value }))}>
                {FONTES.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
          ))}
        </div>

        <h3 className="secao-form">🎨 Cores</h3>
        <div className="cores-grid">
          <ColorField label="Fundo da tag de preço" value={cores.pilulaPreco} onChange={(v) => setCor('pilulaPreco', v)} />
          <ColorField label="Cor do preço" value={cores.textoPreco} onChange={(v) => setCor('textoPreco', v)} />
          <ColorField label="Cor do nome" value={cores.textoForte} onChange={(v) => setCor('textoForte', v)} />
          <ColorField label="Cor da fonte da intro" value={cores.introTextoCor} onChange={(v) => setCor('introTextoCor', v)} />
          <ColorField label="Cor de destaque" value={cores.destaque} onChange={(v) => setCor('destaque', v)} />
          <ColorField label="Fundo do botão CTA" value={cores.ctaFundo} onChange={(v) => setCor('ctaFundo', v)} />
          <ColorField label="Texto do CTA" value={cores.ctaTexto} onChange={(v) => setCor('ctaTexto', v)} />
          <ColorField label="Cor do rodapé (avisos)" value={cores.rodapeCor} onChange={(v) => setCor('rodapeCor', v)} />
          <ColorField label="Filete do rodapé" value={cores.rodapeFiletCor} onChange={(v) => setCor('rodapeFiletCor', v)} />
        </div>
      </div>
    </div>
  );
}

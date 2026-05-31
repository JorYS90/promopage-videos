// Modal de revisão antes de gerar o vídeo. Mostra TUDO que o usuário digitou
// pra ele conferir ortografia/dados — depois de gerar, o texto fica "queimado"
// no vídeo e não dá pra editar.

const fmtData = (iso) => {
  if (!iso) return '';
  const [, m, d] = iso.split('-');
  return d && m ? `${d}/${m}` : iso;
};

function Linha({ rotulo, valor }) {
  if (!valor) return null;
  return (
    <div className="cg-linha">
      <span className="cg-rot">{rotulo}</span>
      <span className="cg-val">{valor}</span>
    </div>
  );
}

function Bloco({ titulo, children }) {
  return (
    <div className="cg-bloco">
      <h3 className="cg-bloco-tit">{titulo}</h3>
      {children}
    </div>
  );
}

export default function ModalConfirmarGerar({ formato, tema, empresa, produtos, textos, regras, aoConfirmar, aoFechar }) {
  const formatoLabel = { vertical: 'Vertical (Stories/Reels)', horizontal: 'Horizontal (YouTube/TV)', quadrado: 'Quadrado (Feed)' }[formato] || formato;
  const audioPartes = [
    textos?.trilha ? 'Trilha sonora' : 'Sem trilha',
    textos?.sfx !== false ? 'Efeitos (whoosh/pop)' : 'Sem efeitos',
    textos?.narracao ? 'Narração (locutor)' : 'Sem narração',
  ];
  const periodoData = regras?.mostrarDatas && regras?.dataInicio && regras?.dataFinal
    ? `Válido de ${fmtData(regras.dataInicio)} a ${fmtData(regras.dataFinal)}`
    : '';

  return (
    <div className="modal-overlay" onClick={aoFechar}>
      <div className="modal-editar cg-modal" onClick={(e) => e.stopPropagation()}>
        <div className="cg-aviso">
          <span className="cg-aviso-ico">⚠️</span>
          <div>
            <b>ATENÇÃO — confira tudo antes de gerar!</b>
            <p>Revise a <b>ortografia</b> de todas as palavras (nomes, preços, textos). Depois que o vídeo for gerado, os textos ficam fixos na imagem e <b>não dá pra editar</b> — só gerando de novo.</p>
          </div>
        </div>

        <div className="cg-corpo">
          <Bloco titulo="Vídeo">
            <Linha rotulo="Formato" valor={formatoLabel} />
            <Linha rotulo="Tema" valor={tema?.nome} />
            <Linha rotulo="Produtos" valor={`${produtos.length} produto(s)`} />
          </Bloco>

          <Bloco titulo="Loja">
            <Linha rotulo="Nome" valor={empresa?.nome} />
            <Linha rotulo="Endereço" valor={empresa?.endereco} />
            <Linha rotulo="Telefone" valor={empresa?.telefone} />
            <Linha rotulo="WhatsApp" valor={empresa?.whatsapp} />
            <Linha rotulo="Instagram" valor={empresa?.instagram} />
            <Linha rotulo="Site" valor={empresa?.site} />
            <Linha rotulo="Dias" valor={empresa?.dias} />
            <Linha rotulo="Horário" valor={empresa?.horario} />
          </Bloco>

          <Bloco titulo="Textos">
            <Linha rotulo="Abertura" valor={textos?.introTexto} />
            <Linha rotulo="Chamada (CTA)" valor={textos?.cta} />
            <Linha rotulo="Validade" valor={textos?.periodo} />
            <Linha rotulo="Encerramento" valor={textos?.finalTexto} />
          </Bloco>

          <Bloco titulo="Produtos">
            <table className="cg-tabela">
              <thead>
                <tr><th>#</th><th>Nome</th><th>De</th><th>Por</th><th>Un.</th><th>Obs.</th></tr>
              </thead>
              <tbody>
                {produtos.map((p, i) => (
                  <tr key={i}>
                    <td>{i + 1}</td>
                    <td>{p.nome}</td>
                    <td>{p.precoDe || '—'}</td>
                    <td><b>{p.preco}</b></td>
                    <td>{p.unidade || '—'}</td>
                    <td>{p.info || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Bloco>

          {(periodoData || regras?.enquantoEstoque || regras?.imagensIlustrativas || regras?.advertenciaMedicamento || (regras?.mostrarFrase && regras?.frasePromocional)) && (
            <Bloco titulo="Regras / Avisos">
              <Linha rotulo="Datas" valor={periodoData} />
              <Linha rotulo="Estoque" valor={regras?.enquantoEstoque ? 'Enquanto durarem os estoques' : ''} />
              <Linha rotulo="Imagens" valor={regras?.imagensIlustrativas ? 'Imagens meramente ilustrativas' : ''} />
              <Linha rotulo="Medicamento" valor={regras?.advertenciaMedicamento ? 'Advertência de medicamento' : ''} />
              <Linha rotulo="Frase" valor={regras?.mostrarFrase ? regras?.frasePromocional : ''} />
            </Bloco>
          )}

          <Bloco titulo="Áudio">
            <Linha rotulo="Trilha/Efeitos" valor={audioPartes.join(' · ')} />
          </Bloco>
        </div>

        <div className="cg-acoes">
          <button className="btn" onClick={aoFechar}>← Voltar e revisar</button>
          <button className="btn btn-primary" onClick={aoConfirmar}>Está tudo certo, gerar vídeo 🎬</button>
        </div>
      </div>
    </div>
  );
}

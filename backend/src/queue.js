// Fila in-process com limite de concorrência. Interface mínima (enqueue) pensada
// pra ser trocada por BullMQ no futuro sem mexer em quem chama:
//   queue.enqueue(() => render(job))   // retorna Promise que resolve no fim
const { RENDER_CONCURRENCY } = require('./config');

let ativos = 0;
const fila = [];

function bombear() {
  while (ativos < RENDER_CONCURRENCY && fila.length > 0) {
    const { tarefa, resolve, reject } = fila.shift();
    ativos++;
    Promise.resolve()
      .then(tarefa)
      .then(resolve, reject)
      .finally(() => {
        ativos--;
        bombear();
      });
  }
}

function enqueue(tarefa) {
  return new Promise((resolve, reject) => {
    fila.push({ tarefa, resolve, reject });
    bombear();
  });
}

function status() {
  return { ativos, naFila: fila.length, concorrencia: RENDER_CONCURRENCY };
}

module.exports = { enqueue, status };

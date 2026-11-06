import http from "node:http";
import https from "node:https";

const URL_BASE = process.env.OLLAMA_URL ?? "http://localhost:11434";
const MODELO = process.env.OLLAMA_MODELO ?? "gemma4:e4b-it-qat";

function postJson(url, corpo) {
  const destino = new URL(url);
  const cliente = destino.protocol === "https:" ? https : http;
  const dados = JSON.stringify(corpo);

  return new Promise((resolve, reject) => {
    const req = cliente.request(
      destino,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(dados),
        },
      },
      (res) => {
        let texto = "";
        res.setEncoding("utf8");
        res.on("data", (parte) => (texto += parte));
        res.on("end", () => {
          if (res.statusCode !== 200) {
            reject(new Error(`HTTP ${res.statusCode}: ${texto}`));
            return;
          }
          try {
            resolve(JSON.parse(texto));
          } catch (erro) {
            reject(erro);
          }
        });
      },
    );
    req.on("error", reject);
    req.end(dados);
  });
}

function gerar(prompt, pensar) {
  return postJson(`${URL_BASE}/api/generate`, {
    model: MODELO,
    prompt,
    stream: false,
    think: pensar,
    options: { num_predict: 400 },
  });
}

function taxa(tokens, duracaoNs) {
  return duracaoNs ? tokens / (duracaoNs / 1e9) : 0;
}

const testes = [
  ["curto, sem pensar", 20, false],
  ["curto, pensando", 20, true],
  ["prompt médio", 500, false],
  ["prompt grande", 2000, false],
];

for (const [nome, itens, pensar] of testes) {
  const lista = Array.from({ length: itens }, (_, i) => `item${i}`).join(" ");
  const prompt = `[${Date.now()}] Diga em uma frase quantos itens tem esta lista: ${lista}`;
  const r = await gerar(prompt, pensar);

  const promptTokens = r.prompt_eval_count ?? 0;
  console.log(
    `${nome.padEnd(18)}` +
      ` | prompt ${String(promptTokens).padStart(5)} tok a ${taxa(promptTokens, r.prompt_eval_duration).toFixed(1).padStart(6)} tok/s` +
      ` | geração ${String(r.eval_count).padStart(4)} tok a ${taxa(r.eval_count, r.eval_duration).toFixed(1).padStart(5)} tok/s` +
      ` | carga ${(r.load_duration / 1e9).toFixed(1).padStart(5)}s` +
      ` | total ${(r.total_duration / 1e9).toFixed(1).padStart(6)}s`,
  );
}

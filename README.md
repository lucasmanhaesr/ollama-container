# Ollama em container

## Requisitos:
* Docker

## build e run

Executar container a partir da imagem
```bash
docker compose up -d
```

Abrir shell no container e baixar o modelo recomendado
```bash
docker exec -it ollama ollama pull gemma4:e4b-it-qat
```

Verificar se está rodando
```bash
curl http://127.0.0.1:11434/api/generate -d '{"model":"gemma4:e4b-it-qat","prompt":"Olá","stream":false}'
```

Na sua máquina local utilize um tunel usando sua chave SSH para não precisar liberar portas do servidor para acesso externo
```bash
ssh -N -L 11435:127.0.0.1:11434 USUARIO@IP_DO_SERVIDOR
```
configuar o hermes ou qualquer assistente/agente de sua escolha, para utilizar seu modelo em: `~/.hermes/config.yaml`
```yml
model:
  default: "gemma4:e4b-it-qat"
  provider: "custom"
  base_url: "http://localhost:11435/v1"
```
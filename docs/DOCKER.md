# Inicialização da aplicação (Docker)

Procedimento completo para subir o sistema em qualquer máquina.

## Pré-requisito

- **Docker** instalado e rodando:
  - **Windows/Mac**: Docker Desktop (docker.com; no Windows habilita WSL2 durante a instalação)
  - **Linux (Ubuntu 24.04 testado)**: Docker Engine pelo repositório oficial — roteiro completo na seção [Instalação em Linux](#instalação-em-linux-ubuntu-2404) abaixo

Nada mais é necessário — sem Python, sem Node.

## 1. Clonar o repositório

```powershell
git clone https://github.com/juarezbamberg-source/escalas.git
cd escalas
```

> **Linux**: clone no home (`~/escalas`), nunca em `/tmp` — o `/tmp` é apagado a cada reinício da distro/máquina.
```

## 2. Criar o arquivo `.env` na raiz

O `.env` não vai no git. Criar na raiz do projeto com o conteúdo mínimo:

```
DATABASE_URL=sqlite:////data/escalas.db
SECRET_KEY=troque-esta-chave-em-producao-com-no-minimo-32-bytes!
ADMIN_USERNAME=admin
ADMIN_SENHA_INICIAL=TroqueEstaSenha123
ADMIN_NOME=Administrador
```

- `ADMIN_SENHA_INICIAL` é a senha temporária do admin — troca obrigatória no primeiro login.
- `SECRET_KEY` deve ser trocada por um valor aleatório próprio (mín. 32 caracteres).

## 3. Subir os containers

```powershell
docker compose up --build -d
```

Na primeira execução as imagens são construídas (~2–3 min). O backend aplica as migrações do banco, cria o admin e sobe a API; o frontend é buildado e servido pelo Nginx.

## 4. Acessar

- **Sistema: http://localhost:8080** (login: `admin` / senha do `.env`)
- API direta: http://localhost:8000/docs

## Verificar se está tudo no ar

```powershell
docker compose ps
```

Ambos os containers (`escalas-backend`, `escalas-frontend`) devem aparecer `Up`.

```powershell
docker compose logs backend
```

Deve mostrar, nesta ordem: migrações (0001→0006), `[seed] Super admin criado`, `Uvicorn running`.

## Comandos do dia a dia

| Ação | Comando |
|---|---|
| Parar | `docker compose down` |
| Iniciar de novo (sem rebuild) | `docker compose up -d` |
| Atualizar o código | `git pull` e depois `docker compose up --build -d` |
| Ver logs em tempo real | `docker compose logs -f backend` |
| Resetar banco (apaga dados) | `docker compose down -v` |

## Backup do banco

O único estado do sistema é o banco SQLite no volume `escalas_data`.

```powershell
# Backup
docker compose exec backend cat /data/escalas.db > backup-escalas.db

# Restaurar em outra máquina (com os containers parados)
docker compose down
docker volume create websiteescalas_escalas_data
docker run --rm -v websiteescalas_escalas_data:/data -v ${PWD}:/backup alpine cp /backup/escalas.db /data/escalas.db
docker compose up -d
```

## Portas usadas

- **8080** — frontend (Nginx)
- **8000** — backend (API)

Se outra aplicação na máquina usar a 8000, pare-a antes de subir (ou edite o mapeamento no `docker-compose.yml`).

---

# Instalação em Linux (Ubuntu 24.04)

Roteiro testado ponta a ponta em Ubuntu 24.04.4 LTS limpo (sem Docker, sem Python, sem nada) — do zero ao sistema no ar. Serve para qualquer Ubuntu 22.04/24.04 e derivados Debian.

## Fase 0 — Verificação do ambiente

```bash
cat /etc/os-release        # deve mostrar Ubuntu 24.04 (noble)
whoami                     # anote o usuário (não deve ser root)
```

## Fase 1 — Instalar o Docker Engine (repositório oficial)

### 1.1 Pré-requisitos e chave GPG

```bash
sudo apt update
sudo apt install -y ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
```

### 1.2 Adicionar o repositório do Docker

```bash
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] \
  https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
```

### 1.3 Instalar

```bash
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

### 1.4 Rodar o Docker sem sudo

```bash
sudo usermod -aG docker $USER
newgrp docker          # aplica o grupo na sessão atual (ou feche e reabra o terminal)
```

### 1.5 Verificar

```bash
docker run hello-world     # deve baixar e rodar
docker compose version     # deve mostrar a versão do plugin
```

> **WSL**: se o daemon não subir sozinho, inicie com `sudo service docker start`
> e verifique com `sudo service docker status`. Em servidor/WSL2 com systemd
> habilitado (`/etc/wsl.conf` com `[boot] systemd=true`), o serviço sobe sozinho.

## Fase 2 — Obter o código

```bash
sudo apt install -y git
git clone https://github.com/juarezbamberg-source/escalas.git
cd escalas
```

## Fase 3 — Criar o `.env`

```bash
cat > .env <<'EOF'
DATABASE_URL=sqlite:////data/escalas.db
SECRET_KEY=troque-esta-chave-em-producao-com-no-minimo-32-bytes!
ADMIN_USERNAME=admin
ADMIN_SENHA_INICIAL=TroqueEstaSenha123
ADMIN_NOME=Administrador
EOF
chmod 600 .env
```

> Troque `SECRET_KEY` por um valor aleatório próprio (mín. 32 caracteres) e
> `ADMIN_SENHA_INICIAL` pela senha temporária desejada.

## Fase 4 — Subir a aplicação

```bash
docker compose up --build -d
```

Primeira execução: build das 2 imagens (~1–5 min, dependendo da rede).

## Fase 5 — Verificar

```bash
docker compose ps              # escalas-backend e escalas-frontend "Up"
docker compose logs backend    # ordem esperada:
                               #   [entrypoint] Aplicando migracoes...
                               #   Running upgrade -> 0001 ... 0005 -> 0006
                               #   [seed] Super admin criado: admin
                               #   Uvicorn running on http://0.0.0.0:8000
docker compose logs frontend   # nginx pronto
```

## Fase 6 — Acessar

- **Sistema: http://localhost:8080** — login `admin` / senha do `.env` (troca obrigatória no 1º acesso)
- API direta: http://localhost:8000/docs

> **WSL2 no Windows**: `localhost` funciona do navegador Windows direto para o
> serviço dentro da distro (localhost forwarding padrão). Se não funcionar, pegue
> o IP da distro com `hostname -I` e use `http://<IP>:8080`.

## Fase 7 — Portas ocupadas (se aplicável)

```bash
sudo ss -tlnp | grep -E ':8000|:8080'
```

Resolva parando o serviço conflitante ou editando o mapeamento no `docker-compose.yml`.

## Checklist final

- [ ] `docker run hello-world` OK
- [ ] `docker compose ps` mostra 2 containers Up
- [ ] Logs do backend mostram migrações + seed + uvicorn
- [ ] Login em http://localhost:8080 funciona
- [ ] Troca de senha no primeiro acesso feita


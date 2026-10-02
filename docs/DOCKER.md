# Inicialização da aplicação (Docker)

Procedimento completo para subir o sistema em qualquer máquina.

## Pré-requisito

- **Docker Desktop** instalado e rodando (Windows/Mac: docker.com; no Windows habilita WSL2 durante a instalação; Linux: `docker` + plugin `docker compose`).

Nada mais é necessário — sem Python, sem Node.

## 1. Clonar o repositório

```powershell
git clone https://github.com/juarezbamberg-source/escalas.git
cd escalas
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

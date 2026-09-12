"""Testes da fundação da Onda 5: usuarios, funcoes e senhas."""

from app.core.security import criar_token_acesso, gerar_hash_senha, verificar_senha
from app.db.session import get_db
from app.models import Funcao, Usuario


def test_hash_de_senha_nao_expoe_texto_e_verifica() -> None:
    senha = "Senha-temporaria-123!"
    senha_hash = gerar_hash_senha(senha)

    assert senha_hash != senha
    assert senha_hash.startswith("$2")
    assert verificar_senha(senha, senha_hash)
    assert not verificar_senha("senha-incorreta", senha_hash)


def test_modelo_usuario_tem_funcao_e_campos_de_controle() -> None:
    usuario = Usuario(
        nome="Admin",
        username="admin",
        senha_hash="hash",
        funcao=Funcao.ADMIN,
    )

    assert usuario.funcao is Funcao.ADMIN
    assert usuario.ativo is None  # defaults são aplicados no INSERT
    assert usuario.trocar_senha_no_proximo_acesso is None
    assert usuario.professor_id is None


def _criar_usuario(client, username="admin", senha="Senha-123!") -> None:
    from app.db.session import get_db

    db = next(client.app.dependency_overrides[get_db]())
    try:
        db.add(
            Usuario(
                nome="Administrador",
                username=username,
                senha_hash=gerar_hash_senha(senha),
                funcao=Funcao.ADMIN,
                ativo=True,
            )
        )
        db.commit()
    finally:
        db.close()


def test_login_local_emite_token_com_funcao(client) -> None:
    _criar_usuario(client)

    response = client.post("/auth/login", json={"username": "admin", "senha": "Senha-123!"})

    assert response.status_code == 200, response.text
    assert response.json()["access_token"]


def test_login_local_rejeita_senha_invalida_e_usuario_inativo(client) -> None:
    _criar_usuario(client)

    invalida = client.post("/auth/login", json={"username": "admin", "senha": "errada"})
    assert invalida.status_code == 401

    from app.db.session import get_db

    db = next(client.app.dependency_overrides[get_db]())
    try:
        usuario = db.query(Usuario).filter_by(username="admin").one()
        usuario.ativo = False
        db.commit()
    finally:
        db.close()

    inativo = client.post("/auth/login", json={"username": "admin", "senha": "Senha-123!"})
    assert inativo.status_code == 401


def test_auth_me_retorna_usuario_e_funcao(client) -> None:
    _criar_usuario(client, username="coordenacao")
    login = client.post("/auth/login", json={"username": "coordenacao", "senha": "Senha-123!"})
    token = login.json()["access_token"]

    response = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})

    assert response.status_code == 200, response.text
    assert response.json()["username"] == "coordenacao"
    assert response.json()["funcao"] == "admin"


def test_trocar_senha_desativa_obrigatoriedade_e_permite_nova_senha(client) -> None:
    _criar_usuario(client, username="admin")
    login = client.post("/auth/login", json={"username": "admin", "senha": "Senha-123!"})
    token = login.json()["access_token"]
    assert login.json()["trocar_senha"] is True

    resposta = client.post(
        "/auth/trocar-senha",
        json={"senha_atual": "Senha-123!", "nova_senha": "Nova-Senha-456!"},
        headers={"Authorization": f"Bearer {token}"},
    )

    assert resposta.status_code == 200, resposta.text
    assert resposta.json()["usuario"]["trocar_senha_no_proximo_acesso"] is False
    nova_login = client.post("/auth/login", json={"username": "admin", "senha": "Nova-Senha-456!"})
    assert nova_login.status_code == 200
    assert nova_login.json()["trocar_senha"] is False


def test_auth_endpoints_rejeitam_token_invalido(client) -> None:
    assert client.get("/auth/me", headers={"Authorization": "Bearer invalido"}).status_code == 401
    assert client.post(
        "/auth/trocar-senha",
        json={"senha_atual": "x", "nova_senha": "Nova-Senha-456!"},
        headers={"Authorization": "Bearer invalido"},
    ).status_code == 401


def test_seed_super_admin_e_idempotente(tmp_path, monkeypatch, capsys) -> None:
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker

    from app.core.config import get_settings
    from app.models import Base
    from app.seed import seed_super_admin

    database_url = f"sqlite:///{tmp_path / 'seed.db'}"
    engine = create_engine(database_url, connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    testing_session = sessionmaker(bind=engine)
    monkeypatch.setattr("app.seed.SessionLocal", testing_session)
    get_settings.cache_clear()
    monkeypatch.setenv("ADMIN_USERNAME", "admin")
    monkeypatch.setenv("ADMIN_SENHA_INICIAL", "Senha-Admin-123!")
    monkeypatch.setenv("ADMIN_NOME", "Administrador Local")

    seed_super_admin()
    seed_super_admin()

    with testing_session() as db:
        usuarios = db.query(Usuario).all()
        assert len(usuarios) == 1
        assert usuarios[0].username == "admin"
        assert usuarios[0].nome == "Administrador Local"
        assert usuarios[0].funcao is Funcao.ADMIN
        assert usuarios[0].trocar_senha_no_proximo_acesso is True
        assert verificar_senha("Senha-Admin-123!", usuarios[0].senha_hash)

    assert "ja existe" in capsys.readouterr().out


def test_professor_autenticado_nao_pode_criar_professor(client) -> None:
    from app.core.security import gerar_hash_senha
    from app.models import Funcao, Usuario

    get_db_override = client.app.dependency_overrides[get_db]
    db = next(get_db_override())
    try:
        professor = Usuario(
            nome="Professor Restrito",
            username="professor_restrito",
            senha_hash=gerar_hash_senha("Senha-Professor-123!"),
            funcao=Funcao.PROFESSOR,
            ativo=True,
        )
        db.add(professor)
        db.commit()
        db.refresh(professor)
        token = criar_token_acesso(professor.id, professor.funcao.value)
    finally:
        db.close()

    response = client.post(
        "/professores",
        json={"nome": "Nao Deve Criar", "contratacao": "CLT"},
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 403


def test_admin_pode_criar_listar_filtrar_desativar_e_resetar_usuario(client) -> None:
    criar = client.post(
        "/usuarios",
        json={
            "nome": "Professor Novo",
            "username": "prof_novo",
            "funcao": "professor",
            "senha_temporaria": "Senha-Temporaria-123!",
        },
    )
    assert criar.status_code == 201, criar.text
    usuario = criar.json()
    assert usuario["trocar_senha_no_proximo_acesso"] is True

    lista = client.get("/usuarios?funcao=professor&ativo=true&busca=prof_")
    assert lista.status_code == 200
    assert lista.json()["total"] == 1

    atualizado = client.patch(
        f"/usuarios/{usuario['id']}",
        json={"nova_senha_temporaria": "Senha-Nova-456!", "ativo": False},
    )
    assert atualizado.status_code == 200, atualizado.text
    assert atualizado.json()["ativo"] is False
    assert atualizado.json()["trocar_senha_no_proximo_acesso"] is True

    login = client.post("/auth/login", json={"username": "prof_novo", "senha": "Senha-Nova-456!"})
    assert login.status_code == 401


def test_usuario_duplicado_retorna_conflito(client) -> None:
    payload = {
        "nome": "Outro",
        "username": "admin_fixture",
        "funcao": "professor",
        "senha_temporaria": "Senha-Temporaria-123!",
    }
    assert client.post("/usuarios", json=payload).status_code == 409


def test_crud_usuarios_e_restrito_ao_admin(client) -> None:
    from app.core.security import criar_token_acesso, gerar_hash_senha

    db = next(client.app.dependency_overrides[get_db]())
    try:
        coordenacao = Usuario(
            nome="Coordenacao",
            username="coordenacao_crud",
            senha_hash=gerar_hash_senha("Senha-Coordenacao-123!"),
            funcao=Funcao.COORDENACAO,
            ativo=True,
        )
        db.add(coordenacao)
        db.commit()
        db.refresh(coordenacao)
        token = criar_token_acesso(coordenacao.id, coordenacao.funcao.value)
    finally:
        db.close()

    response = client.get("/usuarios", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 403


def test_rotas_de_negocio_exigem_autenticacao(client) -> None:
    client_no_auth = client.__class__(client.app)
    assert client_no_auth.get("/professores").status_code == 401


def test_usuario_com_troca_pendente_nao_acessa_negocio(client) -> None:
    from app.core.security import criar_token_acesso, gerar_hash_senha

    db = next(client.app.dependency_overrides[get_db]())
    try:
        usuario = Usuario(
            nome="Pendente",
            username="pendente",
            senha_hash=gerar_hash_senha("Senha-Pendente-123!"),
            funcao=Funcao.ADMIN,
            ativo=True,
            trocar_senha_no_proximo_acesso=True,
        )
        db.add(usuario)
        db.commit()
        db.refresh(usuario)
        token = criar_token_acesso(usuario.id, usuario.funcao.value)
    finally:
        db.close()

    response = client.get("/professores", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 403

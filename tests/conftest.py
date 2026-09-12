from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.security import criar_token_acesso, gerar_hash_senha
from app.db.session import get_db, register_sqlite_pragmas
from app.main import app
from app.models import Base, Funcao, Usuario


@pytest.fixture()
def client() -> Generator[TestClient, None, None]:
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    register_sqlite_pragmas(engine)
    TestingSessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)
    Base.metadata.create_all(bind=engine)

    with TestingSessionLocal() as db:
        admin = Usuario(
            nome="Administrador de Teste",
            username="admin_fixture",
            senha_hash=gerar_hash_senha("Senha-Admin-123!"),
            funcao=Funcao.ADMIN,
            ativo=True,
            trocar_senha_no_proximo_acesso=False,
        )
        db.add(admin)
        db.commit()
        db.refresh(admin)
        token = criar_token_acesso(admin.id, admin.funcao.value)

    def override_get_db() -> Generator[Session, None, None]:
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app, headers={"Authorization": f"Bearer {token}"}) as test_client:
        yield test_client
    app.dependency_overrides.clear()
    Base.metadata.drop_all(bind=engine)

import { afterEach, describe, expect, it, vi } from "vitest";

import { ApiError, api } from "./api";

function stubLocalStorage(): void {
  const store = new Map<string, string>([
    ["escalas.access_token", "token-invalido"],
    ["escalas.usuario", JSON.stringify({ id: 1, username: "admin", funcao: "admin" })],
  ]);
  vi.stubGlobal(
    "localStorage",
    {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => void store.set(key, value),
      removeItem: (key: string) => void store.delete(key),
    },
  );
}

describe("tratamento global de 401", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("401 em rota de negocio limpa a sessao e redireciona ao login", async () => {
    stubLocalStorage();
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(new Response('{"detail":"Nao foi possivel validar as credenciais."}', { status: 401 }))));
    vi.stubGlobal("window", Object.assign(window, { location: { pathname: "/escala", assign: vi.fn() } }));

    await expect(api.listProfessores()).rejects.toMatchObject({ status: 401 } as ApiError);

    expect(localStorage.getItem("escalas.access_token")).toBeNull();
    expect(localStorage.getItem("escalas.usuario")).toBeNull();
    expect(window.location.assign).toHaveBeenCalledWith("/login");
  });

  it("401 no login NAO limpa sessao nem redireciona (credencial errada e retentativa na tela)", async () => {
    stubLocalStorage();
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(new Response('{"detail":"Usuario ou senha invalidos."}', { status: 401 }))));
    vi.stubGlobal("window", Object.assign(window, { location: { pathname: "/login", assign: vi.fn() } }));

    await expect(api.login("admin", "errada")).rejects.toMatchObject({ status: 401 } as ApiError);

    expect(localStorage.getItem("escalas.access_token")).toBe("token-invalido");
    expect(window.location.assign).not.toHaveBeenCalled();
  });

  it("401 quando ja esta no login nao re-redireciona (evita loop)", async () => {
    stubLocalStorage();
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(new Response('{"detail":"x"}', { status: 401 }))));
    vi.stubGlobal("window", Object.assign(window, { location: { pathname: "/login", assign: vi.fn() } }));

    await expect(api.listProfessores()).rejects.toMatchObject({ status: 401 } as ApiError);

    expect(window.location.assign).not.toHaveBeenCalled();
    expect(localStorage.getItem("escalas.access_token")).toBeNull();
  });
});

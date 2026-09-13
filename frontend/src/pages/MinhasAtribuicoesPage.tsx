import { useEffect, useState } from "react";

import { useAppStatus } from "../app/AppStatusContext";
import { SectionCard } from "../components/SectionCard";
import { api, ApiError } from "../lib/api";
import { getStoredUser } from "../lib/auth";
import type { Atribuicao } from "../types/api";

export function MinhasAtribuicoesPage() {
  const [atribuicoes, setAtribuicoes] = useState<Atribuicao[]>([]);
  const [loading, setLoading] = useState(true);
  const { showError, clearMessages, startLoading, stopLoading } = useAppStatus();
  const usuario = getStoredUser();

  useEffect(() => {
    let active = true;

    async function load() {
      if (!usuario?.professor_id) {
        setLoading(false);
        return;
      }
      setLoading(true);
      clearMessages();
      startLoading();
      try {
        const resposta = await api.listAtribuicoesDoProfessor(usuario.professor_id);
        if (active) setAtribuicoes(resposta);
      } catch (error) {
        if (active) {
          showError(
            error instanceof ApiError
              ? error.message
              : "Nao foi possivel carregar suas atribuicoes agora.",
          );
        }
      } finally {
        if (active) setLoading(false);
        stopLoading();
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [clearMessages, showError, startLoading, stopLoading, usuario?.professor_id]);

  return (
    <div className="page-stack">
      <SectionCard eyebrow="Meu painel" title="Minhas atribuicoes">
        <p>Turmas e unidades curriculares atribuidas a voce, com a vigencia de cada atribuicao.</p>
      </SectionCard>

      <SectionCard eyebrow="Atribuicoes" title="Turmas/UCs que sao suas">
        {loading ? (
          <p className="state-message">Carregando atribuicoes...</p>
        ) : !usuario?.professor_id ? (
          <p className="state-message">
            Seu usuario nao esta vinculado a um professor. Solicite a vinculacao a coordenacao.
          </p>
        ) : atribuicoes.length === 0 ? (
          <p className="state-message">Nenhuma atribuicao ativa para o seu perfil.</p>
        ) : (
          <table className="usuarios-table">
            <thead>
              <tr>
                <th>Turma</th>
                <th>UC</th>
                <th>Vigencia</th>
                <th>Substituto</th>
              </tr>
            </thead>
            <tbody>
              {atribuicoes.map((atribuicao) => (
                <tr key={atribuicao.id}>
                  <td>{atribuicao.turma_codigo}</td>
                  <td>
                    {atribuicao.uc_codigo} — {atribuicao.uc_nome}
                  </td>
                  <td>
                    {atribuicao.data_inicio} a {atribuicao.data_fim}
                  </td>
                  <td>{atribuicao.professor_substituto_nome ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </SectionCard>
    </div>
  );
}

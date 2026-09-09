import { Link } from "react-router-dom";

import { SectionCard } from "../components/SectionCard";

const highlights = [
  "Consulta por turno com calendario e semaforo visual",
  "Cadastro inicial de professores, UCs, turmas e alocacoes",
  "Mensagens de erro do backend exibidas sem perder o contexto operacional",
];

export function HomePage() {
  return (
    <div className="page-grid">
      <SectionCard eyebrow="Fluxo principal" title="Comece pelo turno do dia">
        <p>
          A operacao da escala continua organizada por manha, tarde e noite. O frontend prioriza a consulta rapida da
          grade e o registro de novas alocacoes a partir desse eixo.
        </p>
        <div className="cta-row">
          <Link to="/escala" className="primary-link">
            Abrir escala por turno
          </Link>
          <Link to="/dashboard" className="secondary-link">
            Ver dashboard de graficos
          </Link>
          <Link to="/cadastros" className="secondary-link">
            Ir para cadastros
          </Link>
        </div>
      </SectionCard>

      <SectionCard eyebrow="O que esta pronto" title="Primeira base operacional">
        <ul className="feature-list">
          {highlights.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </SectionCard>
    </div>
  );
}

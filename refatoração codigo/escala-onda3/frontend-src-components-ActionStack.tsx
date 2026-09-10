import { Link } from "react-router-dom";
import { buildPrimaryActionReason } from "../lib/escalaSignals";
import { buildActionSearch, suggestPrimaryAction } from "../lib/escalaActions";
import type { EscalaDrawerAction } from "./EscalaActionDrawer";
import type { WorkbenchRow } from "../types/workbench";

const ACTION_LABELS: Record<EscalaDrawerAction, string> = {
  alocar: "Alocar",
  substituir: "Substituir",
  override: "Justificar override",
};

type ActionStackProps = {
  onOpen: (row: WorkbenchRow, action: EscalaDrawerAction) => void;
  row: WorkbenchRow;
};

/**
 * Pilha de acoes contextuais de uma linha da escala.
 * Componente extraido do EscalaPage.tsx.
 */
export function ActionStack({ onOpen, row }: ActionStackProps) {
  const primaryAction = suggestPrimaryAction(row);
  const secondaryActions = (["alocar", "substituir", "override"] as EscalaDrawerAction[]).filter(
    (action) => action !== primaryAction,
  );
  const actionReason = buildPrimaryActionReason(row);

  return (
    <div className="action-stack">
      <button type="button" className="action-main" onClick={() => onOpen(row, primaryAction)}>
        {ACTION_LABELS[primaryAction]}
      </button>
      <p className="action-stack__reason">{actionReason}</p>
      <div className="action-stack__secondary">
        {secondaryActions.map((action) => (
          <button key={action} type="button" className="action-secondary" onClick={() => onOpen(row, action)}>
            {ACTION_LABELS[action]}
          </button>
        ))}
        <Link to={buildActionSearch(row, "remover")} className="action-secondary action-secondary--danger">
          Remover
        </Link>
      </div>
    </div>
  );
}

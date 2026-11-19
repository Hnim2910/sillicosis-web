import { Fragment } from "react";
import { Check, CircleAlert } from "lucide-react";
import { cn } from "@/utils/format";

export interface Step {
  title: string;
  /** False: the step cannot be opened yet; `blockedReason` is shown on the "!" next to it. */
  enabled: boolean;
  done: boolean;
  blockedReason?: string;
}

/** Progress bar of the screening form: numbered steps joined by a line; every reachable step is clickable. */
export function StepProgress({
  steps,
  current,
  onSelect,
}: {
  steps: Step[];
  current: number;
  onSelect: (index: number) => void;
}) {
  return (
    <nav aria-label="Các bước chẩn đoán" className="step-bar">
      <ol>
        {steps.map((step, index) => {
          const active = index === current;
          const done = step.done && !active;
          return (
            <Fragment key={step.title}>
              {index > 0 && (
                <li
                  aria-hidden="true"
                  className={cn(
                    "step-bar__line",
                    (steps[index - 1].done || index <= current) && "is-filled",
                  )}
                />
              )}
              <li className={cn("step-bar__step", active && "is-active", done && "is-done")}>
                <button
                  type="button"
                  disabled={!step.enabled}
                  aria-current={active ? "step" : undefined}
                  onClick={() => onSelect(index)}
                >
                  <span className="step-bar__number" aria-hidden="true">
                    {done ? <Check size={14} strokeWidth={3} /> : index + 1}
                  </span>
                  <span className="step-bar__title">{step.title}</span>
                </button>
                {!step.enabled && step.blockedReason && (
                  <span className="step-bar__hint" tabIndex={0} aria-label={step.blockedReason}>
                    <CircleAlert size={16} />
                    <span role="tooltip" className="step-bar__tooltip">
                      {step.blockedReason}
                    </span>
                  </span>
                )}
              </li>
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}

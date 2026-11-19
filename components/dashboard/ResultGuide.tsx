"use client";
import { useEffect, useState } from "react";
import { ChevronDown, ShieldCheck, TriangleAlert } from "lucide-react";
import { RESULT_GUIDE_NOTE, RESULT_GUIDES } from "@/constants/resultGuide";

/**
 * "Hiểu về kết quả": what each result label means, who it usually concerns and what to do. The two cards share
 * their rows (CSS subgrid), so matching sections always have the same height, and they open and close together.
 */
export function ResultGuide() {
  const sectionTitles = RESULT_GUIDES[0].sections.map((section) => section.title);
  // Opened from "Xem chi tiết" on a result page (/dashboard#result-guide-Co): every section open.
  const fromLink = () =>
    typeof window !== "undefined" && window.location.hash.startsWith("#result-guide");
  const [open, setOpen] = useState<boolean[]>(() =>
    sectionTitles.map((_, index) => fromLink() || index === 0),
  );
  useEffect(() => {
    if (!fromLink()) return;
    document.getElementById(window.location.hash.slice(1))?.scrollIntoView({ block: "start" });
  }, []);
  const toggle = (index: number) =>
    setOpen((current) => current.map((value, i) => (i === index ? !value : value)));

  return (
    <section className="result-guide" aria-labelledby="result-guide-title">
      <div className="result-guide__heading">
        <h2 id="result-guide-title">Hiểu về kết quả</h2>
        <p>{RESULT_GUIDE_NOTE}</p>
      </div>
      <div
        className="result-guide__grid"
        style={{ gridTemplateRows: `repeat(${sectionTitles.length + 1}, auto)` }}
      >
        {RESULT_GUIDES.map((guide) => {
          const Icon = guide.outcome === "Co" ? TriangleAlert : ShieldCheck;
          return (
            <article
              key={guide.outcome}
              id={`result-guide-${guide.outcome}`}
              className={`guide-card guide-card--${guide.outcome}`}
              style={{ gridRow: `span ${sectionTitles.length + 1}` }}
            >
              <header>
                <span className="guide-card__icon">
                  <Icon size={20} />
                </span>
                <div>
                  <h3>{guide.title}</h3>
                  <p>{guide.summary}</p>
                </div>
              </header>
              {guide.sections.map((section, index) => {
                const id = `guide-${guide.outcome}-${index}`;
                return (
                  <div key={section.title} className="guide-section">
                    <button
                      type="button"
                      className="guide-section__toggle"
                      aria-expanded={open[index]}
                      aria-controls={id}
                      onClick={() => toggle(index)}
                    >
                      {section.title}
                      <ChevronDown
                        size={18}
                        className={open[index] ? "chevron-open" : "chevron-closed"}
                      />
                    </button>
                    {open[index] && (
                      <div id={id} className="guide-card__body">
                        {section.paragraphs?.map((text) => (
                          <p key={text}>{text}</p>
                        ))}
                        {section.bullets && (
                          <ul>
                            {section.bullets.map((text) => (
                              <li key={text}>{text}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </article>
          );
        })}
      </div>
    </section>
  );
}

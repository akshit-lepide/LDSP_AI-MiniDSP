"use client";

import { memo, useEffect, useRef } from "react";

export interface DropdownOption {
  value: string;
  label: string;
}

interface LepidusGlobal {
  init?: (container?: Element | Document) => void;
}

const chevron = (
  <svg className="lp-dropdown__chevron" viewBox="0 0 12 6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
    <path d="M1 1l5 4 5-4" />
  </svg>
);

// Rendered once and left uncontrolled: lepidus.js owns the panel, selection and ARIA state.
function FilterDropdownBase({
  label,
  options,
  onChange,
}: {
  label: string;
  options: readonly DropdownOption[];
  onChange: (value: string) => void;
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const latestChange = useRef(onChange);

  useEffect(() => {
    latestChange.current = onChange;
  }, [onChange]);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const handleChange = () => {
      const selected = wrapper.querySelector(".lp-dropdown__trigger-label")?.textContent?.trim();
      wrapper.querySelectorAll(".lp-dropdown__option").forEach((option) => {
        option.setAttribute("aria-selected", String(option.textContent?.trim() === selected));
      });
      const match = options.find((option) => option.label === selected);
      if (match) latestChange.current(match.value);
    };

    wrapper.addEventListener("lp-dropdown-change", handleChange);

    let frame = 0;
    let attempts = 0;
    const initialise = () => {
      const lepidus = (window as unknown as { Lepidus?: LepidusGlobal }).Lepidus;
      if (lepidus?.init) lepidus.init(wrapper);
      else if (attempts++ < 60) frame = window.setTimeout(initialise, 100);
    };
    initialise();

    return () => {
      wrapper.removeEventListener("lp-dropdown-change", handleChange);
      window.clearTimeout(frame);
    };
  }, [options]);

  return (
    <div className="lp-dropdown" data-lp-dropdown="single" ref={wrapperRef}>
      <button type="button" className="lp-dropdown__trigger" aria-expanded="false" aria-haspopup="listbox">
        <span className="lp-dropdown__trigger-label">{options[0].label}</span>
        {chevron}
      </button>
      <div className="lp-dropdown__panel" hidden>
        <div className="lp-dropdown__header">
          <span className="lp-dropdown__header-label">{label}</span>
          <svg className="lp-dropdown__chevron lp-dropdown__chevron--open" viewBox="0 0 12 6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
            <path d="M1 1l5 4 5-4" />
          </svg>
        </div>
        <div className="lp-dropdown__list" role="listbox" aria-label={label}>
          {options.map((option, index) => (
            <button
              type="button"
              className="lp-dropdown__option"
              role="option"
              aria-selected={index === 0}
              key={option.value}
            >
              <span className="lp-dropdown__option-label">{option.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export const FilterDropdown = memo(FilterDropdownBase);

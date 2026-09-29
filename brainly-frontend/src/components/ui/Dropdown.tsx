import { useState } from "react";

export interface CustomOption {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface CustomDropdownProps {
  options: CustomOption[];
  onSelect: (selected: CustomOption) => void;
  placeholder?: string;
  selectedId?: string;
}

export default function CustomDropdownTS({
  options,
  onSelect,
  placeholder = "Select an option",
  selectedId,
}: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedOption = options.find((o) => o.id === selectedId) ?? null;

  const handleOptionClick = (option: CustomOption) => {
    setIsOpen(false);
    onSelect(option);
  };

  return (
    <div className="w-full relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full h-10 flex items-center justify-between px-3.5 bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 rounded-xl text-left text-xs font-semibold text-slate-900 dark:text-white shadow-xs hover:border-slate-300 dark:hover:border-zinc-600 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer"
      >
        <div className="flex items-center gap-2 truncate">
          {selectedOption?.icon && (
            <span className="shrink-0 text-slate-500 dark:text-zinc-400">
              {selectedOption.icon}
            </span>
          )}
          <span className={selectedOption ? "text-slate-900 dark:text-white font-semibold" : "text-slate-400 dark:text-zinc-500 font-normal"}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>
        <svg 
          className={`w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 transition-transform duration-200 shrink-0 ml-2 ${isOpen ? "rotate-180 text-slate-600 dark:text-zinc-300" : ""}`} 
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          
          <ul className="absolute z-50 w-full mt-1.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-xl shadow-2xl max-h-60 overflow-y-auto py-1.5 animate-fadeIn focus:outline-none">
            {options.map((option) => (
              <li
                key={option.id}
                onClick={() => handleOptionClick(option)}
                className="px-3.5 py-2.5 text-xs text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-white cursor-pointer transition-colors duration-150 flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  {option.icon && (
                    <span className="shrink-0 text-slate-500 dark:text-zinc-400">
                      {option.icon}
                    </span>
                  )}
                  <span className="font-semibold">{option.label}</span>
                </div>
                {selectedOption?.id === option.id && (
                  <span className="text-primary dark:text-primary-light font-bold text-xs">✓</span>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

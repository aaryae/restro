import { FRONTEND_BASE_URL } from "@/constants";
import { SideMenuList } from "../../layout/sideMenuList";
import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import { useNavigate } from "react-router-dom";

type RouteSuggestionType = {
  name: string;
  path?: string;
};

export default function SearchBox() {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [userInput, setUserInput] = useState("");
  const [suggestion, setSuggestion] = useState<RouteSuggestionType[]>([]);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === "Escape") {
        inputRef.current?.blur();
        setSuggestion([]);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSearchOptionClick = (path: string) => {
    navigate(path);
    setUserInput("");
    setSuggestion([]);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUserInput(value);

    if (value.trim() !== "") {
      const matchedRoutes: RouteSuggestionType[] = SideMenuList.filter((route) =>
        route.name.toLowerCase().includes(value.toLowerCase()),
      ).flatMap((route) => {
        if (!route.menu) {
          return { name: route.name, path: route.path };
        }
        return route.menu.map((each) => ({
          name: each.name,
          path: each.path,
        }));
      });
      setSuggestion(matchedRoutes);
    } else {
      setSuggestion([]);
    }
  };

  return (
    <div className="relative w-full max-w-lg">
      <div
        className={[
          "flex h-11 items-center gap-3 rounded-lg border bg-white px-4 transition-all duration-200",
          focused
            ? "border-primaryColor/40 ring-2 ring-primaryColor/15"
            : "border-slate-200 shadow-sm hover:border-slate-300",
        ].join(" ")}
      >
        <Search
          size={17}
          strokeWidth={1.75}
          className={[
            "shrink-0 transition-colors",
            focused ? "text-primaryColor" : "text-slate-400",
          ].join(" ")}
        />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search menu, pages, settings…"
          value={userInput}
          onChange={handleInputChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="min-w-0 flex-1 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
        />
        <kbd className="pointer-events-none hidden h-6 select-none items-center rounded border border-slate-200 bg-slate-50 px-1.5 font-sans text-[10px] font-medium text-slate-400 sm:inline-flex">
          Ctrl K
        </kbd>
      </div>

      {suggestion.length > 0 && (
        <ul className="absolute left-0 top-[calc(100%+6px)] z-50 max-h-72 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white py-1.5 shadow-lg">
          {suggestion.map((each, index) => (
            <li key={`${each.path}-${index}`}>
              <button
                type="button"
                className="flex w-full flex-col gap-0.5 px-4 py-2.5 text-left transition-colors hover:bg-slate-50"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() =>
                  handleSearchOptionClick(each.path ? each.path : "")
                }
              >
                <span className="text-sm font-medium text-slate-800">
                  {each.name}
                </span>
                <span className="truncate text-xs text-slate-400">
                  {`${FRONTEND_BASE_URL}${each.path}`}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

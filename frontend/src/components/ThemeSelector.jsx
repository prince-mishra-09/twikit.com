import { useTheme } from "../context/ThemeContext";

const ThemeSelector = () => {
    const { theme, setTheme, grain, setGrain, themes } = useTheme();

    return (
        <div className="w-full">
            <div className="flex items-center justify-between mb-3 px-1">
                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold">App Theme</p>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold">Grain</span>
                    <button
                        onClick={() => setGrain(!grain)}
                        className={`w-8 h-4 rounded-full relative transition-colors ${grain ? "bg-[var(--accent)]" : "bg-gray-700"}`}
                    >
                        <div className={`w-3 h-3 bg-white rounded-full absolute top-0.5 transition-transform ${grain ? "left-[18px]" : "left-[2px]"}`} />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-5 gap-2">
                {themes.map((t) => (
                    <button
                        key={t.id}
                        onClick={() => setTheme(t.id)}
                        className={`group relative flex flex-col items-center gap-1 p-1 rounded-lg transition-all ${theme === t.id ? "bg-white/10 ring-1 ring-white/20" : "hover:bg-white/5"
                            }`}
                        title={t.name}
                    >
                        <div className={`w-8 h-8 rounded-full border-2 shadow-lg transition-transform ${theme === t.id ? "scale-110 border-white" : "border-transparent opacity-80 group-hover:opacity-100 group-hover:scale-105"
                            }`}
                            style={{
                                background: `linear-gradient(135deg, ${t.colors[0]} 0%, ${t.colors[1]} 50%, ${t.colors[2]} 100%)`
                            }}
                        />
                    </button>
                ))}
            </div>
            <div className="mt-2 text-center">
                <p className="text-xs text-[var(--accent)] font-medium">
                    {themes.find(t => t.id === theme)?.name}
                </p>
            </div>
        </div >
    );
};

export default ThemeSelector;

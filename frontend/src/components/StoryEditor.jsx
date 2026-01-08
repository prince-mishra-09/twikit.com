import React, { useState, useRef, useEffect, createRef } from "react";
import Draggable from "react-draggable";
import html2canvas from "html2canvas";
import { AiOutlineArrowLeft, AiOutlinePlus, AiOutlineMinus, AiOutlineRotateRight, AiOutlineDelete } from "react-icons/ai";
import { BsImage } from "react-icons/bs";
import { IoText } from "react-icons/io5";
import { FaTrash } from "react-icons/fa";
import { LoadingAnimation } from "./Loading";
import toast from "react-hot-toast";

// Gen Z / Modern Colors
const GEN_Z_COLORS = [
    "#ffff02ff", // Light Yellow (User Custom)
    "#000000", // Classic Black
    "#1A1A1A", // Dark Gray
    "#FFFFFF", // White
    "#FF00FF", // Magenta
    "#00FFFF", // Cyan
    "#39FF14", // Neon Green
    "#FFFF00", // Neon Yellow
    "#FF4500", // Orange Red
    "#8A2BE2", // Blue Violet
    "#FF1493", // Deep Pink
];

// Fonts
const FONTS = [
    { name: "Modern", value: "Inter, sans-serif" },
    { name: "Serif", value: "Merriweather, serif" },
    { name: "Typewriter", value: "'Courier New', monospace" },
    { name: "Hand", value: "cursive" },
    { name: "Impact", value: "fantasy" },
];

const StoryEditor = ({ file, type, onSave, onCancel }) => {
    // --- State ---
    const [elements, setElements] = useState([]);
    const [backgroundIndex, setBackgroundIndex] = useState(0);
    const [activeElementId, setActiveElementId] = useState(null);
    const [showTextModal, setShowTextModal] = useState(false);
    const [showExitModal, setShowExitModal] = useState(false); // Custom Exit Modal State
    const [saving, setSaving] = useState(false);

    // Drag/Delete State
    const [isDragging, setIsDragging] = useState(false);
    const [isOverTrash, setIsOverTrash] = useState(false);

    // Refs
    const canvasRef = useRef(null);
    const trashRef = useRef(null);
    const fileInputRef = useRef(null);
    const elementRefs = useRef({});

    // Helper to get or create ref synchronously
    const getRef = (id) => {
        if (!elementRefs.current[id]) {
            elementRefs.current[id] = createRef();
        }
        return elementRefs.current[id];
    };

    // Initial Media (Background Layer)
    const [bgMedia, setBgMedia] = useState(null);

    useEffect(() => {
        if (file) {
            const url = URL.createObjectURL(file);
            setBgMedia({ url, type: file.type.startsWith("video") ? "video" : "image" });
            return () => URL.revokeObjectURL(url);
        }
    }, [file]);

    // Force default Light Yellow on mount if no media
    useEffect(() => {
        if (!file && backgroundIndex !== 0) {
            setBackgroundIndex(0);
        }
    }, []);

    // --- Actions ---

    const cycleBackgroundColor = () => {
        setBackgroundIndex((prev) => (prev + 1) % GEN_Z_COLORS.length);
    };

    const handleAddText = (text, color, font) => {
        const newEl = {
            id: Date.now(),
            type: "text",
            content: text,
            x: 50,
            y: 200,
            rotation: 0,
            scale: 1,
            color,
            font
        };
        getRef(newEl.id);
        setElements([...elements, newEl]);
        setShowTextModal(false);
    };

    const handleAddImage = (e) => {
        const file = e.target.files[0];
        if (file) {
            const url = URL.createObjectURL(file);
            const newEl = {
                id: Date.now(),
                type: "image",
                url: url,
                x: 50,
                y: 100,
                rotation: 0,
                scale: 1
            };
            getRef(newEl.id);
            setElements([...elements, newEl]);
        }
        e.target.value = ""; // Reset to allow re-selection
    };

    // --- Interaction Handlers ---

    const handleDragStart = (id) => {
        setActiveElementId(id);
        setIsDragging(true);
    };

    const handleDrag = (e, data) => {
        if (trashRef.current) {
            const rect = trashRef.current.getBoundingClientRect();
            // ClientX/Y 
            let clientX = e.clientX;
            let clientY = e.clientY;

            if (e.type.startsWith('touch')) {
                clientX = e.touches[0].clientX;
                clientY = e.touches[0].clientY;
            }

            if (
                clientX > rect.left &&
                clientX < rect.right &&
                clientY > rect.top &&
                clientY < rect.bottom
            ) {
                setIsOverTrash(true);
            } else {
                setIsOverTrash(false);
            }
        }
    };

    const handleDragStop = (e, data, id) => {
        setIsDragging(false);
        if (isOverTrash) {
            deleteElement(id);
            setIsOverTrash(false);
        } else {
            setElements(prev => prev.map(el => el.id === id ? { ...el, x: data.x, y: data.y } : el));
        }
    };

    // --- Toolbar Handlers ---

    // Explicitly update only the scale/rotation properties, keep x/y as is
    const handleResize = (increment) => {
        if (!activeElementId) return;
        setElements(prev => prev.map(item => {
            if (item.id === activeElementId) {
                const newScale = item.scale + increment;
                return { ...item, scale: Math.max(0.2, Math.min(newScale, 4)) };
            }
            return item;
        }));
    };

    const handleRotate = () => {
        if (!activeElementId) return;
        setElements(prev => prev.map(item => {
            if (item.id === activeElementId) {
                return { ...item, rotation: (item.rotation + 45) % 360 };
            }
            return item;
        }));
    };

    const deleteElement = (id) => {
        setElements(prev => prev.filter(el => el.id !== id));
        setActiveElementId(null);
        toast.success("Deleted", { icon: "🗑️" });
    };

    // --- Save / Bake ---
    const handleSave = async () => {
        if (!canvasRef.current) return;
        setSaving(true);

        try {
            setActiveElementId(null);
            await new Promise(r => setTimeout(r, 100));

            if (bgMedia?.type === "video") {
                onSave(file);
            } else {
                const canvas = await html2canvas(canvasRef.current, {
                    useCORS: true,
                    scale: 2,
                    backgroundColor: GEN_Z_COLORS[backgroundIndex],
                });

                canvas.toBlob((blob) => {
                    const bakedFile = new File([blob], "story.png", { type: "image/png" });
                    onSave(bakedFile);
                }, "image/png");
            }
        } catch (error) {
            console.error("Baking failed", error);
            setSaving(false);
            onSave(file);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] bg-[#0B0F14] flex flex-col">

            {/* --- TOP BAR (Dark Theme) --- */}
            <div className="bg-[#111827] border-b border-gray-800 px-4 py-3 flex items-center justify-between z-20 shadow-sm">
                <button
                    onClick={() => setShowExitModal(true)} // Open Custom Modal
                    className="p-2 -ml-2 text-gray-400 hover:text-white rounded-full transition"
                >
                    <AiOutlineArrowLeft size={24} />
                </button>

                <div className="flex items-center gap-6">
                    {/* 1. Photo Add */}
                    <div className="flex flex-col items-center gap-1 cursor-pointer group" onClick={() => fileInputRef.current.click()}>
                        <BsImage size={24} className="text-indigo-400 group-hover:text-indigo-300 transition" />
                        <span className="text-[10px] font-bold text-gray-400 group-hover:text-gray-200 leading-none">Media</span>
                        <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleAddImage} />
                    </div>

                    {/* 2. Text Add */}
                    <button
                        onClick={() => setShowTextModal(true)}
                        className="flex items-center gap-2 bg-[#1F2937] border border-gray-700 px-3 py-1.5 rounded-full hover:bg-gray-800 transition"
                    >
                        <IoText size={20} className="text-purple-400" />
                        <span className="text-sm font-bold text-gray-200">Text</span>
                    </button>

                    {/* 3. Color Circle (Showing Current Color) */}
                    <button onClick={cycleBackgroundColor} className="relative group flex flex-col items-center gap-1">
                        <div
                            className="w-8 h-8 rounded-full border-2 border-gray-600 shadow-inner transition-transform active:scale-95 hover:border-white"
                            // Showing CURRENT color
                            style={{ backgroundColor: GEN_Z_COLORS[backgroundIndex] }}
                        />
                        <span className="text-[10px] font-bold text-gray-400 group-hover:text-gray-200 leading-none">Bg</span>
                    </button>
                </div>
            </div>

            {/* --- WORKSPACE (CANVAS) --- */}
            <div className="flex-1 relative overflow-hidden bg-[#000000] flex items-center justify-center">

                <div
                    ref={canvasRef} // Needs to capture the background color
                    className="relative w-full h-full md:max-w-sm md:aspect-[9/16] overflow-hidden shadow-2xl transition-colors duration-300"
                    style={{ backgroundColor: GEN_Z_COLORS[backgroundIndex] }}
                    onClick={() => setActiveElementId(null)}
                >
                    {/* Main Background Media */}
                    {bgMedia && (
                        <Draggable
                            nodeRef={getRef("bg")}
                            onStart={() => setActiveElementId("bg")}
                            cancel=".no-drag"
                        >
                            <div ref={getRef("bg")} className="w-full h-full">
                                {bgMedia.type === "video" ? (
                                    <video
                                        src={bgMedia.url}
                                        className="w-full h-full object-cover pointer-events-none"
                                        autoPlay loop muted playsInline
                                    />
                                ) : (
                                    <img
                                        src={bgMedia.url}
                                        className={`w-full h-full object-cover ${activeElementId === 'bg' ? 'border-2 border-blue-500' : ''}`}
                                        alt="bg"
                                        draggable={false}
                                    />
                                )}
                            </div>
                        </Draggable>
                    )}

                    {/* Elements Layer */}
                    {elements.map(el => (
                        <Draggable
                            key={el.id}
                            nodeRef={getRef(el.id)}
                            position={{ x: el.x, y: el.y }}
                            onStart={() => handleDragStart(el.id)}
                            onDrag={handleDrag}
                            onStop={(e, d) => handleDragStop(e, d, el.id)}
                            disabled={false}
                        >

                            {/* OUTER WRAPPER: Handles DRAG (Translate) only. */}
                            <div
                                ref={getRef(el.id)}
                                className={`absolute cursor-pointer p-0 ${activeElementId === el.id ? "z-50" : "z-10"}`} // Lift active on top
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveElementId(el.id);
                                }}
                            >
                                {/* INNER WRAPPER: Handles TRANSFORM (Scale/Rotate). */}
                                <div
                                    className={`p-2 transition-transform duration-100 ease-linear ${activeElementId === el.id ? "border-2 border-white border-dashed rounded-lg bg-black/10" : ""}`}
                                    style={{
                                        transform: `scale(${el.scale}) rotate(${el.rotation}deg)`,
                                        transformOrigin: "center center"
                                    }}
                                >
                                    {el.type === "text" ? (
                                        <p
                                            className="text-2xl font-bold whitespace-pre-wrap text-center leading-tight drop-shadow-md select-none"
                                            style={{ color: el.color, fontFamily: el.font }}
                                        >
                                            {el.content}
                                        </p>
                                    ) : (
                                        <img
                                            src={el.url}
                                            className="max-w-[150px] rounded-lg shadow-xl pointer-events-none"
                                            alt="element"
                                        />
                                    )}
                                </div>
                            </div>
                        </Draggable>
                    ))}

                </div>

                {/* --- TRASH BIN (Floating) --- */}
                <div
                    ref={trashRef}
                    className={`absolute bottom-32 left-1/2 -translate-x-1/2 transition-all duration-300 z-40 ${isDragging ? "translate-y-0 opacity-100" : "translate-y-20 opacity-0"}`}
                >
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center border-2 shadow-lg backdrop-blur-md ${isOverTrash ? "bg-red-500 border-red-500 text-white scale-125" : "bg-black/50 border-white/30 text-white"}`}>
                        <FaTrash size={24} />
                    </div>
                </div>

                {/* --- SELECTION TOOLBAR (FIXED BUBBLING) --- */}
                {activeElementId && activeElementId !== "bg" && !isDragging && !showTextModal && (
                    <div
                        className="absolute bottom-24 left-0 right-0 z-50 flex justify-center pb-2 cursor-default"
                        onClick={(e) => e.stopPropagation()} // STOP BUBBLING to Canvas
                    >
                        <div className="bg-[#1F2937] border border-gray-700 rounded-2xl shadow-xl flex items-center p-2 gap-4 animate-in slide-in-from-bottom-5">

                            {/* Size - */}
                            <button onClick={() => handleResize(-0.1)} className="p-3 bg-gray-700 rounded-full text-white hover:bg-gray-600 active:scale-95 transition">
                                <AiOutlineMinus size={20} />
                            </button>

                            <span className="text-gray-400 text-xs font-bold uppercase tracking-wider select-none">Size</span>

                            {/* Size + */}
                            <button onClick={() => handleResize(0.1)} className="p-3 bg-gray-700 rounded-full text-white hover:bg-gray-600 active:scale-95 transition">
                                <AiOutlinePlus size={20} />
                            </button>

                            <div className="w-px h-6 bg-gray-600 mx-1"></div>

                            {/* Rotate */}
                            <button onClick={handleRotate} className="p-3 bg-gray-700 rounded-full text-white hover:bg-gray-600 active:scale-95 transition">
                                <AiOutlineRotateRight size={20} />
                            </button>

                            <div className="w-px h-6 bg-gray-600 mx-1"></div>

                            {/* Delete */}
                            <button onClick={() => deleteElement(activeElementId)} className="p-3 bg-red-500/20 text-red-400 rounded-full hover:bg-red-500/30 active:scale-95 transition">
                                <AiOutlineDelete size={20} />
                            </button>
                        </div>
                    </div>
                )}

                {/* --- SHARE BUTTON --- */}
                {!isDragging && !showTextModal && !activeElementId && (
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="absolute bottom-8 right-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold h-12 px-6 rounded-full shadow-lg shadow-indigo-500/30 flex items-center gap-2 active:scale-95 transition z-50 hover:brightness-110"
                    >
                        {saving ? <LoadingAnimation small /> : "Share Story >"}
                    </button>
                )}
                {/* Done Button for Clarity */}
                {activeElementId && !isDragging && (
                    <button
                        onClick={() => setActiveElementId(null)}
                        className="absolute bottom-8 right-6 bg-gray-800 text-white font-bold h-12 px-6 rounded-full shadow-lg border border-gray-600 active:scale-95 transition z-50"
                    >
                        Done
                    </button>
                )}

            </div>

            {/* --- TEXT EDITOR MODAL --- */}
            {showTextModal && (
                <TextEditorModal
                    onDone={handleAddText}
                    onCancel={() => setShowTextModal(false)}
                />
            )}

            {/* --- EXIT CONFIRMATION MODAL --- */}
            {showExitModal && (
                <ExitConfirmationModal
                    onConfirm={onCancel}
                    onCancel={() => setShowExitModal(false)}
                />
            )}

        </div>
    );
};

// ... TextEditorModal remains same ... 
const TextEditorModal = ({ onDone, onCancel }) => {
    const [text, setText] = useState("");
    const [color, setColor] = useState("#FFFFFF");
    const [font, setFont] = useState("Inter, sans-serif");

    return (
        <div className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="absolute inset-0" onClick={onCancel}></div>

            <div className="bg-[#111827] w-full max-w-sm rounded-[2rem] p-6 shadow-2xl relative z-10 border border-gray-700 ring-1 ring-white/10">

                <div className="flex justify-between items-center mb-6">
                    <button onClick={onCancel} className="text-gray-400 hover:text-white px-2">Cancel</button>
                    <h3 className="text-white font-bold text-lg">Add Text</h3>
                    <button
                        onClick={() => text.trim() && onDone(text, color, font)}
                        className="text-indigo-400 font-bold hover:text-indigo-300 px-2"
                    >
                        Done
                    </button>
                </div>

                <div className="mb-8 flex justify-center">
                    <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Type something..."
                        className="bg-transparent text-center text-3xl font-bold w-full focus:outline-none placeholder-gray-600 resize-none"
                        style={{ color: color, fontFamily: font }}
                        rows={3}
                        autoFocus
                    />
                </div>

                <div className="mb-6">
                    <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-2 ml-1">Font</p>
                    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                        {FONTS.map((f) => (
                            <button
                                key={f.name}
                                onClick={() => setFont(f.value)}
                                className={`px-4 py-2 rounded-xl border transition ${font === f.value ? "bg-white text-black border-white" : "bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-700"}`}
                                style={{ fontFamily: f.value }}
                            >
                                {f.name}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-2 ml-1">Color</p>
                    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                        {GEN_Z_COLORS.map((c) => (
                            <button
                                key={c}
                                onClick={() => setColor(c)}
                                className={`w-10 h-10 rounded-full border-2 shrink-0 transition ${color === c ? "border-white scale-110" : "border-transparent"}`}
                                style={{ backgroundColor: c }}
                            />
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
};

// ... ExitConfirmationModal ...
const ExitConfirmationModal = ({ onConfirm, onCancel }) => (
    <div className="fixed inset-0 z-[80] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
        <div className="bg-[#1F2937] w-full max-w-xs rounded-2xl p-6 shadow-2xl border border-gray-700 text-center ring-1 ring-white/10">
            <h3 className="text-white font-bold text-lg mb-2">Exit Story Studio?</h3>
            <p className="text-gray-400 text-sm mb-6">Want to exit story workplace?</p> {/* Exact text requested */}
            <div className="flex gap-3 justify-center">
                <button
                    onClick={onCancel}
                    className="flex-1 py-2 rounded-xl bg-gray-800 text-white font-semibold hover:bg-gray-700 border border-gray-600 transition"
                >
                    No
                </button>
                <button
                    onClick={onConfirm}
                    className="flex-1 py-2 rounded-xl bg-red-500/10 text-red-500 border border-red-500/50 font-semibold hover:bg-red-500 hover:text-white transition"
                >
                    Yes
                </button>
            </div>
        </div>
    </div>
);

export default StoryEditor;

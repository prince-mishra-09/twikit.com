import React, { useState, useRef, useEffect, createRef, useMemo } from "react";
import Draggable from "react-draggable";
import html2canvas from "html2canvas";
import { useGesture } from "@use-gesture/react";
import { UserData } from "../context/UserContext";
import { motion, AnimatePresence } from "framer-motion";
import { 
    AiOutlineArrowLeft, 
    AiOutlinePlus, 
    AiOutlineMinus, 
    AiOutlineRotateRight, 
    AiOutlineDelete,
    AiOutlineCheck,
    AiOutlineGlobal,
    AiOutlineAlignLeft,
    AiOutlineAlignCenter,
    AiOutlineAlignRight
} from "react-icons/ai";
import { BsImage, BsCheck2 } from "react-icons/bs";
import { IoText, IoColorPaletteOutline, IoImagesOutline } from "react-icons/io5";
import { FaTrash, FaCheck } from "react-icons/fa";
import { LoadingAnimation } from "./Loading";
import axios from "axios";
import { getOptimizedImage } from "../utils/imagekitUtils";
import toast from "react-hot-toast";

// Gen Z / Modern Colors
const GEN_Z_COLORS = [
    "#000000", "#1A1A1A", "#FFFFFF", "#FF00FF", "#00FFFF", 
    "#39FF14", "#FFFF00", "#FF4500", "#8A2BE2", "#FF1493", "#ffff02ff",
];

const FONTS = [
    { name: "Modern", value: "Inter, sans-serif" },
    { name: "Serif", value: "Merriweather, serif" },
    { name: "Typewriter", value: "'Courier New', monospace" },
    { name: "Hand", value: "cursive" },
    { name: "Impact", value: "fantasy" },
];

const TEXT_STYLES = [
    { id: "classic", label: "Classic", icon: <IoText /> },
    { id: "highlighted", label: "Box", icon: <div className="w-4 h-3 bg-white rounded-sm" /> },
    { id: "rounded", label: "Bubble", icon: <div className="w-4 h-3 bg-white rounded-full" /> },
];

const StoryEditor = ({ file, type, onSave, onCancel }) => {
    const { user } = UserData();
    // --- State ---
    const [elements, setElements] = useState([]);
    const [backgroundIndex, setBackgroundIndex] = useState(0);
    const [activeElementId, setActiveElementId] = useState(null);
    const [showTextModal, setShowTextModal] = useState(false);
    const [editingElement, setEditingElement] = useState(null); // For "Double Tap to Edit"
    const [showExitModal, setShowExitModal] = useState(false);
    const [saving, setSaving] = useState(false);

    // Drag/Delete State
    const [isDragging, setIsDragging] = useState(false);
    const [isOverTrash, setIsOverTrash] = useState(false);
    const [snapGuides, setSnapGuides] = useState({ x: false, y: false });

    // Refs
    const canvasRef = useRef(null);
    const trashRef = useRef(null);
    const fileInputRef = useRef(null);
    const elementRefs = useRef({});

    const getRef = (id) => {
        if (!elementRefs.current[id]) {
            elementRefs.current[id] = createRef();
        }
        return elementRefs.current[id];
    };

    const [bgMedia, setBgMedia] = useState(null);

    useEffect(() => {
        if (file) {
            const url = URL.createObjectURL(file);
            setBgMedia({ url, type: file.type.startsWith("video") ? "video" : "image" });
            return () => URL.revokeObjectURL(url);
        }
    }, [file]);

    const cycleBackgroundColor = () => {
        setBackgroundIndex((prev) => (prev + 1) % GEN_Z_COLORS.length);
    };

    // --- REFRESH PROTECTION ---
    useEffect(() => {
        const handleBeforeUnload = (e) => {
            if (elements.length > 0) {
                e.preventDefault();
                e.returnValue = ''; 
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [elements]);

    const handleAddText = (textData) => {
        if (editingElement) {
            setElements(prev => prev.map(el => el.id === editingElement.id ? { ...el, ...textData, content: textData.text } : el));
            setEditingElement(null);
        } else {
            const newEl = {
                id: Date.now(),
                type: "text",
                content: textData.text,
                x: 0,
                y: 0,
                rotation: 0,
                scale: 1,
                color: textData.color,
                font: textData.font,
                textStyle: textData.textStyle,
                textAlign: textData.textAlign
            };
            setElements([...elements, newEl]);
        }
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
                x: 0,
                y: 0,
                rotation: 0,
                scale: 1
            };
            setElements([...elements, newEl]);
        }
        e.target.value = "";
    };

    // --- Interaction Handlers ---

    const handleDragStart = (id) => {
        setActiveElementId(id);
        setIsDragging(true);
    };

    const handleDrag = (e, data, id) => {
        const threshold = 10;
        const isCenteredX = Math.abs(data.x) < threshold;
        const isCenteredY = Math.abs(data.y) < threshold;

        setSnapGuides({ x: isCenteredX, y: isCenteredY });

        if (trashRef.current) {
            const rect = trashRef.current.getBoundingClientRect();
            let clientX = e.clientX || (e.touches && e.touches[0].clientX);
            let clientY = e.clientY || (e.touches && e.touches[0].clientY);

            if (clientX > rect.left && clientX < rect.right && clientY > rect.top && clientY < rect.bottom) {
                setIsOverTrash(true);
            } else {
                setIsOverTrash(false);
            }
        }
    };

    const handleDragStop = (e, data, id) => {
        setIsDragging(false);
        setSnapGuides({ x: false, y: false });
        if (isOverTrash) {
            deleteElement(id);
            setIsOverTrash(false);
        } else {
            setElements(prev => prev.map(el => el.id === id ? { ...el, x: data.x, y: data.y } : el));
        }
    };

    const deleteElement = (id) => {
        setElements(prev => prev.filter(el => el.id !== id));
        setActiveElementId(null);
        toast.success("Removed", { 
            style: { background: "#1A1A1A", color: "#FFF", borderRadius: "10px" },
            iconTheme: { primary: "#FF3040", secondary: "#FFF" }
        });
    };

    const handleSave = async () => {
        if (!canvasRef.current) return;
        setSaving(true);
        try {
            setActiveElementId(null);
            await new Promise(r => setTimeout(r, 200));
            if (bgMedia?.type === "video") {
                onSave(file);
            } else {
                const canvas = await html2canvas(canvasRef.current, {
                    useCORS: true,
                    scale: 3,
                    logging: true,
                    backgroundColor: GEN_Z_COLORS[backgroundIndex],
                });
                canvas.toBlob((blob) => {
                    const bakedFile = new File([blob], "story.png", { type: "image/png" });
                    onSave(bakedFile);
                }, "image/png");
            }
        } catch (error) {
            toast.error("Failed to save story");
            setSaving(false);
        }
    };

    const openTextEditor = (el = null) => {
        setEditingElement(el);
        setShowTextModal(true);
    };

    return (
        <div className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center font-['Inter']">
            
            {/* Top Left: Exit */}
            <motion.button 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowExitModal(true)}
                className="absolute top-4 left-4 z-[70] p-2.5 rounded-full bg-black/20 backdrop-blur-xl border border-white/10 text-white transition-all shadow-lg md:!text-white"
                style={{ color: isDark(GEN_Z_COLORS[backgroundIndex]) ? '#FFF' : '#000' }}
            >
                <AiOutlineArrowLeft size={22} />
            </motion.button>

            {/* Top Right: Vertical Tools Stack */}
            <div className="absolute top-4 right-4 z-[70] flex flex-col gap-4">
                <ToolButton 
                    icon={<IoText size={22} />} 
                    onClick={() => openTextEditor()} 
                    label="Text" 
                    isDarkBg={isDark(GEN_Z_COLORS[backgroundIndex])}
                />
                <ToolButton 
                    icon={<IoImagesOutline size={22} />} 
                    onClick={() => fileInputRef.current.click()} 
                    label="Stickers" 
                    isDarkBg={isDark(GEN_Z_COLORS[backgroundIndex])}
                />
                <ToolButton 
                    icon={<div className="w-5 h-5 rounded-full border border-current shadow-[0_0_10px_rgba(255,255,255,0.1)]" style={{ backgroundColor: GEN_Z_COLORS[backgroundIndex] }} />} 
                    onClick={cycleBackgroundColor} 
                    label="Backdrop" 
                    isDarkBg={isDark(GEN_Z_COLORS[backgroundIndex])}
                />
                <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleAddImage} />
            </div>

            {/* --- CANVAS CONTAINER (9:16) --- */}
            <div className="relative w-full h-full flex items-center justify-center md:p-4">
                <div
                    ref={canvasRef}
                    className="relative w-full h-full md:aspect-[9/16] md:h-full md:max-h-[85vh] md:w-auto bg-black overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] md:rounded-[2.5rem] md:border border-white/5 transition-all"
                    style={{ backgroundColor: GEN_Z_COLORS[backgroundIndex] }}
                    onClick={() => setActiveElementId(null)}
                >
                    {/* Snap Guides */}
                    <AnimatePresence>
                        {snapGuides.x && (
                            <motion.div 
                                key="snap-x"
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="absolute left-1/2 top-0 bottom-0 w-[2px] bg-cyan-400 z-[100] shadow-[0_0_10px_rgba(0,255,255,0.8)]"
                                style={{ transform: "translateX(-50%)" }}
                            />
                        )}
                        {snapGuides.y && (
                            <motion.div 
                                key="snap-y"
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="absolute top-1/2 left-0 right-0 h-[2px] bg-cyan-400 z-[100] shadow-[0_0_10px_rgba(0,255,255,0.8)]"
                                style={{ transform: "translateY(-50%)" }}
                            />
                        )}
                    </AnimatePresence>

                    {/* Background Media */}
                    {bgMedia && (
                        <div className="absolute inset-0 w-full h-full">
                            {bgMedia.type === "video" ? (
                                <video src={bgMedia.url} className="w-full h-full object-cover" autoPlay loop muted playsInline crossOrigin="anonymous" />
                            ) : (
                                <img src={bgMedia.url} className="w-full h-full object-cover" alt="bg" draggable={false} crossOrigin="anonymous" />
                            )}
                        </div>
                    )}

                    {/* Elements */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        {elements.map(el => (
                            <StoryElement 
                                key={el.id} 
                                element={el} 
                                active={activeElementId === el.id}
                                onSelect={() => setActiveElementId(el.id)}
                                onDrag={handleDrag}
                                onDragStart={handleDragStart}
                                onDragStop={handleDragStop}
                                onUpdate={(updates) => setElements(prev => prev.map(item => item.id === el.id ? { ...item, ...updates } : item))}
                                onDoubleTap={() => openTextEditor(el)}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* --- SMART TRASH BIN --- */}
            <AnimatePresence>
                {isDragging && (
                    <motion.div 
                        key="trash-bin"
                        initial={{ y: 100, opacity: 0, x: "-50%" }}
                        animate={{ y: 0, opacity: 1, x: "-50%" }}
                        exit={{ y: 100, opacity: 0, x: "-50%" }}
                        ref={trashRef}
                        className="absolute bottom-10 left-1/2 z-[70]"
                    >
                        <motion.div 
                            animate={{ scale: isOverTrash ? 1.4 : 1 }}
                            className={`w-16 h-16 rounded-full flex items-center justify-center backdrop-blur-xl border-2 transition-colors ${isOverTrash ? "bg-red-500 border-red-400 text-white" : "bg-white/10 border-white/20 text-white"}`}
                        >
                            <FaTrash size={20} />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* --- FLOATING ACTION BUTTON (SHARE) --- */}
            {!isDragging && !showTextModal && (
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="absolute bottom-6 right-6 z-[70] bg-black/20 backdrop-blur-2xl text-white font-bold h-14 pl-2 pr-6 rounded-full border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.3)] flex items-center gap-3 hover:scale-105 active:scale-95 transition-all group"
                >
                    {saving ? <LoadingAnimation small /> : (
                        <>
                            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/10">
                                <img 
                                    src={getOptimizedImage(user?.profilePic?.url, { isProfilePic: true, updatedAt: user?.updatedAt, width: 100 }) || "https://placehold.co/100"} 
                                    className="w-full h-full object-cover" 
                                    alt="user"
                                    crossOrigin="anonymous"
                                />
                            </div>
                            <span className="text-sm font-extrabold tracking-tight">Your Story</span>
                            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                                <BsCheck2 size={18} />
                            </div>
                        </>
                    )}
                </button>
            )}

            {/* Modals */}
            <AnimatePresence>
                {showTextModal && (
                    <TextEditorModal 
                        key="text-editor"
                        initialData={editingElement}
                        onDone={handleAddText} 
                        onCancel={() => { setShowTextModal(false); setEditingElement(null); }} 
                    />
                )}
                {showExitModal && (
                    <ExitConfirmationModal 
                        key="exit-confirm"
                        onConfirm={onCancel} 
                        onCancel={() => setShowExitModal(false)} 
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

const ToolButton = ({ icon, onClick, label, isDarkBg }) => (
    <motion.button 
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={onClick}
        className="group relative flex flex-col items-center gap-1 md:!text-white"
        style={{ color: isDarkBg ? '#FFF' : '#000' }}
    >
        <div className="p-2.5 rounded-full bg-black/20 backdrop-blur-xl border border-white/10 transition-all shadow-lg">
            {icon}
        </div>
        <span className={`text-[10px] font-bold uppercase tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap md:!text-white/70 ${isDarkBg ? 'text-white/70' : 'text-black/70'}`}>
            {label}
        </span>
    </motion.button>
);

const StoryElement = ({ element, active, onSelect, onDrag, onDragStart, onDragStop, onUpdate, onDoubleTap }) => {
    const nodeRef = useRef(null);
    const lastTap = useRef(0);

    useGesture(
        {
            onPinch: ({ offset: [d, a] }) => {
                onUpdate({ scale: d, rotation: a });
            },
        },
        {
            target: nodeRef,
            pinch: { scaleBounds: { min: 0.5, max: 4 }, from: () => [element.scale, element.rotation] }
        }
    );

    const handleTap = (e) => {
        e.stopPropagation();
        onSelect();
        const now = Date.now();
        if (now - lastTap.current < 300) {
            onDoubleTap();
        }
        lastTap.current = now;
    };

    const textStyles = {
        classic: "text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]",
        highlighted: "bg-white text-black px-3 py-1 rounded-sm shadow-lg inline-block",
        rounded: "bg-white text-black px-5 py-2 rounded-full shadow-lg inline-block"
    };

    const contrastColor = (bgColor) => {
        if (!bgColor || bgColor === 'transparent') return '#FFF';
        return isDark(bgColor) ? '#FFF' : '#000';
    };

    return (
        <Draggable
            nodeRef={nodeRef}
            position={{ x: element.x, y: element.y }}
            onStart={() => onDragStart(element.id)}
            onDrag={(e, d) => onDrag(e, d, element.id)}
            onStop={(e, d) => onDragStop(e, d, element.id)}
        >
            <div
                ref={nodeRef}
                className={`absolute pointer-events-auto cursor-grab active:cursor-grabbing p-4 ${active ? "z-50" : "z-10"}`}
                onClick={handleTap}
                style={{ touchAction: "none" }}
            >
                <div 
                    style={{ 
                        transform: `scale(${element.scale}) rotate(${element.rotation}deg)`,
                        transition: "transform 0.1s ease-out"
                    }}
                >
                    {element.type === "text" ? (
                        <div className="flex flex-col" style={{ alignItems: element.textAlign || 'center' }}>
                            <div 
                                className={`text-2xl font-bold whitespace-pre-wrap select-none ${textStyles[element.textStyle || 'classic']}`}
                                style={{ 
                                    fontFamily: element.font,
                                    textAlign: element.textAlign || 'center',
                                    color: (element.textStyle === 'classic' || !element.textStyle) ? element.color : contrastColor(element.color),
                                    backgroundColor: (element.textStyle !== 'classic' && element.textStyle) ? element.color : 'transparent',
                                }}
                            >
                                {element.content}
                            </div>
                        </div>
                    ) : (
                        <img src={element.url} className="w-40 rounded-2xl shadow-2xl pointer-events-none" alt="sticker" />
                    )}
                </div>
                {active && (
                    <div className="absolute inset-0 border-2 border-dashed border-white/50 rounded-lg pointer-events-none" />
                )}
            </div>
        </Draggable>
    );
};

const isDark = (color) => {
    if (!color) return true;
    const hex = color.replace('#', '');
    if (hex.length < 6) return true;
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const brightness = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return brightness < 155;
};

const TextEditorModal = ({ onDone, onCancel, initialData }) => {
    const [text, setText] = useState(initialData?.content || "");
    const [color, setColor] = useState(initialData?.color || "#FFFFFF");
    const [font, setFont] = useState(initialData?.font || "Inter, sans-serif");
    const [textStyle, setTextStyle] = useState(initialData?.textStyle || "classic");
    const [textAlign, setTextAlign] = useState(initialData?.textAlign || "center");

    const nextAlignment = () => {
        const flow = { center: 'left', left: 'right', right: 'center' };
        setTextAlign(flow[textAlign]);
    };

    const alignmentIcon = () => {
        if (textAlign === 'left') return <AiOutlineAlignLeft size={24} />;
        if (textAlign === 'right') return <AiOutlineAlignRight size={24} />;
        return <AiOutlineAlignCenter size={24} />;
    };

    return (
        <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-2xl flex flex-col items-center p-6 pt-6 md:pt-20"
        >
            <div className="w-full max-w-lg flex flex-col h-full">
                <div className="flex justify-between items-center mb-4 md:mb-10">
                    <button onClick={onCancel} className="text-white/60 hover:text-white font-medium text-lg">Cancel</button>
                    <div className="flex gap-4">
                        {TEXT_STYLES.map(style => (
                            <button 
                                key={style.id}
                                onClick={() => setTextStyle(style.id)}
                                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${textStyle === style.id ? "bg-white text-black scale-110" : "bg-white/10 text-white border border-white/10"}`}
                            >
                                {style.icon}
                            </button>
                        ))}
                    </div>
                    <div className="flex gap-4">
                        <button 
                            onClick={nextAlignment}
                            className="w-10 h-10 rounded-full flex items-center justify-center bg-white/10 text-white border border-white/10"
                        >
                            {alignmentIcon()}
                        </button>
                        <button 
                            onClick={() => text.trim() && onDone({ text, color, font, textStyle, textAlign })}
                            className="bg-white text-black px-6 py-2 rounded-full font-bold hover:bg-white/90 active:scale-95 transition"
                        >
                            Done
                        </button>
                    </div>
                </div>

                    <div className="w-full flex flex-col items-center">
                        <textarea
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder="Type something..."
                            className="bg-transparent text-4xl font-bold focus:outline-none placeholder-white/20 resize-none overflow-hidden max-w-full"
                            style={{ 
                                textAlign: textAlign,
                                color: textStyle === 'classic' ? color : (isDark(color) ? '#FFF' : '#000'),
                                fontFamily: font,
                                backgroundColor: textStyle !== 'classic' ? color : 'transparent',
                                padding: textStyle === 'rounded' ? '1rem 2rem' : (textStyle === 'highlighted' ? '0.5rem 1.5rem' : '0'),
                                borderRadius: textStyle === 'rounded' ? '999px' : (textStyle === 'highlighted' ? '4px' : '0'),
                                width: 'auto',
                                display: 'inline-block',
                                minWidth: '100px'
                            }}
                            rows={text.split('\n').length || 1}
                            autoFocus
                        />
                    </div>

                <div className="space-y-8 pb-2 md:pb-10">
                    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide py-2">
                        {FONTS.map((f) => (
                            <button
                                key={f.name}
                                onClick={() => setFont(f.value)}
                                className={`px-5 py-2 rounded-full border shrink-0 transition-all font-medium ${font === f.value ? "bg-white text-black border-white" : "bg-white/5 text-white border-white/10 hover:bg-white/10"}`}
                                style={{ fontFamily: f.value }}
                            >
                                {f.name}
                            </button>
                        ))}
                    </div>

                    <div className="flex gap-4 overflow-x-auto py-6 scrollbar-hide items-center">
                        {GEN_Z_COLORS.map((c) => (
                            <button
                                key={c}
                                onClick={() => setColor(c)}
                                className={`w-9 h-9 rounded-full border-2 shrink-0 transition-all ${color === c ? "border-white scale-125 shadow-[0_0_15px_rgba(255,255,255,0.5)]" : "border-transparent"}`}
                                style={{ backgroundColor: c }}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

const ExitConfirmationModal = ({ onConfirm, onCancel }) => (
    <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6"
    >
        <motion.div 
            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="bg-[#1A1A1A] w-full max-w-xs rounded-[2.5rem] p-8 border border-white/10 text-center shadow-2xl"
        >
            <div className="mb-6 flex justify-center">
                <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
                    <AiOutlineDelete size={32} />
                </div>
            </div>
            <h3 className="text-white font-bold text-xl mb-2">Discard Story?</h3>
            <p className="text-white/50 text-sm mb-8">If you exit now, you'll lose all the progress you've made on this story.</p>
            <div className="flex flex-col gap-3">
                <button
                    onClick={onConfirm}
                    className="w-full py-4 rounded-2xl bg-red-500 text-white font-bold hover:bg-red-600 transition-colors"
                >
                    Discard
                </button>
                <button
                    onClick={onCancel}
                    className="w-full py-4 rounded-2xl bg-white/5 text-white font-bold border border-white/10 hover:bg-white/10 transition-colors"
                >
                    Keep Editing
                </button>
            </div>
        </motion.div>
    </motion.div>
);

export default StoryEditor;

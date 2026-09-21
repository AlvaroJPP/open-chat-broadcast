import { ChevronRight, File, FileCode2, Folder, FolderOpen, X } from "lucide-react";

interface FileNode {
    name: string;
    icon?: "folder" | "file" | "code";
    open?: boolean;
    depth: number;
}

const explorerTree: FileNode[] = [
    { name: "OPEN-CHAT-BROADCAST", icon: "folder", open: true, depth: 0 },
    { name: ".vscode", icon: "folder", depth: 1 },
    { name: "node_modules", icon: "folder", depth: 1 },
    { name: "public", icon: "folder", depth: 1 },
    { name: "src", icon: "folder", open: true, depth: 1 },
    { name: "components", icon: "folder", open: true, depth: 2 },
    { name: "Chat.jsx", icon: "code", depth: 3 },
    { name: "Stream.jsx", icon: "code", depth: 3 },
    { name: "Users.jsx", icon: "code", depth: 3 },
    { name: "pages", icon: "folder", depth: 2 },
    { name: "Home.jsx", icon: "code", depth: 3 },
    { name: "Room.jsx", icon: "code", depth: 3 },
    { name: "services", icon: "folder", depth: 2 },
    { name: "api.js", icon: "file", depth: 3 },
    { name: "socket.js", icon: "file", depth: 3 },
    { name: "utils", icon: "folder", open: true, depth: 2 },
    { name: "constants.js", icon: "file", depth: 3 },
    { name: "index.jsx", icon: "code", depth: 1 },
    { name: "package.json", icon: "file", depth: 1 },
    { name: "vite.config.js", icon: "file", depth: 1 },
];

const codeLines = [
    { n: 1, code: [["kw", "import"], ["pl", " { useEffect, useState, useRef } "], ["kw", "from"], ["str", " 'react'"]] },
    { n: 2, code: [["kw", "import"], ["pl", " { getMessages, sendMessage } "], ["kw", "from"], ["str", " '../services/api'"]] },
    { n: 3, code: [] },
    { n: 4, code: [["kw", "import"], ["pl", " { socket } "], ["kw", "from"], ["str", " '../services/socket'"]] },
    { n: 5, code: [["kw", "import"], ["pl", " { formatTime } "], ["kw", "from"], ["str", " '../utils/constants'"]] },
    { n: 6, code: [] },
    { n: 7, code: [["kw", "export default function"], ["fn", " Chat"], ["pl", "({ roomId, user }) {"]] },
    { n: 8, code: [["pl", "  const [messages, setMessages] = "], ["fn", "useState"], ["pl", "([])"]] },
    { n: 9, code: [["pl", "  const [input, setInput] = "], ["fn", "useState"], ["pl", "('')"]] },
    { n: 10, code: [["pl", "  const messagesEndRef = "], ["fn", "useRef"], ["pl", "(null)"]] },
    { n: 11, code: [] },
    { n: 12, code: [["fn", "  useEffect"], ["pl", "(() => {"]] },
    { n: 13, code: [["kw", "    const"], ["pl", " loadMessages = "], ["kw", "async"], ["pl", " () => {"]] },
    { n: 14, code: [["kw", "      try"], ["pl", " {"]] },
    { n: 15, code: [["kw", "        const"], ["pl", " data = "], ["kw", "await"], ["fn", " getMessages"], ["pl", "(roomId)"]] },
    { n: 16, code: [["fn", "        setMessages"], ["pl", "(data)"]] },
    { n: 17, code: [["pl", "      } "], ["kw", "catch"], ["pl", " (error) {"]] },
    { n: 18, code: [["pl", "        console."], ["fn", "error"], ["str", "('Erro ao carregar mensagens:'"], ["pl", ", error)"]] },
    { n: 19, code: [["pl", "      }"]] },
    { n: 20, code: [["pl", "    }"]] },
    { n: 21, code: [["fn", "    loadMessages"], ["pl", "()"]] },
    { n: 22, code: [["pl", "  }, [roomId])"]] },
];

const tokenClass: Record<string, string> = {
    kw: "text-accent",
    pl: "text-foreground/80",
    fn: "text-primary",
    str: "text-success",
};

function ExplorerIcon({ icon, open }: { icon?: FileNode["icon"]; open?: boolean }) {
    if (icon === "folder") return open ? <FolderOpen className="size-3.5 text-accent" /> : <Folder className="size-3.5 text-accent" />;
    if (icon === "code") return <FileCode2 className="size-3.5 text-primary" />;
    return <File className="size-3.5 text-muted-foreground" />;
}

export function CodeEditorPreview() {
    return (
        <div className="grid h-full grid-cols-[13rem_1fr] overflow-hidden rounded-xl border border-border bg-[oklch(0.13_0.03_245)] text-[11px] text-foreground/80">
            {/* Explorer */}
            <div className="hidden flex-col overflow-y-auto border-r border-border/70 py-2 sm:flex">
                <span className="px-3 pb-2 text-[10px] font-semibold tracking-wide text-muted-foreground">EXPLORER</span>
                <ul>
                    {explorerTree.map((node) => (
                        <li
                            key={node.name}
                            className="flex cursor-default items-center gap-1.5 px-2 py-[3px] hover:bg-white/5"
                            style={{ paddingLeft: `${8 + node.depth * 12}px` }}
                        >
                            {node.icon === "folder" && (
                                <ChevronRight className={`size-3 shrink-0 text-muted-foreground ${node.open ? "rotate-90" : ""}`} />
                            )}
                            <ExplorerIcon icon={node.icon} open={node.open} />
                            <span className="truncate">{node.name}</span>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Editor */}
            <div className="flex min-w-0 flex-col">
                <div className="flex items-center gap-1 border-b border-border/70 bg-black/10 px-2 pt-2">
                    <div className="flex items-center gap-1.5 rounded-t-md border border-b-0 border-border/70 bg-[oklch(0.16_0.035_245)] px-3 py-1.5 text-foreground">
                        <FileCode2 className="size-3.5 text-primary" />
                        Chat.jsx
                        <X className="size-3 text-muted-foreground" />
                    </div>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2 font-mono leading-5">
                    {codeLines.map((line) => (
                        <div key={line.n} className="flex gap-3">
                            <span className="w-4 shrink-0 select-none text-right text-muted-foreground/50">{line.n}</span>
                            <span className="whitespace-pre">
                                {line.code.length === 0
                                    ? "\u00A0"
                                    : line.code.map(([type, text], i) => (
                                        <span key={i} className={tokenClass[type]}>
                                            {text}
                                        </span>
                                    ))}
                            </span>
                        </div>
                    ))}
                </div>
                <div className="flex items-center justify-between border-t border-border/70 px-3 py-1 text-[10px] text-muted-foreground">
                    <span>Ln 12, Col 3 · Spaces: 2</span>
                    <span>UTF-8 · JavaScript JSX</span>
                </div>
            </div>
        </div>
    );
}
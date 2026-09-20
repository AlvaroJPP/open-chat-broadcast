import * as React from "react";
import { Delete, X, ArrowUpCircle, CornerDownLeft } from "lucide-react";

import { cn } from "@/lib/utils";

export type KeyboardMode = "numeric" | "alphanumeric";

export interface KeyboardEventPayload {
    value: string;
    key?: string;
}

export interface KeyboardProps extends React.HTMLAttributes<HTMLDivElement> {
    /** Modo de exibição do teclado */
    mode?: KeyboardMode;
    /** Valor controlado do input */
    value?: string;
    /** Valor inicial (não controlado) */
    defaultValue?: string;
    /** Controla se o teclado está visível */
    open?: boolean;
    /** Título exibido no cabeçalho */
    title?: string;
    /** Máscara opcional para o valor (ex: senha) */
    mask?: boolean;
    /** Tamanho máximo de caracteres */
    maxLength?: number;
    /** Disparado ao digitar qualquer tecla */
    onKeyPress?: (payload: KeyboardEventPayload) => void;
    /** Disparado quando o valor muda (equivalente a onChange) */
    onValueChange?: (value: string) => void;
    /** Disparado ao abrir o teclado */
    onOpen?: () => void;
    /** Disparado ao fechar o teclado (X ou fora) */
    onClose?: () => void;
    /** Disparado ao confirmar (Enter) */
    onConfirm?: (value: string) => void;
    /** Disparado ao limpar tudo */
    onClear?: () => void;
}

const NUMERIC_ROWS: string[][] = [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
    [".", "0", "backspace"],
];

const ALPHA_ROWS: string[][] = [
    ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"],
    ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
    ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
    ["shift", "Z", "X", "C", "V", "B", "N", "M", "backspace"],
    ["space", "@", ".", "-", "enter"],
];

const KeyboardKey = React.forwardRef<
    HTMLButtonElement,
    React.ButtonHTMLAttributes<HTMLButtonElement> & { wide?: boolean }
>(({ className, wide, children, ...props }, ref) => (
    <button
        ref={ref}
        type="button"
        className={cn(
            "select-none rounded-lg border bg-background text-foreground shadow-sm",
            "flex items-center justify-center font-medium",
            "h-12 sm:h-14 text-base sm:text-lg",
            "active:scale-95 active:bg-muted transition-transform duration-75",
            "touch-manipulation",
            wide ? "flex-[2]" : "flex-1",
            className,
        )}
        {...props}
    >
        {children}
    </button>
));
KeyboardKey.displayName = "KeyboardKey";

/**
 * Teclado virtual responsivo para totens de autoatendimento.
 * Suporta modo numérico e alfanumérico, com eventos de abertura,
 * fechamento, leitura de teclas e confirmação.
 */
const Keyboard = React.forwardRef<HTMLDivElement, KeyboardProps>(
    (
        {
            className,
            mode = "alphanumeric",
            value,
            defaultValue = "",
            open = true,
            title,
            mask = false,
            maxLength,
            onKeyPress,
            onValueChange,
            onOpen,
            onClose,
            onConfirm,
            onClear,
            ...props
        },
        ref,
    ) => {
        const isControlled = value !== undefined;
        const [internalValue, setInternalValue] = React.useState(defaultValue);
        const [shift, setShift] = React.useState(false);
        const currentValue = isControlled ? value : internalValue;

        const hasOpened = React.useRef(false);
        React.useEffect(() => {
            if (open && !hasOpened.current) {
                hasOpened.current = true;
                onOpen?.();
            }
            if (!open) {
                hasOpened.current = false;
            }
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [open]);

        const commitValue = React.useCallback(
            (next: string) => {
                if (!isControlled) setInternalValue(next);
                onValueChange?.(next);
            },
            [isControlled, onValueChange],
        );

        const handleKey = (key: string) => {
            onKeyPress?.({ value: currentValue ?? "", key });

            if (key === "backspace") {
                commitValue((currentValue ?? "").slice(0, -1));
                return;
            }
            if (key === "shift") {
                setShift((s) => !s);
                return;
            }
            if (key === "space") {
                appendChar(" ");
                return;
            }
            if (key === "enter") {
                onConfirm?.(currentValue ?? "");
                return;
            }
            appendChar(shift ? key.toUpperCase() : key.length === 1 ? key : key);
        };

        const appendChar = (char: string) => {
            const next = (currentValue ?? "") + char;
            if (maxLength && next.length > maxLength) return;
            commitValue(next);
        };

        const handleClear = () => {
            commitValue("");
            onClear?.();
        };

        const handleClose = () => {
            onClose?.();
        };

        if (!open) return null;

        const rows = mode === "numeric" ? NUMERIC_ROWS : ALPHA_ROWS;
        const displayValue = mask
            ? "•".repeat((currentValue ?? "").length)
            : currentValue ?? "";

        return (
            <div
                ref={ref}
                role="group"
                aria-label={title ?? "Teclado virtual"}
                className={cn(
                    "w-full max-w-2xl mx-auto rounded-2xl border bg-card p-3 sm:p-5 shadow-lg",
                    "flex flex-col gap-3",
                    className,
                )}
                {...props}
            >
                {/* Cabeçalho */}
                <div className="flex items-center justify-between gap-2">
                    <span className="text-sm sm:text-base font-medium text-muted-foreground truncate">
                        {title ?? "Digite abaixo"}
                    </span>
                    <button
                        type="button"
                        aria-label="Fechar teclado"
                        onClick={handleClose}
                        className="rounded-full p-2 hover:bg-muted transition-colors"
                    >
                        <X className="h-4 w-4 sm:h-5 sm:w-5" />
                    </button>
                </div>

                {/* Display */}
                <div
                    className={cn(
                        "min-h-12 sm:min-h-14 w-full rounded-lg border bg-muted/40 px-3 sm:px-4",
                        "flex items-center text-lg sm:text-xl font-mono tracking-wide overflow-x-auto",
                    )}
                >
                    <span className="truncate">{displayValue || "\u00A0"}</span>
                </div>

                {/* Teclas */}
                <div className="flex flex-col gap-2">
                    {rows.map((row, rowIdx) => (
                        <div key={rowIdx} className="flex gap-2">
                            {row.map((key) => {
                                if (key === "backspace") {
                                    return (
                                        <KeyboardKey key={key} wide onClick={() => handleKey(key)} aria-label="Apagar">
                                            <Delete className="h-5 w-5" />
                                        </KeyboardKey>
                                    );
                                }
                                if (key === "shift") {
                                    return (
                                        <KeyboardKey
                                            key={key}
                                            onClick={() => handleKey(key)}
                                            aria-pressed={shift}
                                            aria-label="Maiúsculas"
                                            className={cn(shift && "bg-primary text-primary-foreground")}
                                        >
                                            <ArrowUpCircle className="h-5 w-5" />
                                        </KeyboardKey>
                                    );
                                }
                                if (key === "space") {
                                    return (
                                        <KeyboardKey
                                            key={key}
                                            wide
                                            onClick={() => handleKey(key)}
                                            aria-label="Espaço"
                                            className="flex-[4]"
                                        >
                                            espaço
                                        </KeyboardKey>
                                    );
                                }
                                if (key === "enter") {
                                    return (
                                        <KeyboardKey
                                            key={key}
                                            wide
                                            onClick={() => handleKey(key)}
                                            aria-label="Confirmar"
                                            className="bg-primary text-primary-foreground"
                                        >
                                            <CornerDownLeft className="h-5 w-5" />
                                        </KeyboardKey>
                                    );
                                }
                                return (
                                    <KeyboardKey key={key} onClick={() => handleKey(key)}>
                                        {shift ? key.toUpperCase() : key}
                                    </KeyboardKey>
                                );
                            })}
                        </div>
                    ))}
                </div>

                {/* Ações extras */}
                <div className="flex justify-between gap-2 pt-1">
                    <button
                        type="button"
                        onClick={handleClear}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                        Limpar campo
                    </button>
                    <button
                        type="button"
                        onClick={() => onConfirm?.(currentValue ?? "")}
                        className="text-sm font-medium text-primary hover:underline"
                    >
                        Confirmar
                    </button>
                </div>
            </div>
        );
    },
);
Keyboard.displayName = "Keyboard";

export { Keyboard, KeyboardKey };
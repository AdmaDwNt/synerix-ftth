/**
 * ============================================================================
 * MODUL       : Synerix UI Provider (Global Notification & Confirm System)
 * FILE        : src/components/providers/SynerixUIProvider.tsx
 * DESKRIPSI   : Provider aplikasi tingkat atas (Root Context) yang menyediakan:
 *               1. Unified Notification System:
 *                  - Toast: Notifikasi kanan bawah dengan detail & tombol aksi
 *                  - Snackbar: Notifikasi pil minimalis bawah tengah
 *                  - Alert Banner: Banner penuh atas layar untuk pengumuman/peringatan
 *               2. Promise-based Confirm Modal (SynerixConfirmModal):
 *                  - Menghilangkan dialog native browser (alert() / confirm())
 *                  - Cukup dipanggil via: const ok = await confirm({ title, ... })
 * ============================================================================
 */

"use client";

import React, {
    createContext,
    useContext,
    useState,
    useCallback,
    useRef,
    ReactNode,
} from "react";
import SynerixNotify, {
    NotifyItem,
    NotifyMode,
    NotifyVariant,
} from "@/components/ui/SynerixNotify";
import SynerixConfirmModal, {
    ConfirmVariant,
} from "@/components/ui/SynerixConfirmModal";

// ----------------------------------------------------------------------------
// DEFINISI TIPE & INTERFACE
// ----------------------------------------------------------------------------
export interface ConfirmOptions {
    title: string;
    description?: ReactNode | string;
    itemName?: string;
    itemBadge?: string;
    itemMeta?: string;
    confirmText?: string;
    cancelText?: string;
    variant?: ConfirmVariant;
    icon?: ReactNode;
}

export interface NotifyHelperOptions {
    title?: string;
    mode?: NotifyMode;
    durationMs?: number;
    actionLabel?: string;
    onAction?: () => void;
    linkLabel?: string;
    linkHref?: string;
    persistent?: boolean;
    icon?: ReactNode;
}

export interface SynerixUIContextType {
    // Shorthand method notify
    toast: (
        variant: NotifyVariant,
        message: string,
        opts?: Partial<Omit<NotifyItem, "id" | "mode" | "variant" | "message">>
    ) => string;
    snackbar: (
        variant: NotifyVariant,
        message: string,
        opts?: Partial<Omit<NotifyItem, "id" | "mode" | "variant" | "message">>
    ) => string;
    banner: (
        variant: NotifyVariant,
        message: string,
        opts?: Partial<Omit<NotifyItem, "id" | "mode" | "variant" | "message">>
    ) => string;

    // Quick helpers
    success: (message: string, opts?: NotifyHelperOptions) => string;
    error: (message: string, opts?: NotifyHelperOptions) => string;
    warning: (message: string, opts?: NotifyHelperOptions) => string;
    info: (message: string, opts?: NotifyHelperOptions) => string;

    // Control
    dismiss: (id: string) => void;
    clearAll: () => void;

    // Promise-based Confirm Modal
    confirm: (options: ConfirmOptions) => Promise<boolean>;
}

// ----------------------------------------------------------------------------
// REACT CONTEXT
// ----------------------------------------------------------------------------
const SynerixUIContext = createContext<SynerixUIContextType | null>(null);

// ----------------------------------------------------------------------------
// PROVIDER COMPONENT
// ----------------------------------------------------------------------------
export function SynerixUIProvider({ children }: { children: ReactNode }) {
    // State Notifikasi
    const [notifyItems, setNotifyItems] = useState<NotifyItem[]>([]);

    const pushNotify = useCallback((item: Omit<NotifyItem, "id">) => {
        const id = `synerix-notify-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        setNotifyItems((prev) => [...prev, { ...item, id }]);
        return id;
    }, []);

    const dismissNotify = useCallback((id: string) => {
        setNotifyItems((prev) => prev.filter((n) => n.id !== id));
    }, []);

    const clearAllNotify = useCallback(() => {
        setNotifyItems([]);
    }, []);

    // Method toast
    const toast = useCallback(
        (
            variant: NotifyVariant,
            message: string,
            opts?: Partial<Omit<NotifyItem, "id" | "mode" | "variant" | "message">>
        ) => pushNotify({ mode: "toast", variant, message, ...opts }),
        [pushNotify]
    );

    // Method snackbar
    const snackbar = useCallback(
        (
            variant: NotifyVariant,
            message: string,
            opts?: Partial<Omit<NotifyItem, "id" | "mode" | "variant" | "message">>
        ) => pushNotify({ mode: "snackbar", variant, message, ...opts }),
        [pushNotify]
    );

    // Method banner
    const banner = useCallback(
        (
            variant: NotifyVariant,
            message: string,
            opts?: Partial<Omit<NotifyItem, "id" | "mode" | "variant" | "message">>
        ) => pushNotify({ mode: "banner", variant, message, persistent: true, ...opts }),
        [pushNotify]
    );

    // Shorthands
    const success = useCallback(
        (message: string, opts?: NotifyHelperOptions) => {
            const mode = opts?.mode || "snackbar";
            return pushNotify({
                mode,
                variant: "success",
                message,
                ...opts,
            });
        },
        [pushNotify]
    );

    const error = useCallback(
        (message: string, opts?: NotifyHelperOptions) => {
            const mode = opts?.mode || "toast";
            return pushNotify({
                mode,
                variant: "error",
                message,
                ...opts,
            });
        },
        [pushNotify]
    );

    const warning = useCallback(
        (message: string, opts?: NotifyHelperOptions) => {
            const mode = opts?.mode || "snackbar";
            return pushNotify({
                mode,
                variant: "warning",
                message,
                ...opts,
            });
        },
        [pushNotify]
    );

    const info = useCallback(
        (message: string, opts?: NotifyHelperOptions) => {
            const mode = opts?.mode || "toast";
            return pushNotify({
                mode,
                variant: "info",
                message,
                ...opts,
            });
        },
        [pushNotify]
    );

    // State Confirm Modal
    const [confirmModalState, setConfirmModalState] = useState<{
        isOpen: boolean;
        options: ConfirmOptions;
    }>({
        isOpen: false,
        options: { title: "" },
    });

    const confirmResolveRef = useRef<((value: boolean) => void) | null>(null);

    const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
        return new Promise<boolean>((resolve) => {
            confirmResolveRef.current = resolve;
            setConfirmModalState({
                isOpen: true,
                options,
            });
        });
    }, []);

    const handleConfirmClose = useCallback(() => {
        setConfirmModalState((prev) => ({ ...prev, isOpen: false }));
        if (confirmResolveRef.current) {
            confirmResolveRef.current(false);
            confirmResolveRef.current = null;
        }
    }, []);

    const handleConfirmSubmit = useCallback(() => {
        setConfirmModalState((prev) => ({ ...prev, isOpen: false }));
        if (confirmResolveRef.current) {
            confirmResolveRef.current(true);
            confirmResolveRef.current = null;
        }
    }, []);

    const value: SynerixUIContextType = {
        toast,
        snackbar,
        banner,
        success,
        error,
        warning,
        info,
        dismiss: dismissNotify,
        clearAll: clearAllNotify,
        confirm,
    };

    return (
        <SynerixUIContext.Provider value={value}>
            {children}

            {/* Render Synerix Unified Notifications */}
            <SynerixNotify items={notifyItems} onDismiss={dismissNotify} />

            {/* Render Global Confirm Modal */}
            <SynerixConfirmModal
                isOpen={confirmModalState.isOpen}
                onClose={handleConfirmClose}
                onConfirm={handleConfirmSubmit}
                title={confirmModalState.options.title}
                description={confirmModalState.options.description}
                itemName={confirmModalState.options.itemName}
                itemBadge={confirmModalState.options.itemBadge}
                itemMeta={confirmModalState.options.itemMeta}
                confirmText={confirmModalState.options.confirmText}
                cancelText={confirmModalState.options.cancelText}
                variant={confirmModalState.options.variant}
                icon={confirmModalState.options.icon}
            />
        </SynerixUIContext.Provider>
    );
}

// ----------------------------------------------------------------------------
// HOOKS
// ----------------------------------------------------------------------------
export function useSynerixUI(): SynerixUIContextType {
    const ctx = useContext(SynerixUIContext);
    if (!ctx) {
        throw new Error("useSynerixUI harus digunakan di dalam <SynerixUIProvider>");
    }
    return ctx;
}

export function useConfirm() {
    const { confirm } = useSynerixUI();
    return confirm;
}

export function useNotifyGlobal() {
    const { toast, snackbar, banner, success, error, warning, info, dismiss, clearAll } =
        useSynerixUI();
    return { toast, snackbar, banner, success, error, warning, info, dismiss, clearAll };
}

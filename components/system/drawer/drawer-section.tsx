import { cn } from "@/lib/utils";
import { AdminButton } from "@/components/system/actions/admin-button";

type DrawerHeaderProps = {
    title?: string;
    description?: string;
    onClose?: () => void;
    children?: React.ReactNode;
    className?: string;
};

export function DrawerHeader({
    title,
    description,
    onClose,
    children,
    className,
}: DrawerHeaderProps) {
    return (
        <div className={cn("px-6 py-5", className)}>
            {title || description || onClose ? (
                <div className="flex items-start justify-between">
                    <div>
                        {title && (
                            <h2 className="text-xl font-semibold text-white">{title}</h2>
                        )}
                        {description && (
                            <p className="mt-2 text-sm text-zinc-400">{description}</p>
                        )}
                    </div>

                    {onClose && (
                        <AdminButton variant="ghost" onClick={onClose} className="px-3 py-2">
                            Close
                        </AdminButton>
                    )}
                </div>
            ) : null}

            {children}
        </div>
    );
}
export function DrawerBody({
    children,
    className,
}: {
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <div className={cn("flex-1 overflow-y-auto px-6 py-6", className)}>
            {children}
        </div>
    );
}
export function DrawerFooter({
    children,
    className,
}: {
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <div className={cn("flex items-center justify-end gap-3 px-6 py-4", className)}>
            {children}
        </div>
    );
}
export function DrawerDivider({ className }: { className?: string }) {
    return <div className={cn("h-px bg-white/[0.04]", className)} />;
}
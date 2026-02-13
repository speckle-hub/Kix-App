import { motion } from "framer-motion";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function Button({
    className,
    variant = 'primary',
    size = 'md',
    ...props
}) {
    const variants = {
        primary: "bg-primary text-background hover:bg-primary/90",
        secondary: "bg-secondary text-white hover:bg-secondary/80",
        outline: "border-2 border-primary text-primary hover:bg-primary/10",
        ghost: "text-primary hover:bg-primary/10",
    };

    const sizes = {
        sm: "px-3 py-1.5 text-sm",
        md: "px-6 py-3 text-base font-bold",
        lg: "px-8 py-4 text-lg font-bold",
    };

    return (
        <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={cn(
                "rounded-xl transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none active:brightness-95",
                variants[variant],
                sizes[size],
                className
            )}
            {...props}
        />
    );
}

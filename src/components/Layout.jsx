import React from 'react';

export function Layout({ children }) {
    return (
        <div className="min-h-screen bg-background text-white flex justify-center pointer-events-none">
            <div className="w-full max-w-[450px] bg-background min-h-screen relative border-x border-white/5 shadow-2xl flex flex-col pointer-events-auto">
                <main className="flex-1 pb-24">
                    {children}
                </main>
            </div>
        </div>
    );
}

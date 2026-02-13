import React from 'react';

export function Layout({ children }) {
    return (
        <div className="min-h-screen bg-background text-white flex justify-center">
            <div className="w-full max-w-[450px] bg-background min-h-screen relative border-x border-white/5 shadow-2xl flex flex-col">
                <main className="flex-1 pb-24">
                    {children}
                </main>
            </div>
        </div>
    );
}

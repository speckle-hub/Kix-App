import { CheckCircle2 } from "lucide-react";

const HISTORY = [
    { id: 1, title: '5v5 Friendly', result: 'W', score: '5 - 3', date: 'Yesterday' },
    { id: 2, title: 'Competitive 7v7', result: 'L', score: '1 - 2', date: '3 days ago' },
    { id: 3, title: 'Local Derby', result: 'D', score: '2 - 2', date: '1 week ago' },
];

export function MatchHistory() {
    return (
        <div className="space-y-4">
            <h3 className="text-xl font-condensed tracking-wide">Recent Matches</h3>
            <div className="grid gap-3">
                {HISTORY.map(match => (
                    <div
                        key={match.id}
                        className="flex items-center justify-between bg-white/5 border border-white/5 rounded-2xl p-4"
                    >
                        <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg
                ${match.result === 'W' ? 'bg-primary/20 text-primary' :
                                    match.result === 'L' ? 'bg-red-500/20 text-red-500' :
                                        'bg-white/10 text-white/60'}`}
                            >
                                {match.result}
                            </div>
                            <div>
                                <h4 className="font-bold text-sm">{match.title}</h4>
                                <p className="text-xs text-white/40">{match.date}</p>
                            </div>
                        </div>
                        <span className="font-condensed font-bold text-xl opacity-60">{match.score}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

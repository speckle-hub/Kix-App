import React from 'react';
import {
    Chart as ChartJS,
    RadialLinearScale,
    PointElement,
    LineElement,
    Filler,
    Tooltip,
    Legend,
} from 'chart.js';
import { Radar } from 'react-chartjs-2';

ChartJS.register(
    RadialLinearScale,
    PointElement,
    LineElement,
    Filler,
    Tooltip,
    Legend
);

export function RadarSkills({ skills }) {
    const data = {
        labels: ['Pace', 'Shooting', 'Passing', 'Dribbling', 'Defending', 'Physical'],
        datasets: [
            {
                label: 'Player Stats',
                data: [
                    skills.pace || 0,
                    skills.shooting || 0,
                    skills.passing || 0,
                    skills.dribbling || 0,
                    skills.defending || 0,
                    skills.physical || 0,
                ],
                backgroundColor: 'rgba(57, 255, 20, 0.2)',
                borderColor: '#39FF14',
                borderWidth: 2,
                pointBackgroundColor: '#39FF14',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: '#39FF14',
            },
        ],
    };

    const options = {
        scales: {
            r: {
                angleLines: {
                    color: 'rgba(255, 255, 255, 0.1)',
                },
                grid: {
                    color: 'rgba(255, 255, 255, 0.1)',
                },
                pointLabels: {
                    color: 'rgba(255, 255, 255, 0.6)',
                    font: {
                        family: 'Inter',
                        size: 10,
                        weight: 'bold',
                    },
                },
                ticks: {
                    display: false,
                    stepSize: 20,
                },
                suggestedMin: 0,
                suggestedMax: 100,
            },
        },
        plugins: {
            legend: {
                display: false,
            },
        },
    };

    return (
        <div className="w-full max-w-[300px] mx-auto p-4 bg-secondary/20 rounded-3xl border border-white/5 backdrop-blur-sm">
            <Radar data={data} options={options} />
        </div>
    );
}

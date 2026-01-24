import { Mail } from 'lucide-react';
import React from 'react'

const Footer = () => {
    return (
        <footer className="relative border-t border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900 backdrop-blur-sm">
            <div className="container mx-auto p-4">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-linear-to-br from-blue-600 to-indigo-600 dark:bg-slate-800 flex items-center justify-center shadow-lg">
                            <Mail className="h-5 w-5 text-white dark:text-slate-300" />
                        </div>
                        <span className="text-lg font-bold bg-linear-to-r from-blue-600 to-indigo-600 dark:from-slate-200 dark:to-slate-300 bg-clip-text text-transparent">
                            AI Intelligence Brief
                        </span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                        © 2026 AI Intelligence Brief. Elevating your AI knowledge.
                    </p>
                </div>
            </div>
        </footer>
    )
}

export default Footer
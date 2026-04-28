'use client'

import type { ReactNode } from 'react'
import { CalendarDays, PencilLine, Rows3, StretchHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

type ViewMode = 'day' | 'range'

interface TrackingFiltersProps {
  title: string
  description: string
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
  selectedDate: string
  onSelectedDateChange: (value: string) => void
  rangeFrom: string
  rangeTo: string
  onRangeFromChange: (value: string) => void
  onRangeToChange: (value: string) => void
  onUseToday: () => void
  onUseLast7Days: () => void
  onUseLast30Days: () => void
  onBatchEdit?: () => void
  batchEditLabel?: string
  accent?: 'orange' | 'cyan' | 'green' | 'blue'
  children?: ReactNode
}

const accentClasses = {
  orange: 'bg-orange-500 text-white hover:bg-orange-600 focus:ring-orange-400',
  cyan: 'bg-cyan-500 text-white hover:bg-cyan-600 focus:ring-cyan-400',
  green: 'bg-emerald-500 text-white hover:bg-emerald-600 focus:ring-emerald-400',
  blue: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-400',
}

export function TrackingFilters({
  title,
  description,
  viewMode,
  onViewModeChange,
  selectedDate,
  onSelectedDateChange,
  rangeFrom,
  rangeTo,
  onRangeFromChange,
  onRangeToChange,
  onUseToday,
  onUseLast7Days,
  onUseLast30Days,
  onBatchEdit,
  batchEditLabel = 'Batch Edit',
  accent = 'orange',
  children,
}: TrackingFiltersProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white/95 p-5 shadow-sm shadow-slate-200/60">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-slate-900">
            <StretchHorizontal className="h-4 w-4 text-slate-500" />
            <h2 className="text-lg font-semibold">{title}</h2>
          </div>
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        </div>

        {onBatchEdit ? (
          <Button
            type="button"
            onClick={onBatchEdit}
            className={cn('cursor-pointer gap-2 rounded-xl px-4 py-2.5 shadow-none', accentClasses[accent])}
          >
            <PencilLine className="h-4 w-4" />
            {batchEditLabel}
          </Button>
        ) : null}
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[auto,1fr]">
        <div className="inline-flex w-full rounded-xl bg-slate-100 p-1 xl:w-auto">
          <button
            type="button"
            onClick={() => onViewModeChange('day')}
            className={cn(
              'flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300',
              viewMode === 'day' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            )}
          >
            <CalendarDays className="h-4 w-4" />
            Day View
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange('range')}
            className={cn(
              'flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300',
              viewMode === 'range' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            )}
          >
            <Rows3 className="h-4 w-4" />
            Range View
          </button>
        </div>

        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr),auto]">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {viewMode === 'day' ? (
              <label className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                <span className="block text-xs font-medium uppercase tracking-[0.18em] text-slate-400">Selected Day</span>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(event) => onSelectedDateChange(event.target.value)}
                  className="mt-2 w-full cursor-pointer bg-transparent text-sm font-medium text-slate-900 outline-none"
                />
              </label>
            ) : (
              <>
                <label className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  <span className="block text-xs font-medium uppercase tracking-[0.18em] text-slate-400">From</span>
                  <input
                    type="date"
                    value={rangeFrom}
                    onChange={(event) => onRangeFromChange(event.target.value)}
                    className="mt-2 w-full cursor-pointer bg-transparent text-sm font-medium text-slate-900 outline-none"
                  />
                </label>
                <label className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  <span className="block text-xs font-medium uppercase tracking-[0.18em] text-slate-400">To</span>
                  <input
                    type="date"
                    value={rangeTo}
                    onChange={(event) => onRangeToChange(event.target.value)}
                    className="mt-2 w-full cursor-pointer bg-transparent text-sm font-medium text-slate-900 outline-none"
                  />
                </label>
              </>
            )}

            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <span className="block text-xs font-medium uppercase tracking-[0.18em] text-slate-400">Quick Presets</span>
              <div className="mt-2 flex flex-wrap gap-2">
                <Button type="button" variant="outline" size="sm" onClick={onUseToday} className="cursor-pointer rounded-lg">
                  Today
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={onUseLast7Days} className="cursor-pointer rounded-lg">
                  Last 7 Days
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={onUseLast30Days} className="cursor-pointer rounded-lg">
                  Last 30 Days
                </Button>
              </div>
            </div>
          </div>

          {children ? <div className="grid gap-3">{children}</div> : null}
        </div>
      </div>
    </section>
  )
}

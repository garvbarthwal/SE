'use client'

import type { ReactNode } from 'react'
import { CalendarDays, PencilLine, Rows3 } from 'lucide-react'
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
  orange: 'border-orange-200 text-orange-700 hover:bg-orange-50 focus:ring-orange-400',
  cyan: 'border-cyan-200 text-cyan-700 hover:bg-cyan-50 focus:ring-cyan-400',
  green: 'border-emerald-200 text-emerald-700 hover:bg-emerald-50 focus:ring-emerald-400',
  blue: 'border-blue-200 text-blue-700 hover:bg-blue-50 focus:ring-blue-400',
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
    <section className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm shadow-slate-200/40">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
          <p className="mt-0.5 max-w-2xl truncate text-xs text-slate-500">{description}</p>
        </div>

        {onBatchEdit ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onBatchEdit}
            className={cn('h-9 shrink-0 cursor-pointer gap-2 rounded-lg bg-white shadow-none', accentClasses[accent])}
          >
            <PencilLine className="h-4 w-4" />
            {batchEditLabel}
          </Button>
        ) : null}
      </div>

      <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="inline-flex w-full shrink-0 rounded-lg bg-slate-100 p-0.5 sm:w-auto">
          <button
            type="button"
            onClick={() => onViewModeChange('day')}
            className={cn(
              'flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300',
              viewMode === 'day' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            )}
          >
            <CalendarDays className="h-3.5 w-3.5" />
            Day
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange('range')}
            className={cn(
              'flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300',
              viewMode === 'range' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            )}
          >
            <Rows3 className="h-3.5 w-3.5" />
            Range
          </button>
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              {viewMode === 'day' ? (
                <label className="flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-600">
                  <span className="shrink-0 text-xs font-medium text-slate-400">Day</span>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(event) => onSelectedDateChange(event.target.value)}
                    className="w-full cursor-pointer bg-transparent text-xs font-medium text-slate-900 outline-none sm:w-auto"
                  />
                </label>
              ) : (
                <>
                  <label className="flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-600">
                    <span className="shrink-0 text-xs font-medium text-slate-400">From</span>
                    <input
                      type="date"
                      value={rangeFrom}
                      onChange={(event) => onRangeFromChange(event.target.value)}
                      className="w-full cursor-pointer bg-transparent text-xs font-medium text-slate-900 outline-none sm:w-auto"
                    />
                  </label>
                  <label className="flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-600">
                    <span className="shrink-0 text-xs font-medium text-slate-400">To</span>
                    <input
                      type="date"
                      value={rangeTo}
                      onChange={(event) => onRangeToChange(event.target.value)}
                      className="w-full cursor-pointer bg-transparent text-xs font-medium text-slate-900 outline-none sm:w-auto"
                    />
                  </label>
                </>
              )}
            </div>

            <div className="flex flex-wrap gap-1.5">
              <Button type="button" variant="outline" size="sm" onClick={onUseToday} className="h-8 cursor-pointer rounded-full px-3 text-xs">
                Today
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={onUseLast7Days} className="h-8 cursor-pointer rounded-full px-3 text-xs">
                7 days
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={onUseLast30Days} className="h-8 cursor-pointer rounded-full px-3 text-xs">
                30 days
              </Button>
            </div>
          </div>

          {children ? <div className="shrink-0">{children}</div> : null}
        </div>
      </div>
    </section>
  )
}

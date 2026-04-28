'use client'

import type { ElementType } from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Clock3, Droplets, GlassWater, PencilLine, Plus, Waves, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { TrackingFilters } from '@/components/tracking/TrackingFilters'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  formatDateKey,
  formatDisplayDate,
  getRelativeDateKey,
  getTodayDateKey,
  toDateTimeLocalValue,
} from '@/lib/tracking'

interface HydrationLog {
  id: string
  amount: number
  createdAt: string
}

interface EditableHydrationRow {
  clientId: string
  id?: string
  amount: string
  createdAt: string
}

const QUICK_AMOUNTS = [250, 500, 750, 1000]
const DAILY_GOAL = 2500

function createHydrationEntry(dateKey = getTodayDateKey()) {
  return {
    amount: '',
    createdAt: `${dateKey}T08:00`,
  }
}

function toEditableHydrationRow(log: HydrationLog): EditableHydrationRow {
  return {
    clientId: log.id,
    id: log.id,
    amount: log.amount.toString(),
    createdAt: toDateTimeLocalValue(log.createdAt),
  }
}

function groupHydrationByDate(logs: HydrationLog[]) {
  return logs.reduce<Record<string, HydrationLog[]>>((groups, log) => {
    const key = formatDateKey(new Date(log.createdAt))
    groups[key] = groups[key] ? [...groups[key], log] : [log]
    return groups
  }, {})
}

export default function HydrationPage() {
  const { status } = useSession()
  const router = useRouter()
  const today = getTodayDateKey()

  const [hydration, setHydration] = useState<HydrationLog[]>([])
  const [totalAmount, setTotalAmount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [batchOpen, setBatchOpen] = useState(false)
  const [batchSaving, setBatchSaving] = useState(false)
  const [batchRows, setBatchRows] = useState<EditableHydrationRow[]>([])
  const [batchDeletedIds, setBatchDeletedIds] = useState<string[]>([])
  const [entryForm, setEntryForm] = useState(createHydrationEntry(today))
  const [viewMode, setViewMode] = useState<'day' | 'range'>('day')
  const [selectedDate, setSelectedDate] = useState(today)
  const [rangeFrom, setRangeFrom] = useState(getRelativeDateKey(-6))
  const [rangeTo, setRangeTo] = useState(today)
  const [filterLabel, setFilterLabel] = useState('Today')

  const fetchHydration = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams(
        viewMode === 'day'
          ? { date: selectedDate }
          : {
              from: rangeFrom,
              to: rangeTo,
            }
      )

      const res = await fetch(`/api/hydration?${params.toString()}`)
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch hydration logs')
      }

      setHydration(data.hydration || [])
      setTotalAmount(data.totalAmount || 0)
      setFilterLabel(data.filters?.label || (viewMode === 'day' ? selectedDate : `${rangeFrom} to ${rangeTo}`))
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : 'Failed to fetch hydration logs')
      setHydration([])
      setTotalAmount(0)
    } finally {
      setLoading(false)
    }
  }, [rangeFrom, rangeTo, selectedDate, viewMode])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }

    if (status === 'authenticated') {
      void fetchHydration()
    }
  }, [status, router, fetchHydration])

  useEffect(() => {
    setEntryForm((current) => ({
      ...current,
      createdAt: `${viewMode === 'day' ? selectedDate : today}T08:00`,
    }))
  }, [selectedDate, viewMode, today])

  async function addWater(amount: number) {
    setSubmitting(true)

    try {
      const res = await fetch('/api/hydration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          createdAt: entryForm.createdAt,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to add hydration log')
      }

      setEntryForm(createHydrationEntry(viewMode === 'day' ? selectedDate : today))
      await fetchHydration()
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Failed to add hydration log')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleCustomEntry(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!entryForm.amount) {
      setError('Enter an amount before saving hydration.')
      return
    }

    await addWater(Number(entryForm.amount))
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/hydration/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to delete hydration log')
      }

      await fetchHydration()
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Failed to delete hydration log')
    }
  }

  function openBatchEditor() {
    setBatchRows(hydration.map(toEditableHydrationRow))
    setBatchDeletedIds([])
    setBatchOpen(true)
  }

  function addBatchRow() {
    const baseDate = viewMode === 'day' ? selectedDate : rangeTo

    setBatchRows((currentRows) => [
      ...currentRows,
      {
        clientId: `new-${Date.now()}-${currentRows.length}`,
        amount: '',
        createdAt: `${baseDate}T08:00`,
      },
    ])
  }

  function updateBatchRow(clientId: string, field: keyof EditableHydrationRow, value: string) {
    setBatchRows((currentRows) =>
      currentRows.map((row) => (row.clientId === clientId ? { ...row, [field]: value } : row))
    )
  }

  function removeBatchRow(clientId: string) {
    const row = batchRows.find((currentRow) => currentRow.clientId === clientId)
    if (row?.id) {
      setBatchDeletedIds((currentIds) => (
        currentIds.includes(row.id!) ? currentIds : [...currentIds, row.id!]
      ))
    }

    setBatchRows((currentRows) => currentRows.filter((row) => row.clientId !== clientId))
  }

  async function saveBatchChanges() {
    setBatchSaving(true)
    setError(null)

    try {
      const existingRows = batchRows.filter((row) => row.id)
      const newRows = batchRows.filter((row) => !row.id)

      const normalizeRow = (row: EditableHydrationRow) => {
        if (!row.amount.trim() || !row.createdAt.trim()) {
          throw new Error('Each hydration row needs an amount and date/time.')
        }

        return {
          ...(row.id ? { id: row.id } : {}),
          amount: Number(row.amount),
          createdAt: row.createdAt,
        }
      }

      if (existingRows.length > 0) {
        const res = await fetch('/api/hydration', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(existingRows.map(normalizeRow)),
        })

        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || 'Failed to update hydration logs')
        }
      }

      if (newRows.length > 0) {
        const res = await fetch('/api/hydration', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newRows.map(normalizeRow)),
        })

        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || 'Failed to add hydration logs')
        }
      }

      if (batchDeletedIds.length > 0) {
        await Promise.all(
          batchDeletedIds.map(async (id) => {
            const res = await fetch(`/api/hydration/${id}`, { method: 'DELETE' })
            if (!res.ok) {
              const data = await res.json()
              throw new Error(data.error || 'Failed to remove hydration logs')
            }
          })
        )
      }

      setBatchOpen(false)
      setBatchDeletedIds([])
      await fetchHydration()
    } catch (batchError) {
      setError(batchError instanceof Error ? batchError.message : 'Failed to save hydration updates')
    } finally {
      setBatchSaving(false)
    }
  }

  const groupedHydration = useMemo(() => groupHydrationByDate(hydration), [hydration])
  const progressPercent = Math.min((totalAmount / DAILY_GOAL) * 100, 100)
  const rangeDayCount = viewMode === 'day' ? 1 : Math.max(1, Math.round((new Date(`${rangeTo}T00:00:00`).getTime() - new Date(`${rangeFrom}T00:00:00`).getTime()) / 86400000) + 1)
  const averagePerDay = Math.round(totalAmount / rangeDayCount)

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-orange-500 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Hydration</h1>
          <p className="mt-1 text-slate-500">Track water for a single day or audit a longer window without losing the quick-add flow.</p>
        </div>

        <Button
          type="button"
          onClick={() => {
            setShowForm((visible) => {
              const nextVisible = !visible
              if (nextVisible) {
                setEntryForm(createHydrationEntry(viewMode === 'day' ? selectedDate : today))
              }
              return nextVisible
            })
          }}
          className="cursor-pointer gap-2 rounded-xl"
        >
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showForm ? 'Close Entry' : 'Quick Add'}
        </Button>
      </div>

      <TrackingFilters
        title="Filter Water History"
        description="Stay in a focused daily mode or widen the lens to compare habits across a range."
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        selectedDate={selectedDate}
        onSelectedDateChange={setSelectedDate}
        rangeFrom={rangeFrom}
        rangeTo={rangeTo}
        onRangeFromChange={setRangeFrom}
        onRangeToChange={setRangeTo}
        onUseToday={() => {
          setViewMode('day')
          setSelectedDate(today)
        }}
        onUseLast7Days={() => {
          setViewMode('range')
          setRangeFrom(getRelativeDateKey(-6))
          setRangeTo(today)
        }}
        onUseLast30Days={() => {
          setViewMode('range')
          setRangeFrom(getRelativeDateKey(-29))
          setRangeTo(today)
        }}
        onBatchEdit={openBatchEditor}
        batchEditLabel="Batch Edit Water Logs"
        accent="cyan"
      >
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <span className="block text-xs font-medium uppercase tracking-[0.18em] text-slate-400">Loaded Window</span>
          <p className="mt-2 text-sm font-medium text-slate-900">{filterLabel}</p>
          <p className="mt-1 text-xs text-slate-500">{hydration.length} hydration entry{hydration.length === 1 ? '' : 'ies'} available</p>
        </div>
      </TrackingFilters>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Water Logged" value={`${totalAmount} ml`} helper="Volume in the active window" icon={Droplets} accent="cyan" />
        <StatCard label="Average / Day" value={`${averagePerDay} ml`} helper="Daily pace across the window" icon={Waves} accent="blue" />
        <StatCard label="Goal Progress" value={`${Math.round(progressPercent)}%`} helper="Against the 2500ml target" icon={GlassWater} accent="emerald" />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-cyan-500 to-blue-600 p-1 shadow-sm shadow-cyan-200/70">
        <div className="rounded-[calc(1rem-1px)] bg-white px-6 py-8">
          <div className="grid gap-6 lg:grid-cols-[auto,1fr] lg:items-center">
            <div className="mx-auto flex h-40 w-40 items-center justify-center rounded-full border-[10px] border-cyan-100 bg-cyan-50 text-center">
              <div>
                <p className="text-3xl font-bold text-slate-900">{totalAmount}</p>
                <p className="text-sm text-slate-500">of {DAILY_GOAL} ml</p>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 text-slate-900">
                <Droplets className="h-5 w-5 text-cyan-500" />
                <h2 className="text-lg font-semibold">Hydration Progress</h2>
              </div>
              <p className="mt-2 text-sm text-slate-500">
                {progressPercent >= 100 ? 'Goal reached for the selected day or range.' : `${Math.max(DAILY_GOAL - totalAmount, 0)} ml remaining to hit the goal.`}
              </p>
              <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300" style={{ width: `${progressPercent}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {showForm ? (
        <form onSubmit={handleCustomEntry} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Quick Add Water</h2>
              <p className="mt-1 text-sm text-slate-500">Every button respects the date and time below, so you can fill today or backfill a missed day.</p>
            </div>
            <PencilLine className="h-5 w-5 text-cyan-500" />
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-[1fr,auto] xl:items-end">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <Input
                label="Amount (ml)"
                type="number"
                value={entryForm.amount}
                onChange={(event) => setEntryForm((current) => ({ ...current, amount: event.target.value }))}
              />
              <Input
                label="Logged At"
                type="datetime-local"
                value={entryForm.createdAt}
                onChange={(event) => setEntryForm((current) => ({ ...current, createdAt: event.target.value }))}
                required
              />
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={submitting} className="cursor-pointer rounded-xl px-5">
                {submitting ? 'Saving...' : 'Save Custom Entry'}
              </Button>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {QUICK_AMOUNTS.map((amount) => (
              <Button
                key={amount}
                type="button"
                variant="outline"
                onClick={() => void addWater(amount)}
                disabled={submitting}
                className="cursor-pointer gap-2 rounded-xl"
              >
                <GlassWater className="h-4 w-4" />
                {amount} ml
              </Button>
            ))}
          </div>
        </form>
      ) : null}

      {hydration.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <Droplets className="mx-auto h-10 w-10 text-slate-300" />
          <h2 className="mt-4 text-lg font-semibold text-slate-900">No hydration entries in this view</h2>
          <p className="mt-2 text-sm text-slate-500">Use the date controls above or add a quick entry to start building your water history.</p>
        </div>
      ) : (
        Object.entries(groupedHydration).map(([dateKey, dayLogs]) => (
          <section key={dateKey} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-200/60">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  {formatDisplayDate(`${dateKey}T00:00:00`, { weekday: 'long', month: 'long', day: 'numeric' })}
                </h2>
                <p className="mt-1 text-sm text-slate-500">{dayLogs.length} water log{dayLogs.length === 1 ? '' : 's'}</p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
                {dateKey}
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {dayLogs.map((log) => (
                <article key={log.id} className="flex flex-col gap-4 px-6 py-4 transition-colors hover:bg-slate-50 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-600">
                      <Droplets className="h-5 w-5" />
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">{log.amount} ml</h3>
                      <p className="mt-1 text-sm text-slate-500 flex items-center gap-1">
                        <Clock3 className="h-3.5 w-3.5" />
                        {formatDisplayDate(log.createdAt, {
                          hour: 'numeric',
                          minute: '2-digit',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>

                  <Button type="button" variant="destructive" size="sm" onClick={() => void handleDelete(log.id)} className="cursor-pointer rounded-lg">
                    Delete
                  </Button>
                </article>
              ))}
            </div>
          </section>
        ))
      )}

      <Dialog open={batchOpen} onOpenChange={setBatchOpen}>
        <DialogContent className="w-[calc(100vw-2rem)] !max-w-4xl overflow-hidden rounded-2xl border-slate-200 bg-white p-0 shadow-2xl shadow-slate-950/20">
          <DialogHeader className="border-b border-slate-100 px-6 py-5 pr-14">
            <DialogTitle className="text-xl font-semibold text-slate-950">Batch Edit Hydration Logs</DialogTitle>
            <DialogDescription className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Adjust existing water logs or append extra entries before saving the whole set.
            </DialogDescription>
          </DialogHeader>

          <div className="min-w-0 space-y-4 px-6 py-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-slate-900">{filterLabel}</p>
                <p className="mt-1 text-sm text-slate-500">
                  {batchRows.length} active water row{batchRows.length === 1 ? '' : 's'}
                  {batchDeletedIds.length > 0 ? `, ${batchDeletedIds.length} marked for removal` : ''}
                </p>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addBatchRow} className="w-full cursor-pointer gap-2 rounded-lg border-cyan-200 text-cyan-700 hover:bg-cyan-50 sm:w-auto">
                <Plus className="h-4 w-4" />
                Add Row
              </Button>
            </div>

            {batchRows.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-100 text-cyan-700">
                  <Droplets className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-sm font-semibold text-slate-950">No water rows in this view</h3>
                <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">
                  Add a row to backfill water intake for this date window.
                </p>
                <Button type="button" onClick={addBatchRow} className="mt-5 cursor-pointer gap-2 rounded-lg">
                  <Plus className="h-4 w-4" />
                  Add First Row
                </Button>
              </div>
            ) : (
              <div className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white">
                <div className="max-h-[56vh] overflow-auto">
                  <table className="w-full min-w-[640px] text-left text-sm">
                    <thead className="sticky top-0 z-10 bg-slate-50 text-slate-500 shadow-[inset_0_-1px_0_#e2e8f0]">
                      <tr>
                        <th className="px-4 py-3 font-medium">Amount (ml)</th>
                        <th className="px-4 py-3 font-medium">Logged At</th>
                        <th className="px-4 py-3 font-medium text-right">Row</th>
                      </tr>
                    </thead>
                    <tbody>
                      {batchRows.map((row) => (
                        <tr key={row.clientId} className="border-t border-slate-100 align-top hover:bg-slate-50">
                          <td className="px-4 py-3">
                            <input type="number" value={row.amount} onChange={(event) => updateBatchRow(row.clientId, 'amount', event.target.value)} className="w-32 rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400" />
                          </td>
                          <td className="px-4 py-3">
                            <input type="datetime-local" value={row.createdAt} onChange={(event) => updateBatchRow(row.clientId, 'createdAt', event.target.value)} className="w-56 rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400" />
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Button type="button" variant="ghost" size="sm" onClick={() => removeBatchRow(row.clientId)} className="cursor-pointer text-slate-500 hover:text-slate-900">
                              Remove
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="border-t border-slate-100 bg-slate-50 px-6 py-4">
            <Button type="button" variant="outline" onClick={() => setBatchOpen(false)} className="cursor-pointer rounded-lg">
              Cancel
            </Button>
            <Button type="button" onClick={() => void saveBatchChanges()} disabled={batchSaving || (batchRows.length === 0 && batchDeletedIds.length === 0)} className="cursor-pointer rounded-lg">
              {batchSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function StatCard({
  label,
  value,
  helper,
  icon: Icon,
  accent,
}: {
  label: string
  value: string
  helper: string
  icon: ElementType
  accent: 'cyan' | 'blue' | 'emerald'
}) {
  const iconClasses = {
    cyan: 'bg-cyan-50 text-cyan-600',
    blue: 'bg-blue-50 text-blue-600',
    emerald: 'bg-emerald-50 text-emerald-600',
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60">
      <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconClasses[accent]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="mt-4 text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">{value}</p>
      <p className="mt-1 text-xs text-slate-400">{helper}</p>
    </div>
  )
}

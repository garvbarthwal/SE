'use client'

import type { ElementType } from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import {
  Activity,
  Clock3,
  Dumbbell,
  Flame,
  Footprints,
  PencilLine,
  Plus,
  Sparkles,
  Trophy,
  X,
} from 'lucide-react'
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

interface Workout {
  id: string
  type: string
  name: string
  duration: number
  calories: number | null
  notes: string | null
  createdAt: string
}

interface EditableWorkoutRow {
  clientId: string
  id?: string
  type: string
  name: string
  duration: string
  calories: string
  notes: string
  createdAt: string
}

const workoutTypeConfig = {
  strength: {
    icon: Dumbbell,
    badgeClass: 'bg-orange-100 text-orange-700',
    panelClass: 'bg-orange-50 text-orange-600',
  },
  cardio: {
    icon: Footprints,
    badgeClass: 'bg-rose-100 text-rose-700',
    panelClass: 'bg-rose-50 text-rose-600',
  },
  flexibility: {
    icon: Activity,
    badgeClass: 'bg-emerald-100 text-emerald-700',
    panelClass: 'bg-emerald-50 text-emerald-600',
  },
  sports: {
    icon: Trophy,
    badgeClass: 'bg-blue-100 text-blue-700',
    panelClass: 'bg-blue-50 text-blue-600',
  },
  other: {
    icon: Sparkles,
    badgeClass: 'bg-slate-100 text-slate-700',
    panelClass: 'bg-slate-100 text-slate-600',
  },
} as const

const workoutTypes = Object.keys(workoutTypeConfig)

function createWorkoutForm(dateKey = getTodayDateKey()) {
  return {
    type: 'strength',
    name: '',
    duration: '',
    calories: '',
    notes: '',
    createdAt: `${dateKey}T07:00`,
  }
}

function toEditableWorkoutRow(workout: Workout): EditableWorkoutRow {
  return {
    clientId: workout.id,
    id: workout.id,
    type: workout.type,
    name: workout.name,
    duration: workout.duration.toString(),
    calories: workout.calories?.toString() ?? '',
    notes: workout.notes ?? '',
    createdAt: toDateTimeLocalValue(workout.createdAt),
  }
}

function groupWorkoutsByDate(workouts: Workout[]) {
  return workouts.reduce<Record<string, Workout[]>>((groups, workout) => {
    const key = formatDateKey(new Date(workout.createdAt))
    groups[key] = groups[key] ? [...groups[key], workout] : [workout]
    return groups
  }, {})
}

export default function WorkoutsPage() {
  const { status } = useSession()
  const router = useRouter()
  const today = getTodayDateKey()

  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [batchOpen, setBatchOpen] = useState(false)
  const [batchSaving, setBatchSaving] = useState(false)
  const [batchRows, setBatchRows] = useState<EditableWorkoutRow[]>([])
  const [viewMode, setViewMode] = useState<'day' | 'range'>('day')
  const [selectedDate, setSelectedDate] = useState(today)
  const [rangeFrom, setRangeFrom] = useState(getRelativeDateKey(-6))
  const [rangeTo, setRangeTo] = useState(today)
  const [filterLabel, setFilterLabel] = useState('Today')
  const [formData, setFormData] = useState(createWorkoutForm(today))

  const fetchWorkouts = useCallback(async () => {
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

      const res = await fetch(`/api/workouts?${params.toString()}`)
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch workouts')
      }

      setWorkouts(data.workouts || [])
      setFilterLabel(data.filters?.label || (viewMode === 'day' ? selectedDate : `${rangeFrom} to ${rangeTo}`))
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : 'Failed to fetch workouts')
      setWorkouts([])
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
      void fetchWorkouts()
    }
  }, [status, router, fetchWorkouts])

  async function handleCreateWorkout(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)

    try {
      const res = await fetch('/api/workouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: formData.type,
          name: formData.name,
          duration: Number(formData.duration),
          calories: formData.calories ? Number(formData.calories) : undefined,
          notes: formData.notes || undefined,
          createdAt: formData.createdAt,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create workout')
      }

      setFormData(createWorkoutForm(viewMode === 'day' ? selectedDate : today))
      setShowForm(false)
      await fetchWorkouts()
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Failed to create workout')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/workouts/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to delete workout')
      }

      await fetchWorkouts()
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Failed to delete workout')
    }
  }

  function openBatchEditor() {
    setBatchRows(workouts.map(toEditableWorkoutRow))
    setBatchOpen(true)
  }

  function addBatchRow() {
    const baseDate = viewMode === 'day' ? selectedDate : rangeTo

    setBatchRows((currentRows) => [
      ...currentRows,
      {
        clientId: `new-${Date.now()}-${currentRows.length}`,
        type: 'strength',
        name: '',
        duration: '',
        calories: '',
        notes: '',
        createdAt: `${baseDate}T07:00`,
      },
    ])
  }

  function updateBatchRow(clientId: string, field: keyof EditableWorkoutRow, value: string) {
    setBatchRows((currentRows) =>
      currentRows.map((row) => (row.clientId === clientId ? { ...row, [field]: value } : row))
    )
  }

  function removeBatchRow(clientId: string) {
    setBatchRows((currentRows) => currentRows.filter((row) => row.clientId !== clientId))
  }

  async function saveBatchChanges() {
    setBatchSaving(true)
    setError(null)

    try {
      const existingRows = batchRows.filter((row) => row.id)
      const newRows = batchRows.filter((row) => !row.id)

      const normalizeRow = (row: EditableWorkoutRow) => {
        if (!row.name.trim() || !row.duration.trim() || !row.createdAt.trim()) {
          throw new Error('Each batch row needs a name, duration, and date/time.')
        }

        return {
          ...(row.id ? { id: row.id } : {}),
          type: row.type,
          name: row.name.trim(),
          duration: Number(row.duration),
          calories: row.calories ? Number(row.calories) : undefined,
          notes: row.notes.trim() || undefined,
          createdAt: row.createdAt,
        }
      }

      if (existingRows.length > 0) {
        const res = await fetch('/api/workouts', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(existingRows.map(normalizeRow)),
        })

        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || 'Failed to update workouts')
        }
      }

      if (newRows.length > 0) {
        const res = await fetch('/api/workouts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newRows.map(normalizeRow)),
        })

        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || 'Failed to add workouts')
        }
      }

      setBatchOpen(false)
      await fetchWorkouts()
    } catch (batchError) {
      setError(batchError instanceof Error ? batchError.message : 'Failed to save batch changes')
    } finally {
      setBatchSaving(false)
    }
  }

  const groupedWorkouts = useMemo(() => groupWorkoutsByDate(workouts), [workouts])
  const totalDuration = workouts.reduce((sum, workout) => sum + workout.duration, 0)
  const totalCalories = workouts.reduce((sum, workout) => sum + (workout.calories || 0), 0)

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
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Workouts</h1>
          <p className="mt-1 text-slate-500">Review any day, scan longer ranges, and update sessions in bulk.</p>
        </div>

        <Button
          type="button"
          onClick={() => {
            setShowForm((visible) => {
              const nextVisible = !visible
              if (nextVisible) {
                setFormData(createWorkoutForm(viewMode === 'day' ? selectedDate : today))
              }
              return nextVisible
            })
          }}
          className="cursor-pointer gap-2 rounded-xl"
        >
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showForm ? 'Close Form' : 'Log Workout'}
        </Button>
      </div>

      <TrackingFilters
        title="Filter Workout History"
        description="Switch between a focused day log and a longer trend window. Quick presets keep navigation fast."
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
        batchEditLabel="Batch Edit Sessions"
        accent="orange"
      >
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <span className="block text-xs font-medium uppercase tracking-[0.18em] text-slate-400">Loaded Window</span>
          <p className="mt-2 text-sm font-medium text-slate-900">{filterLabel}</p>
          <p className="mt-1 text-xs text-slate-500">{workouts.length} session{workouts.length === 1 ? '' : 's'} ready to review</p>
        </div>
      </TrackingFilters>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Sessions" value={workouts.length.toString()} helper="Entries in the active window" icon={Dumbbell} accent="orange" />
        <StatCard label="Duration" value={`${totalDuration} min`} helper="Total planned effort" icon={Clock3} accent="blue" />
        <StatCard label="Calories" value={`${totalCalories} cal`} helper="Tracked energy burn" icon={Flame} accent="rose" />
      </div>

      {showForm ? (
        <form onSubmit={handleCreateWorkout} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Create a Workout Log</h2>
              <p className="mt-1 text-sm text-slate-500">Assign the session to any date and time so your daily view stays accurate.</p>
            </div>
            <PencilLine className="h-5 w-5 text-orange-500" />
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-slate-700">Type</label>
              <select
                value={formData.type}
                onChange={(event) => setFormData((current) => ({ ...current, type: event.target.value }))}
                className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-800 transition-colors focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-400"
              >
                {workoutTypes.map((type) => (
                  <option key={type} value={type}>
                    {type[0].toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <Input label="Workout Name" value={formData.name} onChange={(event) => setFormData((current) => ({ ...current, name: event.target.value }))} required />
            <Input label="Duration (minutes)" type="number" value={formData.duration} onChange={(event) => setFormData((current) => ({ ...current, duration: event.target.value }))} required />
            <Input label="Calories Burned" type="number" value={formData.calories} onChange={(event) => setFormData((current) => ({ ...current, calories: event.target.value }))} />
            <Input label="Logged At" type="datetime-local" value={formData.createdAt} onChange={(event) => setFormData((current) => ({ ...current, createdAt: event.target.value }))} required />
            <div className="md:col-span-2 xl:col-span-1">
              <label className="block text-sm font-medium text-slate-700">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(event) => setFormData((current) => ({ ...current, notes: event.target.value }))}
                rows={1}
                className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-800 transition-colors focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-400"
                placeholder="Optional workout notes"
              />
            </div>
          </div>

          <div className="mt-5 flex justify-end">
            <Button type="submit" disabled={submitting} className="cursor-pointer rounded-xl px-5">
              {submitting ? 'Saving...' : 'Save Workout'}
            </Button>
          </div>
        </form>
      ) : null}

      {workouts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <Dumbbell className="mx-auto h-10 w-10 text-slate-300" />
          <h2 className="mt-4 text-lg font-semibold text-slate-900">No workouts in this view</h2>
          <p className="mt-2 text-sm text-slate-500">Adjust the date range or log a session to build out your workout history.</p>
        </div>
      ) : (
        Object.entries(groupedWorkouts).map(([dateKey, dayWorkouts]) => (
          <section key={dateKey} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-200/60">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  {formatDisplayDate(`${dateKey}T00:00:00`, { weekday: 'long', month: 'long', day: 'numeric' })}
                </h2>
                <p className="mt-1 text-sm text-slate-500">{dayWorkouts.length} workout session{dayWorkouts.length === 1 ? '' : 's'}</p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
                {dateKey}
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {dayWorkouts.map((workout) => {
                const workoutType = workoutTypeConfig[workout.type as keyof typeof workoutTypeConfig] || workoutTypeConfig.other
                const Icon = workoutType.icon

                return (
                  <article key={workout.id} className="flex flex-col gap-4 px-6 py-4 transition-colors hover:bg-slate-50 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-start gap-4">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${workoutType.panelClass}`}>
                        <Icon className="h-5 w-5" />
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${workoutType.badgeClass}`}>
                            {workout.type}
                          </span>
                          <h3 className="text-sm font-semibold text-slate-900">{workout.name}</h3>
                        </div>

                        <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                          <span className="flex items-center gap-1">
                            <Clock3 className="h-3.5 w-3.5" />
                            {workout.duration} min
                          </span>
                          {workout.calories ? (
                            <span className="flex items-center gap-1">
                              <Flame className="h-3.5 w-3.5" />
                              {workout.calories} cal
                            </span>
                          ) : null}
                          {workout.notes ? <span>{workout.notes}</span> : null}
                        </div>

                        <p className="mt-1 text-xs text-slate-400">
                          {formatDisplayDate(workout.createdAt, {
                            hour: 'numeric',
                            minute: '2-digit',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>

                    <Button type="button" variant="destructive" size="sm" onClick={() => void handleDelete(workout.id)} className="cursor-pointer rounded-lg">
                      Delete
                    </Button>
                  </article>
                )
              })}
            </div>
          </section>
        ))
      )}

      <Dialog open={batchOpen} onOpenChange={setBatchOpen}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>Batch Edit Workout Sessions</DialogTitle>
            <DialogDescription>
              Update all visible sessions at once and add new historical rows before saving.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-slate-500">Editing {batchRows.length} row{batchRows.length === 1 ? '' : 's'} from {filterLabel}.</p>
              <Button type="button" variant="outline" size="sm" onClick={addBatchRow} className="cursor-pointer gap-2 rounded-lg">
                <Plus className="h-4 w-4" />
                Add Row
              </Button>
            </div>

            <div className="max-h-[60vh] overflow-auto rounded-xl border border-slate-200">
              <table className="w-full min-w-[920px] text-left text-sm">
                <thead className="sticky top-0 bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">Type</th>
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Duration</th>
                    <th className="px-4 py-3 font-medium">Calories</th>
                    <th className="px-4 py-3 font-medium">Logged At</th>
                    <th className="px-4 py-3 font-medium">Notes</th>
                    <th className="px-4 py-3 font-medium text-right">Row</th>
                  </tr>
                </thead>
                <tbody>
                  {batchRows.map((row) => (
                    <tr key={row.clientId} className="border-t border-slate-100 align-top hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <select
                          value={row.type}
                          onChange={(event) => updateBatchRow(row.clientId, 'type', event.target.value)}
                          className="w-28 rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400"
                        >
                          {workoutTypes.map((type) => (
                            <option key={type} value={type}>
                              {type}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <input
                          value={row.name}
                          onChange={(event) => updateBatchRow(row.clientId, 'name', event.target.value)}
                          className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          value={row.duration}
                          onChange={(event) => updateBatchRow(row.clientId, 'duration', event.target.value)}
                          className="w-24 rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          value={row.calories}
                          onChange={(event) => updateBatchRow(row.clientId, 'calories', event.target.value)}
                          className="w-28 rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="datetime-local"
                          value={row.createdAt}
                          onChange={(event) => updateBatchRow(row.clientId, 'createdAt', event.target.value)}
                          className="w-52 rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <textarea
                          value={row.notes}
                          onChange={(event) => updateBatchRow(row.clientId, 'notes', event.target.value)}
                          rows={1}
                          className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400"
                        />
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

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setBatchOpen(false)} className="cursor-pointer rounded-lg">
              Cancel
            </Button>
            <Button type="button" onClick={() => void saveBatchChanges()} disabled={batchSaving} className="cursor-pointer rounded-lg">
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
  accent: 'orange' | 'blue' | 'rose'
}) {
  const iconClasses = {
    orange: 'bg-orange-50 text-orange-600',
    blue: 'bg-blue-50 text-blue-600',
    rose: 'bg-rose-50 text-rose-600',
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

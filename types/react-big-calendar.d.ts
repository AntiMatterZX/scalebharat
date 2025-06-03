declare module 'react-big-calendar' {
  import { ComponentType } from 'react'

  export interface Event {
    title?: string
    start: Date
    end: Date
    allDay?: boolean
    resource?: any
  }

  export type View = 'month' | 'week' | 'work_week' | 'day' | 'agenda'

  export const Views: {
    MONTH: 'month'
    WEEK: 'week'
    WORK_WEEK: 'work_week'
    DAY: 'day'
    AGENDA: 'agenda'
  }

  export interface CalendarProps {
    localizer: any
    events: Event[]
    startAccessor?: string | ((event: Event) => Date)
    endAccessor?: string | ((event: Event) => Date)
    titleAccessor?: string | ((event: Event) => string)
    style?: React.CSSProperties
    view?: View
    onView?: (view: View) => void
    date?: Date
    onNavigate?: (date: Date) => void
    onSelectEvent?: (event: Event) => void
    eventPropGetter?: (event: Event) => { style?: React.CSSProperties; className?: string }
    views?: View[]
    popup?: boolean
    tooltipAccessor?: (event: Event) => string
  }

  export const Calendar: ComponentType<CalendarProps>

  export function momentLocalizer(moment: any): any
} 
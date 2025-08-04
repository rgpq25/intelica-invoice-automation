'use client'

import { format } from 'date-fns'
import { Calendar as CalendarIcon } from 'lucide-react'

import { cn } from '@renderer/lib/utils'
import { Button } from '@renderer/components/ui/Button'
import { Calendar } from '@renderer/components/ui/Calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@renderer/components/ui/Popover'
import { SelectSingleEventHandler } from 'react-day-picker'

export function DatePickerDemo({
    date,
    setDate
}: {
    date: Date
    setDate: SelectSingleEventHandler
}) {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant={'outline'}
                    className={cn(
                        'w-full justify-start text-left font-normal',
                        !date && 'text-muted-foreground'
                    )}
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, 'PPP') : <span>Pick a date</span>}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
            </PopoverContent>
        </Popover>
    )
}

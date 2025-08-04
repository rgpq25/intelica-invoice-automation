import { cn } from '@renderer/lib/utils'
import { CircleHelp } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from './ui/Popover'

function ParameterSelect({
    className,
    title,
    helpText,
    children
}: {
    className?: string
    title: string
    helpText?: string
    children: React.ReactNode
}) {
    return (
        <div className={cn(className)}>
            <div className="flex flex-row items-center gap-2">
                <p className="font-medium mb-[2px]">{title}</p>
                {helpText && (
                    <Popover>
                        <PopoverTrigger>
                            <CircleHelp className="w-4 h-4 rounded-full" />
                        </PopoverTrigger>
                        <PopoverContent side="top" className='w-[300px]'>
                            <p className="text-muted-foreground text-sm">{helpText}</p>
                        </PopoverContent>
                    </Popover>
                )}
            </div>
            {children}
        </div>
    )
}
export default ParameterSelect

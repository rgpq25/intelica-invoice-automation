import { cn } from '@renderer/lib/utils'
import { GeneralError } from '@renderer/types'
import { CircleX } from 'lucide-react'
import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from './ui/Dialog'

function GeneralErrorDialog({
  generalError,
  setGeneralError
}: {
  generalError: GeneralError
  setGeneralError: React.Dispatch<React.SetStateAction<GeneralError>>
}) {
  const [isOpen, setIsOpen] = useState(false)

  //@ts-ignore
  const deleteMessage = () => {
    setGeneralError({ title: '', description: '' })
  }

  useEffect(() => {
    if (generalError.title !== '' && generalError.description !== '') {
      setIsOpen(true)
    }
  }, [generalError])

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open: boolean) => {
        if (!open) {
          setIsOpen(false)
        }
      }}
    >
      {generalError.title !== '' && generalError.description !== '' && (
        <DialogTrigger
          className={cn(
            'bg-red-700 rounded-full w-14 h-14 absolute bottom-5 right-7 flex hover:scale-110 transition-all'
          )}
          onClick={() => setIsOpen(true)}
        >
          <CircleX className="shrink-0 stroke-white m-auto" />
        </DialogTrigger>
      )}
      <DialogContent className="flex max-h-[400px] w-[80vw] min-w-[80vw] overflow-hidden">
        <DialogHeader className="flex-1 gap-1 overflow-hidden">
          <DialogTitle>{generalError.title}</DialogTitle>
          <DialogDescription
            className="flex-1 shrink-0 overflow-auto"
            style={{ whiteSpace: 'pre-wrap' }}
          >
            {generalError.description
              .split('\n')
              .filter((desc) => desc !== '')
              .map((line, index) => {
                if (
                  index ===
                  generalError.description.split('\n').filter((desc) => desc !== '').length - 1
                ) {
                  return (
                    <p key={index} className="text-start font-semibold text-red-900">
                      {line}
                    </p>
                  )
                }

                return (
                  <p key={index} className="text-start">
                    {line}
                  </p>
                )
              })}
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  )
}
export default GeneralErrorDialog

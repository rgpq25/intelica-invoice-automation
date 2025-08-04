import { useRef } from 'react'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { Upload } from 'lucide-react'

function FilePicker({
	text,
	value,
	handleClick,
	hasInfo = false,
	isLoading = false,
	disabled = false,
	isPath = false
}: {
	text: string
	value: string
	handleClick: () => void
	hasInfo?: boolean
	isLoading?: boolean
	disabled?: boolean
	isPath?: boolean
}) {
	const inputRef = useRef<HTMLInputElement>(null)

	return (
		<div className="flex flex-col gap-1 w-full">
			<div className="flex flex-col gap-0">
				<p className="font-medium text-xl leading-[1]">{text}</p>
				{hasInfo && (
					<p className=" ml-1 text-xs text-gray-400">
						Aqui se deben ubicar{' '}
						<span className="font-semibold text-gray-500">'TEMPLATE_PPT.pptx'</span> y{' '}
						<span className="font-semibold text-gray-500">'TEMPLATE_EXCEL.xslx'</span>
					</p>
				)}
			</div>
			<div className="flex flex-row gap-2 items-center justify-between">
				<Input
					placeholder="No file has been selected"
					value={value}
					readOnly
					className="truncate"
				/>
				<Button
					className="sm:min-w-[131.25px]"
					onClick={() => {
						handleClick()
					}}
					isLoading={isLoading}
					disabled={isLoading || disabled}
				>
					{!isLoading && <Upload className="shrink-0 w-4 h-4 sm:hidden" />}
					<p className='hidden sm:block'>{isLoading ? 'Leyendo' : isPath ? 'Upload path' : 'Upload file'}</p>
				</Button>
			</div>

			<input type="file" className="hidden" ref={inputRef} />
		</div>
	)
}
export default FilePicker
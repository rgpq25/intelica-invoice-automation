import FilePicker from './components/file-picker'
import { useEffect, useRef, useState } from 'react'
import { Button } from './components/ui/Button'
import { Separator } from './components/ui/Separator'
import { DatePickerDemo } from './components/date-picker'
import { Loader2 } from 'lucide-react'
import { Label } from './components/ui/Label'
import { Checkbox } from './components/ui/Checkbox'
import { Input } from './components/ui/Input'
import { transformDate } from './lib/utils'
import { SelectSingleEventHandler } from 'react-day-picker'
import { Progress } from './components/ui/Progress'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from './components/ui/Select'
import ParameterSelect from './components/parameter-select'
import { toast, Toaster } from 'sonner'
import { Tabs, TabsList, TabsTrigger } from './components/ui/Tabs'
import { ControlledError, GeneralError, ResponseType } from './types'
import GeneralErrorDialog from './components/general-error-dialog'

type GenerationMode = 'additional' | 'batch'

type Client = {
  id: string
  bankCode: string
  bankName: string
  country: string
}

type ClientOption = {
  client: Client
  selected: boolean
}

function App(): JSX.Element {
  const [generalError, setGeneralError] = useState<GeneralError>({
    title: '',
    description: ''
  })

  const [appMode, setAppMode] = useState<'invoice' | 'mail'>('invoice')
  const [clientMasterPath, setClientMasterPath] = useState<string>('')
  const [isClientMasterLoading, setIsClientMasterLoading] = useState<boolean>(false)
  const [servicesPerClientPath, setServicesPerClientPath] = useState<string>('')
  const [invoiceMasterPath, setInvoiceMasterPath] = useState<string>('')
  const [outputFolderPath, setOutputFolderPath] = useState<string>('')
  const [generationType, setGenerationType] = useState<GenerationMode>('batch')
  const [clients, setClientes] = useState<ClientOption[]>([])
  const [clientFilterText, setClientFilterText] = useState<string>('')
  const [date, setDate] = useState<Date>(new Date())
  const [response, setResponse] = useState<string[]>([])
  const [isGenerating, setIsGenerating] = useState<boolean>(false)

  const [mailDate, setMailDate] = useState<Date>(new Date())
  const [mailHour, setMailHour] = useState<number>(0)

  const [newInvoiceCSVPath, setNewInvoiceCSVPath] = useState<string>('')
  const [pendingInvoicesExcelPath, setPendingInvoicesExcelPath] = useState<string>('')
  const [outputFolderPathMail, setOutputFolderPathMail] = useState<string>('')
  const [isGeneratingMail, setIsGeneratingMail] = useState<boolean>(false)
  const [responseMail, setResponseMail] = useState<string[]>([])

  const filteredClients = clients.filter(({ client }) =>
    `${client.bankCode} - ${client.bankName} ${client.country}`
      .toLowerCase()
      .includes(clientFilterText.toLowerCase())
  )

  const [maxPrintSteps, setMaxPrintSteps] = useState<number>(0)
  const [isLoadingDependencies, setIsLoadingDependencies] = useState<boolean>(true)

  useEffect(() => {
    if (isGenerating === true) {
      setMaxPrintSteps(filteredClients.filter((c) => c.selected === true).length + 3)
    }
  }, [isGenerating])

  const getAllClients = async (selected_client_master_path) => {
    try {
      setIsClientMasterLoading(true)

      const response: ResponseType<Client[]> = await window.electron.ipcRenderer.invoke(
        'getAllClients',
        [selected_client_master_path]
      )

      if (response.status === 'Error' || response.result === null)
        throw new ControlledError(response.message as string)

      setGeneralError({
        title: '',
        description: ''
      })

      setClientes(
        response.result.map((client) => {
          return {
            selected: true,
            client: client
          }
        })
      )

      console.log(clients)
    } catch (error: any) {
      console.error('Error in getAllClients: ', error)
      setClientMasterPath('')
      setGeneralError({
        title: 'Error reading clients',
        description: error.message
      })
    } finally {
      setIsClientMasterLoading(false)
    }
  }

  const openFileDialog = async (
    setState: any,
    isDirectory: boolean,
    excuteInitialReading: boolean = false
  ) => {
    const response = await window.electron.ipcRenderer.invoke(
      isDirectory ? 'open-directory-dialog' : 'open-file-dialog'
    )
    if (response && response.filePaths.length > 0) {
      setState(response.filePaths[0])

      if (excuteInitialReading) {
        getAllClients(response.filePaths[0])
      }
    }
  }

  const runMainScript = async () => {
    try {
      setIsGenerating(true)
      setGeneralError({
        title: '',
        description: ''
      })

      //@ts-ignore
      window.electron.ipcRenderer.on('script-message', (_event, arg) => {
        // if (!arg.includes('0000-FINISHED_SCRIPT')) {
        setResponse(arg.split('$$').filter((x) => x !== ''))
        // }
      })

      //@ts-ignore
      window.electron.ipcRenderer.on('script-success', (_event, arg) => {
        toast.success('Invoices generated successfully', {
          position: 'bottom-center'
        })
        setIsGenerating(false)
      })

      //@ts-ignore
      window.electron.ipcRenderer.on('script-error', (_event, arg) => {
        console.log(arg.toString())

        setIsGenerating(false)

        setGeneralError({
          title: 'Error in the generation',
          description: arg.toString()
        })
      })

      window.electron.ipcRenderer.send('run-script', [
        generationType === 'batch' ? '1' : '2',
        transformDate(date),
        servicesPerClientPath,
        clientMasterPath,
        invoiceMasterPath,
        outputFolderPath,
        clients.filter((c) => c.selected === true).length,
        ...clients.filter((c) => c.selected === true).map((c) => c.client.id)
      ])
    } catch (error) {
      console.error('Error running Python script:', error)
    }
  }

  const runMainMailGenerationScript = async () => {
    try {
      setResponseMail([])
      setIsGeneratingMail(true)
      setGeneralError({
        title: '',
        description: ''
      })

      //@ts-ignore
      window.electron.ipcRenderer.on('script-message-mail', (_event, arg) => {
        // if (!arg.includes('0000-FINISHED_SCRIPT')) {
        setResponseMail(arg.split('$$').filter((x) => x !== ''))
        // }
      })

      //@ts-ignore
      window.electron.ipcRenderer.on('script-success-mail', (_event, arg) => {
        toast.success('Email agenda generated successfully', {
          position: 'bottom-center'
        })
        setIsGeneratingMail(false)
      })

      //@ts-ignore
      window.electron.ipcRenderer.on('script-error-mail', (_event, arg) => {
        console.log(arg.toString())

        setIsGeneratingMail(false)

        setResponseMail((prev) => [...prev, 'Error in the mail agenda generation'])

        setGeneralError({
          title: 'Error in the mail agenda generation',
          description: arg.toString()
        })
      })

      //transform date and hour to YYYY-MM-DD HH:MM
      const transformed_date = `${transformDate(mailDate).substring(0, 4)}-${transformDate(mailDate).substring(4, 6)}-${transformDate(mailDate).substring(6, 8)}T${mailHour.toString().padStart(2, '0')}:00:00 `

      window.electron.ipcRenderer.send('run-script-mail-agenda', [
        clientMasterPath,
        invoiceMasterPath,
        newInvoiceCSVPath,
        pendingInvoicesExcelPath,
        outputFolderPathMail,
        transformed_date
      ])
    } catch (error) {
      console.error('Error running Python script:', error)
    }
  }

  useEffect(() => {
    async function fetchDirectoryContents() {
      try {
        setIsLoadingDependencies(true)
        await window.electron.ipcRenderer.invoke('checkDependencies')
        setIsLoadingDependencies(false)
      } catch (error) {
        console.error('Error fetching directory contents:', error)
      }
    }

    fetchDirectoryContents()
  }, [])

  const scrollRef1 = useRef<HTMLDivElement>(null)
  const scrollRef2 = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef1.current) {
      scrollRef1.current.scrollTop = scrollRef1.current.scrollHeight
    }
  }, [response])

  useEffect(() => {
    if (scrollRef2.current) {
      scrollRef2.current.scrollTop = scrollRef2.current.scrollHeight
    }
  }, [responseMail])

  return (
    <div className="p-[20px] h-dvh flex flex-col overflow-auto">
      {/* <img alt="logo" className="logo" src={electronLogo} /> */}
      {isLoadingDependencies ? (
        <div className="flex h-full w-full flex-col items-center justify-center gap-3">
          <Loader2 className="animate-spin stroke-gray-500" />
          <p className="text-muted-foreground">Verificando instalacion de librerias ...</p>
        </div>
      ) : (
        <>
          <Tabs
            defaultValue={appMode}
            onValueChange={(e) => setAppMode(e as 'invoice' | 'mail')}
            className="w-full"
          >
            <TabsList className="w-full">
              <TabsTrigger className="flex-1" value="invoice">
                Invoice Generation
              </TabsTrigger>
              <TabsTrigger className="flex-1" value="mail">
                Automatic Mail Excel
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {appMode === 'invoice' ? (
            <>
              <div className="flex flex-col gap-3 mt-3">
                <FilePicker
                  text="Client Master"
                  value={clientMasterPath}
                  handleClick={() => openFileDialog(setClientMasterPath, false, true)}
                  isLoading={isClientMasterLoading}
                />
                <FilePicker
                  text="Services per Client"
                  value={servicesPerClientPath}
                  handleClick={() => openFileDialog(setServicesPerClientPath, false)}
                />
                <FilePicker
                  text="Invoice Number Master"
                  value={invoiceMasterPath}
                  handleClick={() => openFileDialog(setInvoiceMasterPath, false)}
                />
                <FilePicker
                  text="Output Folder"
                  value={outputFolderPath}
                  handleClick={() => openFileDialog(setOutputFolderPath, true)}
                />
              </div>

              <div className="flex justify-between gap-4 items-center mt-3">
                <h1 className="text-xl font-medium">Configuration</h1>
                <Separator orientation="horizontal" className="flex-1" />
              </div>

              <div className="flex flex-row justify-around gap-4 mt-2 h-[220px] min-h-[220px]">
                <section className="flex-1 pl-2 pb-1 flex flex-col">
                  <ParameterSelect
                    title="Generation Type"
                    helpText="Additional invoice generation will add a +1 to the selected clients invoice number"
                  >
                    <Select
                      value={generationType}
                      onValueChange={(v) => setGenerationType(v as GenerationMode)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="batch">Batch</SelectItem>
                        <SelectItem value="additional">Additional Invoice</SelectItem>
                      </SelectContent>
                    </Select>
                  </ParameterSelect>

                  <ParameterSelect className="mt-1" title="Select a date">
                    <DatePickerDemo date={date} setDate={setDate as SelectSingleEventHandler} />
                  </ParameterSelect>
                </section>

                <Separator orientation="vertical" />

                {clients.length === 0 ? (
                  <div className="flex-1 flex">
                    <p className="text-muted-foreground text-sm m-auto">No client info</p>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col gap-1">
                    <div className="flex flex-row gap-4">
                      <Input
                        className="text-sm h-[35px] flex-1"
                        isSearch
                        value={clientFilterText}
                        placeholder="Search for clients..."
                        onChange={(e) => setClientFilterText(e.target.value)}
                      />
                      <div
                        className="flex flex-row items-center gap-2 mr-3 cursor-pointer"
                        onClick={(e) => {
                          e.preventDefault()
                          setClientes(
                            clients.map((c) => {
                              return {
                                ...c,
                                selected: !clients.every((c) => c.selected)
                              }
                            })
                          )
                        }}
                      >
                        <Checkbox
                          checked={clients.every((c) => c.selected)}
                          onClick={(e) => {
                            e.preventDefault()
                          }}
                        />
                        <p className="cursor-pointer font-medium">All</p>
                      </div>
                    </div>
                    {filteredClients.length === 0 ? (
                      <p className="text-muted-foreground text-sm m-auto col-span-3">
                        No clients found
                      </p>
                    ) : (
                      <div className="h-full flex-1 gap-2 grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 overflow-auto overflow-x-hidden place-content-start">
                        {filteredClients.map(({ client, selected }) => {
                          return (
                            <div
                              key={client.id}
                              className="flex items-center gap-2 h-[40px] rounded-lg p-2 cursor-pointer"
                              onClick={(e) => {
                                e.preventDefault()
                                setClientes(
                                  clients.map((c) => {
                                    if (c.client.id === client.id) {
                                      return {
                                        ...c,
                                        selected: !selected
                                      }
                                    }
                                    return c
                                  })
                                )
                              }}
                            >
                              <Checkbox
                                checked={selected}
                                onClick={(e) => {
                                  e.preventDefault()
                                }}
                              />
                              <Label className="cursor-pointer">{`${client.bankCode} - ${client.bankName} ${client.country}`}</Label>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex flex-row items-center gap-4 mt-2">
                <Button
                  size={'lg'}
                  className="text-lg py-6 w-[220px]"
                  onClick={runMainScript}
                  isLoading={isGenerating}
                  disabled={
                    isGenerating ||
                    clients.filter((c) => c.selected === true).length === 0 ||
                    clientMasterPath === '' ||
                    servicesPerClientPath === '' ||
                    invoiceMasterPath === '' ||
                    outputFolderPath === ''
                  }
                >
                  Generate Invoices
                </Button>

                <div className="flex-1 flex flex-row items-center">
                  <Progress
                    value={
                      maxPrintSteps !== 0 ? Math.round((response.length / maxPrintSteps) * 100) : 0
                    }
                  />
                  <p className="font-semibold text-center shrink-0 w-[50px] normal-nums">
                    {maxPrintSteps !== 0 ? Math.round((response.length / maxPrintSteps) * 100) : 0}%
                  </p>
                </div>
              </div>

              <div
                className="flex flex-col min-h-[200px] flex-1  border rounded-lg p-4 overflow-x-hidden mt-3 overflow-y-auto"
                ref={scrollRef1}
              >
                {response.length === 0 ? (
                  <p className="text-center m-auto text-muted-foreground text-sm">
                    Start script to view log
                  </p>
                ) : (
                  response.map((res, index) => {
                    return (
                      <p key={index} className="text-sm">
                        {res}
                      </p>
                    )
                  })
                )}
              </div>
            </>
          ) : (
            <>
              <div className="flex flex-col gap-3 mt-3">
                <FilePicker
                  text="Client Master"
                  value={clientMasterPath}
                  handleClick={() => openFileDialog(setClientMasterPath, false, true)}
                  isLoading={isClientMasterLoading}
                />
                <FilePicker
                  text="Invoice Number Master"
                  value={invoiceMasterPath}
                  handleClick={() => openFileDialog(setInvoiceMasterPath, false)}
                />
                <FilePicker
                  text="New Invoices CSV"
                  value={newInvoiceCSVPath}
                  handleClick={() => openFileDialog(setNewInvoiceCSVPath, false)}
                />
                <FilePicker
                  text="Pending Invoices Excel"
                  value={pendingInvoicesExcelPath}
                  handleClick={() => openFileDialog(setPendingInvoicesExcelPath, false)}
                />
                <FilePicker
                  text="Output Folder"
                  value={outputFolderPathMail}
                  handleClick={() => openFileDialog(setOutputFolderPathMail, true)}
                />
              </div>

              <div className="flex justify-between gap-4 items-center mt-3">
                <h1 className="text-xl font-medium">Configuration</h1>
                <Separator orientation="horizontal" className="flex-1" />
              </div>

              <div className="flex flex-row items-center gap-10">
                <div className="px-2 mt-1 flex flex-col w-[400px]">
                  <ParameterSelect className="mt-1" title="Select a date">
                    <DatePickerDemo
                      date={mailDate}
                      setDate={setMailDate as SelectSingleEventHandler}
                    />
                  </ParameterSelect>
                  <ParameterSelect className="mt-1" title="Select an hour">
                    <div className="flex flex-row items-center gap-1">
                      <Input
                        className="w-[60px]"
                        type="number"
                        value={mailHour}
                        onChange={(e) => {
                          if (e.target.valueAsNumber < 0 || e.target.valueAsNumber > 23) return
                          setMailHour(e.target.valueAsNumber)
                        }}
                      />
                      <p>:</p>
                      <p>00</p>
                    </div>
                  </ParameterSelect>
                </div>

                <div className="flex">
                  <Button
                    isLoading={isGeneratingMail}
                    disabled={
                      isGeneratingMail ||
                      clientMasterPath === '' ||
                      newInvoiceCSVPath === '' ||
                      pendingInvoicesExcelPath === '' ||
                      outputFolderPathMail === ''
                    }
                    size={'lg'}
                    className="m-auto text-lg py-6 w-[220px]"
                    onClick={runMainMailGenerationScript}
                  >
                    Generate excel
                  </Button>
                </div>
              </div>

              <div
                className="flex flex-col min-h-[200px] flex-1  border rounded-lg p-4 overflow-x-hidden mt-3 overflow-y-auto"
                ref={scrollRef2}
              >
                {responseMail.length === 0 ? (
                  <p className="text-center m-auto text-muted-foreground text-sm">
                    Start script to view log
                  </p>
                ) : (
                  responseMail.map((res, index) => {
                    return (
                      <p key={index} className="text-sm">
                        {res}
                      </p>
                    )
                  })
                )}
              </div>
            </>
          )}
          <GeneralErrorDialog generalError={generalError} setGeneralError={setGeneralError} />
          <Toaster richColors position="bottom-center" />
        </>
      )}
    </div>
  )
}

export default App

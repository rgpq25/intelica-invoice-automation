import sys
import os
import shutil
import pdfkit
import jinja2
import base64
import pandas as pd
from datetime import datetime, date
import locale
import warnings
from exception_list import accountability_exception_list

warnings.filterwarnings("ignore")

def getTemplateFixedTitlesPerLanguage(language):
    if language == 'ENG':
        return {
            'h_intelica_info1': '7101 NW 113th Ct., Doral, FL 33178, USA',
            'h_intelica_info2': 'USA Tax ID: 43-1970515',
            'h_intelica_info3': 'Email: billing@intelica.com',
            'h_title': 'Invoice',
            'h_invoice_number': 'Invoice Number',
            'h_invoice_date': 'Invoice Date',
            'h_payment_terms': 'Payment Terms',
            'h_total_amount': 'Total Amount',
            'h_client_information': 'Client Information',
            'h_other_comments': 'Other Comments',
            'h_wire_transfer_instructions': 'Wire Transfer Instructions',
            'h_beneficiary_name': 'Beneficiary Name',
            'h_bank_name': 'Bank Name',
            'h_account_number': 'Account Number',
            'h_swift_code': 'SWIFT Code',
            'h_bank_address': 'Bank Address',
            'h_phone_number': 'Phone Number',
            'h_service_description': 'Service Description',
        }
    elif language == 'ESP':
        return {
            'h_intelica_info1': '7101 NW 113th Ct., Doral, FL 33178, EE.UU',
            'h_intelica_info2': 'Código Tributario EE.UU: 43-1970515',
            'h_intelica_info3': 'Correo: billing@intelica.com',
            'h_title': 'Factura',
            'h_invoice_number': 'N° de factura',
            'h_invoice_date': 'Fecha de factura',
            'h_payment_terms': 'Términos de pago',
            'h_total_amount': 'Monto Total',
            'h_client_information': 'Información del cliente',
            'h_other_comments': 'Otros comentarios',
            'h_wire_transfer_instructions': 'Instrucciones de transferencia bancaria',
            'h_beneficiary_name': 'Nombre Beneficiario',
            'h_bank_name': 'Nombre del Banco',
            'h_account_number': 'Cuenta Corriente',
            'h_swift_code': 'Código Swift',
            'h_bank_address': 'Dirección Banco',
            'h_phone_number': 'Teléfono',
            'h_service_description': 'Descripción del servicio',
        }
    else:
        return 0

def formatDate(date_str, language = 'ENG'): #formats a date to dd Month yyyy
    date_obj = datetime.strptime(date_str, "%Y%m%d")
    
    def get_day_with_suffix(day):
        if 11 <= day <= 13:
            suffix = 'th'
        else:
            suffix = {1: 'st', 2: 'nd', 3: 'rd'}.get(day % 10, 'th')
        return str(day) + suffix

    def get_day_with_ordinal_esp(day):
        return str(day)

    month_name = date_obj.strftime('%B')

    if language.upper() == 'ENG':
        # Configurar el locale para inglés
        locale.setlocale(locale.LC_TIME, 'en_US.UTF-8')
        formatted_date = f"{get_day_with_suffix(date_obj.day)} {date_obj.strftime('%B')} {date_obj.year}"
    elif language.upper() == 'ESP':
        # Configurar el locale para español
        locale.setlocale(locale.LC_TIME, 'es_ES.UTF-8')
        formatted_date = f"{get_day_with_ordinal_esp(date_obj.day)} de {date_obj.strftime('%B')} de {date_obj.year}"
    else:
        raise ValueError("Unsupported language. Use 'ENG' or 'ESP'.")

    return formatted_date

def getInvoiceMemo(invoice_id, language, invoice_month, term_definition):
    invoice_string = ''
    if invoice_id == 'PESC':
        invoice_string = f"Servicio InControl Validación facturas M/V  - %&ESP_MONTH&%"
    elif invoice['language'] == 'ENG':
        invoice_string = f"Consulting services %&ENG_MONTH_CAP&%"
    elif invoice['language'] == 'ESP':
        invoice_string = f"Servicios consultoría %&ESP_MONTH&%."

    return transformStringTerms(invoice_string, term_definition, invoice_month)

def formatDateNormal(date_str): #formats a date to dd/MM/yyyy
    date_obj = datetime.strptime(date_str, "%Y%m%d")
    formatted_date = f"{date_obj.day}/{date_obj.month}/{date_obj.year}"
    return formatted_date

def formatNumber(number):
    formatted_number = f"{float(number):,.2f}"
    return formatted_number

def readClientData(client_data_path, client_master_path, invoice_master_path, input_month):
    df = pd.read_excel(client_data_path, sheet_name='Client Data')
    client_master_df = pd.read_excel(client_master_path)
    invoice_master_df = pd.read_excel(invoice_master_path)

    if df.empty:
        print(f" - ERROR - No data found for the month of {formatDate(input_month)}")
        sys.exit(0)
    
    client_data = []
    unique_invoices = client_master_df['ID'].unique()

    #filter Month of df to the input_month
    # df = df[df['Month'] == int(input_month[:6])]

    for invoice in unique_invoices:
        invoice_data = df[df['Invoice ID'] == invoice]
        bank_data = client_master_df[client_master_df['ID'] == invoice]
        additional_data = invoice_master_df[invoice_master_df['Invoice ID'] == invoice]

        if invoice_data.empty:
            print(f" - ERROR - No services found for the invoice ID: {invoice}")
            continue

        client_data.append({
            'invoice_id': invoice,
            'language': bank_data['Language'].values[0],
            'bank_code': bank_data['Bank Code'].values[0],
            'bank_name': bank_data['Bank Name'].values[0] if pd.notna(bank_data['Bank Name'].values[0]) else '',
            'name_for_month_report': additional_data['Name'].values[0] if pd.notna(additional_data['Name'].values[0]) else '',
            'country': bank_data['Country'].values[0] if pd.notna(bank_data['Country'].values[0]) else '',
            'payment_terms': bank_data['Payment Terms'].values[0],
            'client_information': bank_data['Client Information'].values[0].split('\n') if pd.notna(bank_data['Client Information'].values[0]) else [],
            'other_comments': bank_data['Other Comments'].values[0].split('\n')         if pd.notna(bank_data['Other Comments'].values[0]) else [],
            'product': invoice_data['Product'].tolist(),
            'service_description': invoice_data['Service Description'].tolist(),
            'amount': invoice_data['Amount'].tolist(),
            'currency': bank_data['Currency'].values[0],
            # 'mail_recipient': bank_data['Mail Recipient'].values[0]                     if pd.notna(bank_data['Mail Recipient'].values[0]) else '',
            # 'mail_content': bank_data['Mail Content'].values[0]                         if pd.notna(bank_data['Mail Content'].values[0]) else '',
            # 'mail_service_description': bank_data['Mail Service Description'].values[0] if pd.notna(bank_data['Mail Service Description'].values[0]) else '',
            # 'mail_time': bank_data['Mail Time'].values[0]                               if pd.notna(bank_data['Mail Time'].values[0]) else ''
        })

    return client_data

def getMonthDifference(month1, month2):
    #both months are in the format YYYYMM
    year_diff = int(month1[:4]) - int(month2[:4])
    month_diff = int(month1[4:]) - int(month2[4:])
    return year_diff * 12 + month_diff

def readInvoiceMaster(invoice_master_path, base_month, p_current_date, gen_mode):
    df = pd.read_excel(invoice_master_path)
    invoice_master = {}
    month_diff = getMonthDifference(p_current_date[:6], base_month)

    for index, row in df.iterrows():
        upd_invoice_data = getUpdatedInvoiceData(month_diff, row['20240701-NewNum'],row['20240701-NewMonth'], row['Added Letter'] if pd.notna(row['Added Letter']) else '', row['Additional Invoices'], gen_mode)

        invoice_master[row['Invoice ID']] = {
            'invoice_num': f"{row['Invoice Prefix']}-{upd_invoice_data['num']}",
            'invoice_month': str(upd_invoice_data['month_num']),
        }
    return invoice_master

def getUpdatedInvoiceData(month_diff, num, month_num, add_letter, additional_invoices, gen_mode):
    month_num = str(month_num)
    num = str(num)

    new_month_num = int(month_num) + int(month_diff)
    if int(month_num[4:]) + int(month_diff) > 12:
        year_diff = (int(month_num[4:]) + int(month_diff)) // 12
        new_month_num = str(int(month_num[:4]) + year_diff) + str(int(month_num[4:]) + int(month_diff) - 12).zfill(2)

    # ======================= OLD LOGIC TO CALCULATE THE NEW INVOICE NUMBER WHEN MONTH WAS BIGGER THAN 12
    # new_invoice_num = 0
    # if gen_mode == '1':
    #     if int(num[2:]) + int(month_diff) + int(additional_invoices) > 12:
    #         year_diff = ((int(num[2:]) + int(month_diff)) + int(additional_invoices)) // 12
    #         new_invoice_num = str(int(num[:2]) + year_diff) + f"{str(int(num[2:]) + int(month_diff) + int(additional_invoices) - 12).zfill(2)}" + add_letter
    #     else:
    #         new_invoice_num = str(int(num) + month_diff + additional_invoices) + add_letter

    # elif gen_mode == '2':
    #     if int(num[2:]) + int(month_diff) + int(additional_invoices) + 1 > 12:
    #         year_diff = ((int(num[2:]) + int(month_diff)) + int(additional_invoices) + 1) // 12
    #         new_invoice_num = str(int(num[:2]) + year_diff) + f"{str(int(num[2:]) + int(month_diff) + int(additional_invoices) + 1 - 12).zfill(2)}" + add_letter
    #     else:
    #         new_invoice_num = str(int(num) + month_diff + additional_invoices + 1) + add_letter

    new_invoice_num = 0
    if gen_mode == '1':
        new_invoice_num = str(int(num) + month_diff + additional_invoices) + add_letter
    elif gen_mode == '2':
        new_invoice_num = str(int(num) + month_diff + additional_invoices + 1) + add_letter

    return {
        'num': new_invoice_num,
        'month_num': new_month_num
    }

def getTerms():
    terms = [
        '%&ENG_MONTH_CAP&%',
        '%&ENG_MONTH&%',
        '%&ESP_MONTH_CAP&%',
        '%&ESP_MONTH&%',
        '%&ENG_MONTH_CAP_PREVIOUS&%'
    ]
    return terms

def transformStringTerms(string, term_definition, monthNumber):
    new_str = string
    for term_str in term_definition:
        new_str = new_str.replace(term_str, getMonthString(monthNum = monthNumber, term = term_str.replace('%&', '').replace('&%', '')))
    return new_str

def getMonthString(monthNum, term):
    lang = None
    firstIsUppercase = None
    isPrevious = None

    if term.find('ENG') != -1:
        lang = 'eng'
    elif term.find('ESP') != -1:
        lang = 'esp'
    else:
        return 'No language specified'

    if term.find('CAP') != -1:
        firstIsUppercase = True
    else:
        firstIsUppercase = False

    if term.find('PREVIOUS') != -1:
        isPrevious = True
    else:
        isPrevious = False


    year = int(monthNum[:4])
    month = int(monthNum[4:]) - 1 if isPrevious == True else int(monthNum[4:])

    # date_obj = date(year, month, 1)

    months = {
        'eng': [
            'january', 
            'february', 
            'march', 
            'april', 
            'may', 
            'june', 
            'july', 
            'august', 
            'september', 
            'october', 
            'november', 
            'december'
        ],
        'esp': [
            'enero', 
            'febrero', 
            'marzo', 
            'abril', 
            'mayo', 
            'junio', 
            'julio', 
            'agosto', 
            'septiembre', 
            'octubre', 
            'noviembre', 
            'diciembre'
        ]
    }

    month_name = months.get(lang)[month - 1]

    if firstIsUppercase:
        month_name = month_name.capitalize()

    return f"{month_name} {year}"

def transfromStringToHtml(string, invoice_id):

    previous_invoices = invoice_history_df[invoice_history_df['Invoice ID'] == invoice_id]
    if len(previous_invoices) >= 6:
        previous_invoices = previous_invoices.head(6)

    previous_invoices = previous_invoices.sort_values(by='Invoice Number', ascending=False) 

    currency = previous_invoices['Currency'].values[0]
    
    new_string = string.replace('\n', '<br>')
    new_string = f'<p class="editor-paragraph">{new_string}</p><br>'

    new_string += f"""
        <table border="1" cellpadding="10" cellspacing="0" style="border-collapse:collapse; width:100%; text-align:center;">
        <tr style="background-color:#555; color:white;">
            <th>Invoice</th>
            <th>Date</th>
            <th>Service Description</th>
            <th>Amount {currency}</th>
            <th>Payment Date</th>
            <th>Days</th>
        </tr>
    """

    for index, row in previous_invoices.iterrows():
        new_string += f"""
        <tr>
            <td>{row['Invoice Number']}</td>
            <td>{row['Date']}</td>
            <td>{row['Service Description']}</td>
            <td>{row['Amount']}</td>
            <td>{row['Payment Date']}</td>
            <td>{row['Days']}</td>
        </tr>
        """

    new_string += "</table>"


    return new_string

def printLog(log):
    print(log)
    sys.stdout.flush()


isDev = sys.argv[1] == "dev"        #"dev" || "prod"
if isDev:
    current_directory = os.path.join(os.getcwd(), "scripts")
else:
    current_directory = os.path.join(os.getcwd(), "resources", "scripts")


printLog(" - Initiating script...")


base_month = '202501'   #Base month is July 2024
gen_mode = sys.argv[2]
p_current_month = sys.argv[3]
client_data_path = sys.argv[4] #"./client_data.xlsx"
client_master_path = sys.argv[5] #"./client_master.xlsx"
invoice_master_path = sys.argv[6] #"./invoice_master.xlsx"
# main_folder_path = "C:/Users/renzo/OneDrive - Intelica Corp/TEST/NewTest"
main_folder_path = sys.argv[7]
generated_pdf_path = os.path.join(main_folder_path, "INVOICES")
email_schedule_path = os.path.join(main_folder_path, "EMAIL_SCHEDULE.xlsx")
invoice_history_path = os.path.join(main_folder_path, "INVOICE_HISTORY.xlsx")

template_path = "./main_template/invoice_template.html"
generated_templates_path = os.path.join(current_directory, "generated_templates")

path_to_wkhtmltopdf = os.path.abspath(os.path.join(current_directory, 'wkhtmltopdf/wkhtmltox/bin/wkhtmltopdf.exe'))

selected_clients_amt = sys.argv[8]
selected_clients = sys.argv[9: 9 + int(selected_clients_amt)]


client_data     = readClientData(client_data_path, client_master_path, invoice_master_path, p_current_month)
invoice_master  = readInvoiceMaster(invoice_master_path, base_month, p_current_month, gen_mode)
term_definition = getTerms()
accountability_df = pd.DataFrame(columns=[
    'Invoice No.', 
    '*Customer', 
    'Email', 
    'Terms', 
    '*Invoice Date', 
    'Due Date', 
    'Location', 
    'Memo', 
    'Message on Invoice', 
    'Send Later', 
    '*Product/Service',
    'Description',
    'Qty',
    'Rate',
    '*Amount',
    'Tax Rate',
    'Class'
])

client_data = [client for client in client_data if client['invoice_id'] in selected_clients]

if not os.path.exists(generated_pdf_path):
    os.makedirs(generated_pdf_path)

if not os.path.exists(generated_templates_path):
    os.makedirs(generated_templates_path)

# if os.path.exists(email_schedule_path):
#     os.remove(email_schedule_path)


template = jinja2.Environment(
    loader=jinja2.FileSystemLoader(current_directory),
    autoescape=jinja2.select_autoescape
).get_template(template_path)


logoImg = ""
with open(os.path.join(current_directory, "resources/logo_intelica_horizontal.png"), "rb") as f:
  logoImg = base64.b64encode(f.read()).decode()

config = pdfkit.configuration(wkhtmltopdf=path_to_wkhtmltopdf)
config.default_options = {
    # 'page_size': 'A4',
    'print_media_type': True,
    'dpi': 300
}
options = {
    'page-width': '8.5in',
    'page-height': '11in',
    'dpi': 300,
}


printLog(f" - Processing {len(client_data)} invoices for the date of {formatDate(p_current_month)}")

for idx, invoice in enumerate(client_data):
    current_invoice_attributes = invoice_master.get(invoice['invoice_id'])

    if len(invoice['service_description']) != len(invoice['amount']):
        printLog(f" - ({idx + 1}/{len(client_data)}) - ERROR - Service description and amount length mismatch for invoice {current_invoice_attributes['invoice_num']}")
        continue

    #Services consolidation and total amount definition
    services_with_rates = []
    total_amount = 0
    for index, service in enumerate(invoice['service_description']):
        new_service = service
        for term_str in term_definition:
            new_service = new_service.replace(term_str, getMonthString(monthNum = current_invoice_attributes['invoice_month'], term = term_str.replace('%&', '').replace('&%', '')))
        
        services_with_rates.append({
            'description': new_service,
            'rate': formatNumber(invoice['amount'][index])
        })

        total_amount += float(invoice['amount'][index])

    invoice.update(current_invoice_attributes)


    #Comment box height definition
    comment_box_height = 30
    row_size = 40
    client_infor = invoice['client_information']
    other_comments = invoice['other_comments']
    if other_comments is not None:
        if len(other_comments) >= len(client_infor):
            comment_box_height += row_size * len(other_comments)
        else:
            comment_box_height += row_size * len(client_infor)
    else:
        comment_box_height += row_size * len(client_infor)


    invoice_title_prefix = 'Intelica Invoice' if invoice['language'] == 'ENG' else 'Factura Intelica'
    additional_country = f" - {invoice['country']}" if invoice['country'] != '' else ''
    document_name = f"{invoice['bank_code'][:2]} - {invoice_title_prefix} - {invoice['bank_name']} {invoice['invoice_num']}{additional_country}.pdf"

    #PDF Generation
    context = {
        "document_name":        document_name, 
        "logoImg":              logoImg,
        "comment_box_height":   f"{comment_box_height}px",
        "invoice_number":       invoice["invoice_num"],
        "invoice_date":         formatDate(p_current_month, invoice['language']),
        "payment_terms":        invoice["payment_terms"],
        "client_information":   invoice["client_information"],
        "other_comments":       invoice["other_comments"],
        "services":             services_with_rates,
        "total_amount":         formatNumber(total_amount),
        "currency":             invoice["currency"],
    }


    doc_titles = getTemplateFixedTitlesPerLanguage(invoice['language'])
    if doc_titles == 0:
        printLog(f" - ({idx + 1}/{len(client_data)}) - ERROR - Error in language selection for the bank with ID: {invoice['invoice_id']}")
        continue

    context.update(doc_titles)

    reportText = ''
    reportText = template.render(context)
    new_template_path = os.path.join(generated_templates_path, f"generated_{invoice['invoice_num']}.html")
    with open(new_template_path, 'w', encoding="utf-8") as f:
        f.write(reportText)

    pdfkit.from_file(
        new_template_path, 
        output_path = os.path.join(generated_pdf_path, document_name), 
        configuration = config, 
        options=options
    )

    printLog(f" - ({(str(idx + 1).zfill(2))}/{len(client_data)}) - SUCCESS - Generated {document_name}")


    amount_for_accountability = invoice['amount']

    if invoice['invoice_id'] in [item['ID'] for item in accountability_exception_list]:
        for item in accountability_exception_list:
            if invoice['invoice_id'] == item['ID']:
                for i in range(len(invoice['service_description'])):
                    if float(amount_for_accountability[i]) == float(item['ServiceAmount']):
                        print(f" - ({idx + 1}/{len(client_data)}) - ||INFO|| - Exception found for invoice {invoice['invoice_num']}, replacing amount {amount_for_accountability[i]} with {item['AccountabilityAmount']}")
                        amount_for_accountability[i] = float(item['AccountabilityAmount'])

    #Handle final csv data ===============================================================
    accountability_df = pd.concat([accountability_df, pd.DataFrame([{
        'Invoice No.': invoice['invoice_num'],
        '*Customer': invoice['name_for_month_report'],
        'Email': '',
        'Terms': invoice['payment_terms'],
        '*Invoice Date': formatDateNormal(p_current_month),
        'Due Date': formatDateNormal(p_current_month),
        'Location': '',
        'Memo': getInvoiceMemo(invoice['invoice_id'], invoice['language'], invoice['invoice_month'], term_definition),
        'Message on Invoice': '',
        'Send Later': '',
        '*Product/Service': invoice['product'][0],
        'Description': transformStringTerms(invoice['service_description'][0], term_definition, str(invoice['invoice_month'])),
        'Qty': 1,
        'Rate': amount_for_accountability[0],
        '*Amount': amount_for_accountability[0],
        'Tax Rate': '',
        'Class': ''
    }])], ignore_index=True)

    for i in range(1, len(invoice['service_description'])):
        accountability_df = pd.concat([accountability_df, pd.DataFrame([{
            'Invoice No.': invoice['invoice_num'],
            '*Customer': '',
            'Email': '',
            'Terms': '',
            '*Invoice Date': '',
            'Due Date': '',
            'Location': '',
            'Memo': '',
            'Message on Invoice': '',
            'Send Later': '',
            '*Product/Service': invoice['product'][i],
            'Description': transformStringTerms(invoice['service_description'][i], term_definition, str(invoice['invoice_month'])),
            'Qty': 1,
            'Rate': amount_for_accountability[i],
            '*Amount': amount_for_accountability[i],
            'Tax Rate': '',
            'Class': ''
        }])], ignore_index=True)



# printLog("=================================================================================================")

accountability_path = os.path.join(main_folder_path, f"Accountability - {p_current_month[:4][2:] + p_current_month[4:6]} Monthly Invoices - QB.csv")

#! NOTE: Before we were using encoding='cp1252' on this code block

if gen_mode == '1':
    print(f" - Generating new accountability file {os.path.basename(accountability_path)}")
    accountability_df.to_csv(accountability_path, index=False, encoding='utf-8')
elif gen_mode == '2' and os.path.exists(accountability_path):
    print(f" - Adding new additional invoices to the existing file {os.path.basename(accountability_path)}")
    old_accoutability_df = pd.read_csv(accountability_path, encoding='utf-8')
    old_accoutability_df = pd.concat([old_accoutability_df, accountability_df], ignore_index=True)
    old_accoutability_df.to_csv(accountability_path, index=False, encoding='utf-8')
elif gen_mode == '2' and not os.path.exists(accountability_path):
    print(f" - Generating new accountability file {os.path.basename(accountability_path)}")
    accountability_df.to_csv(accountability_path, index=False, encoding='utf-8')




def createExcelTable(dest_path, df, check_exists):
    if check_exists == True and os.path.exists(dest_path):
        printLog(f" - {os.path.basename(dest_path)} file already exists, skipping creation")
    else:
        writer = pd.ExcelWriter(dest_path, engine='xlsxwriter')
        df.to_excel(writer, sheet_name='Hoja1', startrow=1, header=False, index=False)
        
        workbook = writer.book
        worksheet = writer.sheets['Hoja1']
        (max_row, max_col) = df.shape

        column_settings = []
        for header in df.columns:
            column_settings.append({'header': header})

        worksheet.add_table(0, 0, max_row, max_col - 1, {'name': 'Tabla1', 'columns': column_settings})
        worksheet.set_column(0, max_col - 1, 30)
        writer.close()
        # printLog(f' - {os.path.basename(dest_path)} file created successfully')

def addInfoToExcel(dest_path, df):
    if not os.path.exists(dest_path):
        writer = pd.ExcelWriter(dest_path, engine='xlsxwriter')
        df.to_excel(writer, sheet_name='Hoja1', startrow=1, header=False, index=False)

        workbook = writer.book
        worksheet = writer.sheets['Hoja1']
        (max_row, max_col) = df.shape

        column_settings = []
        for header in df.columns:
            column_settings.append({'header': header})

        worksheet.add_table(0, 0, max_row, max_col - 1, {'name': 'Tabla1', 'columns': column_settings})
        worksheet.set_column(0, max_col - 1, 30)
        writer.close()
        printLog(f' - {os.path.basename(dest_path)} file created successfully')
    else:
        old_df = pd.read_excel(dest_path)
        df = pd.concat([old_df, df], ignore_index=True)
        writer = pd.ExcelWriter(dest_path, engine='xlsxwriter')
        df.to_excel(writer, sheet_name='Hoja1', startrow=1, header=False, index=False)

        workbook = writer.book
        worksheet = writer.sheets['Hoja1']
        (max_row, max_col) = df.shape

        column_settings = []
        for header in df.columns:
            column_settings.append({'header': header})

        worksheet.add_table(0, 0, max_row, max_col - 1, {'name': 'Tabla1', 'columns': column_settings})
        worksheet.set_column(0, max_col - 1, 30)
        writer.close()
        printLog(f' - Added info to {os.path.basename(dest_path)} successfully')


if gen_mode == '2': #must modify the invoice_master file and add a +1 to the invoice
    invoice_master_df = pd.read_excel(invoice_master_path)
    invoice_master_df.loc[invoice_master_df['Invoice ID'].isin(selected_clients), 'Additional Invoices'] += 1
    createExcelTable(invoice_master_path, invoice_master_df, False)

shutil.rmtree(generated_templates_path)

printLog(" - Script finished successfully. Invoices generated under the 'INVOICES' folder.")
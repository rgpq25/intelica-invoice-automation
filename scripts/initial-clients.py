import pandas as pd
import sys
import json

client_master_path = sys.argv[1]


try:
    client_master = pd.read_excel(client_master_path)
except:
    raise Exception("The client master file must be an excel file")

if not 'ID' in client_master.columns or not 'Bank Code' in client_master.columns or not 'Bank Name' in client_master.columns or not 'Country' in client_master.columns:
    raise Exception("The client master file must have the following columns: ID, Bank Code, Bank Name, Country")

#iterate over the rows of the client master
for index, row in client_master.iterrows():
    #create a json to hold the id, bank code, bank name, and country
    client = {
        "id": row["ID"],
        "bankCode": row["Bank Code"] if not pd.isnull(row["Bank Code"]) else '',
        "bankName": row["Bank Name"] if not pd.isnull(row["Bank Name"]) else '',
        "country": row["Country"] if not pd.isnull(row["Country"]) else ''
    }
    
    print(str(json.dumps(client)))



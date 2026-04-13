import csv

def csv_to_dict_list(file_path):
    data = []
    
    with open(file_path, mode='r', newline='', encoding='utf-8') as file:
        reader = csv.DictReader(file)
        
        for row in reader:
            data.append(row)  # each row is already a dict
    
    return data



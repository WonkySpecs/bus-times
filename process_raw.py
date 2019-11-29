import re
import csv
import datetime

def to_hour_minute(s):
    hour = s[0] if len(s) == 3 else s[:2]
    return int(hour), int(s[-2:])

if __name__ == "__main__":
    with open("data.raw", "r") as raw_file:
        headers = raw_file.readline().strip()
        parsed_lines = []
        cur_date = None
        for line in raw_file:
            line = line.strip()
            if re.compile("[0-3][0-9]/[0-3][0-9]").match(line):
                cur_date = line
            else:
                parsed_lines.append([cur_date] + line.split(","))

    out = []
    for date, bus_num, expected, actual in parsed_lines:
        day, month = date.split("/")
        day, month = int(day), int(month)
        year = 2019 if month > 10 else 2020
        exp_hour, exp_minute = to_hour_minute(expected)
        if actual != "LATE":
            a_hour, a_minute = to_hour_minute(actual)
            a_dt = datetime.datetime(year, month, day, a_hour, a_minute)
        else:
            a_dt = None
        out.append([
            bus_num,
            datetime.datetime(year, month, day, exp_hour, exp_minute),
            a_dt])

    for i, e in enumerate(out):
        if not e[2]:
            out[i][2] = out[i + 1][2] + datetime.timedelta(minutes=1)

    with open('data.csv', 'w', newline='') as out_file:
        wtr = csv.writer(out_file)
        wtr.writerow(headers.split(","))
        for row in out:
            wtr.writerow(row)

"""
Generate synthetic banking transactions dataset for demo.
Run once from the backend directory:  python generate_demo_data.py
"""
import os
import numpy as np
import pandas as pd
from datetime import datetime, timedelta

np.random.seed(42)

N = 2000
start_date = datetime(2023, 1, 1)
end_date = datetime(2024, 3, 31)

# Generate dates with more transactions on weekdays
dates = []
for _ in range(N):
    days = np.random.randint(0, (end_date - start_date).days)
    d = start_date + timedelta(days=days)
    if d.weekday() >= 5 and np.random.random() < 0.3:
        d -= timedelta(days=d.weekday() - 4)
    dates.append(d)

regions = ["North", "South", "East", "West"]
branches = {
    "North": ["Delhi Central", "Chandigarh Main", "Lucknow Branch"],
    "South": ["Chennai Hub", "Bangalore Tech", "Hyderabad City"],
    "East":  ["Kolkata Metro", "Patna Branch", "Bhubaneswar Main"],
    "West":  ["Mumbai Central", "Pune IT", "Ahmedabad Branch"],
}
transaction_types = ["Deposit", "Withdrawal", "Transfer", "Payment"]
categories       = ["Salary", "Bills", "Shopping", "Investment", "Loan", "Other"]
channels         = ["Online", "Branch", "ATM", "Mobile"]
age_groups       = ["18-25", "26-35", "36-45", "46-55", "55+"]
statuses         = ["Completed", "Pending", "Failed"]
names = [
    "Priya Sharma", "Rahul Verma", "Anita Singh", "Rajesh Kumar", "Neha Patel",
    "Amit Gupta", "Sunita Reddy", "Vikram Das", "Meera Joshi", "Sunil Nair",
    "Kavita Rao", "Arjun Mehta", "Pooja Iyer", "Deepak Mishra", "Ritu Bose",
    "Manish Pandey", "Shweta Agarwal", "Kiran Desai", "Rohit Saxena", "Anjali Kulkarni",
]

data = []
for i in range(N):
    date     = dates[i]
    region   = np.random.choice(regions, p=[0.40, 0.25, 0.15, 0.20])
    branch   = np.random.choice(branches[region])
    txn_type = np.random.choice(transaction_types, p=[0.30, 0.25, 0.25, 0.20])

    if txn_type == "Deposit":
        amount = round(np.random.lognormal(9.5, 1.2), 2)
    elif txn_type == "Withdrawal":
        amount = round(np.random.lognormal(8.5, 0.8), 2)
    elif txn_type == "Transfer":
        amount = round(np.random.lognormal(9.0, 1.0), 2)
    else:
        amount = round(np.random.lognormal(7.5, 0.7), 2)

    # March 2024 dip — built-in pattern for demos
    if date.year == 2024 and date.month == 3:
        amount *= 0.85
    if region == "South" and date.year == 2024 and date.month == 3:
        amount *= 0.78

    channel = np.random.choice(channels, p=[0.25, 0.15, 0.15, 0.45])
    age     = np.random.choice(age_groups, p=[0.20, 0.30, 0.25, 0.15, 0.10])
    if age == "18-25":
        channel = np.random.choice(channels, p=[0.15, 0.05, 0.10, 0.70])

    data.append({
        "transaction_id":   10001 + i,
        "date":             date.strftime("%Y-%m-%d"),
        "customer_id":      np.random.randint(1000, 6000),
        "customer_name":    np.random.choice(names),
        "region":           region,
        "branch":           branch,
        "transaction_type": txn_type,
        "amount":           round(amount, 2),
        "balance":          round(np.random.uniform(5000, 500000), 2),
        "category":         np.random.choice(categories),
        "channel":          channel,
        "status":           np.random.choice(statuses, p=[0.90, 0.07, 0.03]),
        "age_group":        age,
    })

df = pd.DataFrame(data)

# Inject ~5% missing in category, ~3% in balance (for confidence score demo)
df.loc[np.random.random(N) < 0.05, "category"] = np.nan
df.loc[np.random.random(N) < 0.03, "balance"]  = np.nan

os.makedirs("sample_data", exist_ok=True)
df.to_csv("sample_data/banking_transactions.csv", index=False)
print(f"✅ Generated {len(df)} rows → sample_data/banking_transactions.csv")
print(f"   Columns: {list(df.columns)}")
print(f"\n{df.head()}")

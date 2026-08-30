# ============================================================================
# GreenGold OS - All Stakeholder Login Credentials
# ============================================================================
# Website: https://green-gold-dusky.vercel.app/login
# ============================================================================


## 1. MANAGEMENT ADMIN (Operations Command Center)
## Dashboard: /management

| # | Full Name                     | Email                      | Password  | Employee ID | Role Description |
|---|-------------------------------|----------------------------|-----------|-------------|------------------|
| 1 | System Operations Management  | saad489254@gmail.com       | saad123   | MGMT-001    | System Admin     |


## 2. WASTE COLLECTOR DRIVERS (Smart Bins → Central Dump Yard)
## Dashboard: /collector

| # | Full Name                   | Email                         | Password     | Employee ID | Vehicle #     | Zone   |
|---|-----------------------------|-------------------------------|--------------|-------------|---------------|--------|
| 1 | Collector Driver Tariq Jamil| collector1@greengold.com      | collector123 | C-101       | ICT-GRN-9901  | F-7    |
| 2 | Collector Driver Tariq Jamil| collector@greengold.com       | collector123 | C-101       | ICT-GRN-9901  | F-7    |
| 3 | Collector Driver Zubair Ali | collector2@greengold.com      | collector123 | C-102       | ICT-GRN-9902  | G-5    |
| 4 | Collector Driver Usman Ghani| collector3@greengold.com      | collector123 | C-103       | ICT-GRN-9903  | E-9    |
| 5 | Collector Driver Farhan Malik| collector4@greengold.com     | collector123 | C-104       | ICT-GRN-9904  | F-6    |


## 3. CENTRAL DUMPING & SEPARATION FACILITY (Weigh-In, Area Totals, Stream Sort & Plant Dispatch)
## Dashboard: /dump-facility

| # | Facility Name                              | Supervisor Name     | Email                  | Password | Employee ID | Location                          |
|---|--------------------------------------------|---------------------|------------------------|----------|-------------|-----------------------------------|
| 1 | Capital Green Central Waste & Dumping Hub  | Rashid Mahmood      | dumpyard@greengold.com | dump123  | DUMP-101    | Sector I-9/1 Industrial, Islamabad|


## 4. LOGISTICS TRANSPORTERS (Dump Yard → Recycling Plant)
## Dashboard: /transporter

| # | Full Name                  | Email                          | Password     | Employee ID | Vehicle #     |
|---|----------------------------|--------------------------------|--------------|-------------|---------------|
| 1 | Transporter Aslam Khan     | transporter1@greengold.com     | transport123 | TRN-101     | ICT-TRN-1001  |
| 2 | Transporter Bilal Ahmed    | transporter2@greengold.com     | transport123 | TRN-102     | ICT-TRN-1002  |
| 3 | Transporter Kamran Shah    | transporter3@greengold.com     | transport123 | TRN-103     | ICT-TRN-1003  |
| 4 | Transporter Danish Raza    | transporter4@greengold.com     | transport123 | TRN-104     | ICT-TRN-1004  |


## 5. INDUSTRIAL RECYCLING PLANTS (Audit & Carbon Credit Minting)
## Dashboard: /recycling-plant

| # | Plant Name                            | Inspector Name                 | Email                       | Password | Employee ID | Waste Stream     | Capacity  | Address                                     |
|---|---------------------------------------|--------------------------------|-----------------------------|----------|-------------|------------------|-----------|---------------------------------------------|
| 1 | Pak Recycling Ltd (Organic & Compost) | Engr. Tariq Mahmood            | pakrecycling@greengold.com  | plant123 | PLANT-101   | Organic/Compost  | 80 Tons   | Plot 42, Sector I-9/2, Islamabad            |
| 2 | EcoPak Plastics Recycling Facility    | Haji Rafiq                     | ecopak@greengold.com        | plant123 | PLANT-102   | Plastic          | 60 Tons   | Industrial Triangle, Kahuta Road, Islamabad |
| 3 | GreenTech Metal & Materials Recovery  | Zubair Qureshi                 | greentech@greengold.com     | plant123 | PLANT-103   | Metal            | 100 Tons  | Plot 18, Sector I-10/3, Islamabad           |


## 6. CUSTOMER / CLIENT WASTE GENERATOR (Facility Bins & Pickup Requests)
## Dashboard: /generator

| # | Full Name     | Organization / Site     | Email                  | Password   | Phone           | Address                          | Town       |
|---|---------------|-------------------------|------------------------|------------|-----------------|----------------------------------|------------|
| 1 | Hamza Tariq   | PAF Complex Sector E-9  | citizen@greengold.com  | client123  | +92 300 1234567 | Sector E-9 Campus, Islamabad     | Sector E-9 |
| 2 | Hamza Tariq   | PAF Complex Sector E-9  | client@greengold.com   | client123  | +92 300 1234567 | Sector E-9 Campus, Islamabad     | Sector E-9 |
| 3 | Taimoor Shah  | Serena Hotel Islamabad  | user@greengold.com     | user123    | +92 300 7654321 | Club Road, Sector G-5, Islamabad | Sector G-5 |

*(New clients can also self-register anytime via the "Sign Up" tab on the Login Page)*


## 7. HARDWARE IOT PROTEUS SIMULATOR
## Script: python scripts/proteus_bridge.py --demo
## Bin Types: Metal (01), Plastic (02), Organic/Compost (03)


## CARBON CREDIT MINTING FORMULA
## CC = Recycled Weight (kg) × Stream Factor
##   Organic/Compost: 0.5 CC/kg  (Pak Recycling Ltd)
##   Plastic:         1.2 CC/kg  (EcoPak Plastics Facility)
##   Metal:           2.0 CC/kg  (GreenTech Metal Recovery)
##   General Mixed:   0.3 CC/kg

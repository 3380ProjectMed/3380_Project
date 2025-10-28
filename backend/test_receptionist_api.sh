#!/bin/bash

# Base URL for the API
BASE_URL="http://localhost:8080"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

# Function to print success/failure
print_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓ Success${NC}: $2"
    else
        echo -e "${RED}✗ Failed${NC}: $2"
    fi
}

# Function to test endpoint and check response
test_endpoint() {
    local response
    local http_code
    local endpoint=$1
    local method=${2:-GET}
    local data=$3
    
    echo "Testing $endpoint..."
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" -b cookies.txt "$BASE_URL/receptionist_api/$endpoint")
    else
        response=$(curl -s -w "\n%{http_code}" -b cookies.txt -X "$method" "$BASE_URL/receptionist_api/$endpoint" \
            -H "Content-Type: application/json" \
            -d "$data")
    fi
    
    http_code=$(echo "$response" | tail -n1)
    content=$(echo "$response" | sed '$ d')
    
    echo "Status Code: $http_code"
    echo "Response: $content"
    echo "----------------------------------------"
}

# Login as receptionist
echo "Logging in as receptionist..."
LOGIN_RESPONSE=$(curl -s -c cookies.txt -X POST "$BASE_URL/api/login.php" \
    -H "Content-Type: application/json" \
    -d '{"email": "rocks@medconnect.com", "password": "MedApp123!"}')
echo "Login Response: $LOGIN_RESPONSE"

echo "Testing Appointments Endpoints..."
echo "--------------------------------"

# Test get-by-date
test_endpoint "appointments/get-by-date.php?date=2025-10-27"

# Test get-availability
test_endpoint "appointments/get-availability.php?doctor_id=1&date=2025-10-27"

# Test create appointment
test_endpoint "appointments/create.php" "POST" '{"Patient_id": 1, "Doctor_id": 1, "Office_id": 3, "Appointment_date": "2025-10-27 10:00:00", "Reason_for_visit": "Test Appointment"}'

# Test update appointment
test_endpoint "appointments/update.php" "PUT" '{"Appointment_id": 1007, "Appointment_date": "2025-10-27 11:00:00", "Reason_for_visit": "Updated appointment"}'

# Test check-in
test_endpoint "appointments/check-in.php" "PUT" '{"Appointment_id": 1007}'

echo "Testing Dashboard Endpoints..."
echo "----------------------------"

# Test dashboard stats
test_endpoint "dashboard/stats.php"

# Test dashboard today
test_endpoint "dashboard/today.php"

echo "Testing Doctors Endpoints..."
echo "--------------------------"

# Test get all doctors
test_endpoint "doctors/get-all.php"

# Test get doctors by office
test_endpoint "doctors/get-by-office.php?office_id=1"

# Test get doctor schedule
test_endpoint "doctors/get-schedule.php?doctor_id=1&date=2025-10-27"

echo "Testing Patients Endpoints..."
echo "---------------------------"

# Test get all patients
test_endpoint "patients/get-all.php"

# Test get patient by id
test_endpoint "patients/get-by-id.php?id=1"

echo "Testing Payments Endpoints..."
echo "---------------------------"

# Test create payment
test_endpoint "payments/create.php" "POST" '{"appointment_id": 1007, "patient_id": 4, "copay_amount": 25.00, "payment_received": 25.00, "transaction_id": "TXN123"}'

# Test get payments by date
test_endpoint "payments/get-by-date.php?date=2025-10-27"

# Test get payments by patient
test_endpoint "payments/get-by-patient.php?patient_id=1"

# Clean up
rm -f cookies.txt

echo "Testing complete!"
#!/usr/bin/env python3
"""
QED Serviceability Calculator Automated Tester using COM
Uses Windows COM automation to properly calculate Excel formulas
"""

import win32com.client
from pathlib import Path
import json
import time

def test_qed_scenario_com(scenario):
    """Test a single scenario using Excel COM automation"""
    
    excel_path = str(Path(r"C:\Users\encou\Documents\Project MicroSass\Otium\qed_serviceability_calculator_3_28_may_2025_download_450.xlsm").absolute())
    
    try:
        # Start Excel application
        excel = win32com.client.Dispatch("Excel.Application")
        excel.Visible = False  # Run in background
        excel.DisplayAlerts = False
        
        # Open workbook
        wb = excel.Workbooks.Open(excel_path)
        
        # Select appropriate worksheet
        if scenario['secondary_income'] > 0:
            ws = wb.Worksheets("Dual income")
            worksheet_name = "Dual income"
        else:
            ws = wb.Worksheets("Single income")
            worksheet_name = "Single income"
        
        print(f"Testing: {scenario['name']}")
        print(f"Using worksheet: {worksheet_name}")
        
        # Clear existing values first
        ws.Range("F8").Value = 0  # Primary income
        ws.Range("I8").Value = 0  # Secondary income  
        ws.Range("E3").Value = 0  # Dependents
        ws.Range("B7").Value = 0.055  # Default rate
        ws.Range("F9").Value = "N"  # HECS debt flag primary
        ws.Range("I9").Value = "N"  # HECS debt flag secondary
        ws.Range("F16").Value = 0  # HECS debt amount primary
        ws.Range("I16").Value = 0  # HECS debt amount secondary
        ws.Range("F10").Value = 0  # Rental income
        ws.Range("F33").Value = 0  # Current rent
        ws.Range("F5").Value = 500000  # Set default loan amount
        
        # Set input values
        ws.Range("F8").Value = scenario['primary_income']  # Primary income
        if scenario['secondary_income'] > 0:
            ws.Range("I8").Value = scenario['secondary_income']  # Secondary income
            
        ws.Range("E3").Value = scenario['dependents']  # Dependents
        ws.Range("B7").Value = scenario['interest_rate'] / 100  # Interest rate as decimal
        
        # HECS debt setup
        if scenario['hecs_primary'] > 0:
            ws.Range("F9").Value = "Y"
            ws.Range("F16").Value = scenario['hecs_primary']
        if scenario['hecs_secondary'] > 0:
            ws.Range("I9").Value = "Y" 
            ws.Range("I16").Value = scenario['hecs_secondary']
            
        # Rental income (annual)
        if scenario['rental_income'] > 0:
            ws.Range("F10").Value = scenario['rental_income']
            
        # Current rent (monthly)
        if scenario['current_rent'] > 0:
            ws.Range("F33").Value = scenario['current_rent']
        
        # Force calculation
        excel.Calculate()
        time.sleep(1)  # Give Excel time to calculate
        
        # Read MAX Loan result from correct cell
        if worksheet_name == "Single income":
            result = ws.Range("F42").Value  # Single income: MAX Loan in F42
        else:
            result = ws.Range("F43").Value  # Dual income: MAX Loan in F43
        
        print(f"  MAX Loan Result: ${result:,.0f}" if result else "  MAX Loan Result: None")
        
        # Close workbook without saving
        wb.Close(SaveChanges=False)
        excel.Quit()
        
        return {
            'scenario_name': scenario['name'],
            'qed_result': result,
            'our_app_result': scenario['our_app_result'],
            'expected_min': scenario['expected_range'][0],
            'expected_max': scenario['expected_range'][1],
            'worksheet_used': worksheet_name
        }
        
    except Exception as e:
        print(f"ERROR testing {scenario['name']}: {str(e)}")
        try:
            excel.Quit()
        except:
            pass
        return None

def run_all_scenarios():
    """Run all 6 test scenarios"""
    
    scenarios = [
        {
            'name': 'Scenario 1: Single, Low Income, Owner-Occupied',
            'primary_income': 65000,
            'secondary_income': 0,
            'dependents': 0,
            'hecs_primary': 0,
            'hecs_secondary': 0,
            'property_type': 'Owner-Occupied',
            'interest_rate': 5.5,
            'location': 'NSW 2000',
            'rental_income': 0,
            'current_rent': 650,
            'expected_range': (350000, 400000),
            'our_app_result': 312530
        },
        {
            'name': 'Scenario 2: Single, Medium Income, Investment',
            'primary_income': 95000,
            'secondary_income': 0,
            'dependents': 0,
            'hecs_primary': 25000,
            'hecs_secondary': 0,
            'property_type': 'Investment',
            'interest_rate': 5.8,
            'location': 'VIC 3000',
            'rental_income': 450 * 52,  # Weekly to annual
            'current_rent': 0,
            'expected_range': (600000, 700000),
            'our_app_result': 502553
        },
        {
            'name': 'Scenario 3: Couple, High Income, Owner-Occupied',
            'primary_income': 120000,
            'secondary_income': 85000,
            'dependents': 2,
            'hecs_primary': 35000,
            'hecs_secondary': 20000,
            'property_type': 'Owner-Occupied',
            'interest_rate': 5.5,
            'location': 'QLD 4000',
            'rental_income': 0,
            'current_rent': 650,
            'expected_range': (900000, 1000000),
            'our_app_result': 237413
        },
        {
            'name': 'Scenario 4: Couple, High Income, Investment',
            'primary_income': 140000,
            'secondary_income': 75000,
            'dependents': 0,
            'hecs_primary': 0,
            'hecs_secondary': 0,
            'property_type': 'Investment',
            'interest_rate': 5.8,
            'location': 'WA 6000',
            'rental_income': 650 * 52,  # Weekly to annual
            'current_rent': 400 * 52 / 12,  # Weekly to monthly
            'expected_range': (1200000, 1500000),
            'our_app_result': 1060237
        },
        {
            'name': 'Scenario 5: Single, Very High Income, Investment',
            'primary_income': 180000,
            'secondary_income': 0,
            'dependents': 1,
            'hecs_primary': 45000,
            'hecs_secondary': 0,
            'property_type': 'Investment',
            'interest_rate': 5.8,
            'location': 'SA 5000',
            'rental_income': 800 * 52,  # Weekly to annual
            'current_rent': 0,
            'expected_range': (1500000, 2000000),
            'our_app_result': 660016
        },
        {
            'name': 'Scenario 6: Young Couple, Entry Level',
            'primary_income': 75000,
            'secondary_income': 60000,
            'dependents': 0,
            'hecs_primary': 15000,
            'hecs_secondary': 18000,
            'property_type': 'Owner-Occupied',
            'interest_rate': 5.5,
            'location': 'NSW 2650',
            'rental_income': 0,
            'current_rent': 650,
            'expected_range': (650000, 750000),
            'our_app_result': 425720
        }
    ]
    
    print("QED Automated Testing using COM - All 6 Scenarios")
    print("=" * 60)
    
    results = []
    for scenario in scenarios:
        result = test_qed_scenario_com(scenario)
        if result and result['qed_result']:
            results.append(result)
            qed_result = float(result['qed_result'])
            print(f"  Our App:    ${result['our_app_result']:,.0f}")
            
            # Calculate variance
            if qed_result > 0:
                variance = ((result['our_app_result'] - qed_result) / qed_result) * 100
                print(f"  Variance:   {variance:+.1f}%")
        else:
            print(f"  FAILED to get QED result")
        print()
    
    # Save results
    results_file = Path(r"C:\Users\encou\Documents\Project MicroSass\Otium\docs\qed_test_results_com.json")
    with open(results_file, 'w') as f:
        json.dump(results, f, indent=2)
    
    print(f"Results saved to: {results_file}")
    
    # Generate summary
    print("\nSUMMARY (QED MAX Loan Results):")
    print("-" * 60)
    for result in results:
        if result['qed_result']:
            qed_result = float(result['qed_result'])
            if qed_result > 0:
                variance = ((result['our_app_result'] - qed_result) / qed_result) * 100
                status = "✓ CLOSE" if abs(variance) <= 10 else "⚠ VARIANCE"
                print(f"{result['scenario_name'][:30]:30} | QED: ${qed_result:8,.0f} | Us: ${result['our_app_result']:8,.0f} | {variance:+6.1f}% | {status}")
    
    return results

if __name__ == "__main__":
    print("Note: This script requires pywin32 package and Excel installed on Windows")
    print("Installing: pip install pywin32\n")
    
    try:
        results = run_all_scenarios()
        print(f"\nCompleted testing {len(results)} scenarios with QED MAX Loan calculations")
    except ImportError:
        print("ERROR: pywin32 not installed. Please run: pip install pywin32")
    except Exception as e:
        print(f"ERROR: {str(e)}")
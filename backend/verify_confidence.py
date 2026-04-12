import sys
import os

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from app.core.confidence import calculate_confidence

def test_confidence_rigor():
    print("Testing Confidence Rigor...")
    
    schema = [
        {"name": "amount", "type": "FLOAT", "missing_pct": 10},
        {"name": "category", "type": "TEXT", "missing_pct": 5}
    ]
    
    # Simple query
    conf_simple = calculate_confidence(
        rows_used=100,
        total_rows=1000,
        columns_used=["amount"],
        schema=schema,
        question="What is the total amount?",
        sql_query="SELECT amount FROM data"
    )
    
    # Rigorous query
    conf_rigorous = calculate_confidence(
        rows_used=100,
        total_rows=1000,
        columns_used=["amount"],
        schema=schema,
        question="What is the total amount?",
        sql_query="SELECT CAST(amount AS FLOAT) AS total_amount FROM data"
    )
    
    print(f"Simple Confidence: {conf_simple['score']} (Breakdown: {conf_simple['breakdown']})")
    print(f"Rigorous Confidence: {conf_rigorous['score']} (Breakdown: {conf_rigorous['breakdown']})")
    
    assert conf_rigorous['score'] > conf_simple['score']
    assert conf_rigorous['breakdown']['schema_match'] > conf_simple['breakdown']['schema_match']
    print("Schema Rigor Test Passed!")

def test_completeness_realtime():
    print("\nTesting Real-time Completeness...")
    
    schema = [{"name": "amount", "type": "FLOAT", "missing_pct": 0}] # Schema says 0% missing
    
    # Scenario: Actual data has 50% nulls
    null_counts = {"amount": 50}
    
    conf = calculate_confidence(
        rows_used=100,
        total_rows=100,
        columns_used=["amount"],
        schema=schema,
        null_counts=null_counts
    )
    
    print(f"Completeness Score (50% nulls): {conf['breakdown']['data_completeness']}")
    assert conf['breakdown']['data_completeness'] == 50
    print("Real-time Completeness Test Passed!")

if __name__ == "__main__":
    try:
        test_confidence_rigor()
        test_completeness_realtime()
        print("\nALL CONFIDENCE TESTS PASSED!")
    except AssertionError as e:
        print(f"\n❌ TEST FAILED: {str(e)}")
        sys.exit(1)

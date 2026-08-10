from app.ai.github.analyzer import analyze_repository


result = analyze_repository(
    "Panchami12345",
    "Amazon-Clone",
)

print("\nAI GITHUB ANALYSIS:")
print(result)
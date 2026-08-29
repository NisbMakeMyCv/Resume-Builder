import os

files_to_fix = [
    "frontend/app/components/AppSidebar.tsx",
    "frontend/app/profile/page.tsx",
    "frontend/app/settings/page.tsx"
]

for filepath in files_to_fix:
    if os.path.exists(filepath):
        with open(filepath, "r") as f:
            content = f.read()
        
        # Replace router.replace/push after clearSession
        if "clearSession();" in content:
            content = content.replace('clearSession();\n      router.replace("/signup");', 'clearSession();\n      window.location.href = "/signup";')
            content = content.replace('clearSession();\n    router.replace("/signin");', 'clearSession();\n    window.location.href = "/signin";')
            content = content.replace('clearSession();\n    router.push("/signin");', 'clearSession();\n    window.location.href = "/signin";')
        
        with open(filepath, "w") as f:
            f.write(content)

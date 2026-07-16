import re
import subprocess
import os
import sys

# Get the diff
diff_text = subprocess.check_output(['git', 'diff']).decode('utf-8')
file_diffs = re.split(r'^(diff --git .*)$', diff_text, flags=re.MULTILINE)[1:]

patches = []
for i in range(0, len(file_diffs), 2):
    header_line = file_diffs[i]
    content = file_diffs[i+1]
    
    hunks_split = re.split(r'^(@@ .* @@.*)$', content, flags=re.MULTILINE)
    file_header = hunks_split[0]
    
    for j in range(1, len(hunks_split), 2):
        hunk_header = hunks_split[j]
        hunk_content = hunks_split[j+1]
        patches.append({
            'file_header': header_line + file_header,
            'hunk': hunk_header + hunk_content
        })

print(f"Total hunks to commit: {len(patches)}")

commit_messages = [
    "Refactor: Replace native sort select with custom dropdown structure",
    "A11y: Wrap mobile nav text in spans",
    "Cleanup: Remove unused hamburger menu button",
    "Cleanup: Remove site credit from footer",
    "Cleanup: Remove unused navToggle JS",
    "Feat: Add custom sort dropdown logic",
    "Fix: Handle custom sort reset in app.js",
    "Refactor: Update JS rendering for mobile categories",
    "Cleanup: Remove unused navToggle CSS",
    "Style: Custom styling for custom sort dropdown",
    "Cleanup: Remove unused site credit CSS",
    "Style: Adjust navbar brand centering for mobile",
    "Style: Implement horizontal bottom tab bar on mobile",
    "Fix: Adjust mobile toast positioning",
    "Style: Add mobile categorized horizontal scrolling UI"
]

# Stash current changes to keep them safe
print("Stashing changes...")
subprocess.check_call(['git', 'stash'])

# Make sure we are clean
subprocess.check_call(['git', 'reset', '--hard', 'HEAD'])

for i, patch_dict in enumerate(patches):
    msg = commit_messages[i] if i < len(commit_messages) else f"Update part {i+1}"
    patch_str = patch_dict['file_header'] + patch_dict['hunk']
    
    with open('tmp.patch', 'w') as f:
        f.write(patch_str)
    
    print(f"Applying patch {i+1}/15...")
    try:
        # patch -p1 is more robust than git apply for sequential hunks
        subprocess.check_output(['patch', '-p1', '--no-backup-if-mismatch', '-i', 'tmp.patch'])
        subprocess.check_call(['git', 'add', '.'])
        subprocess.check_call(['git', 'commit', '-m', msg])
    except subprocess.CalledProcessError as e:
        print(f"Failed to apply patch {i+1}!")
        print("Output:", e.output if hasattr(e, 'output') else e)
        sys.exit(1)

print("All 15 commits created successfully!")

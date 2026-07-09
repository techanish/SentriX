import os
import subprocess

def rewrite():
    # Git for Windows uses sh.exe for filter-branch
    script = """
git filter-branch -f --env-filter '
    GIT_AUTHOR_NAME="techanish"
    GIT_AUTHOR_EMAIL="techanish@github.com"
    GIT_COMMITTER_NAME="techanish"
    GIT_COMMITTER_EMAIL="techanish@github.com"
' HEAD
    """
    subprocess.run(script, shell=True)

if __name__ == "__main__":
    rewrite()

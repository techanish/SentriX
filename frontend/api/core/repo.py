import os
import shutil
import tempfile
import subprocess
import logging

logger = logging.getLogger(__name__)

class RepositoryManager:
    """
    Handles cloning and managing target repositories for analysis.
    """
    
    def __init__(self):
        # We will store clones in a specific temp directory
        self.base_dir = os.path.join(tempfile.gettempdir(), "sentrix_repos")
        os.makedirs(self.base_dir, exist_ok=True)
        
    def clone_repo(self, repo_url: str) -> str:
        """
        Downloads a git repository as a zipball to a temporary local directory.
        Bypasses the need for 'git' binary on Vercel.
        """
        import requests, zipfile, io, uuid
        
        repo_url = repo_url.rstrip("/")
        if repo_url.endswith(".git"):
            repo_url = repo_url[:-4]
            
        parts = repo_url.split("/")
        if len(parts) >= 2:
            owner, repo_name = parts[-2], parts[-1]
        else:
            raise ValueError("Invalid GitHub URL provided.")
            
        unique_id = str(uuid.uuid4())[:8]
        target_path = os.path.join(self.base_dir, f"{repo_name}_{unique_id}")
        
        logger.info(f"Downloading {repo_url} into {target_path}")
        
        try:
            # Using the GitHub API to get the zipball of the default branch
            zip_url = f"https://api.github.com/repos/{owner}/{repo_name}/zipball"
            response = requests.get(zip_url, allow_redirects=True, timeout=15)
            response.raise_for_status()
            
            os.makedirs(target_path, exist_ok=True)
            with zipfile.ZipFile(io.BytesIO(response.content)) as z:
                z.extractall(target_path)
                
            logger.info("Repository downloaded and extracted successfully.")
            return target_path
        except Exception as e:
            logger.error(f"Failed to download repository: {e}")
            raise RuntimeError(f"Failed to fetch repository. {e}")

    def cleanup(self, path: str):
        """
        Deletes the repository from the local filesystem.
        """
        if os.path.exists(path) and self.base_dir in path:
            logger.info(f"Cleaning up repository at {path}")
            shutil.rmtree(path, ignore_errors=True)

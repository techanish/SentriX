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
        Clones a git repository to a temporary local directory.
        Returns the path to the cloned repository.
        """
        # Create a unique folder name based on the repo URL (crude but effective for MVP)
        repo_name = repo_url.rstrip("/").split("/")[-1]
        if repo_name.endswith(".git"):
            repo_name = repo_name[:-4]
            
        # Add a random suffix to avoid collisions
        import uuid
        unique_id = str(uuid.uuid4())[:8]
        target_path = os.path.join(self.base_dir, f"{repo_name}_{unique_id}")
        
        logger.info(f"Cloning {repo_url} into {target_path}")
        
        try:
            # Using subprocess to call git clone directly
            result = subprocess.run(
                ["git", "clone", "--depth", "1", repo_url, target_path],
                check=True,
                capture_output=True,
                text=True
            )
            logger.info("Repository cloned successfully.")
            return target_path
        except subprocess.CalledProcessError as e:
            logger.error(f"Failed to clone repository: {e.stderr}")
            raise Exception(f"Failed to clone repository: {e.stderr}")

    def cleanup(self, path: str):
        """
        Deletes the repository from the local filesystem.
        """
        if os.path.exists(path) and self.base_dir in path:
            logger.info(f"Cleaning up repository at {path}")
            shutil.rmtree(path, ignore_errors=True)

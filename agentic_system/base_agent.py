import abc
from typing import Any, Dict

class BaseAgent(abc.ABC):
    """Abstract base class for all agents."""
    def __init__(self, name: str):
        self.name = name

    @abc.abstractmethod
    def handle_task(self, message: Dict[str, Any]) -> Dict[str, Any]:
        pass

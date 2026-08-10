"""Optional admission-control layer for PayPalAPI, powered by tulip-agents.

See governance.py's module docstring for the full picture. `tulip-agents`
is a real dependency of this module and `examples/tulip/` only -- not the
rest of this package (see `examples/tulip/requirements.txt`; it is not
added to the top-level `pyproject.toml`/`requirements.txt`, unlike the
existing framework packages, specifically to avoid adding a new hard
dependency for every installer of this toolkit).
"""

from .governance import GovernedPayPalAPI, classify

__all__ = ["GovernedPayPalAPI", "classify"]

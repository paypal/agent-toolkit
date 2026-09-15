import pytest
from unittest.mock import MagicMock


@pytest.fixture
def mock_client():
    """A MagicMock standing in for PayPalClient. Handlers only ever call
    .post/.get/.put/.delete on it, so no HTTP/auth machinery is involved."""
    client = MagicMock()
    client.post.return_value = {}
    client.get.return_value = {}
    client.put.return_value = {}
    client.delete.return_value = {}
    return client

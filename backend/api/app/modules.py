"""Разделы приложения и уровни доступа к ним.

id разделов совпадают с frontend/src/shell/modules.ts (ModuleId).
"""
from typing import Literal

Module = Literal["dashboard", "sklad", "razgovory"]
Level = Literal["view", "edit"]
Role = Literal["director", "admin", "nurse", "staff"]

MODULES: tuple[Module, ...] = ("dashboard", "sklad", "razgovory")
# Порядок важен: edit включает view.
LEVELS: tuple[Level, ...] = ("view", "edit")

# Права, которые получает новый сотрудник по роли (директор потом может поменять).
# Директору права не нужны — он видит всё.
DEFAULT_PERMISSIONS: dict[str, dict[str, str]] = {
    "director": {},
    "admin": {"razgovory": "edit"},
    "nurse": {"sklad": "edit"},
    "staff": {},
}


def level_allows(have: str | None, need: str) -> bool:
    return have is not None and LEVELS.index(have) >= LEVELS.index(need)

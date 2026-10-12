"""Пользователи и права (users, permissions)

Revision ID: bb67e4630fa2
Revises: 
Create Date: 2026-10-12 14:48:48.984910
"""
from alembic import op
import sqlalchemy as sa


revision = 'bb67e4630fa2'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table('users',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('login', sa.String(length=64), nullable=False),
    sa.Column('name', sa.String(length=128), nullable=False),
    sa.Column('role', sa.String(length=32), nullable=False),
    sa.Column('password_hash', sa.String(length=255), nullable=False),
    sa.Column('is_active', sa.Boolean(), nullable=False),
    sa.Column('token_version', sa.Integer(), nullable=False),
    sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('login')
    )
    op.create_table('permissions',
    sa.Column('user_id', sa.Integer(), nullable=False),
    sa.Column('module', sa.String(length=32), nullable=False),
    sa.Column('level', sa.String(length=16), nullable=False),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('user_id', 'module')
    )


def downgrade() -> None:
    op.drop_table('permissions')
    op.drop_table('users')

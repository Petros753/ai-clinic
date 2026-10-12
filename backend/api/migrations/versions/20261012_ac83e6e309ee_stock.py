"""Склад: категории, поставщики, позиции, операции и строки операций

Revision ID: ac83e6e309ee
Revises: bb67e4630fa2
Create Date: 2026-10-12 15:09:09.590305
"""
from alembic import op
import sqlalchemy as sa


revision = 'ac83e6e309ee'
down_revision = 'bb67e4630fa2'
branch_labels = None
depends_on = None


def upgrade() -> None:
    categories = op.create_table('stock_categories',
    sa.Column('id', sa.String(length=32), nullable=False),
    sa.Column('name', sa.String(length=128), nullable=False),
    sa.Column('color', sa.String(length=16), nullable=False),
    sa.Column('sort', sa.Integer(), nullable=False),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_table('stock_suppliers',
    sa.Column('id', sa.String(length=32), nullable=False),
    sa.Column('name', sa.String(length=128), nullable=False),
    sa.Column('contact', sa.String(length=255), nullable=False),
    sa.Column('lead_days', sa.Integer(), nullable=False),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_table('stock_items',
    sa.Column('id', sa.String(length=32), nullable=False),
    sa.Column('barcode', sa.String(length=32), nullable=False),
    sa.Column('sku', sa.String(length=64), nullable=False),
    sa.Column('name', sa.String(length=255), nullable=False),
    sa.Column('brand', sa.String(length=128), nullable=False),
    sa.Column('category_id', sa.String(length=32), nullable=False),
    sa.Column('unit', sa.String(length=8), nullable=False),
    sa.Column('pack', sa.String(length=64), nullable=False),
    sa.Column('min', sa.Integer(), nullable=False),
    sa.Column('max', sa.Integer(), nullable=False),
    sa.Column('price', sa.Numeric(precision=12, scale=2), nullable=False),
    sa.Column('supplier_id', sa.String(length=32), nullable=True),
    sa.Column('location', sa.String(length=128), nullable=False),
    sa.Column('expiry', sa.Date(), nullable=True),
    sa.Column('stock', sa.Integer(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['category_id'], ['stock_categories.id'], ),
    sa.ForeignKeyConstraint(['supplier_id'], ['stock_suppliers.id'], ),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('barcode'),
    sa.CheckConstraint('stock >= 0', name='stock_not_negative'),
    )
    op.create_table('stock_operations',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('idempotency_key', sa.String(length=64), nullable=False),
    sa.Column('type', sa.String(length=16), nullable=False),
    sa.Column('source', sa.String(length=16), nullable=False),
    sa.Column('user_id', sa.Integer(), nullable=False),
    sa.Column('performer', sa.String(length=128), nullable=False),
    sa.Column('room', sa.String(length=128), nullable=True),
    sa.Column('note', sa.String(length=255), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('idempotency_key')
    )
    op.create_index(op.f('ix_stock_operations_created_at'), 'stock_operations', ['created_at'], unique=False)
    op.create_table('stock_movements',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('operation_id', sa.Integer(), nullable=False),
    sa.Column('item_id', sa.String(length=32), nullable=False),
    sa.Column('delta', sa.Integer(), nullable=False),
    sa.ForeignKeyConstraint(['item_id'], ['stock_items.id'], ),
    sa.ForeignKeyConstraint(['operation_id'], ['stock_operations.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_stock_movements_item_id'), 'stock_movements', ['item_id'], unique=False)
    op.create_index(op.f('ix_stock_movements_operation_id'), 'stock_movements', ['operation_id'], unique=False)

    # Категории расходников стоматологии — без них не завести позицию (редактора категорий пока нет).
    op.bulk_insert(categories, [
        {'id': 'ppe', 'name': 'СИЗ и гигиена', 'color': '#3987e5', 'sort': 1},
        {'id': 'anest', 'name': 'Анестезия', 'color': '#d95926', 'sort': 2},
        {'id': 'fill', 'name': 'Пломбировочные', 'color': '#199e70', 'sort': 3},
        {'id': 'endo', 'name': 'Эндодонтия', 'color': '#c98500', 'sort': 4},
        {'id': 'steril', 'name': 'Стерилизация', 'color': '#d55181', 'sort': 5},
        {'id': 'disp', 'name': 'Одноразовые', 'color': '#008300', 'sort': 6},
        {'id': 'impr', 'name': 'Оттиски', 'color': '#9085e9', 'sort': 7},
    ])


def downgrade() -> None:
    op.drop_index(op.f('ix_stock_movements_operation_id'), table_name='stock_movements')
    op.drop_index(op.f('ix_stock_movements_item_id'), table_name='stock_movements')
    op.drop_table('stock_movements')
    op.drop_index(op.f('ix_stock_operations_created_at'), table_name='stock_operations')
    op.drop_table('stock_operations')
    op.drop_table('stock_items')
    op.drop_table('stock_suppliers')
    op.drop_table('stock_categories')

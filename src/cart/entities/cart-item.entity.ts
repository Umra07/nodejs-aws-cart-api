import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { CartEntity } from './cart.entity';

@Entity('cart_items')
export class CartItemEntity {
  @PrimaryColumn({ type: 'varchar' })
  cart_id: string;

  @PrimaryColumn({ type: 'varchar' })
  product_id: string;

  @Column({ type: 'int' })
  count: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  price: number;

  @Column({ type: 'varchar', default: '' })
  title: string;

  @Column({ type: 'varchar', default: '' })
  description: string;

  @ManyToOne(() => CartEntity, (cart) => cart.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cart_id' })
  cart: CartEntity;
}

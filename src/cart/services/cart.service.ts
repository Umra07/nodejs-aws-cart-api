import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CartEntity, CartStatus } from '../entities/cart.entity';
import { CartItemEntity } from '../entities/cart-item.entity';
import { PutCartPayload } from 'src/order/type';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(CartEntity)
    private cartRepository: Repository<CartEntity>,
    @InjectRepository(CartItemEntity)
    private cartItemRepository: Repository<CartItemEntity>,
  ) {}

  findByUserId(userId: string): Promise<CartEntity | null> {
    return this.cartRepository.findOne({
      where: { user_id: userId, status: CartStatus.OPEN },
      relations: { items: true },
    });
  }

  async createByUserId(userId: string): Promise<CartEntity> {
    const cart = this.cartRepository.create({
      user_id: userId,
      status: CartStatus.OPEN,
    });
    return this.cartRepository.save(cart);
  }

  async findOrCreateByUserId(userId: string): Promise<CartEntity> {
    const existing = await this.findByUserId(userId);
    if (existing) return existing;
    return this.createByUserId(userId);
  }

  async updateByUserId(
    userId: string,
    payload: PutCartPayload,
  ): Promise<CartEntity> {
    const cart = await this.findOrCreateByUserId(userId);
    const productId = payload.product.id;
    const existingItem = cart.items?.find(
      (item) => item.product_id === productId,
    );

    if (payload.count === 0) {
      if (existingItem) {
        await this.cartItemRepository.delete({
          cart_id: cart.id,
          product_id: productId,
        });
      }
    } else if (existingItem) {
      await this.cartItemRepository.update(
        { cart_id: cart.id, product_id: productId },
        {
          count: payload.count,
          price: payload.product.price,
          title: payload.product.title,
          description: payload.product.description,
        },
      );
    } else {
      await this.cartItemRepository.save({
        cart_id: cart.id,
        product_id: productId,
        count: payload.count,
        price: payload.product.price,
        title: payload.product.title,
        description: payload.product.description,
      });
    }

    return this.findByUserId(userId);
  }

  async removeByUserId(userId: string): Promise<void> {
    const cart = await this.findByUserId(userId);
    if (cart) {
      await this.cartRepository.delete(cart.id);
    }
  }
}

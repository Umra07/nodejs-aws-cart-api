import {
  Controller,
  Get,
  Delete,
  Put,
  Body,
  Req,
  UseGuards,
  HttpStatus,
  HttpCode,
  BadRequestException,
} from '@nestjs/common';
import { BasicAuthGuard } from '../auth';
import { Order, OrderService } from '../order';
import { AppRequest, getUserIdFromRequest } from '../shared';
import { CartService } from './services';
import { CartItemEntity } from './entities/cart-item.entity';
import { CartEntity } from './entities/cart.entity';
import { Cart, CartItem, CartStatuses } from './models';
import { CreateOrderDto, PutCartPayload } from 'src/order/type';

function toCartItems(entities: CartItemEntity[]): CartItem[] {
  return (entities ?? []).map((item) => ({
    product: {
      id: item.product_id,
      title: item.title,
      description: item.description,
      price: Number(item.price),
    },
    count: item.count,
  }));
}

function toCartResponse(entity: CartEntity): Cart {
  return {
    id: entity.id,
    user_id: entity.user_id,
    status: entity.status as unknown as CartStatuses,
    created_at: entity.created_at,
    updated_at: entity.updated_at,
    items: toCartItems(entity.items),
  };
}

@Controller('api/profile/cart')
export class CartController {
  constructor(
    private cartService: CartService,
    private orderService: OrderService,
  ) {}

  @UseGuards(BasicAuthGuard)
  @Get()
  async findUserCart(@Req() req: AppRequest): Promise<Cart> {
    const cart = await this.cartService.findOrCreateByUserId(
      getUserIdFromRequest(req),
    );
    return toCartResponse(cart);
  }

  @UseGuards(BasicAuthGuard)
  @Put()
  async updateUserCart(
    @Req() req: AppRequest,
    @Body() body: PutCartPayload,
  ): Promise<Cart> {
    const cart = await this.cartService.updateByUserId(
      getUserIdFromRequest(req),
      body,
    );
    return toCartResponse(cart);
  }

  @UseGuards(BasicAuthGuard)
  @Delete()
  @HttpCode(HttpStatus.OK)
  async clearUserCart(@Req() req: AppRequest): Promise<void> {
    await this.cartService.removeByUserId(getUserIdFromRequest(req));
  }

  @UseGuards(BasicAuthGuard)
  @Put('order')
  async checkout(@Req() req: AppRequest, @Body() body: CreateOrderDto) {
    const userId = getUserIdFromRequest(req);
    const cart = await this.cartService.findByUserId(userId);

    if (!(cart && cart.items.length)) {
      throw new BadRequestException('Cart is empty');
    }

    const order = this.orderService.create({
      userId,
      cartId: cart.id,
      items: cart.items.map(({ product_id, count }) => ({
        productId: product_id,
        count,
      })),
      address: body.address,
      total: 0,
    });

    await this.cartService.removeByUserId(userId);

    return { order };
  }

  @UseGuards(BasicAuthGuard)
  @Get('order')
  getOrder(): Order[] {
    return this.orderService.getAll();
  }
}

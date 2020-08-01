import { getRepository, Repository, In } from 'typeorm';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICreateProductDTO from '@modules/products/dtos/ICreateProductDTO';
import IUpdateProductsQuantityDTO from '@modules/products/dtos/IUpdateProductsQuantityDTO';
import AppError from '@shared/errors/AppError';
import Product from '../entities/Product';

interface IFindProducts {
  id: string;
}

class ProductsRepository implements IProductsRepository {
  private ormRepository: Repository<Product>;

  constructor() {
    this.ormRepository = getRepository(Product);
  }

  public async create({
    name,
    price,
    quantity,
  }: ICreateProductDTO): Promise<Product> {
    const product = this.ormRepository.create({
      name,
      price,
      quantity,
    });

    await this.ormRepository.save(product);

    return product;
  }

  public async findByName(name: string): Promise<Product | undefined> {
    const findByProductName = await this.ormRepository.findOne({
      where: {
        name,
      },
    });

    return findByProductName;
  }

  public async findAllById(products: IFindProducts[]): Promise<Product[]> {
    const findById = products.map(product => product.id);
    const order = await this.ormRepository.find({ id: In(findById) });

    if (findById.length !== order.length) {
      throw new AppError('Missing Product.');
    }

    return order;
  }

  public async updateQuantity(
    products: IUpdateProductsQuantityDTO[],
  ): Promise<Product[]> {
    const updateProduct = await this.findAllById(products);

    const newProducts = updateProduct.map(update => {
      const productFind = products.find(product => product.id === update.id);

      if (!productFind) {
        throw new AppError('Product not found.');
      }

      if (update.quantity < productFind.quantity) {
        throw new AppError('Insuficient quantity product');
      }

      const newProduct = update;

      newProduct.quantity -= productFind.quantity;

      return newProduct;
    });

    await this.ormRepository.save(newProducts);

    return newProducts;
  }
}

export default ProductsRepository;

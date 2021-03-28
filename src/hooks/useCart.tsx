import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const responseStock = await api.get(`/stock/${productId}`);
      const { data: dataStock } = responseStock;

      if (dataStock.amount === 0) {
        toast.error('Quantidade solicitada fora de estoque');
      }

      const findProduct = cart.find(product => product.id === productId);

      if (findProduct) {
        const updatedCart = cart.map(item => {
          if (item.id === productId) {
            return {
              ...item,
              amount: item.amount + 1
            }
          }
          return item;
        });

        setCart(updatedCart);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));
        return;
      }

      const responseProduct = await api.get(`/products/${productId}`);
      const { data: dataProduct } = responseProduct;

      const newProduct = {
        ...dataProduct,
        amount: 1
      };

      setCart([...cart, newProduct]);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart));
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const cartFiltered = cart.filter(item => (
        item.id != productId
      ));
      setCart(cartFiltered);
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const cartUpdated = cart.map(item => {
        if (item.id === productId) {
          return {
            ...item,
            amount
          }
        }
        return item;
      });

      setCart(cartUpdated);
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}

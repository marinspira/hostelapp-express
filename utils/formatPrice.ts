export const formatPrice = (price: string | number | undefined): string => {
  if (typeof price === 'number') {
    return price.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }
  return price ? String(price) : '0,00';
};
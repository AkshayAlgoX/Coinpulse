import { fetcher } from '@/lib/coingecko.server';
import CategoriesList from '@/components/home/CategoriesList';
import { CategoriesFallback } from '@/components/home/fallback';
import type { Category } from '@/types';

const Categories = async () => {
  let categories: Category[];

  try {
    categories = await fetcher<Category[]>('/coins/categories');
  } catch (error) {
    console.error('Failed to fetch categories:', error);
    return <CategoriesFallback />;
  }

  return (
    <div id="categories" className="custom-scrollbar">
      <h4>Top Categories</h4>

      <CategoriesList categories={categories?.slice(0, 10)} />
    </div>
  );
};

export default Categories;

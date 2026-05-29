import { CategoryManager } from '@/components/admin/category-manager';

export default function AdminCategoriesPage() {
  return (
    <div className="p-4 md:p-6">
      <h1 className="mb-4 text-xl font-semibold">Danh mục</h1>
      <CategoryManager />
    </div>
  );
}

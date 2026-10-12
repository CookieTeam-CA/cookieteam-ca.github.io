import { categoryColor } from "../lib/collections";

export default function CategoryBadge({ category }: { category: string }) {
  const color = categoryColor(category);
  return <small className="stats-category-badge" style={{ color, backgroundColor: `${color}18` }}><span aria-hidden="true" style={{ backgroundColor: color }} />{category}</small>;
}

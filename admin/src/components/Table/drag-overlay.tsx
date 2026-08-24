import { GripVertical } from "lucide-react";

interface Product {
  id: string;
  productId: string;
  name: string;
  image: string;
  price: string;
  quantity: string;
  sale: string;
  stock: string;
  startDate: string;
}

interface DragOverlayRowProps {
  product: Product | null;
}

export function DragOverlayRow({ product }: DragOverlayRowProps) {
  if (!product) return null;

  return (
    <div className="bg-white shadow-lg border rounded-md p-2">
      <div className="flex items-center gap-4">
        <div className="flex items-center justify-center w-6 h-6">
          <GripVertical size={16} className="text-gray-400" />
        </div>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-md overflow-hidden flex-shrink-0">
            <img
              src={product.image || "/placeholder.svg"}
              alt={product.name}
              width={40}
              height={40}
              className="object-cover"
            />
          </div>
          <span className="font-medium">{product.name}</span>
        </div>
      </div>
    </div>
  );
}

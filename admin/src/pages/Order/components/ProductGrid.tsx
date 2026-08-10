import DishPlaceHolder from "@/assets/product_placeholder.jpg";
import { CurrencySign, IMAGE_BASE_URL } from "@/constants";
import { useVirtualWindow } from "@/hooks/useVirtualWindow";
import { Minus, Plus } from "lucide-react";
import { useMemo } from "react";
import styles from "./AddEditOrder.module.css";

export type ProductListItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  quantity: number;
  departmentId: number;
  mediaArr: { imageUrl: string }[];
};

type ProductGridProps = {
  products: ProductListItem[];
  menuView: "card" | "list";
  qtyForProduct: (productId: string | number) => number;
  onAdd: (product: ProductListItem) => void;
  onAdjustQty: (product: ProductListItem, delta: number) => void;
};

const LIST_ROW_HEIGHT = 92;
const CARD_ROW_HEIGHT = 200;
const CARD_COLUMNS = 4;

function ProductCard({
  product,
  inCartQty,
  menuView,
  onAdd,
  onAdjustQty,
}: {
  product: ProductListItem;
  inCartQty: number;
  menuView: "card" | "list";
  onAdd: () => void;
  onAdjustQty: (delta: number) => void;
}) {
  return (
    <div
      className={`${styles.productCard} ${
        inCartQty > 0 ? styles.productCardActive : ""
      }`}
      style={menuView === "card" ? { contentVisibility: "auto" } : undefined}
      onClick={onAdd}
    >
      <div className={styles.productImageWrap}>
        <img
          src={`${product?.mediaArr?.[0]?.imageUrl ? IMAGE_BASE_URL + product.mediaArr[0].imageUrl : DishPlaceHolder}`}
          alt={product.name}
          className={styles.productImage}
          loading="lazy"
          decoding="async"
        />
        {inCartQty > 0 && (
          <span className={styles.productQtyBadge}>{inCartQty}</span>
        )}
      </div>
      <div className={styles.productBody}>
        <h4 className={styles.productName}>{product.name}</h4>
        <span className={styles.productPrice}>
          {CurrencySign} {Number(product.price).toFixed(2)}
        </span>
        <button type="button" className={styles.addBtn}>
          Add to Order
        </button>
      </div>
      <div
        className={styles.mobileQtyControls}
        onClick={(e) => e.stopPropagation()}
      >
        {inCartQty > 0 ? (
          <>
            <button
              type="button"
              className={styles.mobileQtyBtn}
              aria-label="Decrease quantity"
              onClick={() => onAdjustQty(-1)}
            >
              <Minus size={16} />
            </button>
            <span className={styles.mobileQtyValue}>{inCartQty}</span>
            <button
              type="button"
              className={styles.mobileQtyBtn}
              aria-label="Increase quantity"
              onClick={() => onAdjustQty(1)}
            >
              <Plus size={16} />
            </button>
          </>
        ) : (
          <button
            type="button"
            className={styles.mobileAddBtn}
            aria-label={`Add ${product.name}`}
            onClick={onAdd}
          >
            <Plus size={18} />
          </button>
        )}
      </div>
    </div>
  );
}

export default function ProductGrid({
  products,
  menuView,
  qtyForProduct,
  onAdd,
  onAdjustQty,
}: ProductGridProps) {
  const isList = menuView === "list";
  const virtualCount = isList
    ? products.length
    : Math.ceil(products.length / CARD_COLUMNS);
  const itemHeight = isList ? LIST_ROW_HEIGHT : CARD_ROW_HEIGHT;
  const { containerRef, range, totalHeight, offsetY } = useVirtualWindow(
    virtualCount,
    { itemHeight },
  );

  const visibleProducts = useMemo(() => {
    if (isList) {
      return products.slice(range.start, range.end);
    }

    const items: ProductListItem[] = [];
    for (let row = range.start; row < range.end; row++) {
      for (let col = 0; col < CARD_COLUMNS; col++) {
        const index = row * CARD_COLUMNS + col;
        if (index >= products.length) break;
        items.push(products[index]);
      }
    }
    return items;
  }, [isList, products, range.end, range.start]);

  return (
    <div
      ref={containerRef}
      style={{ maxHeight: "min(62vh, 720px)", overflowY: "auto" }}
    >
      <div style={{ height: totalHeight, position: "relative" }}>
        <div
          className={`${styles.productGrid} ${
            isList ? styles.productGridList : styles.productGridCards
          }`}
          style={{
            position: "absolute",
            top: offsetY,
            left: 0,
            right: 0,
          }}
        >
          {visibleProducts.map((product) => {
            const inCartQty = qtyForProduct(product.id);
            return (
              <ProductCard
                key={product.id}
                product={product}
                inCartQty={inCartQty}
                menuView={menuView}
                onAdd={() => onAdd(product)}
                onAdjustQty={(delta) => onAdjustQty(product, delta)}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

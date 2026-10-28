import DishPlaceHolder from "@/assets/product_placeholder.jpg";
import { CurrencySign, IMAGE_BASE_URL } from "@/constants";
import { useMemo } from "react";
import "./menuPreview.css";

type MenuProduct = {
  id: number;
  name: string;
  price?: number | string | null;
  description?: string | null;
  isTopSelling?: boolean;
  productCategoryId?: number | null;
  product_category?: { id: number; name: string } | null;
  mediaArr?: Array<{ imageUrl?: string | null }>;
};

type MenuPreviewProps = {
  items: MenuProduct[];
  canEdit?: boolean;
  onEdit?: (id: number) => void;
  cafeLabel?: string;
};

const formatPrice = (price: number | string | null | undefined) => {
  const n = Number(price ?? 0);
  return `${CurrencySign} ${n.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
};

export default function MenuPreview({
  items,
  canEdit = false,
  onEdit,
  cafeLabel = "Our Menu",
}: MenuPreviewProps) {
  const sections = useMemo(() => {
    const map = new Map<string, MenuProduct[]>();
    for (const item of items) {
      const key =
        item.product_category?.name?.trim() ||
        (item.productCategoryId ? `Category ${item.productCategoryId}` : "Menu");
      const list = map.get(key) || [];
      list.push(item);
      map.set(key, list);
    }
    return [...map.entries()].map(([title, rows]) => ({ title, rows }));
  }, [items]);

  if (!items.length) {
    return (
      <div className="menu-preview">
        <div className="menu-preview__board">
          <div className="menu-preview__empty">
            No items match this search. Try another name or category.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="menu-preview">
      <div className="menu-preview__board">
        <header className="menu-preview__header">
          <p className="menu-preview__eyebrow">Today&apos;s kitchen</p>
          <h2 className="menu-preview__title">{cafeLabel}</h2>
          <div className="menu-preview__rule" aria-hidden />
        </header>

        <div className="menu-preview__sections">
          {sections.map((section) => (
            <section key={section.title} className="menu-preview__section">
              <h3 className="menu-preview__section-title">
                <span>{section.title}</span>
              </h3>
              <ul className="menu-preview__list">
                {section.rows.map((item) => {
                  const imagePath = item.mediaArr?.[0]?.imageUrl;
                  const imageUrl = imagePath
                    ? `${IMAGE_BASE_URL}${imagePath}`
                    : DishPlaceHolder;
                  const clickable = Boolean(canEdit && onEdit);
                  const Comp = clickable ? "button" : "div";
                  return (
                    <li key={item.id}>
                      <Comp
                        type={clickable ? "button" : undefined}
                        className={`menu-preview__item${
                          clickable ? " menu-preview__item--clickable" : ""
                        }`}
                        onClick={
                          clickable ? () => onEdit?.(item.id) : undefined
                        }
                        title={clickable ? `Edit ${item.name}` : undefined}
                      >
                        <img
                          src={imageUrl}
                          alt=""
                          className="menu-preview__photo"
                          loading="lazy"
                        />
                        <div className="menu-preview__body">
                          <div className="menu-preview__row">
                            <span className="menu-preview__name">
                              {item.name}
                            </span>
                            <span className="menu-preview__dots" aria-hidden />
                            <span className="menu-preview__price">
                              {formatPrice(item.price)}
                            </span>
                          </div>
                          <div className="menu-preview__meta">
                            {item.isTopSelling ? (
                              <span className="menu-preview__badge">
                                Top selling
                              </span>
                            ) : null}
                            {item.description ? (
                              <p className="menu-preview__desc">
                                {item.description}
                              </p>
                            ) : null}
                          </div>
                        </div>
                      </Comp>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}

/* src/app/products/[slug]/page.tsx */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { fetchProduct, fetchProducts } from "@/services/catalog";
import type { Product } from "@/types";
import { Check, Phone, Truck, Shield, Sparkles } from "lucide-react";
import ProductActions from "@/components/product/ProductActions";
import ProductThumbs from "@/components/product/ProductThumbs";

export const revalidate = 0;
export const dynamic = "force-dynamic";

/* normalizeProducts and RelatedCard unchanged (kept same as before) */
function normalizeProducts(resp: unknown): Product[] {
  if (!resp) return [];
  if (Array.isArray(resp)) return resp as Product[];
  if (typeof resp !== "object") return [];

  const obj = resp as Record<string, any>;
  if (Array.isArray(obj.items)) return obj.items as Product[];
  if (Array.isArray(obj.data)) return obj.data as Product[];
  if (obj.data && Array.isArray(obj.data.items))
    return obj.data.items as Product[];
  if (Array.isArray(obj.results)) return obj.results as Product[];

  const firstArr = Object.values(obj).find((v) => Array.isArray(v));
  if (Array.isArray(firstArr)) return firstArr as Product[];

  return [];
}

function RelatedCard({ product }: { product: Product | any }) {
  const maybeImages = Array.isArray((product as any)?.images)
    ? (product as any).images
    : undefined;
  const img =
    product.image || (maybeImages ? maybeImages[0] : "") || "/fallback.webp";

  return (
    <Link
      href={`/products/${product.slug}`}
      className="rel-card h-full flex flex-col rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition"
    >
      <div className="relative aspect-square rounded-xl overflow-hidden bg-gradient-to-br from-[#F5FDF8] to-[#F5FDF8]">
        <Image
          src={img}
          alt={product.title}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
          className="object-contain transition-transform duration-300 group-hover:scale-105"
          priority={false}
        />
      </div>

      <div className="p-3 flex-1 flex flex-col">
        <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 min-h-[2.75rem]">
          {product.title}
        </h3>

        <div className="mt-auto pt-2 flex items-baseline gap-2">
          <span className="text-pink-700 font-bold">
            ৳{Number(product.price || 0).toFixed(0)}
          </span>
          {typeof product.compareAtPrice === "number" &&
            product.compareAtPrice > (product.price || 0) && (
              <span className="text-gray-400 line-through text-sm">
                ৳{product.compareAtPrice}
              </span>
            )}
        </div>
      </div>
    </Link>
  );
}

/* MAIN PAGE */
export default async function ProductDetailsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const hotline = process.env.NEXT_PUBLIC_HOTLINE || "+8801318319610";
  const { slug } = await params;

  const res = await fetchProduct(slug).catch(() => null);
  if (!res?.data) return notFound();
  const product = res.data as Product;

  const galleryImages =
    Array.isArray((product as any)?.images) && (product as any).images.length
      ? (product as any).images.filter(Boolean)
      : [];
  const finalGallery = galleryImages.length
    ? galleryImages
    : product.image
      ? [product.image]
      : [];

  // related
  let related: Product[] = [];
  if (product.categorySlug) {
    const raw = await fetchProducts({
      category: product.categorySlug,
      limit: 12,
      sort: "-createdAt",
    }).catch(() => null);
    const candidate = raw?.data ?? raw;
    const arr = normalizeProducts(candidate);
    related = arr.filter((p) => p.slug !== product.slug).slice(0, 8);
  }

  const hasDiscount =
    !!product.isDiscounted ||
    (typeof product.compareAtPrice === "number" &&
      product.compareAtPrice > product.price);

  const rawDesc =
    typeof product.description === "string" ? product.description : "";
  const hasDesc = /\S/.test(rawDesc);
  const safeDesc = rawDesc.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "");
  const looksHtml = /<\/?[a-z][\s\S]*>/i.test(safeDesc);

  return (
    <div className="min-h-screen bg-[#F5FDF8] mt-6">
      <div className="max-w-7xl mx-auto px-4 xs:px-5 sm:px-6 lg:px-8 py-4 md:py-6 lg:py-10">
        {/* Grid: mobile single column (compressed), lg -> two columns (unchanged layout) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-10">
          {/* LEFT: IMAGE + Thumb + Description (mobile: thumbs & desc collapsed) */}
          <div className="bg-white rounded-2xl text-black shadow-md transition-border border border-pink-100 p-3 overflow-hidden">
            {/* Main image: mobile smaller height so actions appear on screen */}
            <div
              id={`main-img-box-${product._id}`}
              className="relative w-full rounded-xl overflow-hidden bg-gradient-to-br from-[#F5FDF8] to-[#F5FDF8]"
            >
              {/* responsive heights: mobile compressed, lg uses aspect-square */}
              <div className="lg:aspect-square lg:h-auto h-44 sm:h-56 relative">
                {finalGallery[0] ? (
                  <Image
                    src={finalGallery[0]}
                    alt={product.title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 50vw"
                    className="object-cover transition-transform duration-500"
                    priority
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <Sparkles className="w-20 h-20 text-gray-300" />
                  </div>
                )}
              </div>
            </div>

            {/* Mobile: collapse thumbs (so first screen stays short) */}
            <div className="mt-3 lg:mt-4">
              <details className="lg:hidden">
                <summary className="px-3 py-2 rounded-md bg-gray-50 text-sm font-medium cursor-pointer">
                  View images & thumbnails
                </summary>
                <div className="mt-2">
                  <ProductThumbs
                    title={product.title}
                    mainBoxId={`main-img-box-${product._id}`}
                    images={finalGallery}
                  />
                </div>
              </details>

              {/* On large screens show thumbs inline (unchanged) */}
              <div className="hidden lg:block mt-2">
                <ProductThumbs
                  title={product.title}
                  mainBoxId={`main-img-box-${product._id}`}
                  images={finalGallery}
                />
              </div>
            </div>

            {/* Description collapsed on mobile to save first-screen space */}
            <div className="mt-3 lg:mt-5">
              <details className="lg:block">
                {/* On large screens details is expanded by default due to lg:block wrapper */}
                <summary className="lg:hidden px-3 py-2 rounded-md bg-gray-50 text-sm font-medium cursor-pointer">
                  {hasDesc ? "Read description" : "Description"}
                </summary>

                <div className="mt-2 text-sm text-gray-800 leading-relaxed prose prose-sm max-w-none [&_*]:text-gray-800">
                  {hasDesc ? (
                    looksHtml ? (
                      <div dangerouslySetInnerHTML={{ __html: safeDesc }} />
                    ) : (
                      <p className="whitespace-pre-line">{safeDesc}</p>
                    )
                  ) : (
                    <p className="text-gray-500">No description available.</p>
                  )}
                </div>
              </details>
            </div>
          </div>

          {/* RIGHT: Info + Actions (condensed on mobile so it fits on one screen) */}
          <div className="bg-white rounded-2xl shadow-md border border-pink-100 p-4 sm:p-5 md:p-6 lg:p-8 flex flex-col justify-between">
            <div>
              <h1 className="text-lg sm:text-2xl md:text-3xl lg:text-[2.25rem] font-bold text-gray-900 leading-tight tracking-tight break-words">
                {product.title}
              </h1>

              <div className="mt-3 sm:mt-4 flex items-center gap-3 flex-wrap">
                <div className="text-xl sm:text-3xl font-semibold text-gray-900">
                  ৳
                  {Number(product.price ?? 0).toLocaleString(undefined, {
                    maximumFractionDigits: 2,
                  })}
                </div>

                {hasDiscount && typeof product.compareAtPrice === "number" ? (
                  <div className="text-sm sm:text-base text-gray-400 line-through font-semibold">
                    ৳{Number(product.compareAtPrice ?? 0).toLocaleString()}
                  </div>
                ) : null}

                {hasDiscount ? (
                  <span className="px-2 py-1 text-xs sm:text-sm font-bold rounded-full bg-pink-50 text-pink-700 border border-pink-200">
                    Special Offer
                  </span>
                ) : null}
              </div>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
                <div className="flex items-center gap-2 text-gray-700 bg-gradient-to-r from-pink-50 to-rose-50 rounded-lg px-3 py-2 border border-pink-200">
                  <Check className="w-4 h-4 text-pink-600" />
                  <span className="font-semibold text-sm">
                    {product.stock && product.stock > 0
                      ? "In Stock"
                      : "Out of Stock"}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-gray-700 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg px-3 py-2 border border-purple-200">
                  <Truck className="w-4 h-4 text-purple-600" />
                  <span className="font-semibold text-sm">Free Delivery</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700 bg-gradient-to-r from-rose-50 to-pink-50 rounded-lg px-3 py-2 border border-rose-200">
                  <Shield className="w-4 h-4 text-rose-600" />
                  <span className="font-semibold text-sm">100% Authentic</span>
                </div>
              </div>

              {/* Actions component (kept as-is) */}
              <div className="mt-4">
                <ProductActions product={product} hotline={hotline} />
              </div>

              <div className="mt-4 p-3 bg-gradient-to-r from-pink-50 via-rose-50 to-purple-50 rounded-xl border border-pink-200 text-sm">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-[#167389]" />
                  <p className="text-gray-700">
                    All our products are 100% authentic and of premium quality.
                    Specially curated collection for your beauty and care needs.
                  </p>
                </div>

                <div className="mt-3 text-sm text-gray-600">
                  <span className="font-semibold text-gray-800">Category:</span>{" "}
                  {product.categorySlug ? (
                    <Link
                      href={`/products?category=${product.categorySlug}`}
                      className="text-[#167389] font-bold hover:underline ml-1"
                    >
                      {product.categorySlug}
                    </Link>
                  ) : (
                    <span className="text-gray-500">Not Available</span>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-4">
              <a
                href={`tel:${hotline}`}
                className="inline-flex items-center justify-center gap-2 w-full px-4 py-3 bg-[#167389] text-white font-bold rounded-xl hover:bg-cyan-700 transition"
                aria-label="Call hotline"
              >
                <Phone className="w-4 h-4" />
                <span>Hotline: {hotline}</span>
              </a>
            </div>
          </div>
        </div>

        {/* Related - collapsed on mobile by default using details (so first screen is not long) */}
        {related.length > 0 && (
          <div className="mt-8 lg:mt-12">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl lg:text-2xl font-bold text-gray-900">
                  Related Products
                </h2>
                <p className="text-sm text-gray-600">You might also like</p>
              </div>

              <details className="lg:hidden">
                <summary className="px-3 py-2 rounded-md bg-gray-50 text-sm cursor-pointer">
                  Show related
                </summary>
              </details>
            </div>

            <div className="hidden lg:grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {related.map((p) => (
                <div key={p._id} className="min-w-0 h-full">
                  <RelatedCard product={p} />
                </div>
              ))}
            </div>

            {/* mobile friendly horizontal scroller for related when user opens details */}
            <details className="lg:hidden">
              <summary className="sr-only">Toggle related</summary>
              <div className="mt-3 overflow-x-auto -mx-3 px-3 pb-2">
                <div className="flex gap-3 w-max">
                  {related.map((p) => (
                    <div key={p._id} className="w-40 min-w-[160px]">
                      <RelatedCard product={p} />
                    </div>
                  ))}
                </div>
              </div>
            </details>
          </div>
        )}
      </div>
    </div>
  );
}

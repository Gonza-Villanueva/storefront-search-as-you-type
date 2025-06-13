/*
Copyright 2024 Adobe
All Rights Reserved.

NOTICE: Adobe permits you to use, modify, and distribute this file in
accordance with the terms of the Adobe license agreement accompanying
it.
*/

import getSymbolFromCurrency from "currency-symbol-map";
import React from "react";

import { Product } from "../types/interface";

/**
 * Generate HTML for product price and optional discount.
 *
 * @param {Product}  product        The product data object.
 * @param {string}   currencySymbol Override symbol (if set in Commerce).
 * @param {string}   currencyRate   Conversion rate (e.g. "1.23").
 * @returns {string} HTML string containing:
 *   - `<span class="price">…</span>` always, and
 *   - `<span class="discount">…</span>` only if discount > price.
 */
const getProductPrice = (
  product: Product,
  currencySymbol: string,
  currencyRate: string
): React.ReactNode => {
  // Determine symbol
  let currency =
    product.product.price_range.minimum_price.regular_price.currency;
  if (currencySymbol) {
    currency = currencySymbol;
  } else {
    currency = getSymbolFromCurrency(currency) ?? "";
  }

  // Raw values
  const priceValue =
    product.product.price_range.minimum_price.final_price.value;
  const discountValue =
    product.product.price_range.maximum_price.regular_price.value;

  // Conversion
  const rate = currencyRate ? parseFloat(currencyRate) : 1;
  const price = priceValue * rate;
  const discount = discountValue * rate;

  // Nothing to show?
  if (priceValue == null) {
    return null;
  }

  // Format to two decimals
  const fmt = (n: number) => n.toFixed(2);
  const formattedPrice = `${currency}${fmt(price)}`;
  const formattedDiscount = `${currency}${fmt(discount)}`;

  // Build JSX
  if (discount > price) {
    return (
      <>
        <span className="price">{formattedPrice}</span>
        <span className="discount">{formattedDiscount}</span>
      </>
    );
  }

  return <span className="price">{formattedPrice}</span>;
};

export { getProductPrice };

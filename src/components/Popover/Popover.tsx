/*
Copyright 2024 Adobe
All Rights Reserved.

NOTICE: Adobe permits you to use, modify, and distribute this file in
accordance with the terms of the Adobe license agreement accompanying
it.
*/

import React, { FC } from "react";
import {
    getProductImageURL,
    getProductPrice,
    htmlStringDecode,
    isMobile,
    searchUnitId,
    stylingIds,
} from "utils";

import { Grid, ProductImage, StyledLink, StyledText } from "../../styles";
import NoImageSvg from "../assets/NoImage.svg";
import {
    Product,
    ProductSearchResponse,
    RedirectRouteFunc,
} from "../types/interface";

/**
 * This component renders a styled popover populated with results from search
 */
interface PopoverProps {
    active?: boolean;
    response?: ProductSearchResponse;
    formRef: React.MutableRefObject<HTMLFormElement | null>;
    resultsRef: React.MutableRefObject<HTMLDivElement | null>;
    inputRef: React.MutableRefObject<HTMLInputElement | null>;
    pageSize?: number;
    currencySymbol?: string;
    currencyRate?: string;
    minQueryLengthHit?: boolean;
    route?: RedirectRouteFunc;
}

const text = {
    suggestions: "Sugerencias",
    productsTitle: "Productos",
    aria: "Sugerencias de términos de búsqueda",
    all: "Ver todo",
    unitPrice: "Precio/Unidad",
};

const Popover: FC<PopoverProps> = ({
    active,
    response,
    formRef,
    inputRef,
    resultsRef,
    pageSize = 6,
    currencySymbol = "",
    currencyRate = "1",
    minQueryLengthHit,
    route,
}) => {
    const products = response?.data?.productSearch.items ?? [];
    const suggestions = response?.data?.productSearch.suggestions ?? [];
    const total = Number(response?.data?.productSearch.total_count ?? 0);

    const elements = formRef.current?.elements as HTMLFormControlsCollection & {
        search: HTMLInputElement;
    };

    const searchTerm = elements?.search?.value.trim() || "";

    const containerStyling = `
            display: flex;
            right: 0px;
            margin-top: 5px;
            box-shadow: 0px 0px 6px 0px #cacaca;
        `;

    // containerStyling is only for desktop display
    if (resultsRef.current && (active || !isMobile)) {
        resultsRef.current.style.cssText = containerStyling;
    }

    const updateAndSubmit = (phrase?: string) => {
        // on 'View all' click
        const target = inputRef.current;
        const form = formRef.current;

        if (phrase && target) {
            target.value = phrase;
        }

        form?.dispatchEvent(new Event("submit"));
        // setTimeout(0) moves the submit action to the bottom of the event loop
        // ensuring that the tracking event will execute first.
        setTimeout(() => form?.submit(), 0);
    };

    const onSuggestionClick = (suggestion: string): void => {
        window.magentoStorefrontEvents?.publish.searchSuggestionClick(
            searchUnitId,
            suggestion,
        );

        updateAndSubmit(suggestion);
    };

    // the suggestions element is currently not used
    const Suggestions = suggestions.map((suggestion, index) => {
        if (index <= 4) {
            return (
                <StyledText
                    className={stylingIds.suggestion}
                    customFontSize="90%"
                    customLineHeight="95%"
                    key={suggestion}
                    onClick={() => onSuggestionClick(suggestion)}
                    hoverColor="#f5f5f5"
                    hoverPointer="pointer"
                    padding="4px"
                >
                    {htmlStringDecode(suggestion)}
                </StyledText>
            );
        }
    });

    if (products.length <= 0 || !active || !minQueryLengthHit) {
        return <></>;
    }

    return (
        <Grid className={stylingIds.popover}>
            {/* the suggestions element is currently not used */}
            {suggestions.length > 0 && (
                <Grid className={stylingIds.suggestions}>
                    <StyledText className={stylingIds.suggestionsHeader}>
                        {text.suggestions}
                    </StyledText>
                    {Suggestions}
                </Grid>
            )}

            <Grid className={stylingIds.products}>
                <StyledText className={stylingIds.productsHeader}>
                    {text.productsTitle}
                </StyledText>

                <Grid className={stylingIds.productsWrapper}>
                    {products.map((product, index) => {
                        //render
                        if (index < pageSize) {
                            return (
                                <ProductItem
                                    key={product.product.sku}
                                    product={product}
                                    searchTerm={searchTerm}
                                    updateAndSubmit={updateAndSubmit}
                                    currencySymbol={currencySymbol}
                                    currencyRate={currencyRate}
                                    route={route}
                                />
                            );
                        }
                    })}
                </Grid>

                <Grid className={stylingIds.viewAll}>
                    {text.all} {total > pageSize ? `(+${total - pageSize})` : ""}
                </Grid>
            </Grid>
        </Grid>
    );
};

const escapeRegExp = (s: string) =>
  s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const ProductItem: FC<{
    product: Product;
    searchTerm: string;
    updateAndSubmit: (queryPhrase?: string) => void;
    currencySymbol: string;
    currencyRate: string;
    route?: RedirectRouteFunc;
}> = ({ product, searchTerm, updateAndSubmit, currencySymbol, currencyRate, route }) => {
    const onProductClick = () => {
        window.magentoStorefrontEvents?.publish.searchProductClick(
            searchUnitId,
            product.product.sku,
        );

        if (!route && !product.product.canonical_url) {
            // If there's no URL on the product, populate the search bar with name and submit
            updateAndSubmit(product.product.name);
        }
    };

    const productImage = getProductImageURL(product);
    const productUrl = route
        ? route({ sku: product.product.sku })
        : product.product.canonical_url;

    const name = htmlStringDecode(product.product.name) || "";

    const parts = searchTerm
    ? name.split(new RegExp(`(${escapeRegExp(searchTerm)})`, "gi"))
    : [name];

    return (
        <StyledLink href={productUrl || ""} rel="noopener noreferrer">
            <Grid className={stylingIds.product} onClick={onProductClick} >
                <ProductImage className={stylingIds.productsImage} src={productImage || NoImageSvg} />
                <Grid className={stylingIds.productsInfoWrapper}>
                    <StyledText className={stylingIds.productName}>
                        {parts.map((text, i) =>
                            text.toLowerCase() === searchTerm.toLowerCase() ? (
                                <span key={i} className={stylingIds.productsNameMark}>
                                {text}
                                </span>
                            ) : (
                                <React.Fragment key={i}>{text}</React.Fragment>
                            )
                        )}
                    </StyledText>
                    <Grid className={stylingIds.productPrice}>
                        {getProductPrice(product, currencySymbol, currencyRate)}
                    </Grid>
                    <span className={stylingIds.productPriceUnit}>{text.unitPrice}</span>
                </Grid>
            </Grid>
        </StyledLink>
    );
};
export default Popover;

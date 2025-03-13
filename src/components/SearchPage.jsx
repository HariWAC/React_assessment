import React, { useState, useEffect } from "react";
import useSWRImmutable from "swr/immutable";
import { mutate } from "swr";
import { Container, Row, Col, Form, Button, InputGroup } from "react-bootstrap";
import { useSearchParams, useNavigate } from "react-router-dom";
import SearchFilters from "./SearchFilters";
import SearchResults from "./SearchResults";

const languageConfigs = [
  {
    label: "English",
    indexName: "qa-en",
    clientId: "7645129791",
    secretKey: "Qfj1UUkFItWfVFwWpJ65g0VfhjdVGN",
  },
  {
    label: "Arabic",
    indexName: "qa-ar",
    clientId: "5807942863",
    secretKey: "Llz5MR37gZ4gJULMwf762w1lQ13Iro",
  },
];

const fetcher = async ([url, query, page, filters, sortOption, lang]) => {
  try {
    let sort_by = "1"; // Default to relevance
    if (sortOption === "price-high-to-low") sort_by = "2";
    else if (sortOption === "price-low-to-high") sort_by = "3";

    const languageConfig = languageConfigs.find((config) => config.label === lang) || languageConfigs[0];

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Client-id": languageConfig.clientId,
        "Secret-key": languageConfig.secretKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        index: languageConfig.indexName,
        search: query,
        size: 50,
        sort_by: sort_by,
        page: page,
        page_size: 28,
        filter: {
          category: filters.categories.length > 0 ? filters.categories : undefined,
          price: filters.priceRange,
          brand: filters.brands.length > 0 ? filters.brands : undefined,
        },
      }),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || "Failed to fetch data");
    }
    return result;
  } catch (error) {
    console.error("Fetch error:", error);
    throw error;
  }
};

const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryFromUrl = searchParams.get("q") || "";
  const [searchQuery, setSearchQuery] = useState(queryFromUrl);
  const lang = searchParams.get("lang") || "English";
  const navigate = useNavigate();

  const page = parseInt(searchParams.get("page")) || 1;
  const brands = searchParams.get("brands")?.split(",") || [];
  const categories = searchParams.get("categories")?.split(",") || [];
  const sortOption = searchParams.get("sort") || "relevance";

  const priceMinUrl = parseInt(searchParams.get("priceMin"));
  const priceMaxUrl = parseInt(searchParams.get("priceMax"));
  
  // Initialize priceRange and priceAdjustedByUser 
  const [priceRange, setPriceRange] = useState([
    !isNaN(priceMinUrl) ? priceMinUrl : 0,
    !isNaN(priceMaxUrl) ? priceMaxUrl : 0
  ]);
  const [priceAdjustedByUser, setPriceAdjustedByUser] = useState(!isNaN(priceMinUrl) && !isNaN(priceMaxUrl));

  const filters = {
    brands,
    categories,
    priceRange,
  };

  const swrKey = searchQuery
    ? [
        "https://uat.search-assist.webc.in/api/search",
        searchQuery,
        page,
        filters,
        sortOption,
        lang,
      ]
    : null;

  const { data, error, isLoading } = useSWRImmutable(swrKey, fetcher);

  const handleSearchChange = (e) => {
    const newQuery = e.target.value;
    setSearchQuery(newQuery);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      const newParams = new URLSearchParams(searchParams);
      newParams.set("q", searchQuery);
      newParams.set("page", "1");
      setSearchParams(newParams, { replace: false });
    }
  };

  const handleBack = () => {
    navigate(-1);
    mutate(
      swrKey,
      async () => {
        const languageConfig = languageConfigs.find((config) => config.label === lang) || languageConfigs[0];
        const response = await fetch("https://uat.search-assist.webc.in/api/search", {
          method: "POST",
          headers: {
            "Client-id": languageConfig.clientId,
            "Secret-key": languageConfig.secretKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            index: languageConfig.indexName,
            search: searchQuery,
            size: 50,
            sort_by: sortOption === "price-high-to-low" ? "2" : sortOption === "price-low-to-high" ? "3" : "1",
            page: page || 1,
            page_size: 28,
            filter: {
              category: filters.categories.length > 0 ? filters.categories : undefined,
              price: filters.priceRange,
              brand: filters.brands.length > 0 ? filters.brands : undefined,
            },
          }),
        });

        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.message || "Failed to fetch data");
        }
        return result;
      },
      { revalidate: true }
    );
  };

  const getSortDisplayName = (option) => {
    switch (option) {
      case "relevance": return "Relevance";
      case "price-high-to-low": return "Price: High to Low";
      case "price-low-to-high": return "Price: Low to High";
      default: return "Relevance";
    }
  };

  const items = data?.items || [];
  const totalItems = data?.total || 0;
  const pageSize = 28;
  const totalPages = Math.ceil(totalItems / pageSize);

  const startItem = (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, totalItems);
  const itemsDisplayedText = totalItems > 0 ? `${startItem}-${endItem} of ${totalItems} items` : "0 items";
  const filterHeaderText = `Filters (${totalItems})`;

  const filterList = data?.filter_list || [];
  const priceFilter = filterList.find((f) => f.label === "Price")?.options || {
    min_price: 0,
    max_price: 10000,
  };
  
  // The only useEffect in the component
  useEffect(() => {
    if (data && !priceAdjustedByUser) {
      const minPrice = priceFilter.min_price;
      const maxPrice = priceFilter.max_price;
      setPriceRange([minPrice, maxPrice]);
    }
  }, [data, priceAdjustedByUser, priceFilter.min_price, priceFilter.max_price]);

  const brandFilter = filterList.find((f) => f.label === "Brand")?.options || [];
  const categoryFilter = filterList.find((f) => f.label === "Category")?.options || [];

  const minPrice = priceFilter.min_price;
  const maxPrice = priceFilter.max_price;
  const availableBrands = brandFilter.map((option) => ({
    name: option.name,
    count: option.count || 0,
  }));
  const availableCategories = categoryFilter.map((option) => ({
    name: option.name,
    count: option.count || 0,
  }));

  const handleLanguageChange = (languageLabel) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("lang", languageLabel);
    newParams.set("page", "1");
    setSearchParams(newParams, { replace: false });
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      const newParams = new URLSearchParams(searchParams);
      newParams.set("page", newPage.toString());
      setSearchParams(newParams, { replace: false });
    }
  };

  const handleFilterChange = (type, value) => {
    const newParams = new URLSearchParams(searchParams);

    if (type === "brands" || type === "categories") {
      const currentValues = type === "brands" ? brands : categories;
      const updatedValues = currentValues.includes(value)
        ? currentValues.filter((item) => item !== value)
        : [...currentValues, value];
      if (updatedValues.length > 0) {
        newParams.set(type, updatedValues.join(","));
      } else {
        newParams.delete(type);
      }
    } else if (type === "priceRange") {
      setPriceRange(value);
      setPriceAdjustedByUser(true);
      newParams.set("priceMin", value[0].toString());
      newParams.set("priceMax", value[1].toString());
    } else if (type === "sort") {
      if (value === "relevance") {
        newParams.delete("sort");
      } else {
        newParams.set("sort", value);
      }
    }

    newParams.set("page", "1");
    setSearchParams(newParams, { replace: false });
  };

  const clearAllFilters = () => {
    const newParams = new URLSearchParams();
    newParams.set("q", searchQuery);
    newParams.set("page", "1");
    newParams.set("lang", lang);
    if (sortOption !== "relevance") {
      newParams.set("sort", sortOption);
    }
    if (priceAdjustedByUser && priceRange) {
      newParams.set("priceMin", priceRange[0].toString());
      newParams.set("priceMax", priceRange[1].toString());
    }
    setSearchParams(newParams, { replace: false });
  };

  const clearFilter = (type, value = null) => {
    const newParams = new URLSearchParams(searchParams);

    if (type === "brand") {
      const updatedBrands = brands.filter((brand) => brand !== value);
      if (updatedBrands.length > 0) {
        newParams.set("brands", updatedBrands.join(","));
      } else {
        newParams.delete("brands");
      }
    } else if (type === "category") {
      const updatedCategories = categories.filter((category) => category !== value);
      if (updatedCategories.length > 0) {
        newParams.set("categories", updatedCategories.join(","));
      } else {
        newParams.delete("categories");
      }
    } else if (type === "sort") {
      newParams.delete("sort");
    }

    newParams.set("page", "1");
    setSearchParams(newParams, { replace: false });
  };

  const handleSortChange = (eventKey) => {
    handleFilterChange("sort", eventKey);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (brands.length > 0) count += brands.length;
    if (categories.length > 0) count += categories.length;
    if (sortOption !== "relevance") count += 1;
    return count;
  };

  const calculateOriginalPrice = (salePrice, discountPercentage) => {
    const salePriceNum = parseFloat(salePrice);
    const discount = parseFloat(discountPercentage);
    if (isNaN(salePriceNum) || isNaN(discount) || discount <= 0) return null;
    const originalPrice = salePriceNum / (1 - discount / 100);
    return originalPrice.toFixed(2);
  };

  return (
    <Container className="mt-4">
      <Row className="mb-4">
        <Col>
          <Form onSubmit={handleSearchSubmit}>
            <InputGroup>
              <Form.Control
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Search for products..."
              />
              <Button variant="primary" type="submit">
                Search
              </Button>
            </InputGroup>
          </Form>
        </Col>
      </Row>

      <Row>
        <Col md={3}>
          <SearchFilters
            filterHeaderText={filterHeaderText}
            getActiveFiltersCount={getActiveFiltersCount}
            clearAllFilters={clearAllFilters}
            lang={lang}
            handleLanguageChange={handleLanguageChange}
            sortOption={sortOption}
            getSortDisplayName={getSortDisplayName}
            handleSortChange={handleSortChange}
            availableBrands={availableBrands}
            filters={filters}
            handleFilterChange={handleFilterChange}
            availableCategories={availableCategories}
            minPrice={minPrice}
            maxPrice={maxPrice}
            priceRange={priceRange}
          />
        </Col>
        <Col md={9}>
          <SearchResults
            searchQuery={searchQuery}
            itemsDisplayedText={itemsDisplayedText}
            getActiveFiltersCount={getActiveFiltersCount}
            sortOption={sortOption}
            getSortDisplayName={getSortDisplayName}
            brands={brands}
            categories={categories}
            clearFilter={clearFilter}
            clearAllFilters={clearAllFilters}
            isLoading={isLoading}
            error={error}
            items={items}
            calculateOriginalPrice={calculateOriginalPrice}
            handleBack={handleBack}
            totalItems={totalItems}
            totalPages={totalPages}
            page={page}
            handlePageChange={handlePageChange}
          />
        </Col>
      </Row>
    </Container>
  );
};

export default SearchPage;
import React, { useState, useEffect } from "react";
import useSWRImmutable from "swr/immutable";
import { mutate } from "swr";
import {
  Container,
  Row,
  Col,
  Card,
  Spinner,
  Alert,
  Pagination,
  Form,
  DropdownButton,
  Dropdown,
  Badge,
  Button,
  InputGroup,
} from "react-bootstrap";
import { useSearchParams, useNavigate } from "react-router-dom";
import ReactSlider from "react-slider";

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

// CustomSlider component with stable styling
const CustomSlider = ({ min, max, value, onChange, minDistance }) => {
  return (
    <div style={{ padding: "10px 0" }}> {/* Stable container */}
      <ReactSlider
        min={min}
        max={max}
        value={value}
        onChange={onChange}
        pearling
        minDistance={minDistance}
        renderTrack={(props, state) => {
          const { key, ...restProps } = props;
          return (
            <div
              key={`track-${state.index}`}
              {...restProps}
              style={{
                ...restProps.style,
                height: "8px",
                background: state.index === 1 ? "#007bff" : "#ddd",
                borderRadius: "4px",
              }}
            />
          );
        }}
        renderThumb={(props, state) => {
          const { key, ...restProps } = props;
          return (
            <div
              key={`thumb-${state.index}`}
              {...restProps}
              style={{
                ...restProps.style,
                height: "20px",
                width: "20px",
                backgroundColor: "#007bff",
                borderRadius: "50%",
                cursor: "grab",
                top: "-6px",
              }}
            />
          );
        }}
      />
    </div>
  );
};

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

// Main SearchPage component
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

  const [priceRange, setPriceRange] = useState([0, 0]);
  const [priceAdjustedByUser, setPriceAdjustedByUser] = useState(false);
  const priceMinUrl = parseInt(searchParams.get("priceMin"));
  const priceMaxUrl = parseInt(searchParams.get("priceMax"));

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

  useEffect(() => {
    setSearchQuery(queryFromUrl);
  }, [queryFromUrl]);

  useEffect(() => {
    if (data && !priceAdjustedByUser) {
      const minPrice = priceFilter.min_price;
      const maxPrice = priceFilter.max_price;
      if (priceMinUrl && priceMaxUrl) {
        setPriceRange([priceMinUrl, priceMaxUrl]);
        setPriceAdjustedByUser(true);
      } else {
        setPriceRange([minPrice, maxPrice]);
      }
    }
  }, [data, priceMinUrl, priceMaxUrl, priceAdjustedByUser]);

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
          <Card className="mb-4">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">{filterHeaderText}</h5>
              {getActiveFiltersCount() > 0 && (
                <Button variant="outline-primary" size="sm" onClick={clearAllFilters}>
                  Clear All
                </Button>
              )}
            </Card.Header>
            <Card.Body>
              <div className="mb-3">
                <h6>Language</h6>
                <DropdownButton
                  title={lang}
                  onSelect={handleLanguageChange}
                  className="mb-2"
                  size="sm"
                >
                  {languageConfigs.map((config) => (
                    <Dropdown.Item key={config.label} eventKey={config.label}>
                      {config.label}
                    </Dropdown.Item>
                  ))}
                </DropdownButton>
              </div>

              <div className="mb-3">
                <h6>Sort by:</h6>
                <DropdownButton
                  title={getSortDisplayName(sortOption)}
                  onSelect={handleSortChange}
                  className="mb-2"
                  size="sm"
                >
                  <Dropdown.Item eventKey="relevance">Relevance</Dropdown.Item>
                  <Dropdown.Item eventKey="price-high-to-low">Price: High to Low</Dropdown.Item>
                  <Dropdown.Item eventKey="price-low-to-high">Price: Low to High</Dropdown.Item>
                </DropdownButton>
              </div>

              {availableBrands.length > 0 && (
                <div className="mb-3">
                  <h6>Brand</h6>
                  <Form>
                    {availableBrands.map((brand) => (
                      <Form.Check
                        key={brand.name}
                        type="checkbox"
                        label={`${brand.name} (${brand.count})`}
                        checked={filters.brands.includes(brand.name)}
                        onChange={() => handleFilterChange("brands", brand.name)}
                      />
                    ))}
                  </Form>
                </div>
              )}

              {availableCategories.length > 0 && (
                <div className="mb-3">
                  <h6>Category</h6>
                  <Form>
                    {availableCategories.map((category) => (
                      <Form.Check
                        key={category.name}
                        type="checkbox"
                        label={`${category.name} (${category.count})`}
                        checked={filters.categories.includes(category.name)}
                        onChange={() => handleFilterChange("categories", category.name)}
                      />
                    ))}
                  </Form>
                </div>
              )}

              {minPrice !== undefined && maxPrice !== undefined && (
                <div className="mb-3">
                  <h6>Price Range</h6>
                  <div style={{ marginBottom: "10px" }}>
                    {priceRange[0]} - {priceRange[1]}
                  </div>
                  <CustomSlider
                    min={minPrice}
                    max={maxPrice}
                    value={priceRange}
                    onChange={(value) => handleFilterChange("priceRange", value)}
                    minDistance={10}
                  />
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col md={9}>
          <h1 className="text-center mb-3">Search Results for: {searchQuery}</h1>
          <div className="text-center mb-3">
            <p>{itemsDisplayedText}</p>
          </div>

          {getActiveFiltersCount() > 0 && (
            <div className="mb-3">
              <div className="d-flex flex-wrap gap-2 align-items-center">
                <span>Active Filters:</span>
                {sortOption !== "relevance" && (
                  <Badge bg="primary" className="d-flex align-items-center p-2">
                    Sort: {getSortDisplayName(sortOption)}
                    <Button variant="link" className="p-0 ms-2 text-white" onClick={() => clearFilter("sort")}>
                      ✕
                    </Button>
                  </Badge>
                )}
                {brands.map((brand) => (
                  <Badge key={brand} bg="primary" className="d-flex align-items-center p-2">
                    {brand}
                    <Button variant="link" className="p-0 ms-2 text-white" onClick={() => clearFilter("brand", brand)}>
                      ✕
                    </Button>
                  </Badge>
                ))}
                {categories.map((category) => (
                  <Badge key={category} bg="primary" className="d-flex align-items-center p-2">
                    {category}
                    <Button variant="link" className="p-0 ms-2 text-white" onClick={() => clearFilter("category", category)}>
                      ✕
                    </Button>
                  </Badge>
                ))}
                {getActiveFiltersCount() > 1 && (
                  <Button variant="outline-primary" size="sm" onClick={clearAllFilters}>
                    Clear All
                  </Button>
                )}
              </div>
            </div>
          )}

          {isLoading && (
            <div className="text-center">
              <Spinner animation="border" variant="primary" />
            </div>
          )}

          {error && (
            <Alert variant="danger">
              <Alert.Heading>Oops!</Alert.Heading>
              <p>{error.message}</p>
            </Alert>
          )}

          {!isLoading && !error && (
            <>
              <Row xs={1} md={4} className="g-4 mb-4"> {/* Changed md={3} to md={4} */}
                {items.length > 0 ? (
                  items.map((item) => {
                    const originalPrice = calculateOriginalPrice(item.sale_price, item.discount_percentage);
                    return (
                      <Col key={item.id}>
                        <Card className="h-100">
                          <Card.Img variant="top" src={item.image_link} alt={item.title} className="img-fluid rounded" />
                          <Card.Body>
                            <Card.Title>{item.title}</Card.Title>
                            <Card.Text className="fw-bold">
                              Price: {item.sale_price}
                              {originalPrice && (
                                <span style={{ textDecoration: "line-through", marginLeft: "10px", color: "#888" }}>
                                  {originalPrice}
                                </span>
                              )}
                            </Card.Text>
                            <Card.Text>
                              {item.in_stock ? (
                                <span className="text-success">In Stock</span>
                              ) : (
                                <span className="text-danger">Out of Stock</span>
                              )}
                            </Card.Text>
                          </Card.Body>
                        </Card>
                      </Col>
                    );
                  })
                ) : (
                  <Col className="text-center">
                    <p className="lead">Results not found</p>
                    <Button variant="outline-primary" onClick={handleBack}>
                      Go Back
                    </Button>
                  </Col>
                )}
              </Row>

              {totalItems > 0 && totalPages > 1 && (
                <div className="d-flex justify-content-center">
                  <Pagination>
                    <Pagination.Prev onClick={() => handlePageChange(page - 1)} disabled={page === 1} />
                    {Array.from({ length: totalPages }, (_, index) => (
                      <Pagination.Item
                        key={index + 1}
                        active={index + 1 === page}
                        onClick={() => handlePageChange(index + 1)}
                      >
                        {index + 1}
                      </Pagination.Item>
                    ))}
                    <Pagination.Next onClick={() => handlePageChange(page + 1)} disabled={page === totalPages} />
                  </Pagination>
                </div>
              )}
            </>
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default SearchPage;
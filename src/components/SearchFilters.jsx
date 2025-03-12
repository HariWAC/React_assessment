import React from "react";
import { Card, Button, Form, DropdownButton, Dropdown } from "react-bootstrap";
import CustomSlider from "./CustomSlider";

const SearchFilters = ({
  filterHeaderText,
  getActiveFiltersCount,
  clearAllFilters,
  lang,
  handleLanguageChange,
  sortOption,
  getSortDisplayName,
  handleSortChange,
  availableBrands,
  filters,
  handleFilterChange,
  availableCategories,
  minPrice,
  maxPrice,
  priceRange,
}) => {
  return (
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
            {["English", "Arabic"].map((language) => (
              <Dropdown.Item key={language} eventKey={language}>
                {language}
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
  );
};

export default SearchFilters;
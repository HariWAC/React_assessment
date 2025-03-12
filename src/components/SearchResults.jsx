import React from "react";
import {
  Row,
  Col,
  Card,
  Spinner,
  Alert,
  Pagination,
  Badge,
  Button,
} from "react-bootstrap";

const SearchResults = ({
  searchQuery,
  itemsDisplayedText,
  getActiveFiltersCount,
  sortOption,
  getSortDisplayName,
  brands,
  categories,
  clearFilter,
  clearAllFilters,
  isLoading,
  error,
  items,
  calculateOriginalPrice,
  handleBack,
  totalItems,
  totalPages,
  page,
  handlePageChange,
}) => {
  return (
    <>
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
                <Button
                  variant="link"
                  className="p-0 ms-2 text-white"
                  onClick={() => clearFilter("sort")}
                >
                  ✕
                </Button>
              </Badge>
            )}
            {brands.map((brand) => (
              <Badge key={brand} bg="primary" className="d-flex align-items-center p-2">
                {brand}
                <Button
                  variant="link"
                  className="p-0 ms-2 text-white"
                  onClick={() => clearFilter("brand", brand)}
                >
                  ✕
                </Button>
              </Badge>
            ))}
            {categories.map((category) => (
              <Badge key={category} bg="primary" className="d-flex align-items-center p-2">
                {category}
                <Button
                  variant="link"
                  className="p-0 ms-2 text-white"
                  onClick={() => clearFilter("category", category)}
                >
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
          <Row xs={1} md={4} className="g-4 mb-4">
            {items.length > 0 ? (
              items.map((item) => {
                const originalPrice = calculateOriginalPrice(
                  item.sale_price,
                  item.discount_percentage
                );
                return (
                  <Col key={item.id}>
                    <Card className="h-100">
                      <Card.Img
                        variant="top"
                        src={item.image_link}
                        alt={item.title}
                        className="img-fluid rounded"
                      />
                      <Card.Body>
                        <Card.Title>{item.title}</Card.Title>
                        <Card.Text className="fw-bold">
                          Price: {item.sale_price}
                          {originalPrice && (
                            <span
                              style={{
                                textDecoration: "line-through",
                                marginLeft: "10px",
                                color: "#888",
                              }}
                            >
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
                <Pagination.Prev
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                />
                {Array.from({ length: totalPages }, (_, index) => (
                  <Pagination.Item
                    key={index + 1}
                    active={index + 1 === page}
                    onClick={() => handlePageChange(index + 1)}
                  >
                    {index + 1}
                  </Pagination.Item>
                ))}
                <Pagination.Next
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page === totalPages}
                />
              </Pagination>
            </div>
          )}
        </>
      )}
    </>
  );
};

export default SearchResults;
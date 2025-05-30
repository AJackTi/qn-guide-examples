import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface TablePaginationProps {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}

export function TablePagination({
  currentPage,
  pageSize,
  totalItems,
  onPageChange,
}: TablePaginationProps) {
  const totalPages = Math.ceil(totalItems / pageSize);

  const getPageNumbers = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i);
    }

    if (currentPage < 4) {
      return [0, 1, 2, 3, 4, null, totalPages - 1];
    }

    if (currentPage > totalPages - 5) {
      return [
        0,
        null,
        ...Array.from({ length: 5 }, (_, i) => totalPages - 5 + i),
      ];
    }

    return [
      0,
      null,
      currentPage - 1,
      currentPage,
      currentPage + 1,
      null,
      totalPages - 1,
    ];
  };

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            onClick={() => {
              if (currentPage > 0) {
                onPageChange(currentPage - 1);
              }
            }}
          />
        </PaginationItem>

        {getPageNumbers().map((pageNumber, index) =>
          pageNumber === null ? (
            <PaginationItem key={`ellipsis-${index}`}>
              <PaginationEllipsis />
            </PaginationItem>
          ) : (
            <PaginationItem key={pageNumber}>
              <PaginationLink
                onClick={() => onPageChange(pageNumber)}
                isActive={pageNumber === currentPage}
              >
                {pageNumber + 1}
              </PaginationLink>
            </PaginationItem>
          )
        )}
        <PaginationItem>
          {currentPage < totalPages - 1 ? (
            <PaginationNext onClick={() => onPageChange(currentPage + 1)} />
          ) : (
            <PaginationNext onClick={() => {}} isActive={false} />
          )}
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}

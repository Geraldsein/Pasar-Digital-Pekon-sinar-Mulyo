import React, { useState, useMemo, useEffect } from 'react';
import { ChevronLeft, ChevronRight, MessageSquare, MapPin, CheckCircle2, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { formatRupiah, sanitizeText, safeImageUrl } from '../lib/utils';
import LoadingSkeleton from './ui/LoadingSkeleton';

export default function ProductSection({ products, onBuyProduct, onOpenLocation, activeCategoryName, searchQuery }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const totalPages = Math.ceil(products.length / 9); // 9 products per page

  // Pagination logic
  const paginatedProducts = useMemo(() => {
    const pageSize = 9;
    const start = (currentPage - 1) * pageSize;
    return products.slice(start, start + pageSize);
  }, [products, currentPage]);

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    setIsLoading(true);
    setTimeout(() => {
      setCurrentPage(page);
      setIsLoading(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 300);
  };

  // Reset to first page when products change
  useEffect(() => {
    setCurrentPage(1);
  }, [products]);

  if (isLoading) {
    return (
      <section className="container" id="produk" style={{ paddingBottom: '40px' }}>
        <div className="product-grid">
          {[...Array(9)].map((_, i) => (
            <LoadingSkeleton key={i} type="card" />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="container" id="produk" style={{ paddingBottom: '40px' }}>
      <div className="section-header">
        <div>
          <h2 className="section-title">
            Produk Unggulan Desa
            {activeCategoryName && <span style={{ color: '#2563EB', fontSize: '1.2rem', fontWeight: 600 }}> — Kategori {activeCategoryName}</span>}
            {searchQuery && <span style={{ color: '#64748B', fontSize: '1rem', fontWeight: 500 }}> (Hasil cari: "{searchQuery}")</span>}
          </h2>
          <p className="section-subtitle">Kurasi produk terbaik minggu ini</p>
        </div>

        <div className="products-header-actions">
          <button className="carousel-btn" title="Sebelumnya">
            <ChevronLeft size={20} />
          </button>
          <button className="carousel-btn" title="Selanjutnya">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {paginatedProducts.length === 0 ? (
        <div className="empty-state">
          <p>Tidak ada produk yang sesuai dengan pencarian Anda.</p>
        </div>
      ) : (
        <>
          <div className="product-grid animate-stagger">
            {paginatedProducts.map((item) => (
              <div key={item.id} className="product-card animate-on-scroll fade-up">
                <div className="product-img-wrapper">
                  <img src={safeImageUrl(item.image)} alt={item.title} className="product-img" />
                  {item.tag && <div className="product-tag-terlaris">{sanitizeText(item.tag)}</div>}
                </div>

                <div className="product-body">
                  <div className="product-top-row">
                    <h3 className="product-title">{sanitizeText(item.title)}</h3>
                    {item.verified && <span className="badge-verified">Verified</span>}
                  </div>

                  <div className="product-price">
                    {formatRupiah(item.price)}
                    <span>{item.unit}</span>
                  </div>

                  <p className="product-desc">{sanitizeText(item.desc)}</p>

                  <div className="product-seller">
                    <div className="seller-avatar">
                      {sanitizeText(item.sellerName.charAt(0))}
                    </div>
                    <span className="seller-name">
                      {sanitizeText(item.sellerName)}
                      <CheckCircle2 size={15} className="icon-verified-check" />
                    </span>
                  </div>

                  <div className="product-actions">
                    <button 
                      className="btn-wa" 
                      onClick={() => onBuyProduct(item)}
                    >
                      <MessageSquare size={18} />
                      <span>Beli via WhatsApp</span>
                    </button>

                    <button 
                      className="btn-icon-secondary" 
                      title="Lihat Peta & Lokasi UMKM"
                      onClick={() => onOpenLocation(item)}
                    >
                      <MapPin size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button
                onClick={() => handlePageChange(1)}
                disabled={currentPage === 1}
                className={`page-btn ${currentPage === 1 ? 'page-btn-disabled' : ''}`}
              >
                <ChevronsLeft size={18} />
              </button>
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`page-btn ${currentPage === 1 ? 'page-btn-disabled' : ''}`}
              >
                <ChevronLeft size={18} />
              </button>
              {[...Array(totalPages)].map((_, i) => {
                const pageNum = i + 1;
                const showPage = totalPages <= 5 || pageNum === 1 || pageNum === totalPages || Math.abs(pageNum - currentPage) <= 1;
                if (!showPage && pageNum !== currentPage - 1 && pageNum !== currentPage + 1) return null;
                if (!showPage) return <span key={pageNum} className="page-ellipsis">...</span>;
                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`page-num-btn ${pageNum === currentPage ? 'page-num-active' : ''}`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`page-btn ${currentPage === totalPages ? 'page-btn-disabled' : ''}`}
              >
                <ChevronRight size={18} />
              </button>
              <button
                onClick={() => handlePageChange(totalPages)}
                disabled={currentPage === totalPages}
                className={`page-btn ${currentPage === totalPages ? 'page-btn-disabled' : ''}`}
              >
                <ChevronsRight size={18} />
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}

import React from 'react';
import { Utensils, Palette, Sprout, Wrench, ArrowRight } from 'lucide-react';

const iconMap = {
  Utensils: Utensils,
  Palette: Palette,
  Tractor: Sprout,
  Wrench: Wrench
};

export default function CategorySection({ categories, selectedCategory, onSelectCategory }) {
  return (
    <section className="container" id="kategori" style={{ paddingBottom: '30px' }}>
      <div className="section-header">
        <div>
          <h2 className="section-title">Kategori Produk</h2>
        </div>
        <button 
          className="link-see-all" 
          onClick={() => onSelectCategory(null)}
        >
          <span>{selectedCategory ? 'Lihat Semua Kategori' : 'Lihat Semua'}</span>
          <ArrowRight size={18} />
        </button>
      </div>

      <div className="category-grid">
        {categories.map((cat) => {
          const IconComponent = iconMap[cat.icon] || Utensils;
          const isActive = selectedCategory === cat.id;

          return (
            <div
              key={cat.id}
              className={`category-card ${isActive ? 'active' : ''}`}
              onClick={() => onSelectCategory(isActive ? null : cat.id)}
            >
              <div 
                className="category-icon-wrapper"
                style={{ backgroundColor: cat.bg, color: cat.color }}
              >
                <IconComponent size={26} />
              </div>
              <h3 className="category-title">{cat.name}</h3>
              <p className="category-desc">{cat.sub}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

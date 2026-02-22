
import React, { useState, useMemo, useEffect } from 'react';
import { marketStore } from '../store';
import { productService } from '../services/productService'; // Import Service
import { User, Role, Product, Comment } from '../types';
import Logo from '../components/Logo';
import { Language, translations } from '../translations';
import { ArrowRight, Star, ShoppingBag, Truck, ShieldCheck, Heart, MessageCircle, Send, Minus, Plus } from 'lucide-react';
import { useToast } from '../components/ToastProvider';

interface PublicProductDetailsProps {
  lang: Language;
  user: User | null;
  productId: string | null;
  onBack: () => void;
  onLoginClick: () => void;
  onRefresh?: () => void;
  addToCart?: (product: Product, quantity: number) => void;
}

const PublicProductDetails: React.FC<PublicProductDetailsProps> = ({ lang, user, productId, onBack, onLoginClick, onRefresh, addToCart }) => {
  const t = translations[lang];
  const { showToast } = useToast();
  
  // Local State
  const [ratingInput, setRatingInput] = useState(5);
  const [commentInput, setCommentInput] = useState('');
  const [socialCommentInput, setSocialCommentInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeImgIndex, setActiveImgIndex] = useState(0);
  const [isImageLoading, setIsImageLoading] = useState(false);
  
  // Product state (local)
  const [product, setProduct] = useState<Product | undefined>(undefined);
  const [isLoadingProduct, setIsLoadingProduct] = useState(false);

  // Social State
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [comments, setComments] = useState<Comment[]>([]);

  // Fetch Product Logic
  useEffect(() => {
    const loadProduct = async () => {
        if (!productId) return;
        setIsLoadingProduct(true);
        // Try local store first
        let p = marketStore.getProducts().find(p => p.id === productId);
        if (!p) {
            // Try fetching from cloud
            p = await productService.fetchById(productId);
        }
        setProduct(p);
        setIsLoadingProduct(false);
    };
    loadProduct();
  }, [productId, marketStore.getProducts().length]);
  
  // Reset active image when product changes
  useEffect(() => {
    setActiveImgIndex(0);
    setQuantity(1);
    if (productId && product) {
      setLikesCount(marketStore.getLikesCount(productId));
      setComments(marketStore.getComments(productId));
      if (user) {
        setIsLiked(marketStore.isLiked(user.id, productId));
      }
    }
  }, [productId, user, product]);

  const images = useMemo(() => {
    if (!product) return [];
    let imgs = product.images && product.images.length > 0 
      ? product.images 
      : [product.imageUrl || product.image_url].filter(Boolean);
    imgs = Array.from(new Set(imgs)).filter(url => typeof url === 'string' && url.length > 0);
    return imgs.length > 0 ? imgs : ['https://placehold.co/600x600?text=No+Image'];
  }, [product]);

  if (isLoadingProduct) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="w-10 h-10 border-4 border-palma-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 font-sans">
        <div className="text-center space-y-6 animate-fade-in">
           <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm border border-slate-100 text-3xl">🔍</div>
           <h2 className="text-xl font-black text-palma-navy">Product Not Found</h2>
           <button onClick={onBack} className="bg-palma-navy text-white px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-palma-primary transition-all shadow-lg">
             {t.common.back}
           </button>
        </div>
      </div>
    );
  }

  const merchantProfile = marketStore.getMerchantProfileByUserId(product.merchant_id || product.merchantId || '');
  const merchantName = marketStore.getMerchantNameByUserId(product.merchant_id || product.merchantId || '');
  
  const reviews = marketStore.getReviewsForProduct(product.id);
  const rating = marketStore.getProductRating(product.id);

  const isCustomer = user?.role === Role.CUSTOMER;
  const alreadyReviewed = user ? reviews.some(r => (r.customer_id === user.id || r.userId === user.id)) : false;

  const handleToggleLike = () => {
    if (!user) return onLoginClick();
    if (user.role !== Role.CUSTOMER) return showToast(lang === 'en' ? 'Only Customers can like products.' : 'فقط الزبائن يمكنهم الإعجاب بالمنتجات.', 'warning');

    const newStatus = marketStore.toggleLike(user.id, product.id);
    setIsLiked(newStatus);
    setLikesCount(prev => newStatus ? prev + 1 : Math.max(0, prev - 1));
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return onLoginClick();
    if (user.role !== Role.CUSTOMER) return showToast(lang === 'en' ? 'Only Customers can comment.' : 'فقط الزبائن يمكنهم التعليق.', 'warning');
    if (!socialCommentInput.trim()) return;

    const newComment = marketStore.addComment(user.id, product.id, socialCommentInput);
    if (newComment) {
      setComments([newComment, ...comments]);
      setSocialCommentInput('');
      showToast(lang === 'en' ? 'Comment added' : 'تم إضافة التعليق', 'success');
    }
  };

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return onLoginClick();
    if (user.role !== Role.CUSTOMER) return showToast(lang === 'en' ? 'Only Customers can leave reviews.' : 'فقط الزبائن يمكنهم ترك تقييمات.', 'warning');
    if (!commentInput.trim()) return showToast(lang === 'en' ? 'Please provide a comment.' : 'يرجى كتابة تعليق.', 'warning');

    setIsSubmitting(true);
    const result = marketStore.addReview(user.id, product.id, ratingInput, commentInput);
    
    if (result) {
      showToast(t.common.success, 'success');
      setCommentInput('');
      setRatingInput(5);
      if (onRefresh) onRefresh(); 
    } else {
      showToast(lang === 'en' ? 'Already reviewed.' : 'تم التقييم مسبقاً.', 'error');
    }
    setIsSubmitting(false);
  };

  const handleAddToCart = () => {
    if (!user) return onLoginClick();
    
    if (addToCart) {
        addToCart(product, quantity);
        showToast(t.common.success, 'success');
    } else {
        console.warn('addToCart function missing');
    }
  };

  const handleImageChange = (index: number) => {
    setIsImageLoading(true);
    setActiveImgIndex(index);
    setTimeout(() => setIsImageLoading(false), 300);
  };

  const showNav = !user; 

  return (
    <div className={`min-h-screen bg-slate-50 font-sans text-palma-text transition-all duration-500`} dir={lang === 'en' ? 'ltr' : 'rtl'}>
      
      {showNav && (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 shadow-sm h-16 sm:h-20 transition-all">
          <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
            <div className="flex items-center gap-6">
               <button onClick={onBack} className="p-2 hover:bg-slate-50 rounded-xl transition-colors text-palma-muted group">
                 <ArrowRight className="w-5 h-5 group-hover:-translate-x-1 transition-transform rtl:group-hover:translate-x-1 rtl:rotate-180" />
               </button>
               <div onClick={onBack} className="cursor-pointer"><Logo size="small" /></div>
            </div>
            <div className="flex items-center gap-4">
               <button onClick={onLoginClick} className="bg-palma-navy text-white px-5 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-palma-primary transition-all shadow-md">
                 {t.auth.login}
               </button>
            </div>
          </div>
        </nav>
      )}

      <main className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 ${showNav ? 'pt-28' : 'pt-8'} animate-slide-up`}>
        
        {!showNav && (
          <div className="mb-8 flex items-center gap-2 text-xs font-bold text-palma-muted">
             <button onClick={onBack} className="hover:text-palma-navy hover:underline">{t.common.products}</button>
             <span className="text-slate-300">/</span>
             <span className="text-palma-navy truncate max-w-[200px]">{product.name}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
           
           <div className="lg:col-span-7 space-y-6">
              <div className="aspect-[4/3] sm:aspect-square bg-white rounded-3xl lg:rounded-[2.5rem] overflow-hidden shadow-card border border-slate-100 relative group cursor-zoom-in">
                 <img 
                    src={images[activeImgIndex]} 
                    className={`w-full h-full object-cover transition-all duration-500 ease-in-out ${isImageLoading ? 'opacity-80 scale-95 blur-sm' : 'opacity-100 scale-100 blur-0'} group-hover:scale-110`} 
                    alt={product.name} 
                 />
                 
                 <div className="absolute top-6 left-6 flex flex-col gap-2 z-10 pointer-events-none">
                    {rating.average >= 4.5 && (
                      <span className="bg-palma-gold text-white px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg flex items-center gap-2">
                        <Star className="w-3 h-3 fill-current" /> {t.common.topRated}
                      </span>
                    )}
                    {product.discount ? (
                      <span className="bg-rose-500 text-white px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg">
                        -{product.discount}% OFF
                      </span>
                    ) : null}
                 </div>

                 {/* Like Button on Image */}
                 <div className="absolute top-6 right-6 z-20">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleToggleLike(); }}
                      className={`p-3 rounded-full shadow-lg transition-all ${isLiked ? 'bg-rose-500 text-white' : 'bg-white text-slate-300 hover:text-rose-500'}`}
                    >
                       <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
                    </button>
                 </div>
              </div>
              
              {images.length > 1 && (
                <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide px-1">
                   {images.map((img, i) => (
                     <button 
                        key={i} 
                        onClick={() => handleImageChange(i)}
                        className={`w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border-2 shrink-0 transition-all duration-300 ${activeImgIndex === i ? 'border-palma-navy ring-4 ring-palma-navy/10 scale-105 opacity-100 shadow-md' : 'border-transparent opacity-60 hover:opacity-100 hover:scale-105'}`}
                     >
                        <img src={img} className="w-full h-full object-cover" alt={`View ${i + 1}`} />
                     </button>
                   ))}
                </div>
              )}
           </div>

           <div className="lg:col-span-5 flex flex-col h-full">
              <div className="bg-white p-8 sm:p-10 rounded-3xl lg:rounded-[2.5rem] shadow-soft border border-slate-100 flex-1 relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-64 h-64 bg-palma-green/5 rounded-full blur-3xl -mr-32 -mt-32"></div>

                 <div className="relative z-10 space-y-8">
                    
                    <div>
                       <div className="flex items-center gap-3 mb-4">
                          <span className="bg-slate-50 text-palma-navy px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border border-slate-100">{t.categories[product.category as keyof typeof t.categories] || product.category}</span>
                          <div className="flex items-center gap-1 text-palma-gold">
                             <Star className="w-3.5 h-3.5 fill-current" />
                             <span className="text-xs font-black text-palma-navy mt-0.5">{rating.average.toFixed(1)}</span>
                             <span className="text-[9px] font-bold text-slate-400 mt-0.5">({rating.count})</span>
                          </div>
                          <div className="flex items-center gap-1 text-rose-500">
                             <Heart className="w-3.5 h-3.5 fill-current" />
                             <span className="text-xs font-black mt-0.5">{likesCount}</span>
                          </div>
                       </div>
                       <h1 className="text-3xl sm:text-4xl font-black text-palma-navy leading-[1.1] mb-4 tracking-tight">{product.name}</h1>
                       <div className="flex items-baseline gap-4">
                          <span className="text-4xl sm:text-5xl font-black text-palma-green tracking-tight">₪{product.price || product.price_ils}</span>
                          {product.discount && (
                             <span className="text-lg font-bold text-slate-300 line-through decoration-2">₪{((product.price || product.price_ils || 0) * 1.2).toFixed(0)}</span>
                          )}
                       </div>
                    </div>

                    <div className="h-px bg-slate-100"></div>

                    <div className="space-y-4">
                       <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{t.product.desc}</h3>
                       <p className="text-sm font-medium text-slate-600 leading-relaxed">
                          {product.description || "Experience premium quality with this exceptional product, designed to meet your needs with style and durability."}
                       </p>
                       <ul className="grid grid-cols-2 gap-3 pt-2">
                          <li className="flex items-center gap-2 text-[10px] font-bold text-palma-navy bg-slate-50 p-2 rounded-lg"><Truck className="w-3.5 h-3.5 text-palma-primary" /> Fast Delivery</li>
                          <li className="flex items-center gap-2 text-[10px] font-bold text-palma-navy bg-slate-50 p-2 rounded-lg"><ShieldCheck className="w-3.5 h-3.5 text-palma-primary" /> Verified Seller</li>
                       </ul>
                    </div>

                    <div className="bg-slate-50 rounded-2xl p-4 flex items-center gap-4 border border-slate-100">
                        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm overflow-hidden border border-slate-100">
                           <img src={merchantProfile?.logo_url || `https://ui-avatars.com/api/?name=${merchantName}&background=random`} className="w-full h-full object-cover" />
                        </div>
                        <div>
                           <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest">{t.common.merchantName}</p>
                           <p className="text-sm font-bold text-palma-navy">{merchantName}</p>
                        </div>
                    </div>

                    <div className="space-y-4 pt-4">
                       <div className="flex items-center bg-slate-50 rounded-xl p-1.5 w-fit border border-slate-100">
                          <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-10 h-10 flex items-center justify-center bg-white rounded-lg shadow-sm text-palma-navy hover:text-palma-primary transition"><Minus className="w-4 h-4" /></button>
                          <span className="w-12 text-center font-black text-palma-navy">{quantity}</span>
                          <button onClick={() => setQuantity(Math.max(1, quantity + 1))} className="w-10 h-10 flex items-center justify-center bg-white rounded-lg shadow-sm text-palma-navy hover:text-palma-primary transition"><Plus className="w-4 h-4" /></button>
                       </div>
                       
                       <div className="flex flex-col sm:flex-row gap-4">
                          <button onClick={handleAddToCart} className="flex-1 py-5 bg-palma-navy text-white rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-xl shadow-palma-navy/20 hover:bg-palma-primary transition-all active:scale-[0.98] flex items-center justify-center gap-3">
                             <ShoppingBag className="w-4 h-4" /> {t.product.addToCart}
                          </button>
                       </div>
                    </div>

                 </div>
              </div>
           </div>
        </div>

        {/* Social Comments Section */}
        <section className="mt-24 max-w-4xl mx-auto">
           <div className="grid md:grid-cols-2 gap-16">
              
              {/* Comments */}
              <div className="space-y-8">
                 <h3 className="text-xl font-black text-palma-navy flex items-center gap-3">
                    <MessageCircle className="w-5 h-5" /> {lang === 'en' ? 'Comments' : 'التعليقات'} ({comments.length})
                 </h3>
                 
                 {user && isCustomer && (
                    <form onSubmit={handleAddComment} className="flex gap-3">
                       <input 
                         className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-palma-primary outline-none transition-all"
                         placeholder={lang === 'en' ? "Add a comment..." : "أضف تعليقاً..."}
                         value={socialCommentInput}
                         onChange={(e) => setSocialCommentInput(e.target.value)}
                       />
                       <button type="submit" className="bg-palma-navy text-white p-3 rounded-xl hover:bg-palma-primary transition-all shadow-md disabled:opacity-50" disabled={!socialCommentInput.trim()}>
                          <Send className="w-4 h-4 rtl:rotate-180" />
                       </button>
                    </form>
                 )}

                 <div className="space-y-4">
                    {comments.length === 0 ? (
                       <p className="text-slate-400 text-xs italic">{lang === 'en' ? 'No comments yet.' : 'لا توجد تعليقات بعد.'}</p>
                    ) : (
                       comments.map(c => (
                          <div key={c.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                             <div className="flex justify-between items-start mb-2">
                                <span className="text-xs font-black text-palma-navy">{c.userName}</span>
                                <span className="text-[9px] text-slate-400 font-bold">{new Date(c.createdAt).toLocaleDateString()}</span>
                             </div>
                             <p className="text-sm text-slate-600">{c.text}</p>
                          </div>
                       ))
                    )}
                 </div>
              </div>

              {/* Reviews */}
              <div className="space-y-8">
                 <h3 className="text-xl font-black text-palma-navy flex items-center gap-3">
                    <Star className="w-5 h-5" /> {t.common.reviews} ({reviews.length})
                 </h3>

                 {/* Review Input */}
                 <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    {user && isCustomer ? (
                       alreadyReviewed ? (
                          <p className="text-sm font-bold text-palma-primary text-center">✓ {lang === 'en' ? 'Thanks for your review!' : 'شكراً لتقييمك!'}</p>
                       ) : (
                          <form onSubmit={handleSubmitReview} className="space-y-4">
                             <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-slate-500">{t.product.addReview}</span>
                                <div className="flex gap-1">
                                   {[1,2,3,4,5].map(star => (
                                      <button type="button" key={star} onClick={() => setRatingInput(star)} onMouseEnter={() => setHoverRating(star)} onMouseLeave={() => setHoverRating(0)}>
                                         <Star className={`w-5 h-5 ${star <= (hoverRating || ratingInput) ? 'fill-palma-gold text-palma-gold' : 'text-slate-200'}`} />
                                      </button>
                                   ))}
                                </div>
                             </div>
                             <textarea 
                                value={commentInput} 
                                onChange={e => setCommentInput(e.target.value)} 
                                placeholder={lang === 'en' ? "Write your experience..." : "اكتب تجربتك..."} 
                                className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-palma-primary transition-all resize-none h-24"
                             />
                             <button type="submit" disabled={isSubmitting} className="w-full bg-palma-navy text-white py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-palma-primary transition-all disabled:opacity-50">
                                {isSubmitting ? '...' : t.common.save}
                             </button>
                          </form>
                       )
                    ) : (
                       <div className="text-center">
                          <p className="text-xs text-slate-400 mb-2">{lang === 'en' ? 'Log in to write a review' : 'سجل الدخول لكتابة تقييم'}</p>
                          <button onClick={onLoginClick} className="text-xs font-black text-palma-primary hover:underline">{t.auth.login}</button>
                       </div>
                    )}
                 </div>

                 {/* Reviews List */}
                 <div className="space-y-4">
                    {reviews.length === 0 ? (
                       <p className="text-slate-400 text-xs italic">{t.common.noData}</p>
                    ) : (
                       reviews.slice().reverse().map(rev => (
                          <div key={rev.id} className="bg-white p-4 rounded-2xl border border-slate-100 flex gap-3">
                             <div className="w-8 h-8 bg-palma-soft rounded-full flex items-center justify-center font-black text-palma-navy shrink-0 text-xs">
                                {rev.customer_name?.charAt(0)}
                             </div>
                             <div className="flex-1">
                                <div className="flex justify-between items-start">
                                   <h5 className="font-bold text-palma-navy text-xs">{rev.customer_name}</h5>
                                   <div className="flex gap-0.5">
                                      {[1,2,3,4,5].map(s => <Star key={s} className={`w-3 h-3 ${s <= rev.rating ? 'fill-palma-gold text-palma-gold' : 'text-slate-200'}`} />)}
                                   </div>
                                </div>
                                <p className="mt-1 text-xs text-slate-600 font-medium">"{rev.comment}"</p>
                             </div>
                          </div>
                       ))
                    )}
                 </div>
              </div>
           </div>
        </section>

      </main>
    </div>
  );
};

export default PublicProductDetails;

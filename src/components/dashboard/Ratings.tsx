import { useEffect, useState } from 'react';
import { Edit3, MessageSquare, Star } from 'lucide-react';
import { toast } from 'react-toastify';
import SectionCard from './SectionCard';
import StarRating from '../ratings/StarRating';
import { PendingReviewItem, Review, resolveImageUrl, reviewsAPI } from '../../pages/lib/api';

type RatingsProps = {
  onPendingCountChange?: (count: number) => void;
};

type EditorState =
  | {
      mode: 'create';
      orderId: string;
      productId: string;
      title: string;
      comment: string;
      rating: number;
    }
  | {
      mode: 'edit';
      reviewId: string;
      title: string;
      comment: string;
      rating: number;
    }
  | null;

export default function Ratings({ onPendingCountChange }: RatingsProps) {
  const [tab, setTab] = useState<'pending' | 'submitted'>('pending');
  const [pendingItems, setPendingItems] = useState<PendingReviewItem[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editor, setEditor] = useState<EditorState>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [pendingResponse, reviewsResponse] = await Promise.all([
        reviewsAPI.listPending(),
        reviewsAPI.listMyReviews(),
      ]);

      const pending = Array.isArray(pendingResponse?.items) ? pendingResponse.items : [];
      const mine = Array.isArray(reviewsResponse?.reviews) ? reviewsResponse.reviews : [];

      setPendingItems(pending);
      setReviews(mine);
      onPendingCountChange?.(pending.length);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error?.message || 'Failed to load ratings');
      setPendingItems([]);
      setReviews([]);
      onPendingCountChange?.(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openCreateEditor = (item: PendingReviewItem) => {
    setEditor({
      mode: 'create',
      orderId: item.order_id,
      productId: item.product_id,
      title: '',
      comment: '',
      rating: 5,
    });
  };

  const openEditEditor = (review: Review) => {
    setEditor({
      mode: 'edit',
      reviewId: review.id,
      title: review.title || '',
      comment: review.comment || '',
      rating: review.rating,
    });
  };

  const closeEditor = () => setEditor(null);

  const submitEditor = async () => {
    if (!editor) return;
    if (!editor.rating || editor.rating < 1 || editor.rating > 5) {
      toast.error('Select a rating between 1 and 5');
      return;
    }

    setSubmitting(true);
    try {
      if (editor.mode === 'create') {
        await reviewsAPI.create({
          orderId: editor.orderId,
          productId: editor.productId,
          rating: editor.rating,
          title: editor.title,
          comment: editor.comment,
        });
        toast.success('Rating submitted successfully');
      } else {
        await reviewsAPI.update(editor.reviewId, {
          rating: editor.rating,
          title: editor.title,
          comment: editor.comment,
        });
        toast.success('Rating updated successfully');
      }

      closeEditor();
      await load();
      setTab(editor.mode === 'create' ? 'submitted' : tab);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error?.message || 'Failed to save rating');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStarSelector = (value: number, onChange: (next: number) => void) => (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((index) => (
        <button
          key={index}
          type="button"
          onClick={() => onChange(index)}
          className="rounded-full p-1 transition hover:bg-amber-50"
        >
          <Star
            className={index <= value ? 'h-6 w-6 fill-amber-400 text-amber-400' : 'h-6 w-6 text-gray-300'}
          />
        </button>
      ))}
    </div>
  );

  return (
    <SectionCard title="Ratings">
      <div className="flex items-center gap-6 border-b border-gray-100 pb-3">
        <button
          type="button"
          onClick={() => setTab('pending')}
          className={`border-b-2 pb-2 text-sm font-semibold transition ${
            tab === 'pending' ? 'border-pink-600 text-pink-600' : 'border-transparent text-gray-500'
          }`}
        >
          Pending Ratings ({pendingItems.length})
        </button>
        <button
          type="button"
          onClick={() => setTab('submitted')}
          className={`border-b-2 pb-2 text-sm font-semibold transition ${
            tab === 'submitted' ? 'border-pink-600 text-pink-600' : 'border-transparent text-gray-500'
          }`}
        >
          Submitted Reviews ({reviews.length})
        </button>
      </div>

      {loading ? (
        <div className="py-12 text-sm text-gray-500">Loading ratings...</div>
      ) : tab === 'pending' ? (
        pendingItems.length === 0 ? (
          <div className="py-12 text-sm text-gray-500">No pending ratings. Delivered items you can review will appear here.</div>
        ) : (
          <div className="mt-6 space-y-4">
            {pendingItems.map((item) => {
              const isEditing =
                editor?.mode === 'create' &&
                editor.orderId === item.order_id &&
                editor.productId === item.product_id;

              return (
                <div key={`${item.order_id}-${item.product_id}`} className="rounded-2xl border border-gray-200 bg-white p-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-start gap-4">
                      <div className="h-20 w-20 overflow-hidden rounded-2xl bg-gray-100">
                        {item.image_url ? (
                          <img src={resolveImageUrl(item.image_url)} alt={item.product_name} className="h-full w-full object-cover" />
                        ) : null}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{item.product_name}</p>
                        <p className="mt-1 text-sm text-gray-500">Order #{item.order_id.slice(-8).toUpperCase()}</p>
                        <p className="mt-1 text-sm text-gray-500">
                          Delivered on{' '}
                          {item.order_created_at
                            ? new Date(item.order_created_at).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })
                            : 'your order date'}
                        </p>
                        <StarRating className="mt-2" rating={item.rating} count={item.rating_count} emptyLabel="No reviews yet" />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => openCreateEditor(item)}
                      className="rounded-full bg-[#12108b] px-4 py-2 text-sm font-semibold text-white hover:bg-[#211eb0]"
                    >
                      Rate product
                    </button>
                  </div>

                  {isEditing ? (
                    <div className="mt-5 rounded-2xl bg-gray-50 p-4">
                      <p className="text-sm font-semibold text-gray-900 mb-3">Your rating</p>
                      {renderStarSelector(editor.rating, (next) => setEditor({ ...editor, rating: next }))}
                      <input
                        type="text"
                        value={editor.title}
                        onChange={(event) => setEditor({ ...editor, title: event.target.value })}
                        className="mt-4 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm"
                        placeholder="Review title (optional)"
                      />
                      <textarea
                        value={editor.comment}
                        onChange={(event) => setEditor({ ...editor, comment: event.target.value })}
                        className="mt-3 min-h-[120px] w-full rounded-xl border border-gray-200 px-4 py-3 text-sm"
                        placeholder="Share your experience with this product"
                      />
                      <div className="mt-4 flex gap-3">
                        <button
                          type="button"
                          onClick={submitEditor}
                          disabled={submitting}
                          className="rounded-full bg-pink-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                        >
                          {submitting ? 'Saving...' : 'Submit rating'}
                        </button>
                        <button
                          type="button"
                          onClick={closeEditor}
                          className="rounded-full border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )
      ) : reviews.length === 0 ? (
        <div className="py-12 text-sm text-gray-500">You have not submitted any reviews yet.</div>
      ) : (
        <div className="mt-6 space-y-4">
          {reviews.map((review) => {
            const isEditing = editor?.mode === 'edit' && editor.reviewId === review.id;

            return (
              <div key={review.id} className="rounded-2xl border border-gray-200 bg-white p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-start gap-4">
                    <div className="h-20 w-20 overflow-hidden rounded-2xl bg-gray-100">
                      {review.product?.image_url ? (
                        <img
                          src={resolveImageUrl(review.product.image_url)}
                          alt={review.product.name}
                          className="h-full w-full object-cover"
                        />
                      ) : null}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{review.product?.name || 'Product review'}</p>
                      <StarRating className="mt-2" rating={review.rating} count={0} showCount={false} />
                      {review.title ? <p className="mt-3 font-medium text-gray-900">{review.title}</p> : null}
                      {review.comment ? <p className="mt-1 text-sm text-gray-600">{review.comment}</p> : null}
                      <p className="mt-2 text-xs text-gray-400">
                        Updated{' '}
                        {review.updatedAt
                          ? new Date(review.updatedAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })
                          : ''}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => openEditEditor(review)}
                    className="inline-flex items-center gap-2 rounded-full border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700"
                  >
                    <Edit3 className="h-4 w-4" />
                    Edit
                  </button>
                </div>

                {isEditing ? (
                  <div className="mt-5 rounded-2xl bg-gray-50 p-4">
                    <p className="text-sm font-semibold text-gray-900 mb-3">Edit your review</p>
                    {renderStarSelector(editor.rating, (next) => setEditor({ ...editor, rating: next }))}
                    <input
                      type="text"
                      value={editor.title}
                      onChange={(event) => setEditor({ ...editor, title: event.target.value })}
                      className="mt-4 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm"
                      placeholder="Review title (optional)"
                    />
                    <textarea
                      value={editor.comment}
                      onChange={(event) => setEditor({ ...editor, comment: event.target.value })}
                      className="mt-3 min-h-[120px] w-full rounded-xl border border-gray-200 px-4 py-3 text-sm"
                      placeholder="Share your experience with this product"
                    />
                    <div className="mt-4 flex gap-3">
                      <button
                        type="button"
                        onClick={submitEditor}
                        disabled={submitting}
                        className="rounded-full bg-pink-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                      >
                        {submitting ? 'Saving...' : 'Update review'}
                      </button>
                      <button
                        type="button"
                        onClick={closeEditor}
                        className="rounded-full border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}

      {!loading && pendingItems.length === 0 && reviews.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-5 text-sm text-gray-500">
          <div className="flex items-center gap-3">
            <MessageSquare className="h-4 w-4" />
            Ratings appear here after you receive a delivered order.
          </div>
        </div>
      ) : null}
    </SectionCard>
  );
}

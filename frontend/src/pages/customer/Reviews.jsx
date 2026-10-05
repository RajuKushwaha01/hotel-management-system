import { useEffect, useState } from 'react';
import { Star, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { customerService } from '../../services/customerService';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import EmptyState from '../../components/ui/EmptyState';

export default function Reviews() {
  const [reviews, setReviews] = useState([]);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ rating: 5, comment: '' });

  const load = () => customerService.getMyReviews().then((res) => setReviews(res.data.data));
  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await customerService.createReview(form);
      toast.success('Thank you for your review!');
      setShowNew(false);
      setForm({ rating: 5, comment: '' });
      load();
    } catch { toast.error('Failed to submit review'); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-display mb-1">My Reviews</h1><p className="text-text-secondary text-sm">Share your experience</p></div>
        <Button variant="gold" onClick={() => setShowNew(true)} className="flex items-center gap-2"><Plus size={16} /> Write Review</Button>
      </div>

      {reviews.length === 0 ? <EmptyState title="No reviews yet" /> : (
        <div className="space-y-4">
          {reviews.map((r) => (
            <Card key={r._id}>
              <div className="flex items-center gap-1 text-gold mb-2">{[...Array(r.rating)].map((_, i) => <Star key={i} size={14} fill="currentColor" />)}</div>
              <p className="text-sm">{r.comment}</p>
            </Card>
          ))}
        </div>
      )}

      <Modal open={showNew} onClose={() => setShowNew(false)} title="Write a Review">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button type="button" key={n} onClick={() => setForm({ ...form, rating: n })}>
                <Star size={28} className={n <= form.rating ? 'text-gold fill-gold' : 'text-black/20 dark:text-white/20'} />
              </button>
            ))}
          </div>
          <Input placeholder="Share your experience..." value={form.comment} onChange={(e) => setForm({ ...form, comment: e.target.value })} required />
          <Button variant="gold" className="w-full">Submit Review</Button>
        </form>
      </Modal>
    </div>
  );
}

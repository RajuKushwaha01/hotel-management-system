import { useEffect, useState } from 'react';
import { Gift, Award, History, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { loyaltyService } from '../../services/loyaltyService';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Tabs from '../../components/ui/Tabs';
import EmptyState from '../../components/ui/EmptyState';

const TIER_COLOR = { Bronze: 'from-amber-700 to-amber-500', Silver: 'from-slate-400 to-slate-200', Gold: 'from-gold to-goldLight', Platinum: 'from-purple-500 to-purple-300' };

export default function Loyalty() {
  const [data, setData] = useState(null);

  const load = () => loyaltyService.getMine().then((res) => setData(res.data.data)).catch(() => toast.error('Failed to load loyalty details'));
  useEffect(() => { load(); }, []);

  const handleRedeem = async (reward) => {
    try {
      const res = await loyaltyService.redeem(reward._id);
      toast.success(res.data.message, { duration: 6000 });
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to redeem'); }
  };

  if (!data) return null;

  return (
    <div>
      <h1 className="text-2xl font-display mb-1">Loyalty & Rewards</h1>
      <p className="text-text-secondary text-sm mb-6">Earn points on every stay, redeem them for perks</p>

      <div className={`p-6 rounded-2xl bg-gradient-to-br ${TIER_COLOR[data.membershipLevel]} text-navy mb-6 animate-fade-in`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm opacity-80 flex items-center gap-1"><Award size={14} /> {data.membershipLevel} Member</p>
            <p className="text-4xl font-display mt-1">{data.points.toLocaleString()} pts</p>
          </div>
          <Sparkles size={40} className="opacity-30" />
        </div>
        {data.nextTier && <p className="text-xs mt-3 opacity-80">{data.nextTier.pointsNeeded} more points to reach {data.nextTier.level}</p>}
      </div>

      <Tabs
        tabs={[
          {
            id: 'rewards', label: 'Available Rewards',
            content: data.rewards.length === 0 ? <EmptyState icon={Gift} title="No rewards available right now" /> : (
              <div className="grid sm:grid-cols-2 gap-4">
                {data.rewards.map((r) => (
                  <Card key={r._id} hover>
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium">{r.name}</h4>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gold/10 text-gold font-medium shrink-0">{r.pointsCost} pts</span>
                    </div>
                    <p className="text-text-secondary text-sm mb-4">{r.description}</p>
                    <Button
                      variant="gold" className="w-full !py-2 text-sm"
                      disabled={data.points < r.pointsCost}
                      onClick={() => handleRedeem(r)}
                    >
                      {data.points < r.pointsCost ? 'Not Enough Points' : 'Redeem'}
                    </Button>
                  </Card>
                ))}
              </div>
            ),
          },
          {
            id: 'history', label: 'Points History',
            content: data.history.length === 0 ? <EmptyState icon={History} title="No activity yet" message="Complete a stay to start earning points" /> : (
              <div className="space-y-2">
                {data.history.map((h) => (
                  <div key={h._id} className="flex justify-between items-center text-sm border-b border-border dark:border-darkBorder pb-2">
                    <div>
                      <p>{h.reason}</p>
                      <p className="text-xs text-text-secondary">{new Date(h.createdAt).toLocaleDateString()}</p>
                    </div>
                    <span className={h.points > 0 ? 'text-success font-medium' : 'text-danger font-medium'}>
                      {h.points > 0 ? '+' : ''}{h.points}
                    </span>
                  </div>
                ))}
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}

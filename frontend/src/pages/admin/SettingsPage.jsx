import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { settingsService } from '../../services/settingsService';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Skeleton from '../../components/ui/Skeleton';

export default function SettingsPage() {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    settingsService
      .getAll()
      .then((res) => {
        const map = {};
        res.data.data.forEach((s) => (map[s.key] = s.value));
        setSettings(map);
      })
      .catch(() => toast.error('Failed to load settings'))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = Object.entries(settings).map(([key, value]) => ({ key, value }));
      await settingsService.bulkUpdate(payload);
      toast.success('Settings saved');
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Skeleton className="h-96" />;

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-display mb-6">System Settings</h1>

      <Card className="space-y-4 mb-4">
        <h3 className="font-semibold">General</h3>
        <Input label="Hotel Name" value={settings.hotel_name || ''} onChange={(e) => setSettings({ ...settings, hotel_name: e.target.value })} />
        <Input label="Currency" value={settings.currency || ''} onChange={(e) => setSettings({ ...settings, currency: e.target.value })} />
        <Input label="Tax Percent" type="number" value={settings.tax_percent || 0} onChange={(e) => setSettings({ ...settings, tax_percent: Number(e.target.value) })} />
      </Card>

      <Card className="space-y-4 mb-4">
        <h3 className="font-semibold">Booking Policy</h3>
        <Input label="Check-in Time" value={settings.check_in_time || ''} onChange={(e) => setSettings({ ...settings, check_in_time: e.target.value })} />
        <Input label="Check-out Time" value={settings.check_out_time || ''} onChange={(e) => setSettings({ ...settings, check_out_time: e.target.value })} />
        <Input label="Cancellation Window (hours)" type="number" value={settings.cancellation_hours || 0} onChange={(e) => setSettings({ ...settings, cancellation_hours: Number(e.target.value) })} />
      </Card>

      <Button variant="gold" onClick={handleSave} disabled={saving}>
        {saving ? 'Saving...' : 'Save Settings'}
      </Button>
    </div>
  );
}

import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import Dashboard from '../components/Dashboard';

export default function DashboardPage() {
    const navigate = useNavigate();

    return (
        <div className="space-y-6 sm:space-y-8">
            <Dashboard />

            {/* Mobile Quick Action */}
            <button
                type="button"
                className="sm:hidden fixed bottom-6 right-6 z-30 flex items-center gap-2 px-4 py-3 rounded-full bg-primary text-white shadow-lg shadow-primary/30 hover:bg-primary-hover transition-colors"
                onClick={() => navigate('/entries')}
            >
                <Plus size={16} />
                New Entry
            </button>
        </div>
    );
}

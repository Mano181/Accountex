import { Navigate, Route, Routes } from 'react-router-dom';
import SalesLayout from './sales/SalesLayout';
import CustomersPage from './sales/CustomersPage';
import InvoicesPage from './sales/InvoicesPage';
import OutstandingPage from './sales/OutstandingPage';
import PaymentsReceivedPage from './sales/PaymentsReceivedPage';

export default function SalesPage() {
    return (
        <Routes>
            <Route element={<SalesLayout />}>
                <Route index element={<Navigate to="customers" replace />} />
                <Route path="customers" element={<CustomersPage />} />
                <Route path="invoices" element={<InvoicesPage />} />
                <Route path="outstanding" element={<OutstandingPage />} />
                <Route path="payments" element={<PaymentsReceivedPage />} />
            </Route>
        </Routes>
    );
}

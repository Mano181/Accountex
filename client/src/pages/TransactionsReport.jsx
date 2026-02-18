import Entries from './Entries';

export default function TransactionsReportPage() {
    return (
        <Entries
            moduleTitle="Reports"
            tableTitle="Transaction History Report"
            showForm={false}
        />
    );
}
